import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createSessionStore, type SessionStore } from '../../src/auth/session';
import {
  createAuthClient,
  signupClosed,
  type AuthClient,
  type AuthTokens,
} from '../../src/auth/authClient';
import { createConfirmationFlow, parseConfirmSearch } from '../../src/auth/confirmFlow';
import { PortalError } from '../../src/api/fault';
import { config, fakeServer, ownerA, ownerB, pair } from '../fixtures/network';
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}
function authDouble(overrides: Partial<AuthClient> = {}): AuthClient {
  return {
    signIn: vi.fn(async () => pair()),
    refresh: vi.fn(async () => pair(ownerA, 'rotated')),
    verify: vi.fn(async () => pair()),
    recover: vi.fn(async () => undefined),
    updatePassword: vi.fn(async () => undefined),
    signOut: vi.fn(async () => undefined),
    ...overrides,
  };
}
const stores: SessionStore[] = [];
function store(auth: AuthClient) {
  const result = createSessionStore(auth);
  stores.push(result);
  return result;
}
beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  stores.forEach((item) => item.dispose());
  stores.length = 0;
  vi.clearAllTimers();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});
describe('anexo A y decisión expresa de refresh desconocido', () => {
  it('una petición nueva espera el refresh pendiente sin usar el token anterior', async () => {
    const waiting = deferred<AuthTokens>();
    const session = store(authDouble({ refresh: vi.fn(() => waiting.promise) }));
    await session.signIn('a@example.invalid', 'fake-password');
    const refreshed = session.refresh();
    const operation = vi.fn(async (token: string) => token);
    const request = session.authorized(operation);
    expect(operation).not.toHaveBeenCalled();
    waiting.resolve(pair(ownerA, 'rotated'));
    await refreshed;
    expect(await request).toBe('fake-access-rotated');
    expect(operation).toHaveBeenCalledTimes(1);
  });
  it('S-01: login, refresh y logout no escriben almacenamiento; recarga/otra instancia no heredan sesión', async () => {
    const write = vi.fn();
    vi.stubGlobal('localStorage', { setItem: write, removeItem: write });
    vi.stubGlobal('sessionStorage', { setItem: write, removeItem: write });
    vi.stubGlobal('indexedDB', { open: write });
    const document = {};
    Object.defineProperty(document, 'cookie', { set: write });
    vi.stubGlobal('document', document);
    const server = fakeServer();
    const session = store(createAuthClient(config, server.fetcher));
    await session.signIn('a@example.invalid', 'fake-password');
    await session.refresh();
    expect(JSON.stringify(session.getSnapshot())).not.toContain('fake-access');
    expect(JSON.stringify(session.getSnapshot())).not.toContain('fake-refresh');
    expect(store(authDouble()).getSnapshot().session).toBeNull();
    await session.logout('local');
    expect(session.getSnapshot().session).toBeNull();
    expect(write).not.toHaveBeenCalled();
  });
  it('S-02: diez 401 explícitos comparten un refresh y se repiten una vez', async () => {
    const waiting = deferred<AuthTokens>();
    const auth = authDouble({ refresh: vi.fn(() => waiting.promise) });
    const session = store(auth);
    await session.signIn('a@example.invalid', 'fake-password');
    const operations = Array.from({ length: 10 }, () =>
      vi.fn(async (token: string) => {
        if (token === 'fake-access-a') throw new PortalError('TOKEN_EXPIRED', 401);
        return 'ok';
      }),
    );
    const requests = operations.map((operation) => session.authorized(operation));
    await Promise.resolve();
    await Promise.resolve();
    expect(auth.refresh).toHaveBeenCalledTimes(1);
    waiting.resolve(pair(ownerA, 'rotated'));
    expect(await Promise.all(requests)).toEqual(Array(10).fill('ok'));
    operations.forEach((operation) => expect(operation).toHaveBeenCalledTimes(2));
  });
  it('S-02: un 401 tardío del token anterior no consume otro refresh', async () => {
    const late = deferred<string>();
    const auth = authDouble();
    const session = store(auth);
    await session.signIn('a@example.invalid', 'fake-password');
    const old = session.authorized(vi.fn(() => late.promise));
    const fresh = session.authorized(async (token) => {
      if (token === 'fake-access-a') throw new PortalError('TOKEN_EXPIRED', 401);
      return token;
    });
    expect(await fresh).toBe('fake-access-rotated');
    late.reject(new PortalError('TOKEN_EXPIRED', 401));
    // El callback también rechazará la segunda vez; solo se permite una repetición.
    await expect(old).rejects.toMatchObject({ code: 'SESSION_ENDED' });
    expect(auth.refresh).toHaveBeenCalledTimes(1);
  });
  it('S-02: el refresco anticipado comienza 60 segundos antes del vencimiento', async () => {
    const auth = authDouble();
    const session = store(auth);
    await session.signIn('a@example.invalid', 'fake-password');
    await vi.advanceTimersByTimeAsync(29 * 60000);
    session.activity();
    await vi.advanceTimersByTimeAsync(29 * 60000);
    session.activity();
    await vi.advanceTimersByTimeAsync(60000);
    expect(auth.refresh).toHaveBeenCalledTimes(1);
    expect(session.getSnapshot().session).not.toBeNull();
  });
  it.each(['TOKEN_INVALID', 'NETWORK', 'TIMEOUT', 'UNKNOWN_OUTCOME'] as const)(
    'S-03: refresh %s invalida inmediatamente la generación, sin repetición',
    async (code) => {
      const auth = authDouble({
        refresh: vi.fn(async () => {
          throw new PortalError(code);
        }),
      });
      const session = store(auth);
      await session.signIn('a@example.invalid', 'fake-password');
      const epoch = session.getSnapshot().epoch;
      await expect(session.refresh()).rejects.toMatchObject({ code });
      expect(session.getSnapshot().epoch).toBeGreaterThan(epoch);
      expect(session.getSnapshot().session).toBeNull();
      await vi.advanceTimersByTimeAsync(4 * 3600000);
      expect(auth.refresh).toHaveBeenCalledTimes(1);
    },
  );
  it.each(['local', 'global'] as const)(
    'S-04: logout %s vacía memoria antes de resolver red caída',
    async (scope) => {
      const pending = deferred<void>();
      const auth = authDouble({ signOut: vi.fn(() => pending.promise) });
      const session = store(auth);
      await session.signIn('a@example.invalid', 'fake-password');
      const out = session.logout(scope);
      expect(session.getSnapshot().session).toBeNull();
      expect(auth.signOut).toHaveBeenCalledWith(scope, 'fake-access-a', expect.any(AbortSignal));
      pending.reject(new PortalError('NETWORK'));
      await out;
      expect(session.getSnapshot().notice).toContain('remoto no confirmado');
    },
  );
  it('S-05: inactividad de 30 min usa logout local y la actividad reinicia su reloj', async () => {
    const auth = authDouble();
    const session = store(auth);
    await session.signIn('a@example.invalid', 'fake-password');
    await vi.advanceTimersByTimeAsync(29 * 60000);
    session.activity();
    await vi.advanceTimersByTimeAsync(29 * 60000);
    expect(session.getSnapshot().session).not.toBeNull();
    await vi.advanceTimersByTimeAsync(60000);
    expect(session.getSnapshot().session).toBeNull();
    expect(auth.signOut).toHaveBeenCalledWith('local', expect.any(String), expect.any(AbortSignal));
  });
  it('S-05: un refresh de fondo no renueva la actividad humana', async () => {
    const auth = authDouble({ signIn: vi.fn(async () => pair(ownerA, 'a', 1200)) });
    const session = store(auth);
    await session.signIn('a@example.invalid', 'fake-password');
    await vi.advanceTimersByTimeAsync(30 * 60000);
    expect(auth.refresh).toHaveBeenCalledTimes(1);
    expect(session.getSnapshot().session).toBeNull();
  });
  it('S-12: logout aborta refresh y sus diez esperas; el 200 tardío no revive ni reprograma', async () => {
    const waiting = deferred<AuthTokens>();
    let signal: AbortSignal | undefined;
    const auth = authDouble({
      refresh: vi.fn((_token, incoming) => {
        signal = incoming;
        return waiting.promise;
      }),
    });
    const session = store(auth);
    await session.signIn('a@example.invalid', 'fake-password');
    const operation = vi.fn(async () => {
      throw new PortalError('TOKEN_EXPIRED', 401);
    });
    const requests = Array.from({ length: 10 }, () =>
      session.authorized(operation).catch((error) => error as PortalError),
    );
    await Promise.resolve();
    await Promise.resolve();
    await session.logout('local');
    expect(signal?.aborted).toBe(true);
    waiting.resolve(pair(ownerA, 'late'));
    const results = await Promise.all(requests);
    results.forEach((result) => expect(result).toMatchObject({ code: 'SESSION_ENDED' }));
    expect(operation).toHaveBeenCalledTimes(10);
    expect(session.getSnapshot().session).toBeNull();
    await vi.advanceTimersByTimeAsync(4 * 3600000);
    expect(auth.refresh).toHaveBeenCalledTimes(1);
  });
  it('S-13: A → logout → B descarta refresh y API tardíos de A', async () => {
    const refresh = deferred<AuthTokens>();
    const api = deferred<string>();
    let logins = 0;
    const auth = authDouble({
      signIn: vi.fn(async () => (++logins === 1 ? pair() : pair(ownerB, 'b'))),
      refresh: vi.fn(() => refresh.promise),
    });
    const session = store(auth);
    await session.signIn('a@example.invalid', 'fake-password');
    const oldApi = session.authorized(() => api.promise).catch((error) => error as PortalError);
    const refreshing = session.refresh().catch((error) => error as PortalError);
    await session.logout('local');
    await session.signIn('b@example.invalid', 'fake-password');
    refresh.resolve(pair(ownerA, 'late'));
    api.resolve('DATOS A NO PINTAR');
    expect(await refreshing).toMatchObject({ code: 'SESSION_ENDED' });
    expect(await oldApi).toMatchObject({ code: 'SESSION_ENDED' });
    expect(session.getSnapshot().session?.userId).toBe(ownerB);
    expect(await session.authorized(async (token) => token)).toBe('fake-access-b');
  });
  it('S-14: inactividad durante refresh aborta y descarta el 200 tardío', async () => {
    const waiting = deferred<AuthTokens>();
    const auth = authDouble({ refresh: vi.fn(() => waiting.promise) });
    const session = store(auth);
    await session.signIn('a@example.invalid', 'fake-password');
    await vi.advanceTimersByTimeAsync(29 * 60000);
    const result = session.refresh().catch((error) => error as PortalError);
    await vi.advanceTimersByTimeAsync(60000);
    waiting.resolve(pair(ownerA, 'late'));
    expect(await result).toMatchObject({ code: 'SESSION_ENDED' });
    expect(session.getSnapshot().session).toBeNull();
    expect(auth.signOut).toHaveBeenCalledTimes(1);
  });
  it('refresh que devuelve otro dueño cierra la sesión', async () => {
    const session = store(authDouble({ refresh: vi.fn(async () => pair(ownerB, 'b')) }));
    await session.signIn('a@example.invalid', 'fake-password');
    await expect(session.refresh()).rejects.toMatchObject({ code: 'TOKEN_INVALID' });
    expect(session.getSnapshot().session).toBeNull();
  });
  it('solo recuperación vigente permite cambiar contraseña', async () => {
    const auth = authDouble();
    const session = store(auth);
    await expect(session.updatePassword('new-fake-password')).rejects.toMatchObject({
      code: 'RECOVERY_REQUIRED',
    });
    await session.signIn('a@example.invalid', 'fake-password');
    await expect(session.updatePassword('new-fake-password')).rejects.toMatchObject({
      code: 'RECOVERY_REQUIRED',
    });
    await session.verify({ type: 'recovery', tokenHash: 'abcdefghijklmnopqrst' });
    await session.updatePassword('new-fake-password');
    expect(auth.updatePassword).toHaveBeenCalledTimes(1);
    expect(session.getSnapshot().session).toBeNull();
  });
});
describe('confirmación única y demo cerrada', () => {
  it.each(['signup', 'recovery'] as const)(
    'S-06/S-15: limpia URL antes de verificar %s, incluso con montaje doble',
    async (type) => {
      const waiting = deferred<AuthTokens>();
      let clean = false;
      const auth = authDouble({
        verify: vi.fn(() => {
          expect(clean).toBe(true);
          return waiting.promise;
        }),
      });
      const session = store(auth);
      const flow = createConfirmationFlow(session);
      const location = {
        pathname: '/auth/confirm',
        search: '?type=' + type + '&token_hash=abcdefghijklmnopqrst',
        hash: '',
      };
      const history = {
        replaceState: vi.fn(() => {
          clean = true;
        }),
      };
      const first = flow.consume(location, history);
      const second = flow.consume({ ...location, search: '' }, history);
      waiting.resolve(pair());
      await Promise.all([first, second, flow.consume({ ...location, search: '' }, history)]);
      expect(auth.verify).toHaveBeenCalledTimes(1);
      expect(history.replaceState).toHaveBeenCalledTimes(1);
      expect(history.replaceState).toHaveBeenCalledWith({}, '', '/auth/confirm');
      expect(flow.getSnapshot()).toEqual({ status: 'success', type });
      expect(session.getSnapshot().session?.kind).toBe(type === 'recovery' ? 'recovery' : 'access');
      expect(JSON.stringify(flow.getSnapshot())).not.toContain('abcdefghijklmnopqrst');
    },
  );
  it.each(['email', 'magiclink', 'invite', '', 'SIGNUP', 'Recovery', 'email_change'])(
    'S-15: tipo %s nunca verifica',
    async (type) => {
      const auth = authDouble();
      const flow = createConfirmationFlow(store(auth));
      await flow.consume(
        {
          pathname: '/auth/confirm',
          search: '?token_hash=abcdefghijklmnopqrst&type=' + type,
          hash: '',
        },
        { replaceState: vi.fn() },
      );
      expect(flow.getSnapshot().status).toBe('error');
      expect(auth.verify).not.toHaveBeenCalled();
    },
  );
  it.each([
    '?token_hash=abcdefghijklmnopqrst&type=signup&type=signup',
    '?token_hash=abcdefghijklmnopqrst&token_hash=abcdefghijklmnopqrst&type=signup',
    '?token_hash=abc&type=signup',
    '?token_hash=%20abcdefghijklmnopqrst&type=signup',
    '?token_hash=abcdefghijklmnopqrst&type=signup&next=/cuenta',
  ])('S-15: parámetros inválidos no van a red: %s', async (search) => {
    expect(parseConfirmSearch(search).status).toBe('invalid');
    const auth = authDouble();
    await createConfirmationFlow(store(auth)).consume(
      { pathname: '/auth/confirm', search, hash: '' },
      { replaceState: vi.fn() },
    );
    expect(auth.verify).not.toHaveBeenCalled();
  });
  it('flujo implícito se borra y rechaza; fallo/uso previo no se repite', async () => {
    const auth = authDouble({
      verify: vi.fn(async () => {
        throw new PortalError('LINK_INVALID');
      }),
    });
    const flow = createConfirmationFlow(store(auth));
    const history = { replaceState: vi.fn() };
    await flow.consume(
      {
        pathname: '/auth/confirm',
        search: '?token_hash=abcdefghijklmnopqrst&type=signup',
        hash: '#access_token=fake',
      },
      history,
    );
    expect(history.replaceState).toHaveBeenCalled();
    expect(auth.verify).not.toHaveBeenCalled();
    const second = createConfirmationFlow(store(auth));
    const location = {
      pathname: '/auth/confirm',
      search: '?token_hash=abcdefghijklmnopqrst&type=recovery',
      hash: '',
    };
    await second.consume(location, history);
    await second.consume(location, history);
    expect(auth.verify).toHaveBeenCalledTimes(1);
    expect(second.getSnapshot().status).toBe('error');
  });
  it('S-07: alta cerrada no envía; recuperación 200/400 desconocido tiene mismo resultado neutro', async () => {
    const fetcher = vi.fn(
      async () => new Response('{}', { headers: { 'Content-Type': 'application/json' } }),
    );
    const auth = createAuthClient(config, fetcher);
    expect(signupClosed).toThrowError('Registro cerrado');
    expect(fetcher).not.toHaveBeenCalled();
    await expect(
      auth.recover('existing@example.invalid', new AbortController().signal),
    ).resolves.toBeUndefined();
    fetcher.mockResolvedValueOnce(
      new Response('{}', { status: 400, headers: { 'Content-Type': 'application/json' } }),
    );
    await expect(
      auth.recover('unknown@example.invalid', new AbortController().signal),
    ).resolves.toBeUndefined();
    expect(fetcher).toHaveBeenCalledTimes(2);
  });
});
