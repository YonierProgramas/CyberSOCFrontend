import type { ReactNode, Ref } from 'react';
import { Icon, type IconName } from '../components/Icon';
import { RouteLink, Shield } from '../components/Shell';
import { Badge } from '../components/ui';

// Portada para visitantes. Todo lo que dice es cierto para la versión actual: sin cifras de
// detección, sin «protección en tiempo real», sin vinculación de equipos ni instalador
// publicado (ambos pendientes). Los resultados viven solo en la aplicación de escritorio.
const features: { icon: IconName; title: string; text: string }[] = [
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
];

// Recorrido real de un análisis en la aplicación de escritorio, en orden.
const pipeline: { icon: IconName; title: string; text: string }[] = [
  {
    icon: 'layers',
    title: 'Recorre carpetas',
    text: 'Una pila (LIFO) explora las subcarpetas en profundidad, sin recursión.',
  },
  {
    icon: 'scan',
    title: 'Pone en cola',
    text: 'Cada archivo espera en una cola acotada (FIFO): se analiza en orden de llegada.',
  },
  {
    icon: 'bug',
    title: 'Analiza por capas',
    text: 'Hash, firmas, tipo de archivo, reglas, heurística, ejecutables PE y scripts.',
  },
  {
    icon: 'privacy',
    title: 'Decide el veredicto',
    text: 'La política de riesgo combina las capas: Sin hallazgos, Sospechoso o Detectado.',
  },
  {
    icon: 'vault',
    title: 'Aparta si hace falta',
    text: 'Con tu confirmación, la cuarentena cifra el archivo y permite restaurarlo.',
  },
];

const steps = [
  {
    title: 'Entra con tu cuenta de la demo',
    text: 'El registro está cerrado: las cuentas de prueba ya existen.',
  },
  {
    title: 'Descarga el instalador desde tu cuenta',
    text: 'Aparece en la sección Descarga de tu panel cuando la versión esté publicada.',
  },
  {
    title: 'Instala en Windows de 64 bits',
    text: 'Se instala solo para tu usuario, sin permisos de administrador, y ya trae todo lo necesario. Aún no está firmado: Windows puede mostrar un aviso.',
  },
] as const;

export function HomePage({
  headingRef,
  onNavigate,
  extra,
}: {
  headingRef: Ref<HTMLHeadingElement>;
  onNavigate: (path: string) => void;
  extra?: ReactNode;
}) {
  return (
    <div className="home">
      <section className="hero" aria-labelledby="inicio-titulo">
        <div className="hero-copy">
          <p className="eyebrow">Antivirus de escritorio para Windows · Proyecto académico</p>
          <h1 id="inicio-titulo" ref={headingRef} tabIndex={-1}>
            CyberSOC Defender
          </h1>
          <p className="hero-lead">
            Analiza archivos en tu propio equipo, aparta lo peligroso en una cuarentena que puedes
            revertir y entiende cada resultado en lenguaje sencillo.
          </p>
          <div className="hero-actions">
            <RouteLink href="/acceso" onNavigate={onNavigate} className="button">
              <Icon name="lock" />
              Iniciar sesión
            </RouteLink>
            <RouteLink href="/registro" onNavigate={onNavigate} className="button ghost">
              <Icon name="user" />
              Cómo obtener una cuenta
            </RouteLink>
          </div>
          <p className="hero-note">
            Proyecto de Estructuras de Datos · Universidad Cooperativa de Colombia · demo cerrada.
          </p>
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
              <span className="feature-icon">
                <Icon name={feature.icon} />
              </span>
              <h3>{feature.title}</h3>
              <p>{feature.text}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="home-section" aria-labelledby="inicio-proceso">
        <h2 id="inicio-proceso">Cómo se analiza un archivo</h2>
        <ol className="pipeline">
          {pipeline.map((stage) => (
            <li key={stage.title} className="stage">
              <span className="stage-icon">
                <Icon name={stage.icon} />
              </span>
              <h3>{stage.title}</h3>
              <p>{stage.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="home-section desktop-app" aria-labelledby="inicio-escritorio">
        <div>
          <h2 id="inicio-escritorio">La aplicación de escritorio</h2>
          <p className="muted">
            El portal solo gestiona tu cuenta y la descarga. Todo el análisis ocurre en la
            aplicación, dentro de tu equipo.
          </p>
          <ul className="checklist">
            <li>
              <Icon name="windows" />
              Windows 10/11 de 64 bits, instalación por usuario sin administrador.
            </li>
            <li>
              <Icon name="check" />
              Trae su propio motor de análisis: no necesitas instalar nada más.
            </li>
            <li>
              <Icon name="check" />
              El motor de análisis no usa la red; el asistente solo se conecta si configuras tu
              clave.
            </li>
          </ul>
        </div>
        <div className="desktop-status">
          <Badge tone="warn">Instalador en preparación</Badge>
          <p className="muted">
            Todavía no hay una versión publicada. Cuando exista, la verás en la sección Descarga
            después de entrar.
          </p>
        </div>
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
