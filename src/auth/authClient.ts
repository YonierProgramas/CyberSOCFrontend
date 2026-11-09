import { z } from 'zod';
import type { PublicConfig } from '../config/publicConfig';
import { CONFIRM_SIGNUP_TYPE } from '../config/publicConfig';
import { PortalError } from '../api/fault';
import { requestJson, type Fetcher } from '../api/http';
const userSchema = z.object({ id: z.string().uuid() });
const tokensSchema = z.object({
  access_token: z.string().min(1).max(16384),
  refresh_token: z.string().min(1).max(4096),
  expires_in: z.number().int().positive().max(2147483),
  expires_at: z.number().int().positive().optional(),
  user: userSchema,
});
export type AuthTokens = z.infer<typeof tokensSchema>;
export type ConfirmInput = { tokenHash: string; type: typeof CONFIRM_SIGNUP_TYPE | 'recovery' };
export interface AuthClient {
  signIn(email: string, password: string, signal: AbortSignal): Promise<AuthTokens>;
  signUp(email: string, password: string, signal: AbortSignal): Promise<AuthTokens>;
  refresh(token: string, signal: AbortSignal): Promise<AuthTokens>;
  verify(input: ConfirmInput, signal: AbortSignal): Promise<AuthTokens>;
  recover(email: string, signal: AbortSignal): Promise<void>;
  updatePassword(password: string, accessToken: string, signal: AbortSignal): Promise<void>;
  signOut(scope: 'local' | 'global', accessToken: string, signal: AbortSignal): Promise<void>;
}
export function createAuthClient(config: PublicConfig, fetcher: Fetcher = fetch): AuthClient {
  function validEmail(value: string) {
    if (!z.email().max(254).safeParse(value).success) throw new PortalError('VALIDATION_FAILED');
  }
  function validPassword(value: string, minimum = 1) {
    if (value.length < minimum || value.length > 4096) throw new PortalError('VALIDATION_FAILED');
  }
  async function call(
    path: string,
    method: string,
    body: unknown,
    signal: AbortSignal,
    token?: string,
  ) {
    let result;
    try {
      result = await requestJson(
        fetcher,
        config.supabaseUrl + '/auth/v1/' + path,
        {
          method,
          headers: {
            apikey: config.publishableKey,
            'Content-Type': 'application/json',
            ...(token ? { Authorization: 'Bearer ' + token } : {}),
          },
          ...(body === undefined ? {} : { body: JSON.stringify(body) }),
        },
        signal,
      );
    } catch (error) {
      if (
        error instanceof PortalError &&
        ['NETWORK', 'TIMEOUT', 'BAD_RESPONSE'].includes(error.code)
      )
        throw new PortalError('UNKNOWN_OUTCOME');
      throw error;
    }
    if (!result.ok) {
      if (result.status === 429) throw new PortalError('RATE_LIMITED', 429, result.retryAfterMs);
      if (result.status >= 500) throw new PortalError('UNKNOWN_OUTCOME', result.status);
      throw new PortalError('AUTH_REQUIRED', result.status);
    }
    return result.data;
  }
  async function session(path: string, body: unknown, signal: AbortSignal) {
    const parsed = tokensSchema.safeParse(await call(path, 'POST', body, signal));
    if (!parsed.success) throw new PortalError('BAD_RESPONSE');
    return parsed.data;
  }
  return {
    async signUp(email, password, signal) {
      if (config.signupMode !== 'open') throw new PortalError('SIGNUP_CLOSED');
      validEmail(email);
      validPassword(password, 8);
      let data;
      try {
        data = await call('signup', 'POST', { email, password }, signal);
      } catch (error) {
        if (error instanceof PortalError && error.status >= 400 && error.status < 429)
          throw new PortalError('SIGNUP_FAILED', error.status);
        throw error;
      }
      const parsed = tokensSchema.safeParse(data);
      if (parsed.success) return parsed.data;
      if (userSchema.safeParse(data).success) throw new PortalError('SIGNUP_CONFIRMATION_REQUIRED');
      throw new PortalError('UNKNOWN_OUTCOME');
    },
    async signIn(email, password, signal) {
      validEmail(email);
      validPassword(password);
      try {
        return await session('token?grant_type=password', { email, password }, signal);
      } catch (error) {
        if (error instanceof PortalError && error.status >= 400 && error.status < 429)
          throw new PortalError('LOGIN_FAILED', error.status);
        throw error;
      }
    },
    refresh: (refresh_token, signal) =>
      session('token?grant_type=refresh_token', { refresh_token }, signal),
    async verify(input, signal) {
      if (
        (input.type !== CONFIRM_SIGNUP_TYPE && input.type !== 'recovery') ||
        !/^[A-Za-z0-9_-]{20,512}$/.test(input.tokenHash)
      )
        throw new PortalError('LINK_INVALID');
      try {
        return await session('verify', { type: input.type, token_hash: input.tokenHash }, signal);
      } catch (error) {
        if (error instanceof PortalError && error.code === 'SESSION_ENDED') throw error;
        throw new PortalError('LINK_INVALID');
      }
    },
    async recover(email, signal) {
      validEmail(email);
      try {
        await call('recover', 'POST', { email }, signal);
      } catch (error) {
        if (error instanceof PortalError && error.status >= 400 && error.status < 429) return;
        throw error;
      }
    },
    async updatePassword(password, token, signal) {
      validPassword(password, 8);
      const data = await call('user', 'PUT', { password }, signal, token);
      if (!userSchema.safeParse(data).success) throw new PortalError('UNKNOWN_OUTCOME');
    },
    async signOut(scope, token, signal) {
      await call('logout?scope=' + scope, 'POST', undefined, signal, token);
    },
  };
}
