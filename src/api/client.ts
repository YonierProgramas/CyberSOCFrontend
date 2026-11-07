import { z } from 'zod';
import type { PublicConfig } from '../config/publicConfig';
import type { SessionStore } from '../auth/session';
import { PortalError, asPortalError, knownCode } from './fault';
import { requestJson, abortableDelay, type Fetcher } from './http';
import { ReadPool } from './readPool';
import {
  meSchema,
  profileSchema,
  preferencesSchema,
  consentsSchema,
  consentSchema,
  purposeSchema,
  releaseSchema,
  downloadSchema,
  devicePageSchema,
  cursorSchema,
} from './schemas';
const errorSchema = z
  .object({
    error: z
      .object({
        code: z.enum([
          'VALIDATION_FAILED',
          'INVALID_CURSOR',
          'AUTH_REQUIRED',
          'TOKEN_INVALID',
          'TOKEN_EXPIRED',
          'FORBIDDEN',
          'NOT_FOUND',
          'PROFILE_NOT_FOUND',
          'METHOD_NOT_ALLOWED',
          'CONFLICT',
          'POLICY_VERSION_OUTDATED',
          'PAYLOAD_TOO_LARGE',
          'UNSUPPORTED_MEDIA_TYPE',
          'RATE_LIMITED',
          'RELEASE_UNAVAILABLE',
          'UPSTREAM_UNAVAILABLE',
          'UPSTREAM_TIMEOUT',
          'INTERNAL',
        ]),
        message: z.string().max(200),
        requestId: z.string().uuid(),
      })
      .strict(),
  })
  .strict();
