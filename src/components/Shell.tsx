import { useEffect, type MouseEvent, type ReactNode } from 'react';
import { navItems } from '../app/navigation';
import { trackVisualViewport } from './revealFocus';

type ShellProps = {
  path: string;
  signedIn: boolean;
  wide?: boolean;
  children: ReactNode;
  onNavigate: (path: string) => void;
  onSignOut: () => void;
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

export function Shield({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={className}>
      <path className="shield-outer" d="M16 2 5 7v8c0 7 4.6 11.6 11 13 6.4-1.4 11-6 11-13V7z" />
      <path
        className="shield-inner"
        d="M16 7 10 9.4V15c0 3.6 2.3 6.2 6 7.2 3.7-1 6-3.6 6-7.2V9.4z"
      />
    </svg>
  );
}

export function Shell({ path, signedIn, wide, children, onNavigate, onSignOut }: ShellProps) {
  const items = navItems(signedIn);
  useEffect(() => trackVisualViewport(), []);
  return (
    <div className="shell">
      <span className="reveal-anchor" data-reveal-anchor tabIndex={-1} aria-hidden="true" />
      <a className="skip" href="#contenido">
        Saltar al contenido
      </a>
      <header className="top">
        <div className="top-inner">
          <a className="brand" href="/" onClick={(event) => go(event, '/', onNavigate)}>
            <Shield />
            <span>
              CyberSOC <span className="brand-accent">Defender</span>
            </span>
          </a>
          <nav aria-label="Principal" className="nav">
            {items.map((route) => (
              <a
                key={route.id}
                href={route.path}
                className={route.id === 'access' ? 'nav-cta' : undefined}
                aria-current={path === route.path ? 'page' : undefined}
                onClick={(event) => go(event, route.path, onNavigate)}
              >
                {route.nav}
              </a>
            ))}
          </nav>
          {signedIn ? (
            <button type="button" className="nav-exit" onClick={onSignOut}>
              Salir
            </button>
          ) : null}
        </div>
      </header>
      <main id="contenido" className={wide ? 'wrap wrap-wide' : 'wrap'} tabIndex={-1}>
        {children}
      </main>
    </div>
  );
}

export function RouteLink({
  href,
  onNavigate,
  className,
  children,
}: {
  href: string;
  onNavigate: (path: string) => void;
  className?: string;
  children: ReactNode;
}) {
  return (
    <a href={href} className={className} onClick={(event) => go(event, href, onNavigate)}>
      {children}
    </a>
  );
}
