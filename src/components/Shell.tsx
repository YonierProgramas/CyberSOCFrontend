import { useEffect, useId, useRef, useState, type MouseEvent, type ReactNode } from 'react';
import { accountMenu, inAccountMenu, navItems } from '../app/navigation';
import { Icon, type IconName } from './Icon';
import { trackVisualViewport } from './revealFocus';

type ShellProps = {
  path: string;
  signedIn: boolean;
  wide?: boolean;
  children: ReactNode;
  onNavigate: (path: string) => void;
  onSignOut: () => void;
};

const navIcons: Record<string, IconName> = {
  home: 'home',
  register: 'user',
  access: 'logout',
  download: 'download',
  devices: 'devices',
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

// Menú desplegable «Mi cuenta»: patrón de divulgación (botón + lista de enlaces), no un
// role="menu". Se cierra con Escape (el foco vuelve al botón), al hacer clic fuera y al
// navegar. Tab recorre los enlaces en orden normal.
function AccountMenu({ path, onNavigate }: { path: string; onNavigate: (path: string) => void }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  useEffect(() => setOpen(false), [path]);
  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', outside);
    return () => document.removeEventListener('pointerdown', outside);
  }, [open]);
  return (
    <div
      className="account-menu"
      ref={root}
      onKeyDown={(event) => {
        if (event.key === 'Escape' && open) {
          setOpen(false);
          button.current?.focus();
        }
      }}
    >
      <button
        ref={button}
        type="button"
        className={inAccountMenu(path) ? 'account-toggle active' : 'account-toggle'}
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((value) => !value)}
      >
        <Icon name="user" />
        Mi cuenta
        <Icon name="chevron" className="chevron" />
      </button>
      <ul id={id} className="account-panel" hidden={!open}>
        {accountMenu.map((item) => (
          <li key={item.path}>
            <a
              href={item.path}
              aria-current={path === item.path ? 'page' : undefined}
              onClick={(event) => go(event, item.path, onNavigate)}
            >
              <Icon
                name={
                  item.path === '/cuenta'
                    ? 'user'
                    : item.path.endsWith('preferencias')
                      ? 'settings'
                      : 'privacy'
                }
              />
              {item.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <Shield />
          <div>
            <p className="footer-title">CyberSOC Defender</p>
            <p>
              Antivirus de escritorio para Windows con análisis local, cuarentena reversible y un
              asistente que explica cada resultado.
            </p>
          </div>
        </div>
        <div className="footer-meta">
          <p>Proyecto académico de ciberseguridad · Estructuras de Datos</p>
          <p>Universidad Cooperativa de Colombia · 2026</p>
        </div>
      </div>
    </footer>
  );
}

export function Shell({ path, signedIn, wide, children, onNavigate, onSignOut }: ShellProps) {
  const items = navItems(signedIn);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuId = useId();
  useEffect(() => trackVisualViewport(), []);
  useEffect(() => setMenuOpen(false), [path, signedIn]);
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
          <button
            type="button"
            className="menu-toggle"
            aria-expanded={menuOpen}
            aria-controls={menuId}
            aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
            onClick={() => setMenuOpen((value) => !value)}
          >
            <Icon name={menuOpen ? 'close' : 'menu'} />
          </button>
          <div id={menuId} className={menuOpen ? 'nav-area open' : 'nav-area'}>
            <nav aria-label="Principal" className="nav">
              {items.map((route) => (
                <a
                  key={route.id}
                  href={route.path}
                  className={route.id === 'access' ? 'nav-cta' : undefined}
                  aria-current={path === route.path ? 'page' : undefined}
                  onClick={(event) => go(event, route.path, onNavigate)}
                >
                  <Icon name={navIcons[route.id] ?? 'home'} />
                  {route.nav}
                </a>
              ))}
            </nav>
            {signedIn ? (
              <div className="session-area">
                <span className="session-chip">
                  <span className="dot" aria-hidden="true" />
                  Sesión activa
                </span>
                <AccountMenu path={path} onNavigate={onNavigate} />
                <button type="button" className="nav-exit" onClick={onSignOut}>
                  <Icon name="logout" />
                  Salir
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </header>
      <main id="contenido" className={wide ? 'wrap wrap-wide' : 'wrap'} tabIndex={-1}>
        {children}
      </main>
      <Footer />
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
