export const routes = [
  { id: 'home', path: '/', title: 'CyberSOC Defender', nav: 'Inicio', access: 'public' },
  { id: 'access', path: '/acceso', title: 'Acceso', nav: 'Acceso', access: 'public' },
  { id: 'register', path: '/registro', title: 'Registro', nav: 'Registro', access: 'public' },
  { id: 'recover', path: '/recuperar', title: 'Recuperar acceso', nav: null, access: 'public' },
  { id: 'confirm', path: '/auth/confirm', title: 'Confirmar enlace', nav: null, access: 'public' },
  {
    id: 'newPassword',
    path: '/nueva-contrasena',
    title: 'Nueva contraseña',
    nav: null,
    access: 'public',
  },
  { id: 'account', path: '/cuenta', title: 'Tu cuenta', nav: 'Cuenta', access: 'protected' },
  {
    id: 'preferences',
    path: '/cuenta/preferencias',
    title: 'Preferencias',
    nav: null,
    access: 'protected',
  },
  {
    id: 'consents',
    path: '/cuenta/consentimientos',
    title: 'Consentimientos',
    nav: null,
    access: 'protected',
  },
  { id: 'download', path: '/cuenta/descarga', title: 'Descarga', nav: null, access: 'protected' },
  { id: 'devices', path: '/cuenta/equipos', title: 'Equipos', nav: null, access: 'protected' },
] as const;

export type RouteId = (typeof routes)[number]['id'];
export type Route = (typeof routes)[number];

// Tabla cerrada de rutas. Invariante: cada path aparece una sola vez.
// La búsqueda usa la clave del Map: O(1) en promedio. Hay 11 rutas fijas.
const byPath = new Map<string, Route>(routes.map((route) => [route.path, route]));

export function routeByPath(pathname: string): Route | undefined {
  const path = pathname.length > 1 && pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
  return byPath.get(path);
}

export function isProtected(route: Route | undefined): boolean {
  return route?.access === 'protected';
}
