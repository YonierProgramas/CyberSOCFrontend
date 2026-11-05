// guestOnly: la ruta solo tiene sentido sin sesión (entrar o pedir cuenta). Con sesión no se
// muestra en la barra y, si se abre por dirección, el portal lleva a la cuenta.
export const routes = [
  {
    id: 'home',
    path: '/',
    title: 'CyberSOC Defender',
    nav: 'Inicio',
    access: 'public',
    guestOnly: false,
  },
  {
    id: 'register',
    path: '/registro',
    title: 'Registro',
    nav: 'Registro',
    access: 'public',
    guestOnly: true,
  },
  {
    id: 'access',
    path: '/acceso',
    title: 'Acceso',
    nav: 'Acceso',
    access: 'public',
    guestOnly: true,
  },
  {
    id: 'recover',
    path: '/recuperar',
    title: 'Recuperar acceso',
    nav: null,
    access: 'public',
    guestOnly: false,
  },
  {
    id: 'confirm',
    path: '/auth/confirm',
    title: 'Confirmar enlace',
    nav: null,
    access: 'public',
    guestOnly: false,
  },
  {
    id: 'newPassword',
    path: '/nueva-contrasena',
    title: 'Nueva contraseña',
    nav: null,
    access: 'public',
    guestOnly: false,
  },
  {
    id: 'account',
    path: '/cuenta',
    title: 'Tu cuenta',
    nav: 'Cuenta',
    access: 'protected',
    guestOnly: false,
  },
  {
    id: 'preferences',
    path: '/cuenta/preferencias',
    title: 'Preferencias',
    nav: null,
    access: 'protected',
    guestOnly: false,
  },
  {
    id: 'consents',
    path: '/cuenta/consentimientos',
    title: 'Consentimientos',
    nav: null,
    access: 'protected',
    guestOnly: false,
  },
  {
    id: 'download',
    path: '/cuenta/descarga',
    title: 'Descarga',
    nav: null,
    access: 'protected',
    guestOnly: false,
  },
  {
    id: 'devices',
    path: '/cuenta/equipos',
    title: 'Equipos',
    nav: null,
    access: 'protected',
    guestOnly: false,
  },
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

export function isGuestOnly(route: Route | undefined): boolean {
  return route?.guestOnly === true;
}

// Enlaces de la barra principal. Sin sesión: Inicio, Registro y Acceso (el último, destacado).
// Con sesión: Inicio y Cuenta; nunca Acceso ni Registro. Recorre las 11 rutas: O(n).
export function navItems(signedIn: boolean): Route[] {
  return routes.filter((route) => {
    if (route.nav === null) return false;
    if (signedIn) return !route.guestOnly;
    return route.access === 'public';
  });
}
