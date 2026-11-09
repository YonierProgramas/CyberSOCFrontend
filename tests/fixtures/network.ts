import type { PublicConfig } from '../../src/config/publicConfig';
export const config: PublicConfig = {
  apiBaseUrl: 'https://cybersocbackend.onrender.com',
  supabaseUrl: 'https://cgvjthwobrlzmhmzuuvg.supabase.co',
  publishableKey: 'sb_publishable_ejemplo_local_no_real_0000',
  signupMode: 'open',
  confirmSignupType: 'signup',
};
export const ownerA = '11111111-1111-4111-8111-111111111111';
export const ownerB = '22222222-2222-4222-8222-222222222222';
export const at = '2026-11-03T12:00:00.123456Z';
export function pair(userId = ownerA, suffix = 'a', expires_in = 3600) {
  return {
    access_token: 'fake-access-' + suffix,
    refresh_token: 'fake-refresh-' + suffix,
    expires_in,
    user: { id: userId },
  };
}
export const consents = ['scan_summaries', 'report_storage'].map((purpose) => ({
  purpose,
  granted: false,
  policyVersion: null as string | null,
  currentPolicyVersion: 'demo-v1',
  needsRenewal: false,
  effective: false,
  changedAt: null as string | null,
}));
export function me(userId = ownerA, displayName = 'Cuenta de ejemplo') {
  return {
    userId,
    email: null,
    profile: { displayName, createdAt: at },
    preferences: { locale: 'es-CO', timezone: 'America/Bogota', theme: 'system' },
    consents: structuredClone(consents),
  };
}
export const release = {
  version: '0.0.0-local',
  platform: 'windows-x64',
  publishedAt: at,
  sizeBytes: 1234,
  sha256: 'a'.repeat(64),
  sourceCommit: 'b'.repeat(40),
  notes: 'Fixture local',
  requirements: { os: 'Windows 10/11 x64', admin: false },
};
export const download = {
  requestId: ownerA,
  version: release.version,
  downloadUrl:
    'https://github.com/YonierProgramas/CyberSOC/releases/download/v0.0.0-local/fixture.exe',
  sizeBytes: release.sizeBytes,
  sha256: release.sha256,
  notice: 'Fixture local',
};
export const device = {
  deviceId: '33333333-3333-4333-8333-333333333333',
  displayName: 'Equipo de ejemplo',
  platform: 'windows-x64',
  appVersion: '0.0.0-local',
  createdAt: at,
  lastSeenAt: null,
  revokedAt: null as string | null,
};
export function json(data: unknown, status = 200, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers },
  });
}
export function failure(code: string, status: number, headers: Record<string, string> = {}) {
  return json(
    { error: { code, message: 'UPSTREAM SQL private-body', requestId: ownerA } },
    status,
    headers,
  );
}
export function fakeServer() {
  let profile = me();
  let missing = false;
  let available = false;
  let devices = [structuredClone(device)];
  const requests: { path: string; method: string; body: unknown; authorization: string | null }[] =
    [];
  const fetcher: typeof fetch = async (input, init) => {
    const url = new URL(String(input));
    const method = init?.method ?? 'GET';
    const body = init?.body ? (JSON.parse(String(init.body)) as Record<string, unknown>) : {};
    const authorization = new Headers(init?.headers).get('Authorization');
    requests.push({ path: url.pathname + url.search, method, body, authorization });
    if (url.pathname === '/auth/v1/token') {
      if (url.search.includes('password')) {
        const b = String(body.email).startsWith('b@');
        profile = me(b ? ownerB : ownerA, b ? 'Cuenta B local' : 'Cuenta de ejemplo');
        return json(pair(profile.userId, b ? 'b' : 'a'));
      }
      return json(pair(profile.userId, 'rotated'));
    }
    if (url.pathname === '/auth/v1/signup') {
      missing = true;
      return json(pair());
    }
    if (url.pathname === '/auth/v1/verify') return json(pair());
    if (url.pathname === '/auth/v1/recover') return json({});
    if (url.pathname === '/auth/v1/user') return json({ id: ownerA });
    if (url.pathname === '/auth/v1/logout') return new Response(null, { status: 204 });
    if (url.pathname === '/v1/me') {
      if (method === 'PUT') {
        profile.profile.displayName = String(body.displayName);
        missing = false;
      }
      return missing ? failure('PROFILE_NOT_FOUND', 404) : json(profile);
    }
    if (url.pathname === '/v1/me/preferences') {
      Object.assign(profile.preferences, body);
      return json(profile.preferences);
    }
    if (url.pathname === '/v1/me/consents') return json(profile.consents);
    if (url.pathname.startsWith('/v1/me/consents/')) {
      const consent = profile.consents.find(
        (item) => item.purpose === url.pathname.split('/').at(-1),
      );
      if (!consent) return failure('NOT_FOUND', 404);
      if (body.granted === true && body.policyVersion !== consent.currentPolicyVersion)
        return failure('POLICY_VERSION_OUTDATED', 409);
      Object.assign(consent, {
        granted: body.granted,
        effective: body.granted,
        policyVersion: body.granted ? body.policyVersion : null,
        changedAt: at,
      });
      return json(consent);
    }
    if (url.pathname === '/v1/releases/latest')
      return available ? json(release) : failure('RELEASE_UNAVAILABLE', 503);
    if (url.pathname === '/v1/downloads')
      return available ? json(download) : failure('RELEASE_UNAVAILABLE', 503);
    if (url.pathname.startsWith('/v1/devices/')) {
      devices = devices.map((item) => ({ ...item, revokedAt: at }));
      return new Response(null, { status: 204 });
    }
    if (url.pathname === '/v1/devices') return json({ items: devices, nextCursor: null });
    return failure('NOT_FOUND', 404);
  };
  return {
    fetcher,
    requests,
    setMissing(value: boolean) {
      missing = value;
    },
    setAvailable(value: boolean) {
      available = value;
    },
    emptyDevices() {
      devices = [];
    },
  };
}
