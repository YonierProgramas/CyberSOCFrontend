import type { Ref } from 'react';
import { Icon, type IconName } from '../components/Icon';
import { RouteLink } from '../components/Shell';
import { AnalysisFlow } from '../components/home/AnalysisFlow';
import { DesktopShowcase } from '../components/home/DesktopShowcase';
import { PageHero, SectionHead } from '../components/home/PageHero';
import { StructureDemos } from '../components/home/StructureDemos';

// Páginas informativas públicas. No hacen peticiones de red ni muestran cifras de análisis.
// Cada afirmación se contrastó con el código de CyberSOC (app y motor), la API y este portal:
// capas y zonas en shared/protocol.ts y ScanProfiles.ts, JSON-RPC en EngineProcess.ts,
// cuarentena en QuarantineManager/QuarantineVault y estructuras en construccion/estructuras.

type PageProps = { headingRef: Ref<HTMLHeadingElement>; onNavigate: (path: string) => void };
type Item = { icon: IconName; title: string; text: string };

function CardGrid({ items, className = 'info-cards' }: { items: Item[]; className?: string }) {
  return (
    <ul className={className}>
      {items.map((item) => (
        <li key={item.title} className="info-card">
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
  );
}

// Enlace al final de cada página para seguir explorando.
function NextPage({
  href,
  label,
  text,
  onNavigate,
}: {
  href: string;
  label: string;
  text: string;
  onNavigate: (path: string) => void;
}) {
  return (
    <aside className="next-page" aria-label="Siguiente página">
      <div>
        <p className="kicker">Sigue explorando</p>
        <p className="next-page-text">{text}</p>
      </div>
      <RouteLink href={href} onNavigate={onNavigate} className="button">
        {label}
        <Icon name="arrow" />
      </RouteLink>
    </aside>
  );
}

// ---------------------------------------------------------------------------------------------
// Cómo funciona
const layers: Item[] = [
  {
    icon: 'hash',
    title: 'Hash',
    text: 'Calcula la huella SHA-256 del contenido. Dos archivos iguales tienen la misma huella.',
  },
  {
    icon: 'fingerprint',
    title: 'Firmas',
    text: 'Busca esa huella en un diccionario de firmas conocidas: una consulta O(1) en promedio.',
  },
  {
    icon: 'file',
    title: 'Tipo real',
    text: 'Lee los primeros bytes («números mágicos») para saber qué es el archivo, diga lo que diga su extensión.',
  },
  {
    icon: 'layers',
    title: 'Reglas',
    text: 'Compara el contenido con patrones de texto, UTF-16 y hexadecimales descritos en archivos YAML.',
  },
  {
    icon: 'pulse',
    title: 'Heurística',
    text: 'Mide la entropía de los bytes con un histograma de 256 contadores, sin cargar el archivo entero.',
  },
  {
    icon: 'window',
    title: 'Ejecutables PE',
    text: 'Revisa la estructura de los programas de Windows (.exe, .dll) en busca de señales de riesgo.',
  },
  {
    icon: 'code',
    title: 'Scripts',
    text: 'Examina el contenido de scripts, donde suelen esconderse descargas o comandos ocultos.',
  },
];

const zones = [
  'Descargas',
  'Escritorio',
  'Documentos',
  'Temporales',
  'Datos de aplicaciones',
  'Extraíble',
  'Programas',
  'Sistema',
  'Otra',
];

const verdicts: { tone: string; label: string; text: string }[] = [
  { tone: 'ok', label: 'Sin hallazgos', text: 'Ninguna capa aplicada encontró indicios.' },
  { tone: 'warn', label: 'Sospechoso', text: 'Hay señales de riesgo que conviene revisar.' },
  { tone: 'danger', label: 'Detectado', text: 'Las señales indican una amenaza.' },
  { tone: 'muted', label: 'No analizado', text: 'El archivo no se pudo leer o analizar.' },
];

const quarantineSteps: Item[] = [
  {
    icon: 'alert',
    title: 'Tú decides',
    text: 'Desde el resultado eliges enviar el archivo a cuarentena. Nada se mueve solo.',
  },
  {
    icon: 'check',
    title: 'Confirmas',
    text: 'La aplicación pide una confirmación explícita antes de tocar el archivo.',
  },
  {
    icon: 'lock',
    title: 'Se cifra',
    text: 'El archivo se guarda cifrado con AES-256-GCM en la bóveda y recibe un identificador propio.',
  },
  {
    icon: 'refresh',
    title: 'Restaurar o eliminar',
    text: 'Ambas acciones piden confirmación; si fue Detectado, restaurar pide una más. Nunca se sobrescribe otro archivo.',
  },
];

export function HowItWorksPage({ headingRef, onNavigate }: PageProps) {
  return (
    <div className="home info-page">
      <PageHero
        headingRef={headingRef}
        kicker="Cómo funciona"
        title="Del archivo al resultado, paso a paso"
        icon="scan"
      >
        Qué hace CyberSOC Defender con cada archivo: cómo lo encuentra, cómo lo revisa por capas,
        quién decide el resultado y qué pasa si lo apartas.
      </PageHero>

      <section className="home-section" aria-labelledby="recorrido">
        <SectionHead id="recorrido" kicker="El recorrido" title="Seis etapas de un análisis">
          Selecciona una etapa para ver qué ocurre en ella.
        </SectionHead>
        <AnalysisFlow />
      </section>

      <section className="home-section" aria-labelledby="capas">
        <SectionHead id="capas" kicker="El motor" title="Las siete capas de análisis">
          El motor está escrito en Python y trabaja dentro de tu equipo, sin usar la red. Cada capa
          aporta señales con su explicación.
        </SectionHead>
        <CardGrid items={layers} />
      </section>

      <section className="home-section split-section" aria-labelledby="zonas">
        <SectionHead id="zonas" kicker="Perfiles" title="Cada zona tiene su perfil">
          La aplicación reconoce en qué zona está cada carpeta con un árbol de prefijos (trie) y
          aplica las capas de esa zona. Puedes usar el perfil automático o uno personalizado.
        </SectionHead>
        <div className="card zone-card">
          <ul className="layer-chips">
            {zones.map((zone) => (
              <li key={zone}>
                <Icon name="folder" />
                {zone}
              </li>
            ))}
          </ul>
          <p className="muted">
            Por defecto, la zona Sistema usa hash, firmas y tipo real; Programas añade las reglas;
            el resto aplica las siete capas.
          </p>
        </div>
      </section>

      <section className="home-section" aria-labelledby="resultados">
        <SectionHead id="resultados" kicker="El resultado" title="Quién decide y cómo">
          La política de riesgo combina las señales de todas las capas y asigna un resultado. Cada
          resultado muestra cómo se decidió, sus evidencias y las capas aplicadas.
        </SectionHead>
        <ul className="verdict-grid">
          {verdicts.map((verdict) => (
            <li key={verdict.label} className={`verdict-card tone-${verdict.tone}`}>
              <span className={`badge tone-${verdict.tone}`}>{verdict.label}</span>
              <p>{verdict.text}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="home-section" aria-labelledby="cuarentena">
        <SectionHead id="cuarentena" kicker="Cuarentena" title="Apartar sin borrar">
          La cuarentena aísla un archivo peligroso y permite deshacerlo. Funciona con
          identificadores, no con una pila.
        </SectionHead>
        <ol className="timeline">
          {quarantineSteps.map((step) => (
            <li key={step.title}>
              <span className="timeline-icon">
                <Icon name={step.icon} />
              </span>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="home-section band" aria-labelledby="papel-ia">
        <SectionHead
          id="papel-ia"
          kicker="Inteligencia artificial"
          title="La IA explica, no decide"
        >
          Si configuras tu propia clave de Claude, la aplicación pide explicaciones en lenguaje
          sencillo. Es opcional: sin clave, todo lo demás funciona igual.
        </SectionHead>
        <CardGrid
          items={[
            {
              icon: 'queue',
              title: 'Primero, lo más riesgoso',
              text: 'Una cola de prioridad (montículo) atiende antes los resultados de mayor riesgo; con el mismo riesgo, por orden de llegada.',
            },
            {
              icon: 'check',
              title: 'Respuestas comprobadas',
              text: 'Si la respuesta de la IA no tiene el formato esperado, se descarta y se indica.',
            },
            {
              icon: 'eye',
              title: 'Transparencia',
              text: 'Cada resultado muestra qué se envió a la IA. El veredicto lo pone siempre la política de riesgo.',
            },
          ]}
        />
      </section>

      <NextPage
        href="/estructuras"
        label="Ver las estructuras de datos"
        text="Cola, pila, diccionario, montículos y trie: las estructuras que hacen posible este recorrido."
        onNavigate={onNavigate}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------------------------
// Tecnología
const localStack: Item[] = [
  { icon: 'window', title: 'Electron', text: 'Aplicación de escritorio para Windows' },
  { icon: 'code', title: 'React y TypeScript', text: 'Interfaz, cola, cuarentena e historial' },
  { icon: 'pulse', title: 'Python 3.12', text: 'Motor de análisis por capas, incluido' },
  { icon: 'database', title: 'SQLite', text: 'Historial y configuración en tu equipo' },
];
const webStack: Item[] = [
  { icon: 'code', title: 'React y TypeScript', text: 'Este portal, en Cloudflare Pages' },
  { icon: 'server', title: 'API en Node.js', text: 'Cuenta, equipos y descarga, en Render' },
  { icon: 'database', title: 'Supabase', text: 'Inicio de sesión y base de datos de cuentas' },
  { icon: 'branch', title: 'GitHub', text: 'Código fuente y publicación del instalador' },
];

function StackList({ items }: { items: Item[] }) {
  return (
    <ul>
      {items.map((item) => (
        <li key={item.title + item.text}>
          <span className="mini-icon">
            <Icon name={item.icon} />
          </span>
          <span>
            <strong>{item.title}</strong>
            {item.text}
          </span>
        </li>
      ))}
    </ul>
  );
}

export function TechnologyPage({ headingRef, onNavigate }: PageProps) {
  return (
    <div className="home info-page">
      <PageHero
        headingRef={headingRef}
        kicker="Tecnología y arquitectura"
        title="Más que una interfaz"
        icon="code"
      >
        CyberSOC Defender tiene dos partes con tareas distintas: el antivirus que trabaja en tu
        equipo y el portal web para tu cuenta. Así están construidas y así se comunican.
      </PageHero>

      <section className="home-section band" aria-labelledby="arquitectura">
        <SectionHead id="arquitectura" kicker="Arquitectura" title="Dos partes, tareas separadas">
          Tus archivos se analizan en tu equipo. La web solo gestiona la cuenta y la descarga.
        </SectionHead>
        <div className="arch">
          <article className="arch-zone local">
            <h3>
              <Icon name="devices" />
              En tu equipo
            </h3>
            <p className="arch-caption">Análisis, cuarentena e historial</p>
            <StackList items={localStack} />
          </article>
          <div className="arch-link" aria-hidden="true">
            <span className="arch-line" />
            <span className="arch-pill">Cuenta y descarga</span>
            <span className="arch-line" />
          </div>
          <article className="arch-zone web">
            <h3>
              <Icon name="cloud" />
              En la web
            </h3>
            <p className="arch-caption">Cuenta, preferencias y descarga</p>
            <StackList items={webStack} />
          </article>
        </div>
        <p className="arch-ai">
          <Icon name="sparkle" />
          <span>
            <strong>Claude, de Anthropic:</strong> el asistente de la aplicación usa su API solo
            cuando configuras tu propia clave. Es opcional y nunca decide un veredicto.
          </span>
        </p>
      </section>

      <section className="home-section" aria-labelledby="comunicacion">
        <SectionHead id="comunicacion" kicker="Por dentro" title="Cómo se comunican las piezas">
          Cada parte tiene un canal propio y valida los mensajes que recibe.
        </SectionHead>
        <ol className="timeline">
          <li>
            <span className="timeline-icon">
              <Icon name="window" />
            </span>
            <h3>Interfaz</h3>
            <p>
              La ventana, hecha con React, pide acciones al proceso principal de Electron por
              canales definidos y validados.
            </p>
          </li>
          <li>
            <span className="timeline-icon">
              <Icon name="server" />
            </span>
            <h3>Proceso principal</h3>
            <p>
              Organiza el escaneo, la cuarentena y el historial en SQLite. Es el único que habla con
              el motor y con la IA.
            </p>
          </li>
          <li>
            <span className="timeline-icon">
              <Icon name="pulse" />
            </span>
            <h3>Motor Python</h3>
            <p>
              Corre como un proceso aparte y responde mensajes JSON-RPC por su entrada y salida
              estándar. No escribe tus archivos ni usa la red.
            </p>
          </li>
        </ol>
      </section>

      <section className="home-section" aria-labelledby="calidad">
        <SectionHead id="calidad" kicker="Calidad y seguridad" title="Cómo se cuida el desarrollo">
          Prácticas reales del proyecto, comprobables en sus repositorios.
        </SectionHead>
        <CardGrid
          items={[
            {
              icon: 'check',
              title: 'Pruebas automatizadas',
              text: 'Vitest y Playwright en la aplicación y el portal; pytest en el motor.',
            },
            {
              icon: 'branch',
              title: 'Integración continua',
              text: 'GitHub Actions ejecuta tipos, estilo y pruebas en cada cambio publicado.',
            },
            {
              icon: 'code',
              title: 'Estilo uniforme',
              text: 'TypeScript estricto, ESLint y Prettier en JavaScript; Ruff en Python.',
            },
            {
              icon: 'lock',
              title: 'Portal con CSP estricta',
              text: 'Solo carga scripts y estilos propios, y la sesión vive únicamente en la pestaña abierta.',
            },
            {
              icon: 'privacy',
              title: 'Datos mínimos',
              text: 'El portal no recibe archivos ni resultados; los permisos opcionales se piden aparte.',
            },
            {
              icon: 'sparkle',
              title: 'IA acotada',
              text: 'Solo lee datos del análisis mediante herramientas autorizadas y su respuesta se valida.',
            },
          ]}
        />
      </section>

      <NextPage
        href="/aplicacion"
        label="Ver la aplicación"
        text="Mira capturas reales de la aplicación de escritorio y cómo instalarla."
        onNavigate={onNavigate}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------------------------
// Estructuras de datos (resumen de construccion/estructuras-de-datos/indice.md).
const structuresInApp: { name: string; problem: string; cost: string }[] = [
  {
    name: 'Cola circular',
    problem: 'Atender elementos por orden de llegada sin desplazar el arreglo.',
    cost: 'Encolar y desencolar O(1)',
  },
  {
    name: 'Cola acotada',
    problem: 'Frenar el descubrimiento de archivos si el motor no alcanza a analizarlos.',
    cost: 'Capacidad fija · O(1)',
  },
  {
    name: 'Pila para DFS',
    problem: 'Recorrer carpetas en profundidad sin recursión y poder cancelar.',
    cost: 'Apilar y desapilar O(1)',
  },
  {
    name: 'Conjunto de visitadas',
    problem: 'No recorrer dos veces la misma carpeta.',
    cost: 'Consultar y añadir O(1) promedio',
  },
  {
    name: 'Diccionario de firmas',
    problem: 'Encontrar una firma a partir del SHA-256 del archivo.',
    cost: 'Buscar O(1) promedio',
  },
  {
    name: 'Diccionario de números mágicos',
    problem: 'Identificar el tipo real probando prefijos de bytes de mayor a menor longitud.',
    cost: 'Pocas consultas por archivo',
  },
  {
    name: 'Histograma de 256 contadores',
    problem: 'Calcular la entropía de los bytes sin cargar el archivo completo.',
    cost: 'Memoria fija · O(n) en bytes',
  },
  {
    name: 'Cola de prioridad (montículo máximo)',
    problem: 'Que la IA explique primero lo más riesgoso, con desempate por llegada.',
    cost: 'Insertar y extraer O(log n)',
  },
  {
    name: 'Trie de rutas',
    problem: 'Elegir la zona con el prefijo de carpeta más específico.',
    cost: 'Proporcional a los segmentos',
  },
  {
    name: 'Conjunto de rutas protegidas',
    problem: 'Impedir operaciones de cuarentena en carpetas protegidas.',
    cost: 'Recorre prefijos y segmentos',
  },
  {
    name: 'Ventana deslizante',
    problem: 'Conservar los últimos diez turnos de la conversación con el asistente.',
    cost: 'Tamaño acotado · O(1)',
  },
  {
    name: 'Top-k con montículo mínimo',
    problem: 'Retener los diez resultados de mayor riesgo de un análisis.',
    cost: 'O(log k) por resultado',
  },
  {
    name: 'Mapa de herramientas',
    problem: 'Buscar por nombre una herramienta autorizada del asistente y su validador.',
    cost: 'Buscar O(1) promedio',
  },
];

export function StructuresPage({ headingRef, onNavigate }: PageProps) {
  return (
    <div className="home info-page">
      <PageHero
        headingRef={headingRef}
        kicker="Proyecto de Estructuras de Datos"
        title="Estructuras de datos en acción"
        icon="layers"
      >
        CyberSOC Defender nació como proyecto de Estructuras de Datos. Aquí puedes probar las tres
        principales y ver dónde se usa cada estructura del antivirus.
      </PageHero>

      <section className="home-section" aria-labelledby="pruebalas">
        <SectionHead id="pruebalas" kicker="Interactivo" title="Pruébalas">
          Son explicaciones de los algoritmos con pocos elementos, no análisis reales.
        </SectionHead>
        <StructureDemos />
      </section>

      <section className="home-section" aria-labelledby="donde-se-usan">
        <SectionHead id="donde-se-usan" kicker="En el antivirus" title="Dónde se usa cada una">
          Trece usos en la aplicación de escritorio y el motor, cada uno con el problema que
          resuelve y su costo.
        </SectionHead>
        <ul className="structure-table">
          {structuresInApp.map((item) => (
            <li key={item.name}>
              <h3>{item.name}</h3>
              <p>{item.problem}</p>
              <span className="structure-cost">{item.cost}</span>
            </li>
          ))}
        </ul>
        <p className="honest-note">
          <Icon name="info" />
          Buscar en un diccionario es O(1) en promedio, pero no vuelve instantánea la lectura del
          archivo ni el cálculo de su huella.
        </p>
      </section>

      <section className="home-section split-section" aria-labelledby="en-el-portal">
        <SectionHead id="en-el-portal" kicker="En este portal" title="También en la web">
          El portal usa las mismas ideas en cosas pequeñas.
        </SectionHead>
        <CardGrid
          items={[
            {
              icon: 'key',
              title: 'Mapa de rutas',
              text: 'Cada dirección se busca en un Map: así se elige la página en O(1) promedio.',
            },
            {
              icon: 'privacy',
              title: 'Conjunto de parámetros',
              text: 'Al confirmar un enlace del correo, un Set admite solo los parámetros esperados.',
            },
          ]}
        />
      </section>

      <NextPage
        href="/preguntas"
        label="Ver preguntas frecuentes"
        text="¿Necesita Internet? ¿Puedo restaurar un archivo? Respuestas cortas a las dudas más comunes."
        onNavigate={onNavigate}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------------------------
// La aplicación
const appSections: Item[] = [
  {
    icon: 'home',
    title: 'Inicio',
    text: 'Resumen del análisis en curso, el último completado, la actividad y la distribución de resultados.',
  },
  {
    icon: 'scan',
    title: 'Escaneo',
    text: 'Analiza un archivo o una carpeta con el perfil por zona o uno personalizado, y muestra el progreso.',
  },
  {
    icon: 'history',
    title: 'Historial',
    text: 'Análisis guardados con filtros por estado, fechas, veredicto y riesgo mínimo.',
  },
  {
    icon: 'vault',
    title: 'Cuarentena',
    text: 'Archivos apartados, con restaurar y eliminar bajo confirmación.',
  },
  {
    icon: 'gauge',
    title: 'Estado',
    text: 'Estado del motor antivirus, de la aplicación y de sus componentes.',
  },
  {
    icon: 'settings',
    title: 'Configuración',
    text: 'Clave del asistente de IA, información del sistema y preferencias visuales.',
  },
  {
    icon: 'chat',
    title: 'Asistente',
    text: 'Panel lateral para preguntar por un archivo o un escaneo, con archivo de conversaciones.',
  },
];

const installSteps = [
  'Entra con tu cuenta en este portal.',
  'Abre Descarga en tu panel y pide el instalador.',
  'Comprueba que el SHA-256 del archivo coincide con el que muestra el portal.',
  'Ejecuta el instalador. Como aún no está firmado, Windows puede avisar: revisa el origen antes de continuar.',
  'Se instala solo para tu usuario, sin permisos de administrador, y ya trae su motor de análisis.',
];

export function DesktopAppPage({ headingRef, onNavigate }: PageProps) {
  return (
    <div className="home info-page">
      <PageHero
        headingRef={headingRef}
        kicker="Antivirus de escritorio"
        title="La aplicación para Windows"
        icon="window"
      >
        Todo el análisis ocurre aquí, dentro de tu equipo: escaneo, cuarentena, historial y un
        asistente que explica los resultados.
      </PageHero>

      <section className="home-section" aria-labelledby="capturas">
        <SectionHead id="capturas" kicker="Vista del antivirus" title="Capturas reales">
          Pantallas de la aplicación real para Windows, con su tema oscuro.
        </SectionHead>
        <DesktopShowcase />
      </section>

      <section className="home-section" aria-labelledby="secciones-app">
        <SectionHead id="secciones-app" kicker="Recorrido" title="Siete secciones">
          Lo que encontrarás en la barra de la aplicación.
        </SectionHead>
        <CardGrid items={appSections} />
      </section>

      <section className="home-section download-band" aria-labelledby="instalar">
        <div className="download-main">
          <span className="download-badge" aria-hidden="true">
            <Icon name="windows" />
          </span>
          <div>
            <p className="kicker">Instalación</p>
            <h2 id="instalar">Cómo instalarla</h2>
            <ol className="download-steps install-steps">
              {installSteps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </div>
        </div>
        <div className="download-side">
          <ul className="download-reqs">
            <li>
              <Icon name="windows" />
              Windows 10 y 11 de 64 bits
            </li>
            <li>
              <Icon name="user" />
              Sin administrador
            </li>
            <li>
              <Icon name="check" />
              Conserva tus datos al desinstalar
            </li>
          </ul>
          <RouteLink href="/acceso" onNavigate={onNavigate} className="button">
            <Icon name="download" />
            Entrar para descargar
          </RouteLink>
        </div>
      </section>

      <NextPage
        href="/como-funciona"
        label="Ver cómo funciona"
        text="Descubre qué hace el motor con cada archivo, capa por capa."
        onNavigate={onNavigate}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------------------------
// Preguntas frecuentes, por temas.
const faqGroups: { title: string; icon: IconName; items: { q: string; a: string }[] }[] = [
  {
    title: 'General',
    icon: 'info',
    items: [
      {
        q: '¿Qué es CyberSOC Defender?',
        a: 'Un antivirus de escritorio para Windows. Analiza archivos en tu equipo, aparta lo peligroso en una cuarentena reversible y explica cada resultado. Es el proyecto de Estructuras de Datos de la Universidad Cooperativa de Colombia.',
      },
      {
        q: '¿Qué diferencia hay entre el portal y el antivirus de Windows?',
        a: 'El portal (esta web) gestiona tu cuenta, tus preferencias y la descarga. La aplicación de Windows hace el análisis y la cuarentena, y guarda el historial en tu equipo. El portal no recibe tus archivos ni tus resultados.',
      },
      {
        q: '¿Detecta todas las amenazas?',
        a: 'No. Ningún antivirus las detecta todas. CyberSOC Defender combina varias capas para reducir riesgos; mantén Windows actualizado y conserva copias de seguridad.',
      },
    ],
  },
  {
    title: 'Análisis',
    icon: 'scan',
    items: [
      {
        q: '¿Cómo analiza los archivos?',
        a: 'Recorre las carpetas con una pila, pone los archivos en una cola y los revisa por capas: huella SHA-256 frente a firmas conocidas, tipo real, reglas, heurística, ejecutables y scripts. Después, la política de riesgo combina las señales y decide el resultado.',
      },
      {
        q: '¿Necesita conexión a Internet?',
        a: 'Para analizar, no: el motor trabaja dentro de tu equipo y no usa la red. El asistente de IA sí se conecta, y solo si configuras tu propia clave de Claude. Este portal, para entrar y descargar, necesita conexión.',
      },
      {
        q: '¿Qué ocurre cuando encuentra un archivo sospechoso?',
        a: 'La aplicación lo marca como Sospechoso o Detectado y muestra qué capas aportaron señales. No mueve nada por su cuenta: tú decides si lo envías a cuarentena y la aplicación pide tu confirmación.',
      },
      {
        q: '¿Puedo cancelar un análisis?',
        a: 'Sí. El escaneo tiene un botón Cancelar y el recorrido de carpetas se detiene sin terminar la lista.',
      },
    ],
  },
  {
    title: 'Cuarentena',
    icon: 'vault',
    items: [
      {
        q: '¿Puedo restaurar un archivo en cuarentena?',
        a: 'Sí. Desde la sección Cuarentena eliges el archivo y confirmas; si estaba Detectado, se pide una confirmación adicional. Si en la ruta original ya existe un archivo con ese nombre, se restaura con un nombre nuevo para no sobrescribirlo.',
      },
      {
        q: '¿Qué significa que la cuarentena esté cifrada?',
        a: 'El archivo apartado se guarda cifrado con AES-256-GCM dentro de la bóveda de la aplicación. Así no se puede abrir por accidente mientras está aislado.',
      },
    ],
  },
  {
    title: 'IA y privacidad',
    icon: 'sparkle',
    items: [
      {
        q: '¿Para qué se utiliza la inteligencia artificial?',
        a: 'Para explicar resultados en lenguaje sencillo y responder tus preguntas en el asistente. Usa la API de Claude con tu propia clave y es opcional. La IA nunca decide si un archivo es peligroso: eso lo hace la política de riesgo.',
      },
      {
        q: '¿Dónde se guardan mis datos?',
        a: 'Los análisis, el historial y las conversaciones se guardan en tu equipo, en una base SQLite. Tu cuenta (nombre, preferencias y permisos opcionales) se guarda en el servicio de cuentas del portal.',
      },
    ],
  },
  {
    title: 'Cuenta e instalación',
    icon: 'download',
    items: [
      {
        q: '¿Cómo obtengo una cuenta?',
        a: 'El registro público está cerrado: las cuentas las crea el equipo del proyecto. La página Registro explica cómo funciona.',
      },
      {
        q: '¿Qué sistemas operativos son compatibles?',
        a: 'La aplicación funciona en Windows 10 y Windows 11 de 64 bits. No hay versión para macOS, Linux ni móviles. El portal se abre en cualquier navegador actual.',
      },
      {
        q: '¿Por qué Windows muestra un aviso al instalar?',
        a: 'Porque el instalador todavía no tiene firma digital. Antes de continuar, comprueba que el SHA-256 del archivo coincide con el que muestra el portal en Descarga.',
      },
    ],
  },
];

export function FaqPage({ headingRef, onNavigate }: PageProps) {
  return (
    <div className="home info-page">
      <PageHero
        headingRef={headingRef}
        kicker="Preguntas frecuentes"
        title="Lo que suelen preguntar"
        icon="chat"
      >
        Respuestas cortas, ordenadas por temas, sobre el antivirus, la cuarentena, la IA y la
        instalación.
      </PageHero>

      {faqGroups.map((group, index) => (
        <section
          key={group.title}
          className="home-section faq-section"
          aria-labelledby={`faq-${index}`}
        >
          <header className="faq-group-head">
            <span className="mini-icon">
              <Icon name={group.icon} />
            </span>
            <h2 id={`faq-${index}`}>{group.title}</h2>
          </header>
          <div className="faq">
            {group.items.map((item) => (
              <details key={item.q}>
                <summary>
                  {item.q}
                  <Icon name="chevron" className="faq-chevron" />
                </summary>
                <p>{item.a}</p>
              </details>
            ))}
          </div>
        </section>
      ))}

      <NextPage
        href="/registro"
        label="Cómo obtener una cuenta"
        text="¿Todavía tienes dudas sobre el acceso? Mira cómo funcionan las cuentas."
        onNavigate={onNavigate}
      />
    </div>
  );
}
