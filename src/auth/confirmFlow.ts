import { CONFIRM_SIGNUP_TYPE } from '../config/publicConfig';
import type { SessionStore } from './session';
export type ConfirmType = typeof CONFIRM_SIGNUP_TYPE | 'recovery';
export type ConfirmParse = { status: 'invalid' } | { status: 'ready'; type: ConfirmType };
// Set cerrado: únicos parámetros admitidos. has O(1) promedio.
const allowed = new Set(['token_hash', 'type']);
export function parseConfirmSearch(search: string): ConfirmParse {
  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
  // Set de claves vistas, sin duplicados. has/add O(1) promedio; recorrido O(n).
  const seen = new Set<string>();
  for (const [key] of params) {
    if (seen.has(key) || !allowed.has(key)) return { status: 'invalid' };
    seen.add(key);
  }
  const hash = params.get('token_hash');
  const type = params.get('type');
  if (!hash || hash.length < 20 || hash.length > 512 || !/^[A-Za-z0-9_-]+$/.test(hash))
    return { status: 'invalid' };
  if (type !== CONFIRM_SIGNUP_TYPE && type !== 'recovery') return { status: 'invalid' };
  return { status: 'ready', type };
}
export function cleanConfirmPath() {
  return '/auth/confirm';
}
export type ConfirmState =
  { status: 'idle' | 'pending' | 'error' } | { status: 'success'; type: ConfirmType };
export function createConfirmationFlow(session: SessionStore) {
  let started = false;
  let pending: Promise<void> | null = null;
  let state: ConfirmState = { status: 'idle' };
  // Observadores únicos, subscribe/delete O(1) promedio; notificación O(n).
  const listeners = new Set<() => void>();
  function emit(value: ConfirmState) {
    state = value;
    for (const listener of listeners) listener();
  }
  return {
    getSnapshot: () => state,
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    consume(
      location: Pick<Location, 'pathname' | 'search' | 'hash'>,
      history: Pick<History, 'replaceState'>,
    ) {
      if (location.pathname !== cleanConfirmPath()) return Promise.resolve();
      if (started) {
        // También borra un fragmento añadido por navegación dentro del mismo documento.
        if (location.search || location.hash) history.replaceState({}, '', cleanConfirmPath());
        return pending ?? Promise.resolve();
      }
      started = true;
      const parsed = parseConfirmSearch(location.search);
      const hash = new URLSearchParams(location.search).get('token_hash');
      const implicit = location.hash !== '';
      // Antes de red, incluso si el enlace es inválido. Nunca guardar URL/hash en el historial.
      history.replaceState({}, '', cleanConfirmPath());
      if (parsed.status !== 'ready' || !hash || implicit) {
        emit({ status: 'error' });
        return Promise.resolve();
      }
      emit({ status: 'pending' });
      const type = parsed.type;
      pending = session
        .verify({ type, tokenHash: hash })
        .then(() => {
          emit({ status: 'success', type });
        })
        .catch(() => {
          // La verificación iniciada nunca se repite por remontaje, doble clic o fallo de red.
          emit({ status: 'error' });
        });
      return pending;
    },
  };
}
