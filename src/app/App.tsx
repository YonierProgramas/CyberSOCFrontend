import { useEffect, useState, type ReactNode } from 'react';
import { isGuestOnly, isProtected, routeByPath } from './navigation';
import { readPublicConfig } from '../config/publicConfig';
import { createPortalRuntime, type PortalRuntime } from './runtime';
import { PortalProvider, useSession } from './portal';
import { Shell } from '../components/Shell';
import { AccessPage } from '../pages/AccessPage';
import { AccountNav, AccountPage } from '../pages/AccountPage';
import { ConfirmPage } from '../pages/ConfirmPage';
import { ConsentsPage } from '../pages/ConsentsPage';
import { DevicesPage } from '../pages/DevicesPage';
import { DownloadPage } from '../pages/DownloadPage';
import { HomePage } from '../pages/HomePage';
import { NewPasswordPage } from '../pages/NewPasswordPage';
import { NotFoundPage } from '../pages/NotFoundPage';
import { PreferencesPage } from '../pages/PreferencesPage';
import { RecoveryPage } from '../pages/RecoveryPage';
import { RegistrationPage } from '../pages/RegistrationPage';
let defaultRuntime: PortalRuntime | undefined;
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
  // Con sesión, Acceso y Registro ya no aplican: se va directo a la cuenta.
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
    window.history.replaceState({}, '', '/cuenta');
    setPath('/cuenta');
  }, [alreadyIn]);
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
  }
  // Mientras una redirección está pendiente no se pinta la página de error.
  let body: ReactNode = route ? null : <NotFoundPage onNavigate={navigate} />;
  if (route && !blocked && !alreadyIn) {
    switch (route.id) {
      case 'home':
        body = <HomePage onNavigate={navigate} extra={homeExtra} />;
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
        body = <AccountPage />;
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
    }
  }
  return (
    <Shell
      path={path}
      signedIn={signedIn}
      onNavigate={navigate}
      onSignOut={() => {
        void runtime.session.logout('local');
      }}
    >
      <h1 ref={setHeading} tabIndex={-1}>
        {route?.title ?? 'Página no encontrada'}
      </h1>
      {route && isProtected(route) && signedIn ? (
        <AccountNav path={path} onNavigate={navigate} />
      ) : null}
      <div
        key={
          route && (isProtected(route) || route.id === 'newPassword' || route.id === 'recover')
            ? path + ':' + epoch
            : path
        }
      >
        {body}
      </div>
    </Shell>
  );
}
function normalize(pathname: string) {
  return pathname.length > 1 && pathname.endsWith('/') ? pathname.slice(0, -1) : pathname || '/';
}
