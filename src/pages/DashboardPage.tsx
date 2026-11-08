import { useCallback, useEffect, type ReactNode, type Ref } from 'react';
import { usePortal, useResource } from '../app/portal';
import { applyTheme } from '../app/theme';
import { Icon, type IconName } from '../components/Icon';
import { RouteLink } from '../components/Shell';
import { Badge } from '../components/ui';

// El portal no recibe análisis: se hacen y se guardan en la app de escritorio (privacidad,
// ADR-010). Por eso aquí no hay cifras de análisis: solo una explicación de cómo se presentan
// en la aplicación, con una captura real de su pantalla Resumen y sin métricas inventadas.
const verdicts: { tone: 'ok' | 'warn' | 'danger' | 'muted'; label: string; text: string }[] = [
  { tone: 'ok', label: 'Sin hallazgos', text: 'Ninguna capa encontró indicios.' },
  { tone: 'warn', label: 'Sospechoso', text: 'Hay señales que conviene revisar.' },
  { tone: 'danger', label: 'Detectado', text: 'Las señales indican una amenaza.' },
  { tone: 'muted', label: 'No analizado', text: 'El archivo no se pudo leer.' },
];
const layers: { icon: IconName; label: string }[] = [
  { icon: 'fingerprint', label: 'Hash y firmas' },
  { icon: 'file', label: 'Tipo real' },
  { icon: 'layers', label: 'Reglas' },
  { icon: 'pulse', label: 'Heurística' },
  { icon: 'window', label: 'Ejecutables' },
  { icon: 'code', label: 'Scripts' },
];

function Kpi({
  icon,
  label,
  value,
  note,
}: {
  icon: IconName;
  label: string;
  value: ReactNode;
  note?: ReactNode;
}) {
  return (
    <div className="kpi">
      <span className="kpi-icon">
        <Icon name={icon} />
      </span>
      <div>
        <p className="kpi-label">{label}</p>
        <p className="kpi-value">{value}</p>
        {note ? <p className="kpi-note">{note}</p> : null}
      </div>
    </div>
  );
}

