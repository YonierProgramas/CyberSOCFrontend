import { describe, expect, it } from 'vitest';
import { isProtected, routeByPath, routes } from '../../src/app/navigation';

describe('rutas', () => {
  it('guarda un solo destino por path', () => {
    const paths = routes.map((route) => route.path);
    expect(new Set(paths).size).toBe(paths.length);
    expect(routeByPath('/acceso')?.id).toBe('access');
    expect(routeByPath('/cuenta/')?.id).toBe('account');
    expect(routeByPath('/otra')).toBeUndefined();
  });

  it('protege solo la cuenta', () => {
    expect(isProtected(routeByPath('/cuenta/descarga'))).toBe(true);
    expect(isProtected(routeByPath('/registro'))).toBe(false);
    expect(isProtected(undefined)).toBe(false);
  });
});
