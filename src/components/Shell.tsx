import { useEffect, type MouseEvent, type ReactNode } from 'react';
import type { Route } from '../app/navigation';
import { trackVisualViewport } from './revealFocus';

type ShellProps = {
  path: string;
  routes: readonly Route[];
  signedIn: boolean;
  children: ReactNode;
  onNavigate: (path: string) => void;
};

function go(
  event: MouseEvent<HTMLAnchorElement>,
  href: string,
  onNavigate: (path: string) => void,
) {
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0)
    return;
  event.preventDefault();
  onNavigate(href);
}

export function Shell({ path, routes, signedIn, children, onNavigate }: ShellProps) {
  const items = routes.filter(
    (route) => route.nav !== null && (route.access === 'public' || signedIn),
  );
  useEffect(() => trackVisualViewport(), []);
  return (
    <div className="shell">
      <span className="reveal-anchor" data-reveal-anchor tabIndex={-1} aria-hidden="true" />
      <a className="skip" href="#contenido">
        Saltar al contenido
      </a>
      <header className="top">
        <a className="brand" href="/" onClick={(event) => go(event, '/', onNavigate)}>
          <svg viewBox="0 0 32 32" aria-hidden="true">
            <path fill="#0B5F73" d="M16 2 5 7v8c0 7 4.6 11.6 11 13 6.4-1.4 11-6 11-13V7z" />
            <path fill="#73C7DA" d="M16 7 10 9.4V15c0 3.6 2.3 6.2 6 7.2 3.7-1 6-3.6 6-7.2V9.4z" />
          </svg>
          CyberSOC Defender
        </a>
        <nav aria-label="Principal" className="nav">
          {items.map((route) => (
            <a
              key={route.id}
              href={route.path}
              aria-current={path === route.path ? 'page' : undefined}
              onClick={(event) => go(event, route.path, onNavigate)}
            >
              {route.nav}
            </a>
          ))}
        </nav>
      </header>
      <main id="contenido" className="wrap" tabIndex={-1}>
        {children}
      </main>
    </div>
  );
}

export function RouteLink({
  href,
  onNavigate,
  children,
}: {
  href: string;
  onNavigate: (path: string) => void;
  children: ReactNode;
}) {
  return (
    <a href={href} onClick={(event) => go(event, href, onNavigate)}>
      {children}
    </a>
  );
}
