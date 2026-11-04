import { describe, expect, it } from 'vitest';
import { acceptedDownloadUrl, preferencesSchema, profileSchema } from '../../src/api/schemas';

describe('contratos de presentación', () => {
  it('no acepta un dueño inyectado en el perfil', () => {
    expect(profileSchema.safeParse({ displayName: 'Ada', owner: 'otro' }).success).toBe(false);
    expect(
      preferencesSchema.safeParse({ locale: 'es-CO', timezone: 'America/Bogota', theme: 'system' })
        .success,
    ).toBe(true);
  });

  it('solo acepta el prefijo público del instalador', () => {
    const prefix =
      'https://github.com/YonierProgramas/CyberSOC/releases/download/v0/CyberSOC-Setup.exe';
    expect(acceptedDownloadUrl(prefix)).toBe(true);
    expect(
      acceptedDownloadUrl(
        'https://github.com.ejemplo/YonierProgramas/CyberSOC/releases/download/v0/a.exe',
      ),
    ).toBe(false);
    expect(acceptedDownloadUrl('javascript:alert(1)')).toBe(false);
  });
});
