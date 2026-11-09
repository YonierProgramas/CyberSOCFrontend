import { z } from 'zod';

export const CONFIRM_SIGNUP_TYPE = 'signup' as const;
export const API_ORIGIN = 'https://cybersocbackend.onrender.com';
export const AUTH_ORIGIN = 'https://cgvjthwobrlzmhmzuuvg.supabase.co';

const httpsUrl = z
  .string()
  .trim()
  .url()
  .refine((value) => {
    const url = new URL(value);
    return (
      url.protocol === 'https:' &&
      url.username === '' &&
      url.password === '' &&
      url.pathname === '/' &&
      url.search === '' &&
      url.hash === ''
    );
  }, 'La dirección debe ser HTTPS y no puede llevar usuario ni consulta.');

export const publicConfigSchema = z
  .object({
    apiBaseUrl: httpsUrl.refine((value) => new URL(value).origin === API_ORIGIN),
    supabaseUrl: httpsUrl.refine((value) => new URL(value).origin === AUTH_ORIGIN),
    publishableKey: z.string().regex(/^sb_publishable_[A-Za-z0-9_-]{20,}$/),
    signupMode: z.enum(['closed', 'open']),
    confirmSignupType: z.literal(CONFIRM_SIGNUP_TYPE),
  })
  .strict();

export type PublicConfig = z.infer<typeof publicConfigSchema>;

export type ConfigResult = { ok: true; config: PublicConfig } | { ok: false; message: string };

const invalidMessage = 'Falta la configuración pública del portal. No se hizo ninguna llamada.';

export function readPublicConfig(env: Record<string, string | undefined>): ConfigResult {
  const parsed = publicConfigSchema.safeParse({
    apiBaseUrl: env.VITE_API_BASE_URL,
    supabaseUrl: env.VITE_SUPABASE_URL,
    publishableKey: env.VITE_SUPABASE_PUBLISHABLE_KEY,
    signupMode: env.VITE_SIGNUP_MODE,
    confirmSignupType: env.VITE_CONFIRM_SIGNUP_TYPE,
  });
  if (!parsed.success) return { ok: false, message: invalidMessage };
  return {
    ok: true,
    config: {
      ...parsed.data,
      apiBaseUrl: parsed.data.apiBaseUrl.replace(/\/$/, ''),
      supabaseUrl: parsed.data.supabaseUrl.replace(/\/$/, ''),
    },
  };
}
