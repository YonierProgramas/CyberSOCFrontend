import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createPortalRuntime, type PortalRuntime } from '../../src/app/runtime';
import { requestJson } from '../../src/api/http';
import { acceptedDownloadUrl } from '../../src/api/schemas';
import { config, download, failure, fakeServer, json, me, ownerB, pair } from '../fixtures/network';
const runtimes: PortalRuntime[] = [];
beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  runtimes.forEach((runtime) => runtime.session.dispose());
  runtimes.length = 0;
  vi.clearAllTimers();
  vi.useRealTimers();
});
async function runtime(handler: typeof fetch) {
  const fetcher = vi.fn<typeof fetch>(async (url, init) =>
    String(url).includes('/auth/v1/') ? json(pair()) : handler(url, init),
  );
  const result = createPortalRuntime(config, fetcher);
  runtimes.push(result);
  await result.session.signIn('a@example.invalid', 'fake-password');
  fetcher.mockClear();
  return { ...result, fetcher };
}
describe('API real: contratos y decisiones por resultado', () => {
  it('401 con sobre incompleto no cuenta como TOKEN_EXPIRED explícito ni refresca', async () => {
    const server = fakeServer();
    const portal = createPortalRuntime(config, async (url, init) =>
      String(url).includes('/auth/v1/')
        ? server.fetcher(url, init)
        : json({ error: { code: 'TOKEN_EXPIRED' } }, 401),
    );
    runtimes.push(portal);
    await portal.session.signIn('a@example.invalid', 'fake-password');
    await expect(portal.api.loadMe()).rejects.toMatchObject({ code: 'SESSION_ENDED' });
    expect(server.requests.filter((item) => item.path.includes('refresh_token'))).toHaveLength(0);
  });
  it.each(['NETWORK', 'TIMEOUT', '503'])(
    'refresh REST %s se envía una vez y descarta sesión inmediatamente',
    async (kind) => {
      let refreshes = 0;
      const portal = createPortalRuntime(config, async (url) => {
        if (!String(url).includes('refresh_token')) return json(pair());
        refreshes += 1;
        if (kind === 'NETWORK') throw new TypeError('private');
        if (kind === 'TIMEOUT') return new Promise<Response>(() => undefined);
        return failure('UPSTREAM_UNAVAILABLE', 503);
      });
      runtimes.push(portal);
      await portal.session.signIn('a@example.invalid', 'fake-password');
      const epoch = portal.session.getSnapshot().epoch;
      const result = portal.session.refresh().catch((error) => error);
      await vi.advanceTimersByTimeAsync(12001);
      expect(await result).toMatchObject({ code: 'UNKNOWN_OUTCOME' });
      expect(portal.session.getSnapshot().session).toBeNull();
      expect(portal.session.getSnapshot().epoch).toBeGreaterThan(epoch);
      await vi.advanceTimersByTimeAsync(3600000);
      expect(refreshes).toBe(1);
    },
  );
  it('POST con 401 TOKEN_EXPIRED explícito se repite una vez después de refresh', async () => {
    const server = fakeServer();
    server.setAvailable(true);
    let posts = 0;
    const portal = createPortalRuntime(config, async (url, init) => {
      if (String(url).endsWith('/v1/downloads') && ++posts === 1)
        return failure('TOKEN_EXPIRED', 401);
      return server.fetcher(url, init);
    });
    runtimes.push(portal);
    await portal.session.signIn('a@example.invalid', 'fake-password');
    expect(await portal.api.requestDownload()).toEqual(download);
    expect(posts).toBe(2);
    expect(server.requests.filter((item) => item.path.includes('refresh_token'))).toHaveLength(1);
  });
  it.each([403, 404, 503])('DELETE %s no repite ni fabrica revocación', async (status) => {
    const portal = await runtime(async () =>
      failure(
        status === 403 ? 'FORBIDDEN' : status === 404 ? 'NOT_FOUND' : 'UPSTREAM_UNAVAILABLE',
        status,
      ),
    );
    await expect(portal.api.revokeDevice(ownerB)).rejects.toMatchObject({
      code: status === 403 ? 'FORBIDDEN' : status === 404 ? 'NOT_FOUND' : 'UNKNOWN_OUTCOME',
    });
    expect(portal.fetcher).toHaveBeenCalledTimes(1);
  });
  it('listado respeta orden y cursor de páginas vivas; DELETE 204 válido', async () => {
    const server = fakeServer();
    const portal = await runtime(server.fetcher);
    const page = await portal.api.loadDevices();
    expect(page.items.map((item) => item.displayName)).toEqual(['Equipo de ejemplo']);
    expect(page.nextCursor).toBeNull();
    await expect(portal.api.revokeDevice(page.items[0]?.deviceId)).resolves.toBeNull();
    expect((await portal.api.loadDevices()).items[0]?.revokedAt).not.toBeNull();
  });
  it.each([
    [401, 'TOKEN_INVALID'],
    [403, 'FORBIDDEN'],
    [404, 'PROFILE_NOT_FOUND'],
    [409, 'POLICY_VERSION_OUTDATED'],
    [429, 'RATE_LIMITED'],
  ] as const)('error %s/%s fijo; sin texto upstream ni reintentos', async (status, code) => {
    const portal = await runtime(async () => failure(code, status, { 'Retry-After': '9' }));
    const request =
      code === 'POLICY_VERSION_OUTDATED'
        ? portal.api.saveConsent('scan_summaries', { granted: true, policyVersion: 'old' })
        : portal.api.loadMe();
    const error = await request.catch((error) => error as Error);
    expect(error).toBeInstanceOf(Error);
    if (error instanceof Error) expect(error.message).not.toMatch(/SQL|private|UPSTREAM/);
    expect(portal.fetcher).toHaveBeenCalledTimes(1);
    if (status === 429) expect(error).toMatchObject({ retryAfterMs: 9000 });
    if (status === 401) expect(portal.session.getSnapshot().session).toBeNull();
  });
  it('401 TOKEN_EXPIRED explícito refresca y repite una vez; 403 no refresca', async () => {
    const server = fakeServer();
    let calls = 0;
    const fetcher = vi.fn<typeof fetch>(async (url, init) => {
      if (String(url).includes('/v1/me') && ++calls === 1) return failure('TOKEN_EXPIRED', 401);
      return server.fetcher(url, init);
    });
    const portal = createPortalRuntime(config, fetcher);
    runtimes.push(portal);
    await portal.session.signIn('a@example.invalid', 'fake-password');
    expect((await portal.api.loadMe()).userId).toBe(me().userId);
    expect(server.requests.filter((item) => item.path.includes('refresh_token'))).toHaveLength(1);
    expect(calls).toBe(2);
  });
  it.each(['NETWORK', 'TIMEOUT', '503', '504'])(
    'lectura %s: 3 intentos como máximo con esperas 2/5 s',
    async (kind) => {
      const portal = await runtime(async () => {
        if (kind === 'NETWORK') throw new TypeError('UPSTREAM SQL private');
        if (kind === 'TIMEOUT') return new Promise<Response>(() => undefined);
        return failure(kind === '503' ? 'UPSTREAM_UNAVAILABLE' : 'UPSTREAM_TIMEOUT', Number(kind));
      });
      const caught = portal.api.loadMe().catch((error) => error as Error);
      await vi.advanceTimersByTimeAsync(44000);
      const error = await caught;
      expect(error).toBeInstanceOf(Error);
      if (error instanceof Error) expect(error.message).not.toMatch(/SQL|private/);
      expect(portal.fetcher).toHaveBeenCalledTimes(3);
      expect(portal.session.getSnapshot().session).not.toBeNull();
    },
  );
  it.each(['NETWORK', 'TIMEOUT', '503', 'BAD_JSON'])(
    'mutación %s: resultado desconocido, nunca repetida',
    async (kind) => {
      const portal = await runtime(async () => {
        if (kind === 'NETWORK') throw new TypeError('private');
        if (kind === 'TIMEOUT') return new Promise<Response>(() => undefined);
        if (kind === 'BAD_JSON')
          return new Response('bad', { headers: { 'Content-Type': 'application/json' } });
        return failure('UPSTREAM_UNAVAILABLE', 503);
      });
      const caught = portal.api
        .saveProfile({ displayName: 'Cuenta local' })
        .catch((error) => error as Error);
      await vi.advanceTimersByTimeAsync(12001);
      expect(await caught).toMatchObject({ code: 'UNKNOWN_OUTCOME' });
      expect(portal.fetcher).toHaveBeenCalledTimes(1);
    },
  );
  it('dueño no se elige por input; Me de otro dueño se descarta', async () => {
    const portal = await runtime(async () => json(me(ownerB)));
    expect(() => portal.api.saveProfile({ displayName: 'Local', userId: ownerB })).toThrow();
    expect(() =>
      portal.api.savePreferences({
        locale: 'es',
        timezone: 'America/Bogota',
        theme: 'dark',
        owner: ownerB,
      }),
    ).toThrow();
    expect(() =>
      portal.api.saveConsent('scan_summaries', { granted: false, owner: ownerB }),
    ).toThrow();
    expect(portal.fetcher).not.toHaveBeenCalled();
    await expect(portal.api.loadMe()).rejects.toMatchObject({ code: 'BAD_RESPONSE' });
    expect(portal.fetcher).toHaveBeenCalledTimes(1);
  });
  it('preferencias/perfil/consentimientos respetan contrato; retirada no exige versión; 409 no concede nueva', async () => {
    const server = fakeServer();
    const portal = await runtime(server.fetcher);
    await portal.api.saveProfile({ displayName: 'Nombre local' });
    expect((await portal.api.loadMe()).profile.displayName).toBe('Nombre local');
    await portal.api.savePreferences({ locale: 'es', timezone: 'America/Bogota', theme: 'dark' });
    await expect(
      portal.api.saveConsent('scan_summaries', { granted: true, policyVersion: 'old' }),
    ).rejects.toMatchObject({ code: 'POLICY_VERSION_OUTDATED' });
    expect((await portal.api.loadConsents())[0]?.granted).toBe(false);
    await portal.api.saveConsent('scan_summaries', { granted: true, policyVersion: 'demo-v1' });
    await portal.api.saveConsent('scan_summaries', { granted: false });
    expect(server.requests.at(-1)?.body).toEqual({ granted: false });
    expect(() => portal.api.saveConsent('scan_summaries', { granted: true })).toThrow();
  });
  it('perfil inexistente conserva PROFILE_NOT_FOUND; crear PUT devuelve perfil', async () => {
    const server = fakeServer();
    server.setMissing(true);
    const portal = await runtime(server.fetcher);
    await expect(portal.api.loadMe()).rejects.toMatchObject({ code: 'PROFILE_NOT_FOUND' });
    expect(
      (await portal.api.saveProfile({ displayName: 'Perfil nuevo local' })).profile.displayName,
    ).toBe('Perfil nuevo local');
  });
  it('release ausente no reintenta ni inventa URL; POST descarga solo con sesión y consentimiento no exigido', async () => {
    const server = fakeServer();
    const portal = await runtime(server.fetcher);
    await expect(portal.api.latestRelease()).rejects.toMatchObject({
      code: 'RELEASE_UNAVAILABLE',
      status: 503,
    });
    expect(portal.fetcher).toHaveBeenCalledTimes(1);
    await expect(portal.api.requestDownload()).rejects.toMatchObject({
      code: 'RELEASE_UNAVAILABLE',
      status: 503,
    });
    server.setAvailable(true);
    expect(await portal.api.requestDownload()).toEqual(download);
    expect(server.requests.filter((item) => item.path.includes('/consents'))).toHaveLength(0);
    await portal.session.logout('local');
    await expect(portal.api.requestDownload()).rejects.toMatchObject({ code: 'AUTH_REQUIRED' });
  });
  it.each([
    'https://evil.example/a.exe',
    'https://github.com.evil.example/YonierProgramas/CyberSOC/releases/download/v1/a.exe',
    'https://evil@github.com/YonierProgramas/CyberSOC/releases/download/v1/a.exe',
    'https://github.com/YonierProgramas/CyberSOC/releases/download/v1/a.exe?next=evil',
    'https://github.com/YonierProgramas/CyberSOC/releases/download/v1/a.exe#secret',
    'https://github.com/YonierProgramas/CyberSOC/releases/download/v1/%2Fbad.exe',
    'https://github.com:444/YonierProgramas/CyberSOC/releases/download/v1/a.exe',
    'https://github.com:443/YonierProgramas/CyberSOC/releases/download/v1/a.exe',
    'javascript:alert(1)',
    'invalid',
  ])('URL ajena o ambigua se rechaza: %s', async (url) => {
    expect(acceptedDownloadUrl(url)).toBe(false);
    const portal = await runtime(async () => json({ ...download, downloadUrl: url }));
    await expect(portal.api.requestDownload()).rejects.toMatchObject({ code: 'UNKNOWN_OUTCOME' });
  });
  it('K10 usa cursor opaco y límite estable; INVALID_CURSOR no fabrica página final', async () => {
    const cursor = 'c1.' + 'a'.repeat(43);
    const portal = await runtime(async () => failure('INVALID_CURSOR', 400));
    expect(() => portal.api.loadDevices('owner=' + ownerB)).toThrow();
    await expect(portal.api.loadDevices(cursor)).rejects.toMatchObject({ code: 'INVALID_CURSOR' });
    const requested = String(portal.fetcher.mock.calls[0]?.[0]);
    expect(requested).toContain('/v1/devices?limit=20&cursor=c1.');
    expect(requested).not.toContain('owner');
    expect(portal.fetcher).toHaveBeenCalledTimes(1);
  });
});
describe('transporte acotado y cancelación', () => {
  it('abortado antes de empezar no envía y timeout no reenvía aunque fetch ignore abort', async () => {
    const fetcher = vi.fn<typeof fetch>(() => new Promise(() => undefined));
    const controller = new AbortController();
    controller.abort();
    await expect(
      requestJson(fetcher, config.apiBaseUrl, {}, controller.signal),
    ).rejects.toMatchObject({ code: 'SESSION_ENDED' });
    expect(fetcher).not.toHaveBeenCalled();
    const caught = requestJson(fetcher, config.apiBaseUrl, {}, new AbortController().signal).catch(
      (error) => error as Error,
    );
    await vi.advanceTimersByTimeAsync(12000);
    expect(await caught).toMatchObject({ code: 'TIMEOUT' });
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
  it('abort pendiente rechaza incluso si fetch ignora señal; respuesta enorme no pasa', async () => {
    const controller = new AbortController();
    const request = requestJson(
      () => new Promise(() => undefined),
      config.apiBaseUrl,
      {},
      controller.signal,
    ).catch((error) => error as Error);
    controller.abort();
    expect(await request).toMatchObject({ code: 'SESSION_ENDED' });
    await expect(
      requestJson(
        async () => json('a'.repeat(524289)),
        config.apiBaseUrl,
        {},
        new AbortController().signal,
      ),
    ).rejects.toMatchObject({ code: 'BAD_RESPONSE' });
  });
});
