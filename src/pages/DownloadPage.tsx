import { useState } from 'react';
import { useAction, usePortal, useResource } from '../app/portal';
import type { DownloadView } from '../api/schemas';
import { ActionStatus, ResourceStatus } from '../components/AsyncState';
import { Icon } from '../components/Icon';
import { Badge, formatDate } from '../components/ui';

function megabytes(bytes: number): string {
  return `${(bytes / 1024 / 1024).toLocaleString('es-CO', { maximumFractionDigits: 1 })} MB`;
}

export function DownloadPage() {
  const { api } = usePortal();
  const resource = useResource(api.latestRelease);
  const action = useAction();
  const [download, setDownload] = useState<DownloadView | null>(null);
  const unavailable =
    (resource.state.status === 'error' && resource.state.error.code === 'RELEASE_UNAVAILABLE') ||
    action.error?.code === 'RELEASE_UNAVAILABLE';
  const release = resource.state.status === 'ready' && !unavailable ? resource.state.data : null;
  return (
    <div className="page-grid">
      <section className="card download-hero" aria-labelledby="descarga-titulo">
        <span className="download-icon">
          <Icon name="windows" />
        </span>
        <div className="download-copy">
          <div className="section-head">
            <h2 id="descarga-titulo">Instalador para Windows</h2>
            {release ? (
              <Badge tone="ok">Publicado</Badge>
            ) : unavailable ? (
              <Badge tone="warn">Pendiente de publicación</Badge>
            ) : null}
          </div>
          <p className="muted">
            Instala CyberSOC Defender en tu equipo. El análisis, la cuarentena y el historial
            funcionan dentro de la aplicación, sin enviar tus archivos al portal.
          </p>
          {unavailable ? (
            <>
              <p className="notice" role="status">
                Instalador pendiente.
              </p>
              <p className="muted">
                Todavía no hay un instalador publicado para Windows de 64 bits. No hay enlace de
                descarga. Vuelve más tarde: esta página lo mostrará en cuanto exista.
              </p>
            </>
          ) : (
            <ResourceStatus {...resource} />
          )}
          {release ? (
            <dl className="meta">
              <div>
                <dt>Versión</dt>
                <dd>{release.version}</dd>
              </div>
              <div>
                <dt>Publicado</dt>
                <dd>{formatDate(release.publishedAt)}</dd>
              </div>
              <div>
                <dt>Tamaño</dt>
                <dd>
                  {megabytes(release.sizeBytes)} ({release.sizeBytes} bytes)
                </dd>
              </div>
              <div>
                <dt>Requisitos</dt>
                <dd>
                  {release.requirements.os}
                  {release.requirements.admin ? '' : ' · sin permisos de administrador'}
                </dd>
              </div>
            </dl>
          ) : null}
          {release ? (
            <p className="muted">
              No necesitas conceder permisos de sincronización para descargar.
            </p>
          ) : null}
          <div className="actions">
            {release ? (
              <button
                type="button"
                disabled={action.busy || download !== null}
                onClick={() => {
                  void action.run(async () => {
                    setDownload(null);
                    setDownload(await api.requestDownload());
                  });
                }}
              >
                <Icon name="download" />
                Descargar
              </button>
            ) : (
              <button type="button" disabled aria-describedby="descarga-motivo">
                <Icon name="download" />
                Descargar
              </button>
            )}
          </div>
          {release ? null : (
            <p id="descarga-motivo" className="hint">
              El botón se activa cuando hay una versión publicada.
            </p>
          )}
          <ActionStatus {...action} />
        </div>
      </section>
      {download && !unavailable ? (
        <section className="card download-ready" aria-label="Instalador listo">
          <a className="button" href={download.downloadUrl} rel="noreferrer">
            <Icon name="download" />
            Obtener instalador {download.version}
          </a>
          <p>{download.sizeBytes} bytes</p>
          <p className="hash">SHA-256: {download.sha256}</p>
          <p className="muted">
            Comprueba que el SHA-256 del archivo descargado coincida antes de instalarlo.
          </p>
        </section>
      ) : null}
      <section className="card" aria-labelledby="descarga-pasos">
        <h2 id="descarga-pasos">
          <Icon name="info" /> Antes de instalar
        </h2>
        <ul className="checklist">
          <li>
            <Icon name="check" />
            Se instala solo para tu usuario y conserva tus datos si lo desinstalas.
          </li>
          <li>
            <Icon name="check" />
            Trae su propio motor de análisis: no necesitas instalar nada más.
          </li>
          <li>
            <Icon name="alert" />
            El instalador aún no está firmado: Windows puede mostrar un aviso de SmartScreen.
          </li>
        </ul>
      </section>
    </div>
  );
}
