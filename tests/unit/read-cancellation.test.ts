import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { createPortalRuntime, type PortalRuntime } from '../../src/app/runtime';
import { retryAfterMs } from '../../src/api/http';
import { ReadPool } from '../../src/api/readPool';
import { config, failure, fakeServer, json, me, ownerB } from '../fixtures/network';

let portal: PortalRuntime | undefined;
beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  portal?.session.dispose();
  portal = undefined;
  vi.useRealTimers();
});
async function setup(handler: typeof fetch) {
  const fake = fakeServer();
  const fetcher = vi.fn<typeof fetch>((url, init) =>
    String(url).includes('/auth/v1/') ? fake.fetcher(url, init) : handler(url, init),
  );
  portal = createPortalRuntime(config, fetcher);
  await portal.session.signIn('a@example.invalid', 'fake-password');
  fetcher.mockClear();
  return { portal, fetcher };
}
it('StrictMode: liberar y volver a adquirir en el mismo turno comparte un transporte', async () => {
  const { portal, fetcher } = await setup(async () => json(me()));
  const first = portal.api.loadMe();
  const ignored = first.catch((error) => error);
  first.cancel();
  const second = portal.api.loadMe();
  expect((await ignored).code).toBe('SESSION_ENDED');
  expect((await second).userId).toBe(me().userId);
  expect(fetcher).toHaveBeenCalledTimes(1);
});
it('cancelar un lector no aborta el recurso que sigue usando otro', async () => {
  const pool = new ReadPool();
  let complete: (value: string) => void = () => undefined;
  let signal: AbortSignal | undefined;
  const run = vi.fn((value: AbortSignal) => {
    signal = value;
    return new Promise<string>((resolve) => {
      complete = resolve;
    });
  });
  const a = pool.read('same', run);
  const caught = a.catch((error) => error);
  const b = pool.read('same', run);
  await Promise.resolve();
  a.cancel();
  await Promise.resolve();
  expect(signal?.aborted).toBe(false);
  complete('ok');
  expect(await b).toBe('ok');
  expect((await caught).code).toBe('SESSION_ENDED');
  expect(run).toHaveBeenCalledTimes(1);
});
it.each(['pending', 'retry'])(
  'abandonar recurso %s aborta fetch/espera y no genera retries',
  async (kind) => {
    let signal: AbortSignal | undefined;
    const { portal, fetcher } = await setup(async (_url, init) => {
      signal = init?.signal ?? undefined;
      return kind === 'retry'
        ? failure('UPSTREAM_UNAVAILABLE', 503)
        : new Promise<Response>(() => undefined);
    });
    const request = portal.api.latestRelease();
    const caught = request.catch((error) => error);
    await vi.advanceTimersByTimeAsync(1);
    request.cancel();
    await vi.advanceTimersByTimeAsync(60000);
    // La señal de un fetch ya completado no necesita cambiar; sí la espera/retry.
    if (kind === 'pending') expect(signal?.aborted).toBe(true);
    expect((await caught).code).toBe('SESSION_ENDED');
    expect(fetcher).toHaveBeenCalledTimes(1);
  },
);
it('una respuesta antigua no satisface la lectura nueva ni cruza de cuenta', async () => {
  const finishes: ((reply: Response) => void)[] = [];
  const { portal } = await setup(
    () =>
      new Promise((resolve) => {
        finishes.push(resolve);
      }),
  );
  const old = portal.api.loadMe();
  const ended = old.catch((error) => error);
  await vi.advanceTimersByTimeAsync(1);
  await portal.session.logout('local');
  await portal.session.signIn('b@example.invalid', 'fake-password');
  const next = portal.api.loadMe();
  await vi.advanceTimersByTimeAsync(1);
  finishes[0]!(json(me()));
  finishes[1]!(json(me(ownerB)));
  expect((await ended).code).toBe('SESSION_ENDED');
  expect((await next).userId).toBe(ownerB);
});
it('503 terminal no reintenta y una visita posterior consulta de nuevo', async () => {
  const { portal, fetcher } = await setup(async () => failure('RELEASE_UNAVAILABLE', 503));
  await expect(portal.api.latestRelease()).rejects.toMatchObject({ code: 'RELEASE_UNAVAILABLE' });
  await vi.advanceTimersByTimeAsync(6000);
  expect(fetcher).toHaveBeenCalledTimes(1);
  await expect(portal.api.latestRelease()).rejects.toMatchObject({ code: 'RELEASE_UNAVAILABLE' });
  expect(fetcher).toHaveBeenCalledTimes(2);
});
it.each([1, 120])(
  '429 de %s segundos se respeta, sin retries ni llamadas durante cooldown',
  async (seconds) => {
    let limited = true;
    const { portal, fetcher } = await setup(async () =>
      limited ? failure('RATE_LIMITED', 429, { 'Retry-After': String(seconds) }) : json(me()),
    );
    await expect(portal.api.loadMe()).rejects.toMatchObject({
      code: 'RATE_LIMITED',
      retryAfterMs: seconds * 1000,
    });
    await vi.advanceTimersByTimeAsync(seconds * 1000 - 1);
    await expect(portal.api.loadMe()).rejects.toMatchObject({ code: 'RATE_LIMITED' });
    expect(fetcher).toHaveBeenCalledTimes(1);
    limited = false;
    await vi.advanceTimersByTimeAsync(1);
    await expect(portal.api.loadMe()).resolves.toMatchObject({ userId: me().userId });
  },
);
it('Retry-After acepta segundos y HTTP-date; valores inválidos conservan fallback seguro', () => {
  expect(retryAfterMs('1')).toBe(1000);
  expect(retryAfterMs('120')).toBe(120000);
  expect(retryAfterMs('Sat, 07 Nov 2026 22:00:00 GMT', Date.parse('2026-11-07T21:58:00Z'))).toBe(
    120000,
  );
  for (const value of [null, '', '-1', 'NaN', '1.5', 'infinite'])
    expect(retryAfterMs(value)).toBe(0);
  expect(retryAfterMs('999999999999')).toBe(2147483647);
});
