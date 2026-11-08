import type { ReactNode, Ref } from 'react';
import { Icon, type IconName } from '../components/Icon';
import { RouteLink } from '../components/Shell';
import { HeroArt } from '../components/home/HeroArt';
import { SectionHead } from '../components/home/PageHero';

// Portada para visitantes. Todo lo que dice se contrastó con el código de la versión actual:
// sin cifras de detección, sin «protección en tiempo real» y sin funciones pendientes (como la
// vinculación de equipos) presentadas como disponibles. La portada no hace peticiones de red:
// el estado real del instalador se consulta dentro de la cuenta, en Descarga.

const highlights = [
  'Motor local que no usa la red',
  'Cuarentena cifrada y reversible',
  'Windows 10 y 11 de 64 bits',
];

const features: { icon: IconName; title: string; text: string; tag?: string }[] = [
  {
    icon: 'scan',
    title: 'Análisis local',
    text: 'Los archivos se revisan dentro de tu equipo. El motor de análisis no se conecta a Internet.',
  },
  {
    icon: 'fingerprint',
    title: 'Firmas conocidas',
    text: 'La huella SHA-256 de cada archivo se compara con un diccionario de firmas conocidas.',
  },
  {
    icon: 'pulse',
    title: 'Evaluación heurística',
    text: 'Entropía, tipo real, ejecutables y scripts aportan señales aunque no exista firma.',
  },
  {
    icon: 'alert',
    title: 'Archivos sospechosos',
    text: 'La política de riesgo distingue entre Sin hallazgos, Sospechoso y Detectado.',
  },
  {
    icon: 'vault',
    title: 'Cuarentena reversible',
    text: 'Lo peligroso se aparta cifrado, sin borrarlo, y se restaura cuando lo confirmas.',
  },
  {
    icon: 'history',
    title: 'Historial de análisis',
    text: 'Cada análisis queda guardado en tu equipo, con filtros por fecha, veredicto y riesgo.',
  },
  {
    icon: 'layers',
    title: 'Resultados explicados',
    text: 'Cada resultado indica qué capas del motor aportaron señales y por qué.',
  },
  {
    icon: 'sparkle',
    title: 'Asistente con IA',
    text: 'Responde en lenguaje sencillo con tu propia clave de Claude. Nunca decide el veredicto.',
    tag: 'Opcional',
  },
];

// Páginas informativas a las que lleva la sección «Explora».
const explore: { href: string; icon: IconName; title: string; text: string }[] = [
  {
    href: '/como-funciona',
    icon: 'scan',
    title: 'Cómo funciona',
    text: 'Las seis etapas de un análisis, las siete capas del motor y la cuarentena.',
  },
  {
    href: '/tecnologia',
    icon: 'code',
    title: 'Tecnología',
    text: 'Electron, Python, SQLite, Supabase y cómo se comunican las piezas.',
  },
  {
    href: '/estructuras',
    icon: 'layers',
    title: 'Estructuras de datos',
    text: 'Cola, pila y diccionario interactivos, y trece usos dentro del antivirus.',
  },
  {
    href: '/aplicacion',
    icon: 'window',
    title: 'La aplicación',
    text: 'Capturas reales de Windows, sus siete secciones y cómo instalarla.',
  },
  {
    href: '/preguntas',
    icon: 'chat',
    title: 'Preguntas frecuentes',
    text: 'Internet, cuarentena, IA, privacidad e instalación, en respuestas cortas.',
  },
];