export function DashboardPage({
  headingRef,
  onNavigate,
  extra,
}: {
  headingRef: Ref<HTMLHeadingElement>;
  onNavigate: (path: string) => void;
  extra?: ReactNode;
}) {
  const { api } = usePortal();
  const me = useResource(api.loadMe);
  const release = useResource(api.latestRelease);
  const firstDevices = useCallback(() => api.loadDevices(null), [api]);
  const devices = useResource(firstDevices);
  const theme = me.state.status === 'ready' ? me.state.data.preferences.theme : null;
  useEffect(() => {
    if (theme) applyTheme(theme);
  }, [theme]);

  const name = me.state.status === 'ready' ? me.state.data.profile.displayName : null;
  const missingProfile = me.state.status === 'error' && me.state.error.code === 'PROFILE_NOT_FOUND';
  const apiState =
    me.state.status === 'loading'
      ? { tone: 'muted' as const, text: 'Comprobando la conexión…' }
      : me.state.status === 'ready' || missingProfile
        ? { tone: 'ok' as const, text: 'Servicio de cuentas conectado' }
        : { tone: 'danger' as const, text: 'Servicio de cuentas no disponible' };

  const activeDevices =
    devices.state.status === 'ready'
      ? devices.state.data.items.filter((device) => !device.revokedAt).length
      : null;
  const consents =
    me.state.status === 'ready'
      ? me.state.data.consents.filter((consent) => consent.effective).length
      : null;
  const releaseText =
    release.state.status === 'ready'
      ? `Versión ${release.state.data.version}`
      : release.state.status === 'error' && release.state.error.code === 'RELEASE_UNAVAILABLE'
        ? 'Pendiente'
        : release.state.status === 'loading'
          ? 'Consultando…'
          : 'No disponible';

  return (
    <div className="dashboard">
      <section className="welcome" aria-labelledby="panel-titulo">
        <div>
          <p className="eyebrow">Panel de seguridad</p>
          <h1 id="panel-titulo" ref={headingRef} tabIndex={-1}>
            {name ? `Hola, ${name}` : 'Tu panel'}
          </h1>
          <p className="welcome-lead">
            Desde aquí gestionas tu cuenta, tus equipos y la descarga del antivirus. Los análisis se
            hacen en la aplicación de escritorio, dentro de tu equipo.
          </p>
          <p className={`api-status tone-${apiState.tone}`} role="status">
            <span className="dot" aria-hidden="true" />
            {apiState.text}
            {me.state.status === 'error' && !missingProfile ? (
              <>
                {' · '}
                {me.state.error.message}{' '}
                <button type="button" className="link-button" onClick={me.reload}>
                  Reintentar
                </button>
              </>
            ) : null}
          </p>
        </div>
        <div className="welcome-actions">
          <RouteLink href="/cuenta/descarga" onNavigate={onNavigate} className="button">
            <Icon name="download" />
            Ir a la descarga
          </RouteLink>
          <RouteLink href="/cuenta" onNavigate={onNavigate} className="button ghost">
            <Icon name="user" />
            Ver mi perfil
          </RouteLink>
        </div>
      </section>

      {missingProfile ? (
        <p className="callout tone-warn" role="status">
          <Icon name="info" />
          <span>
            Crea tu perfil para continuar.{' '}
            <RouteLink href="/cuenta" onNavigate={onNavigate}>
              Crear mi perfil
            </RouteLink>
          </span>
        </p>
      ) : null}

      {extra}

      <section aria-labelledby="panel-cuenta">
        <div className="section-head">
          <h2 id="panel-cuenta">Tu cuenta hoy</h2>
        </div>
        <div className="kpi-grid">
          <Kpi
            icon="devices"
            label="Equipos vinculados"
            value={
              activeDevices === null
                ? '—'
                : `${activeDevices}${devices.state.status === 'ready' && devices.state.data.nextCursor ? '+' : ''}`
            }
            note={
              devices.state.status === 'error'
                ? devices.state.error.message
                : 'Activos, sin revocar'
            }
          />
          <Kpi icon="download" label="Instalador para Windows" value={releaseText} />
          <Kpi
            icon="privacy"
            label="Consentimientos vigentes"
            value={consents === null ? '—' : `${consents} de 2`}
            note="Ninguno es obligatorio"
          />
          <Kpi
            icon="server"
            label="Servicio de cuentas"
            value={
              apiState.tone === 'ok'
                ? 'En línea'
                : apiState.tone === 'danger'
                  ? 'Sin conexión'
                  : '…'
            }
            note="Comprobado al abrir el panel"
          />
        </div>
      </section>

      <section className="app-preview" aria-labelledby="panel-app">
        <div className="section-head">
          <h2 id="panel-app">Tus análisis, en la aplicación de escritorio</h2>
        </div>
        <p className="muted app-preview-lead">
          El análisis, el historial y sus gráficos viven en la aplicación, dentro de tu equipo. Así
          se organizan:
        </p>
        <div className="app-preview-grid">
          <figure className="showcase-frame">
            <img
              src="/capturas/escritorio-resumen.webp"
              alt="Pantalla Resumen de la aplicación de escritorio: análisis en curso, último análisis completado y actividad de siete días."
              width={886}
              height={500}
              loading="lazy"
              decoding="async"
            />
          </figure>
          <div className="app-preview-copy">
            <article className="card">
              <h3>Resultados posibles</h3>
              <ul className="verdict-scale">
                {verdicts.map((verdict) => (
                  <li key={verdict.label}>
                    <Badge tone={verdict.tone}>{verdict.label}</Badge>
                    <span>{verdict.text}</span>
                  </li>
                ))}
              </ul>
            </article>
            <article className="card">
              <h3>Capas del motor</h3>
              <ul className="layer-chips">
                {layers.map((layer) => (
                  <li key={layer.label}>
                    <Icon name={layer.icon} />
                    {layer.label}
                  </li>
                ))}
              </ul>
              <p className="muted layer-note">
                La política de riesgo combina sus señales; la IA nunca decide el veredicto.
              </p>
            </article>
          </div>
        </div>
      </section>

      <section aria-labelledby="panel-estructuras">
        <div className="section-head">
          <h2 id="panel-estructuras">Cómo funciona por dentro</h2>
          <Badge tone="accent">Estructuras de datos</Badge>
        </div>
        <div className="structures">
          <article className="card structure">
            <h3>
              <Icon name="scan" /> Cola FIFO de archivos pendientes
            </h3>
            <ol
              className="lane lane-queue"
              aria-label="Ejemplo de cola: sale primero el primero que entró"
            >
              <li className="lane-out">Sale al motor</li>
              <li>informe.pdf</li>
              <li>setup.exe</li>
              <li>foto.jpg</li>
              <li className="lane-in">Entra</li>
            </ol>
            <p>
              El recorrido de carpetas deja cada archivo en una cola acotada y el motor los analiza
              en orden de llegada: el primero que entra es el primero que sale. Encolar y desencolar
              cuestan O(1).
            </p>
          </article>
          <article className="card structure">
            <h3>
              <Icon name="layers" /> Pila LIFO del recorrido de carpetas
            </h3>
            <ol
              className="lane lane-stack"
              aria-label="Ejemplo de pila: sale primero la última carpeta que entró"
            >
              <li className="lane-top">Tope: Descargas\fotos</li>
              <li>Descargas\juegos</li>
              <li>Documentos</li>
            </ol>
            <p>
              Para recorrer carpetas en profundidad sin recursión, cada subcarpeta encontrada se
              apila y se explora primero la última: la última que entra es la primera que sale.
              Apilar y desapilar cuestan O(1).
            </p>
          </article>
        </div>
      </section>

      <section aria-labelledby="panel-modulos">
        <h2 id="panel-modulos">Estado de los módulos</h2>
        <ul className="modules">
          <li className="card">
            <Icon name="server" />
            <span>Servicio de cuentas</span>
            <Badge tone={apiState.tone}>
              {apiState.tone === 'ok'
                ? 'Conectado'
                : apiState.tone === 'danger'
                  ? 'Sin conexión'
                  : 'Comprobando'}
            </Badge>
          </li>
          <li className="card">
            <Icon name="download" />
            <span>Publicación del instalador</span>
            <Badge tone={release.state.status === 'ready' ? 'ok' : 'warn'}>
              {release.state.status === 'ready' ? 'Publicado' : 'Pendiente'}
            </Badge>
          </li>
          <li className="card">
            <Icon name="devices" />
            <span>Vinculación desde el escritorio</span>
            <Badge tone="warn">Pendiente</Badge>
          </li>
          <li className="card">
            <Icon name="scan" />
            <span>Análisis de archivos</span>
            <Badge tone="accent">En el escritorio</Badge>
          </li>
        </ul>
      </section>

      <section aria-labelledby="panel-acciones">
        <h2 id="panel-acciones">Acciones rápidas</h2>
        <div className="quick-actions">
          <RouteLink href="/cuenta/descarga" onNavigate={onNavigate} className="quick">
            <Icon name="download" />
            Obtener el instalador
          </RouteLink>
          <RouteLink href="/cuenta/equipos" onNavigate={onNavigate} className="quick">
            <Icon name="devices" />
            Ver mis equipos
          </RouteLink>
          <RouteLink href="/cuenta/preferencias" onNavigate={onNavigate} className="quick">
            <Icon name="settings" />
            Cambiar el tema o el idioma
          </RouteLink>
          <RouteLink href="/cuenta/consentimientos" onNavigate={onNavigate} className="quick">
            <Icon name="privacy" />
            Revisar mis permisos
          </RouteLink>
        </div>
      </section>
    </div>
  );
}
