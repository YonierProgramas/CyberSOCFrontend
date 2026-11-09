import { describe, expect, it, vi } from 'vitest';
import { createAuthClient } from '../../src/auth/authClient';
import { createSessionStore } from '../../src/auth/session';
import { config, failure, json, ownerA, pair } from '../fixtures/network';

describe('registro de la demo', () => {
  it('rechaza altas cerradas y datos inválidos antes de llamar al proveedor', async () => {
    const fetcher = vi.fn();
    const signal = new AbortController().signal;
    await expect(
      createAuthClient({ ...config, signupMode: 'closed' }, fetcher).signUp(
        'a@example.invalid',
        'valid-password',
        signal,
      ),
    ).rejects.toMatchObject({ code: 'SIGNUP_CLOSED' });
    const auth = createAuthClient(config, fetcher);
    await expect(auth.signUp('bad', 'valid-password', signal)).rejects.toMatchObject({
      code: 'VALIDATION_FAILED',
    });
    await expect(auth.signUp('a@example.invalid', 'short', signal)).rejects.toMatchObject({
      code: 'VALIDATION_FAILED',
    });
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('instala la sesión activa del alta sin exponer tokens en la vista', async () => {
    const fetcher = vi.fn(async () => json(pair()));
    const session = createSessionStore(createAuthClient(config, fetcher));
    try {
      await session.signUp('new@example.invalid', 'valid-password');
      expect(session.getSnapshot().session).toMatchObject({ userId: ownerA, kind: 'access' });
      expect(JSON.stringify(session.getSnapshot())).not.toContain('fake-access');
      expect(fetcher).toHaveBeenCalledTimes(1);
      const [url, init] = fetcher.mock.calls[0] as unknown as [string, RequestInit];
      expect(url).toBe(config.supabaseUrl + '/auth/v1/signup');
      expect(JSON.parse(String(init.body))).toEqual({
        email: 'new@example.invalid',
        password: 'valid-password',
      });
    } finally {
      session.dispose();
    }
  });

  it('una respuesta sin sesión explica la confirmación pendiente sin activar la vista', async () => {
    const fetcher = vi.fn(async () => json({ id: ownerA }));
    const session = createSessionStore(createAuthClient(config, fetcher));
    try {
      await expect(session.signUp('new@example.invalid', 'valid-password')).rejects.toMatchObject({
        code: 'SIGNUP_CONFIRMATION_REQUIRED',
      });
      expect(session.getSnapshot().session).toBeNull();
      expect(fetcher).toHaveBeenCalledTimes(1);
    } finally {
      session.dispose();
    }
  });

  it.each([
    [422, 'SIGNUP_FAILED'],
    [429, 'RATE_LIMITED'],
    [503, 'UNKNOWN_OUTCOME'],
  ])('HTTP %s no reintenta ni muestra el cuerpo del proveedor', async (status, code) => {
    const fetcher = vi.fn(async () => failure('private-upstream', status as number));
    await expect(
      createAuthClient(config, fetcher).signUp(
        'new@example.invalid',
        'valid-password',
        new AbortController().signal,
      ),
    ).rejects.toMatchObject({ code });
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it('error de red no repite el alta ni asegura que la cuenta se creó', async () => {
    const fetcher = vi.fn(async () => {
      throw new Error('private-body');
    });
    await expect(
      createAuthClient(config, fetcher).signUp(
        'new@example.invalid',
        'valid-password',
        new AbortController().signal,
      ),
    ).rejects.toMatchObject({ code: 'UNKNOWN_OUTCOME' });
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
});
