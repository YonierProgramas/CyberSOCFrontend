import { describe, expect, it } from 'vitest';
import {
  accountMenu,
  inAccountMenu,
  infoPages,
  isGuestOnly,
  isInfo,
  isProtected,
  navItems,
  routeByPath,
  routes,
} from '../../src/app/navigation';

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
    expect(navItems(false).map((route) => route.nav)).toEqual([
      'Inicio',
      'Cómo funciona',
      'Tecnología',
      'Estructuras',
      'Aplicación',
      'Preguntas',
      'Registro',
      'Acceso',
    ]);
    expect(navItems(true).map((route) => route.nav)).toEqual(['Inicio', 'Descarga', 'Equipos']);
  });

  it('las cinco páginas informativas son públicas y sirven con o sin sesión', () => {
    const pages = infoPages();
    expect(pages.map((route) => route.path)).toEqual([
      '/como-funciona',
      '/tecnologia',
      '/estructuras',
      '/aplicacion',
      '/preguntas',
    ]);
    for (const route of pages) {
      expect(isProtected(route)).toBe(false);
      expect(isGuestOnly(route)).toBe(false);
      expect(isInfo(routeByPath(route.path))).toBe(true);
    }
    expect(isInfo(routeByPath('/'))).toBe(false);
  });

  it('«Mi cuenta» agrupa perfil, preferencias y consentimientos, todos protegidos', () => {
    expect(accountMenu.map((item) => item.label)).toEqual([
      'Mi perfil',
      'Preferencias',
      'Consentimientos',
    ]);
    for (const item of accountMenu) expect(isProtected(routeByPath(item.path))).toBe(true);
    expect(inAccountMenu('/cuenta/preferencias')).toBe(true);
    expect(inAccountMenu('/cuenta/equipos')).toBe(false);
  });

  it('solo Acceso y Registro son exclusivas de quien no ha entrado', () => {
    const guestOnly = routes.filter((route) => isGuestOnly(route)).map((route) => route.path);
    expect(guestOnly).toEqual(['/registro', '/acceso']);
    expect(isGuestOnly(routeByPath('/recuperar'))).toBe(false);
    expect(isGuestOnly(undefined)).toBe(false);
  });
});
