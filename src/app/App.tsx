import { useEffect, useState, type ReactNode } from 'react';
import { isGuestOnly, isInfo, isProtected, routeByPath } from './navigation';
import { readPublicConfig } from '../config/publicConfig';
import { createPortalRuntime, type PortalRuntime } from './runtime';
import { PortalProvider, useSession } from './portal';
import { Shell } from '../components/Shell';
import { AccessPage } from '../pages/AccessPage';
import { AccountPage } from '../pages/AccountPage';
import { DashboardPage } from '../pages/DashboardPage';
import { applyTheme } from './theme';
import { Icon, type IconName } from '../components/Icon';
import { AuthLayout } from '../components/AuthLayout';
import { ConfirmPage } from '../pages/ConfirmPage';
import { ConsentsPage } from '../pages/ConsentsPage';
import { DevicesPage } from '../pages/DevicesPage';
import { DownloadPage } from '../pages/DownloadPage';
import { HomePage } from '../pages/HomePage';
import {
  DesktopAppPage,
  FaqPage,
  HowItWorksPage,
  StructuresPage,
  TechnologyPage,
} from '../pages/InfoPages';
import { NewPasswordPage } from '../pages/NewPasswordPage';
import { NotFoundPage } from '../pages/NotFoundPage';
import { PreferencesPage } from '../pages/PreferencesPage';
import { RecoveryPage } from '../pages/RecoveryPage';
import { RegistrationPage } from '../pages/RegistrationPage';
let defaultRuntime: PortalRuntime | undefined;
// Cabecera de las páginas de la cuenta: icono y una frase que dice para qué sirve cada una.
const pageMeta: Partial<Record<string, { icon: IconName; subtitle: string }>> = {
  account: { icon: 'user', subtitle: 'Tu nombre visible, los datos de la cuenta y tus sesiones.' },
  preferences: { icon: 'settings', subtitle: 'Idioma, zona horaria y apariencia del portal.' },
  consents: { icon: 'privacy', subtitle: 'Decide qué datos opcionales puede guardar tu cuenta.' },
  download: { icon: 'download', subtitle: 'El instalador de la aplicación de escritorio.' },
  devices: { icon: 'devices', subtitle: 'Los equipos que pueden usar tu cuenta.' },
};
// Pantallas públicas de acceso: comparten AuthLayout (tarjeta + panel de marca).
const authMeta: Partial<Record<string, { icon: IconName; subtitle: string }>> = {
  access: { icon: 'lock', subtitle: 'Gestiona tu cuenta y la descarga del antivirus.' },
  register: {
    icon: 'user',
    subtitle: 'Crea tu cuenta para acceder al portal y descargar la aplicación.',
  },
  recover: { icon: 'refresh', subtitle: 'Pide un enlace para crear una contraseña nueva.' },
  confirm: { icon: 'check', subtitle: 'Comprobamos el enlace que abriste desde el correo.' },
  newPassword: { icon: 'lock', subtitle: 'Elige una contraseña nueva para tu cuenta.' },
};
export function App({ runtime, homeExtra }: { runtime?: PortalRuntime; homeExtra?: ReactNode }) {
  const config = readPublicConfig(import.meta.env);
  if (!runtime && !config.ok)
    return (
      <main id="contenido" className="wrap" tabIndex={-1}>
        <h1 tabIndex={-1}>Configuración del portal</h1>
        <p className="error" role="alert">
          {config.message}
        </p>
      </main>
    );
  if (!runtime && config.ok) defaultRuntime ??= createPortalRuntime(config.config);
  const active = runtime ?? defaultRuntime;
  if (!active) return null;
  return (
    <PortalProvider runtime={active}>
      <Portal runtime={active} homeExtra={homeExtra} />
    </PortalProvider>
  );
}
function Portal({ runtime, homeExtra }: { runtime: PortalRuntime; homeExtra: ReactNode }) {
  const { session, epoch, notice } = useSession();
  const [path, setPath] = useState(() => normalize(window.location.pathname));
  const [heading, setHeading] = useState<HTMLHeadingElement | null>(null);
  const route = routeByPath(path);
  const signedIn = session?.kind === 'access';
  const blocked = Boolean(route && isProtected(route) && !signedIn);
  // Con sesión, Acceso y Registro ya no aplican: se va directo al panel de Inicio.
  const alreadyIn = Boolean(route && isGuestOnly(route) && signedIn);
  useEffect(() => {
    const cleanConfirmation = () => {
      void runtime.confirmation.consume(window.location, window.history);
    };
    const onPop = () => {
      cleanConfirmation();
      setPath(normalize(window.location.pathname));
    };
    const activity = () => runtime.session.activity();
    window.addEventListener('popstate', onPop);
    window.addEventListener('hashchange', cleanConfirmation);
    window.addEventListener('keydown', activity);
    window.addEventListener('pointerdown', activity);
    window.addEventListener('pointermove', activity);
    return () => {
      window.removeEventListener('popstate', onPop);
      window.removeEventListener('hashchange', cleanConfirmation);
      window.removeEventListener('keydown', activity);
      window.removeEventListener('pointerdown', activity);
      window.removeEventListener('pointermove', activity);
    };
  }, [runtime]);
  useEffect(() => {
    if (!blocked) return;
    window.history.replaceState({}, '', '/acceso');
    setPath('/acceso');
  }, [blocked]);
  useEffect(() => {
    if (!alreadyIn) return;
    window.history.replaceState({}, '', '/');
    setPath('/');
  }, [alreadyIn]);
  useEffect(() => {
    // Sin sesión no hay preferencia guardada que aplicar: se vuelve al tema del sistema.
    if (!signedIn) applyTheme('system');
  }, [signedIn]);
  useEffect(() => {
    document.title = route
      ? route.id === 'home'
        ? 'CyberSOC Defender'
        : route.title + ' · CyberSOC Defender'
      : 'Página no encontrada · CyberSOC Defender';
    heading?.focus();
  }, [path, route, heading]);
  function navigate(next: string) {
    // Solo las rutas internas conocidas pueden entrar al historial.
    // Se compara con la barra de direcciones real: una redirección pudo cambiarla ya.
    const clean = normalize(next);
    if (!routeByPath(clean) || clean === normalize(window.location.pathname)) return;
    window.history.pushState({}, '', clean);
    setPath(clean);
    // Las páginas informativas son largas: cada página nueva empieza arriba, sin animación.
    window.scrollTo({ top: 0, behavior: 'instant' });
  }
  // Mientras una redirección está pendiente no se pinta la página de error.
  let body: ReactNode = route ? null : <NotFoundPage onNavigate={navigate} />;
  const isHome = route?.id === 'home';
  // Inicio y las páginas informativas dibujan su propia banda con el título (h1).
  const ownHeader = isHome || isInfo(route);
  const meta = route && signedIn ? pageMeta[route.id] : undefined;
  const auth = route && !blocked && !alreadyIn ? authMeta[route.id] : undefined;
  if (route && !blocked && !alreadyIn) {
    switch (route.id) {
      case 'home':
        body = signedIn ? (
          <DashboardPage headingRef={setHeading} onNavigate={navigate} extra={homeExtra} />
        ) : (
          <HomePage headingRef={setHeading} onNavigate={navigate} extra={homeExtra} />
        );
        break;
      case 'access':
        body = <AccessPage onNavigate={navigate} notice={notice} />;
        break;
      case 'register':
        body = <RegistrationPage onNavigate={navigate} />;
        break;
      case 'recover':
        body = <RecoveryPage onNavigate={navigate} />;
        break;
      case 'confirm':
        body = <ConfirmPage onNavigate={navigate} />;
        break;
      case 'newPassword':
        body = <NewPasswordPage session={session} onNavigate={navigate} />;
        break;
      case 'account':
        body = <AccountPage onNavigate={navigate} />;
        break;
      case 'preferences':
        body = <PreferencesPage />;
        break;
      case 'consents':
        body = <ConsentsPage />;
        break;
      case 'download':
        body = <DownloadPage />;
        break;
      case 'devices':
        body = <DevicesPage />;
        break;
      case 'howItWorks':
        body = <HowItWorksPage headingRef={setHeading} onNavigate={navigate} />;
        break;
      case 'technology':
        body = <TechnologyPage headingRef={setHeading} onNavigate={navigate} />;
        break;
      case 'structures':
        body = <StructuresPage headingRef={setHeading} onNavigate={navigate} />;
        break;
      case 'desktopApp':
        body = <DesktopAppPage headingRef={setHeading} onNavigate={navigate} />;
        break;
      case 'faq':
        body = <FaqPage headingRef={setHeading} onNavigate={navigate} />;
        break;
    }
  }
  return (
    <Shell
      path={path}
      signedIn={signedIn}
      wide={ownHeader || Boolean(auth) || Boolean(route && isProtected(route) && signedIn)}
      onNavigate={navigate}
      onSignOut={() => {
        void runtime.session.logout('local');
      }}
    >
      {ownHeader || auth ? null : (
        <header className={meta ? 'page-head' : 'page-head plain'}>
          {meta ? (
            <span className="page-icon">
              <Icon name={meta.icon} />
            </span>
          ) : null}
          <div>
            <h1 ref={setHeading} tabIndex={-1}>
              {route?.title ?? 'Página no encontrada'}
            </h1>
            {meta ? <p className="page-subtitle">{meta.subtitle}</p> : null}
          </div>
        </header>
      )}
      <div
        key={
          route && (isProtected(route) || route.id === 'newPassword' || route.id === 'recover')
            ? path + ':' + epoch
            : path
        }
      >
        {auth && route ? (
          <AuthLayout
            title={route.title}
            subtitle={auth.subtitle}
            icon={auth.icon}
            headingRef={setHeading}
          >
            {body}
          </AuthLayout>
        ) : (
          body
        )}
      </div>
    </Shell>
  );
}
function normalize(pathname: string) {
  return pathname.length > 1 && pathname.endsWith('/') ? pathname.slice(0, -1) : pathname || '/';
}
