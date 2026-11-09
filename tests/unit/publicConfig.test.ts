import { describe, expect, it } from 'vitest';
import { readPublicConfig } from '../../src/config/publicConfig';

const valid = {
  VITE_API_BASE_URL: 'https://cybersocbackend.onrender.com',
  VITE_SUPABASE_URL: 'https://cgvjthwobrlzmhmzuuvg.supabase.co',
  VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_ejemplo_local_no_real_0000',
  VITE_SIGNUP_MODE: 'open',
  VITE_CONFIRM_SIGNUP_TYPE: 'signup',
};

describe('configuración pública', () => {
  it('acepta los modos abierto y cerrado', () => {
    const result = readPublicConfig(valid);
    expect(result.ok).toBe(true);
    expect(readPublicConfig({ ...valid, VITE_SIGNUP_MODE: 'closed' }).ok).toBe(true);
  });

  it('rechaza modo desconocido, secreto y consulta sin llamar a la red', () => {
    expect(readPublicConfig({ ...valid, VITE_SIGNUP_MODE: 'invalid' }).ok).toBe(false);
    expect(readPublicConfig({ ...valid, VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_secret_no' }).ok).toBe(
      false,
    );
    expect(
      readPublicConfig({
        ...valid,
        VITE_API_BASE_URL: 'https://cybersocbackend.onrender.com/healthz?x=1',
      }).ok,
    ).toBe(false);
    expect(
      readPublicConfig({ ...valid, VITE_SUPABASE_URL: 'http://cgvjthwobrlzmhmzuuvg.supabase.co' })
        .ok,
    ).toBe(false);
  });
});