export function createAccountApi(
  session: SessionStore,
  config: PublicConfig,
  fetcher: Fetcher = fetch,
) {
  let limitedUntil = 0;
  let limitedEpoch = session.getSnapshot().epoch;
  const reads = new ReadPool();
  function read<T>(path: string, schema: z.ZodType<T>) {
    const epoch = session.getSnapshot().epoch;
    return reads.read(epoch + ':' + path, (signal) => {
      session.assertCurrent(epoch);
      return call(path, 'GET', undefined, schema, signal);
    });
  }
  async function call<T>(
    path: string,
    method: string,
    body: unknown,
    schema: z.ZodType<T>,
    resourceSignal?: AbortSignal,
  ) {
    if (limitedEpoch !== session.getSnapshot().epoch) {
      limitedEpoch = session.getSnapshot().epoch;
      limitedUntil = 0;
    }
    if (Date.now() < limitedUntil)
      throw new PortalError('RATE_LIMITED', 429, limitedUntil - Date.now());
    const owner = session.getSnapshot().session?.userId;
    const read = method === 'GET';
    const deadline = Date.now() + 60000;
    let readRetries = 0;
    return session.authorized(async (token, sessionSignal) => {
      const signal = resourceSignal
        ? AbortSignal.any([sessionSignal, resourceSignal])
        : sessionSignal;
      if (signal.aborted) throw new PortalError('SESSION_ENDED');
      for (let attempt = 0; attempt < 3; attempt += 1) {
        try {
          if (read && Date.now() >= deadline) throw new PortalError('TIMEOUT');
          const result = await requestJson(
            fetcher,
            config.apiBaseUrl + path,
            {
              method,
              headers: {
                Authorization: 'Bearer ' + token,
                ...(read || method === 'DELETE' ? {} : { 'Content-Type': 'application/json' }),
              },
              ...(body === undefined ? {} : { body: JSON.stringify(body) }),
            },
            signal,
            read ? Math.min(12000, deadline - Date.now()) : 12000,
          );
          if (!result.ok) {
            if (result.status === 429) limitedUntil = Date.now() + (result.retryAfterMs || 60000);
            const envelope = errorSchema.safeParse(result.data);
            const code = envelope.success ? knownCode(envelope.data.error.code) : null;
            // TOKEN_EXPIRED es la única respuesta que autoriza refresh y repetición.
            const safeCode =
              result.status === 401
                ? code === 'TOKEN_EXPIRED' || code === 'TOKEN_INVALID'
                  ? code
                  : 'AUTH_REQUIRED'
                : result.status === 429
                  ? 'RATE_LIMITED'
                  : (code ??
                    (result.status === 403
                      ? 'FORBIDDEN'
                      : result.status === 404
                        ? 'NOT_FOUND'
                        : result.status === 409
                          ? 'CONFLICT'
                          : result.status >= 500
                            ? 'UPSTREAM_UNAVAILABLE'
                            : 'INTERNAL'));
            throw new PortalError(
              !read && result.status >= 500 && safeCode !== 'RELEASE_UNAVAILABLE'
                ? 'UNKNOWN_OUTCOME'
                : safeCode,
              result.status,
              result.retryAfterMs,
            );
          }
          const parsed = schema.safeParse(result.data);
          if (!parsed.success) throw new PortalError(read ? 'BAD_RESPONSE' : 'UNKNOWN_OUTCOME');
          // El identificador de dueño nunca sale del formulario ni se acepta por respuesta ajena.
          if (path === '/v1/me' && (parsed.data as { userId: string }).userId !== owner)
            throw new PortalError('BAD_RESPONSE');
          return parsed.data;
        } catch (error) {
          const fault = asPortalError(error);
          if (
            read &&
            readRetries < 2 &&
            Date.now() + (readRetries === 0 ? 2000 : 5000) < deadline &&
            ['NETWORK', 'TIMEOUT', 'UPSTREAM_UNAVAILABLE', 'UPSTREAM_TIMEOUT'].includes(fault.code)
          ) {
            const delay = readRetries === 0 ? 2000 : 5000;
            readRetries += 1;
            await abortableDelay(delay, signal);
            continue;
          }
          if (!read && ['NETWORK', 'TIMEOUT', 'BAD_RESPONSE'].includes(fault.code))
            throw new PortalError('UNKNOWN_OUTCOME', fault.status);
          throw fault;
        }
      }
      throw new PortalError('INTERNAL');
    });
  }
  function input<T>(schema: z.ZodType<T>, value: unknown): T {
    const parsed = schema.safeParse(value);
    if (!parsed.success) throw new PortalError('VALIDATION_FAILED');
    return parsed.data;
  }
  return {
    loadMe: () => read('/v1/me', meSchema),
    saveProfile: (value: unknown) => call('/v1/me', 'PUT', input(profileSchema, value), meSchema),
    savePreferences: (value: unknown) =>
      call('/v1/me/preferences', 'PATCH', input(preferencesSchema, value), preferencesSchema),
    loadConsents: () => read('/v1/me/consents', consentsSchema),
    saveConsent(purpose: unknown, value: unknown) {
      const code = input(purposeSchema, purpose);
      const body = input(
        z.discriminatedUnion('granted', [
          z.object({ granted: z.literal(true), policyVersion: z.string().min(1).max(40) }).strict(),
          z.object({ granted: z.literal(false) }).strict(),
        ]),
        value,
      );
      return call('/v1/me/consents/' + code, 'PUT', body, consentSchema);
    },
    latestRelease: () => read('/v1/releases/latest?platform=windows-x64', releaseSchema),
    requestDownload: () =>
      call('/v1/downloads', 'POST', { platform: 'windows-x64' }, downloadSchema),
    loadDevices(cursor: string | null = null) {
      const suffix =
        cursor === null ? '' : '&cursor=' + encodeURIComponent(input(cursorSchema, cursor));
      return read('/v1/devices?limit=20' + suffix, devicePageSchema);
    },
    revokeDevice(id: unknown) {
      return call('/v1/devices/' + input(z.string().uuid(), id), 'DELETE', undefined, z.null());
    },
  };
}
export type AccountApi = ReturnType<typeof createAccountApi>;
