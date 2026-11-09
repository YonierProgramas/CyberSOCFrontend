import { PortalError, asPortalError } from '../api/fault';
import type { AuthClient, AuthTokens, ConfirmInput } from './authClient';
export type SessionKind = 'access' | 'recovery';
export type PortalSession = Readonly<{
  kind: SessionKind;
  generation: number;
  userId: string;
  label: string;
  expiresAt: number;
}>;
export type SessionSnapshot = Readonly<{
  epoch: number;
  session: PortalSession | null;
  notice: string;
}>;
export type SessionStore = ReturnType<typeof createSessionStore>;
export function createSessionStore(auth: AuthClient, now: () => number = () => Date.now()) {
  // Set: cada observador/controlador aparece una sola vez. add/delete/has O(1) promedio;
  // notificar o cancelar los n elementos cuesta O(n). Ningún Set contiene tokens.
  const listeners = new Set<() => void>();
  const operations = new Set<AbortController>();
  let tokens: AuthTokens | null = null; // Exclusivamente en este cierre de módulo, nunca en la vista.
  let epoch = 0;
  let snapshot: SessionSnapshot = { epoch, session: null, notice: '' };
  let refreshTimer: ReturnType<typeof setTimeout> | undefined;
  let expiryTimer: ReturnType<typeof setTimeout> | undefined;
  let idleTimer: ReturnType<typeof setTimeout> | undefined;
  let refreshing: { epoch: number; promise: Promise<void>; controller: AbortController } | null =
    null;
  function emit(session: PortalSession | null, notice = '') {
    snapshot = Object.freeze({ epoch, session, notice });
    for (const listener of listeners) listener();
  }
  function clearTimers() {
    clearTimeout(refreshTimer);
    clearTimeout(expiryTimer);
    clearTimeout(idleTimer);
  }
  function end(notice = '') {
    epoch += 1;
    clearTimers();
    tokens = null;
    refreshing = null;
    for (const controller of operations) controller.abort();
    operations.clear();
    emit(null, notice);
  }
  function current(expected: number) {
    if (expected !== epoch) throw new PortalError('SESSION_ENDED');
  }
  function activity() {
    clearTimeout(idleTimer);
    if (tokens)
      idleTimer = setTimeout(
        () => {
          void logout('local', 'Sesión cerrada por 30 minutos de inactividad.');
        },
        30 * 60 * 1000,
      );
  }
  function install(value: AuthTokens, kind: SessionKind, resetInactivity = true) {
    const expiresAt = Math.min(
      value.expires_at ? value.expires_at * 1000 : Infinity,
      now() + value.expires_in * 1000,
    );
    if (expiresAt <= now()) throw new PortalError('TOKEN_EXPIRED');
    tokens = value;
    clearTimeout(refreshTimer);
    clearTimeout(expiryTimer);
    emit(Object.freeze({ kind, generation: epoch, userId: value.user.id, label: '', expiresAt }));
    refreshTimer = setTimeout(
      () => {
        void refresh().catch(() => undefined);
      },
      Math.max(1000, expiresAt - now() - 60000),
    );
    expiryTimer = setTimeout(
      () => end('La sesión venció. Entra de nuevo.'),
      Math.max(0, expiresAt - now()),
    );
    if (resetInactivity) activity();
  }
  async function refresh(): Promise<void> {
    if (refreshing?.epoch === epoch) return refreshing.promise;
    if (!tokens || !snapshot.session) throw new PortalError('AUTH_REQUIRED');
    const expected = epoch;
    const kind = snapshot.session.kind;
    const userId = snapshot.session.userId;
    const refreshToken = tokens.refresh_token;
    const controller = new AbortController();
    operations.add(controller);
    const task = { epoch: expected, controller, promise: Promise.resolve() };
    // Una sola promesa por generación; se publica antes de que otro evento pueda pedir refresh.
    task.promise = (async () => {
      try {
        const pair = await auth.refresh(refreshToken, controller.signal);
        current(expected);
        if (pair.user.id !== userId) throw new PortalError('TOKEN_INVALID');
        install(pair, kind, false);
      } catch (error) {
        current(expected);
        // Decisión expresa del equipo: resultado desconocido también invalida de inmediato.
        end('No se pudo renovar la sesión. Entra de nuevo; no se repitió el refresco.');
        throw asPortalError(error);
      } finally {
        operations.delete(controller);
        if (refreshing === task) refreshing = null;
      }
    })();
    refreshing = task;
    return task.promise;
  }
  async function begin(kind: SessionKind, request: (signal: AbortSignal) => Promise<AuthTokens>) {
    end();
    const expected = epoch;
    const controller = new AbortController();
    operations.add(controller);
    try {
      const pair = await request(controller.signal);
      current(expected);
      install(pair, kind);
    } catch (error) {
      current(expected);
      throw asPortalError(error);
    } finally {
      operations.delete(controller);
    }
  }
  async function authorized<T>(
    operation: (accessToken: string, signal: AbortSignal) => Promise<T>,
    allowRecovery = false,
  ): Promise<T> {
    const expected = epoch;
    if (!tokens || !snapshot.session || (!allowRecovery && snapshot.session.kind !== 'access'))
      throw new PortalError('AUTH_REQUIRED');
    const controller = new AbortController();
    operations.add(controller);
    try {
      if (refreshing?.epoch === expected || snapshot.session.expiresAt - now() <= 60000)
        await refresh();
      current(expected);
      for (let attempt = 0; attempt < 2; attempt += 1) {
        const usedToken: string | undefined = tokens?.access_token;
        if (!usedToken) throw new PortalError('SESSION_ENDED');
        try {
          const result = await operation(usedToken, controller.signal);
          current(expected);
          return result;
        } catch (error) {
          current(expected);
          const fault = asPortalError(error);
          if (attempt === 0 && fault.status === 401 && fault.code === 'TOKEN_EXPIRED') {
            // Otra respuesta simultánea puede llegar después de que la promesa ya rotó el par.
            if (tokens?.access_token === usedToken) await refresh();
            current(expected);
            continue;
          }
          if (
            fault.status === 401 &&
            ['AUTH_REQUIRED', 'TOKEN_INVALID', 'TOKEN_EXPIRED'].includes(fault.code)
          )
            end('La sesión no es válida. Entra de nuevo.');
          throw fault;
        }
      }
      throw new PortalError('AUTH_REQUIRED');
    } catch (error) {
      current(expected);
      throw asPortalError(error);
    } finally {
      operations.delete(controller);
    }
  }
  async function logout(scope: 'local' | 'global', notice?: string) {
    const accessToken = tokens?.access_token;
    end(
      notice ??
        'Sesión local cerrada. El acceso copiado puede seguir válido en el servidor hasta su vencimiento.',
    );
    const expected = epoch;
    if (!accessToken) return;
    try {
      await auth.signOut(scope, accessToken, new AbortController().signal);
    } catch {
      if (epoch === expected)
        emit(
          null,
          (notice ? notice + ' ' : '') +
            'Sesión local cerrada; cierre remoto no confirmado. Un acceso copiado puede seguir válido hasta su vencimiento.',
        );
    }
  }
  return {
    getSnapshot: () => snapshot,
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    assertCurrent: current,
    authorized,
    refresh,
    logout,
    activity,
    signIn: (email: string, password: string) =>
      begin('access', (signal) => auth.signIn(email, password, signal)),
    signUp: (email: string, password: string) =>
      begin('access', (signal) => auth.signUp(email, password, signal)),
    verify: (input: ConfirmInput) =>
      begin(input.type === 'recovery' ? 'recovery' : 'access', (signal) =>
        auth.verify(input, signal),
      ),
    async updatePassword(password: string) {
      if (snapshot.session?.kind !== 'recovery') throw new PortalError('RECOVERY_REQUIRED');
      await authorized(async (token, signal) => {
        await auth.updatePassword(password, token, signal);
      }, true);
      await logout('local', 'Contraseña actualizada. Entra con la nueva contraseña.');
    },
    dispose() {
      end();
      listeners.clear();
    },
  };
}
