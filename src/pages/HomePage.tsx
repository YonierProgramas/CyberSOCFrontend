import type { ReactNode, Ref } from 'react';
import { RouteLink, Shield } from '../components/Shell';

// Todo lo que dice la portada es cierto para la versión actual: no hay cifras de detección,
// porcentajes ni sellos de protección total. Los resultados viven solo en la app de escritorio.
const features = [
  {
    icon: 'scan',
    title: 'Análisis en tu equipo',
    text: 'Un motor local combina firmas conocidas y señales heurísticas. No necesita conexión ni cuenta web.',
  },
  {
    icon: 'vault',
    title: 'Cuarentena reversible',
    text: 'Lo que se considera peligroso se aparta sin borrarlo. Si fue un error, lo restauras desde la aplicación.',
  },
  {
    icon: 'chart',
    title: 'Panel e historial',
    text: 'Gráficos de los últimos siete días, cada uno con su tabla de cifras, y el historial de análisis por páginas.',
  },
  {
    icon: 'chat',
    title: 'Asistente que explica',
    text: 'Responde en lenguaje sencillo con tu propia clave de Claude. El veredicto lo decide siempre la política de riesgo, nunca la IA.',
  },
] as const;

const steps = [
  {
    title: 'Entra con tu cuenta de la demo',
    text: 'El registro está cerrado: las cuentas de prueba ya existen.',
  },
  {
    title: 'Descarga el instalador desde tu cuenta',
    text: 'Aparece en Cuenta, sección Descarga, cuando la versión esté publicada.',
  },
  {
    title: 'Instala en Windows de 64 bits',
    text: 'Se instala solo para tu usuario, sin permisos de administrador, y ya trae todo lo necesario. Aún no está firmado: Windows puede mostrar un aviso.',
  },
] as const;

type IconName = (typeof features)[number]['icon'];

function Icon({ name }: { name: IconName }) {
  const paths: Record<IconName, ReactNode> = {
    scan: (
      <>
        <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h4" />
        <path d="M14 3v5h5" />
        <circle cx="16.5" cy="15.5" r="3.5" />
        <path d="m19 18 2.5 2.5" />
      </>
    ),
    vault: (
      <>
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <circle cx="12" cy="12" r="3.5" />
        <path d="M12 8.5V7M12 17v-1.5M8.5 12H7M17 12h-1.5" />
      </>
    ),
    chart: (
      <>
        <path d="M4 20h16" />
        <path d="M7 16v-4M12 16V7M17 16v-7" />
      </>
    ),
    chat: (
      <>
        <path d="M5 5h14a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1h-7l-4 3.5V16H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z" />
        <path d="M8 9.5h8M8 12.5h5" />
      </>
    ),
  };
  return (
    <svg className="feature-icon" viewBox="0 0 24 24" aria-hidden="true">
      {paths[name]}
    </svg>
  );
}

export function HomePage({
  signedIn,
  headingRef,
  onNavigate,
  extra,
}: {
  signedIn: boolean;
  headingRef: Ref<HTMLHeadingElement>;
  onNavigate: (path: string) => void;
  extra?: ReactNode;
}) {
  return (
    <div className="home">
      <section className="hero" aria-labelledby="inicio-titulo">
        <div className="hero-copy">
          <p className="eyebrow">Antivirus de escritorio para Windows · Demo cerrada</p>
          <h1 id="inicio-titulo" ref={headingRef} tabIndex={-1}>
            CyberSOC Defender
          </h1>
          <p className="hero-lead">
            Analiza archivos en tu propio equipo, aparta lo peligroso en una cuarentena que puedes
            revertir y entiende cada resultado en lenguaje sencillo.
          </p>
          <div className="hero-actions">
            {signedIn ? (
              <>
                <RouteLink href="/cuenta/descarga" onNavigate={onNavigate} className="button">
                  Ir a la descarga
                </RouteLink>
                <RouteLink href="/cuenta" onNavigate={onNavigate} className="button ghost">
                  Ver mi cuenta
                </RouteLink>
              </>
            ) : (
              <>
                <RouteLink href="/acceso" onNavigate={onNavigate} className="button">
                  Entrar
                </RouteLink>
                <RouteLink href="/registro" onNavigate={onNavigate} className="button ghost">
                  Cómo se obtiene una cuenta
                </RouteLink>
              </>
            )}
          </div>
        </div>
        <div className="hero-art" aria-hidden="true">
          <span className="ring ring-1" />
          <span className="ring ring-2" />
          <span className="ring ring-3" />
          <Shield className="hero-shield" />
          <span className="scan-line" />
        </div>
      </section>

      {extra}

      <section className="home-section" aria-labelledby="inicio-funciones">
        <h2 id="inicio-funciones">Qué hace la aplicación</h2>
        <ul className="features">
          {features.map((feature) => (
            <li key={feature.title} className="feature">
              <Icon name={feature.icon} />
              <h3>{feature.title}</h3>
              <p>{feature.text}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="home-section" aria-labelledby="inicio-pasos">
        <h2 id="inicio-pasos">Cómo empezar</h2>
        <ol className="steps">
          {steps.map((step) => (
            <li key={step.title} className="step">
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="privacy" aria-labelledby="inicio-privacidad">
        <h2 id="inicio-privacidad">El portal no ve tus archivos</h2>
        <p>
          El portal solo gestiona tu cuenta y la descarga. No recibe tus archivos ni muestra
          resultados, gráficas o porcentajes de análisis: eso vive únicamente en la aplicación de
          escritorio.
        </p>
      </section>
    </div>
  );
}
