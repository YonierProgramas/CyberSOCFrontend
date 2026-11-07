import type { ReactNode, Ref } from 'react';
import { Icon, type IconName } from './Icon';
import { Shield } from './Shell';

// Composición común de acceso, registro, recuperación, confirmación y nueva contraseña:
// tarjeta con el formulario y panel de marca. En el DOM la tarjeta va primero (el título
// recibe el foco y el lector la anuncia antes); en escritorio el panel se muestra a la
// izquierda solo con CSS. El panel no tiene controles: no altera el orden de tabulación.
const points: { icon: IconName; text: string }[] = [
  { icon: 'scan', text: 'Análisis local con firmas, reglas y heurística.' },
  { icon: 'vault', text: 'Cuarentena reversible: nada se borra sin tu decisión.' },
  { icon: 'chat', text: 'Un asistente explica cada resultado; la política de riesgo decide.' },
];

export function AuthLayout({
  title,
  subtitle,
  icon,
  headingRef,
  children,
}: {
  title: string;
  subtitle: string;
  icon: IconName;
  headingRef: Ref<HTMLHeadingElement>;
  children: ReactNode;
}) {
  return (
    <div className="auth">
      <div className="auth-card">
        <span className="auth-icon">
          <Icon name={icon} />
        </span>
        <h1 id="auth-titulo" ref={headingRef} tabIndex={-1}>
          {title}
        </h1>
        <p className="auth-subtitle">{subtitle}</p>
        {children}
      </div>
      <aside className="auth-aside" aria-label="Sobre CyberSOC Defender">
        <div className="auth-art" aria-hidden="true">
          <span className="ring ring-1" />
          <span className="ring ring-2" />
          <Shield className="hero-shield" />
        </div>
        <p className="auth-eyebrow">Demo académica cerrada</p>
        <p className="auth-claim">Tu antivirus de escritorio, explicado paso a paso.</p>
        <ul className="auth-points">
          {points.map((point) => (
            <li key={point.text}>
              <Icon name={point.icon} />
              {point.text}
            </li>
          ))}
        </ul>
        <p className="auth-note">
          <Icon name="lock" />
          Tu sesión vive solo en esta pestaña: al recargar se vuelve a pedir el acceso.
        </p>
      </aside>
    </div>
  );
}