const principles: { icon: IconName; title: string; text: string }[] = [
  {
    icon: 'devices',
    title: 'Tus archivos se quedan en tu equipo',
    text: 'El análisis ocurre en la aplicación de escritorio. El motor no usa la red.',
  },
  {
    icon: 'cloud',
    title: 'El portal está separado',
    text: 'Esta web gestiona tu cuenta y la descarga. No recibe archivos ni resultados de análisis.',
  },
  {
    icon: 'lock',
    title: 'Cuarentena cifrada',
    text: 'Un archivo apartado se guarda cifrado en la bóveda de la aplicación, no se borra.',
  },
  {
    icon: 'refresh',
    title: 'Restaurar con confirmación',
    text: 'Volver a su lugar exige tu confirmación y nunca sobrescribe un archivo existente.',
  },
  {
    icon: 'user',
    title: 'Tú decides',
    text: 'Aislar, restaurar o eliminar un archivo solo ocurre cuando tú lo confirmas.',
  },
  {
    icon: 'privacy',
    title: 'Consentimientos opcionales',
    text: 'Los permisos opcionales de tu cuenta solo se activan si los aceptas y puedes retirarlos.',
  },
];

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
          <p className="eyebrow">Antivirus de escritorio para Windows</p>
          <h1 id="inicio-titulo" ref={headingRef} tabIndex={-1}>
            <span className="hero-name">CyberSOC Defender</span>
            <span className="hero-title">
              Detecta, aísla y <span className="hero-accent">explica</span> cada amenaza.
            </span>
          </h1>
          <p className="hero-lead">
            Un motor local combina firmas, reglas y heurística; lo peligroso se aparta en una
            cuarentena que puedes revertir, y cada resultado se explica en lenguaje sencillo.
          </p>
          <div className="hero-actions">
            <RouteLink href="/acceso" onNavigate={onNavigate} className="button">
              <Icon name="lock" />
              Iniciar sesión
            </RouteLink>
            <RouteLink href="/tecnologia" onNavigate={onNavigate} className="button ghost">
              <Icon name="code" />
              Conoce la tecnología
            </RouteLink>
          </div>
          <ul className="hero-checks">
            {highlights.map((item) => (
              <li key={item}>
                <Icon name="check" />
                {item}
              </li>
            ))}
          </ul>
        </div>
        <div className="hero-art">
          <HeroArt />
        </div>
      </section>

      {extra}

      <section className="home-section" aria-labelledby="funciones">
        <SectionHead
          id="funciones"
          kicker="Por qué CyberSOC Defender"
          title="Qué ofrece el antivirus"
        >
          Capas de análisis complementarias, decisiones en tus manos y resultados que se entienden.
        </SectionHead>
        <ul className="features">
          {features.map((feature) => (
            <li key={feature.title} className="feature">
              <span className="feature-icon">
                <Icon name={feature.icon} />
              </span>
              <h3>
                {feature.title}
                {feature.tag ? <span className="feature-tag">{feature.tag}</span> : null}
              </h3>
              <p>{feature.text}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="home-section" aria-labelledby="explora">
        <SectionHead id="explora" kicker="Explora el proyecto" title="Conoce cada parte a fondo">
          Cinco páginas para entender cómo analiza, con qué está construido y cómo se usa.
        </SectionHead>
        <ul className="explore">
          {explore.map((item) => (
            <li key={item.href}>
              <RouteLink href={item.href} onNavigate={onNavigate} className="explore-card">
                <span className="feature-icon">
                  <Icon name={item.icon} />
                </span>
                <span className="explore-title">{item.title}</span>
                <span className="explore-text">{item.text}</span>
                <span className="explore-more">
                  Ver página
                  <Icon name="arrow" />
                </span>
              </RouteLink>
            </li>
          ))}
        </ul>
      </section>

      <section className="home-section" aria-labelledby="privacidad">
        <SectionHead
          id="privacidad"
          kicker="Seguridad y privacidad"
          title="Principios de funcionamiento"
        >
          Cómo trata CyberSOC Defender tus archivos y tu cuenta.
        </SectionHead>
        <ul className="principles">
          {principles.map((item) => (
            <li key={item.title}>
              <span className="mini-icon">
                <Icon name={item.icon} />
              </span>
              <div>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </div>
            </li>
          ))}
        </ul>
        <p className="honest-note">
          <Icon name="info" />
          Ningún antivirus detecta todas las amenazas. Mantén Windows actualizado y conserva copias
          de seguridad de tus archivos importantes.
        </p>
      </section>

      <section className="home-section download-band" aria-labelledby="descarga">
        <div className="download-main">
          <span className="download-badge" aria-hidden="true">
            <Icon name="windows" />
          </span>
          <div>
            <p className="kicker">Descarga</p>
            <h2 id="descarga">Instálalo en Windows</h2>
            <p className="download-lead">
              La descarga está dentro de tu cuenta. La sección Descarga consulta la versión
              publicada y solo activa el botón cuando hay un instalador disponible.
            </p>
            <ul className="download-reqs">
              <li>
                <Icon name="windows" />
                Windows 10 y 11 de 64 bits
              </li>
              <li>
                <Icon name="user" />
                Para tu usuario, sin administrador
              </li>
              <li>
                <Icon name="check" />
                Incluye su propio motor de análisis
              </li>
              <li>
                <Icon name="alert" />
                Sin firma digital: Windows puede avisar
              </li>
            </ul>
          </div>
        </div>
        <div className="download-side">
          <ol className="download-steps">
            <li>Entra con tu cuenta.</li>
            <li>Abre Descarga en tu panel.</li>
            <li>Comprueba el SHA-256 e instala.</li>
          </ol>
          <RouteLink href="/acceso" onNavigate={onNavigate} className="button">
            <Icon name="download" />
            Entrar para descargar
          </RouteLink>
          <RouteLink href="/registro" onNavigate={onNavigate} className="download-account">
            ¿Cómo se obtiene una cuenta?
          </RouteLink>
        </div>
      </section>
    </div>
  );
}
