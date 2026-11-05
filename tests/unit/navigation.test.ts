import { describe, expect, it } from 'vitest';
import { isGuestOnly, isProtected, navItems, routeByPath, routes } from '../../src/app/navigation';

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

  it('con sesión la barra no ofrece Acceso ni Registro', () => {
    expect(navItems(false).map((route) => route.nav)).toEqual(['Inicio', 'Registro', 'Acceso']);
    expect(navItems(true).map((route) => route.nav)).toEqual(['Inicio', 'Cuenta']);
  });

  it('solo Acceso y Registro son exclusivas de quien no ha entrado', () => {
    const guestOnly = routes.filter((route) => isGuestOnly(route)).map((route) => route.path);
    expect(guestOnly).toEqual(['/registro', '/acceso']);
    expect(isGuestOnly(routeByPath('/recuperar'))).toBe(false);
    expect(isGuestOnly(undefined)).toBe(false);
  });
});
