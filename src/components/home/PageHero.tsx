import type { ReactNode, Ref } from 'react';
import { Icon, type IconName } from '../Icon';

// Banda superior de cada página informativa: la misma identidad que la de Inicio, más baja.
// El h1 recibe el foco al cambiar de página (lo anuncia el lector de pantalla).
export function PageHero({
  headingRef,
  kicker,
  title,
  icon,
  children,
}: {
  headingRef: Ref<HTMLHeadingElement>;
  kicker: string;
  title: string;
  icon: IconName;
  children: ReactNode;
}) {
  return (
    <section className="hero page-hero" aria-labelledby="pagina-titulo">
      <div className="hero-copy">
        <p className="eyebrow">{kicker}</p>
        <h1 id="pagina-titulo" ref={headingRef} tabIndex={-1}>
          {title}
        </h1>
        <p className="hero-lead">{children}</p>
      </div>
      <div className="page-hero-art" aria-hidden="true">
        <span className="ring ring-1" />
        <span className="ring ring-2" />
        <span className="page-hero-icon">
          <Icon name={icon} />
        </span>
      </div>
    </section>
  );
}

export function SectionHead({
  id,
  kicker,
  title,
  children,
}: {
  id: string;
  kicker: string;
  title: string;
  children?: ReactNode;
}) {
  return (
    <header className="section-intro">
      <p className="kicker">{kicker}</p>
      <h2 id={id}>{title}</h2>
      {children ? <p className="section-lead">{children}</p> : null}
    </header>
  );
}
