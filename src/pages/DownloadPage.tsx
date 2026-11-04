import { useState } from 'react';
import { useAction, usePortal, useResource } from '../app/portal';
import type { DownloadView } from '../api/schemas';
import { ActionStatus, ResourceStatus } from '../components/AsyncState';
export function DownloadPage() {
  const { api } = usePortal();
  const resource = useResource(api.latestRelease);
  const action = useAction();
  const [download, setDownload] = useState<DownloadView | null>(null);
  const unavailable =
    (resource.state.status === 'error' && resource.state.error.code === 'RELEASE_UNAVAILABLE') ||
    action.error?.code === 'RELEASE_UNAVAILABLE';
  return (
    <div className="stack">
      {unavailable ? (
        <>
          <p className="notice" role="status">
            Instalador pendiente.
          </p>
          <p>
            Todavía no hay un instalador publicado para Windows de 64 bits. No hay enlace de
            descarga.
          </p>
        </>
      ) : (
        <ResourceStatus {...resource} />
      )}
      {resource.state.status === 'ready' && !unavailable ? (
        <>
          <p>
            Versión {resource.state.data.version} · Windows 10/11 x64 ·{' '}
            {resource.state.data.sizeBytes} bytes.
          </p>
          <p>No necesitas conceder permisos de sincronización para descargar.</p>
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
            Descargar
          </button>
        </>
      ) : (
        <button type="button" disabled>
          Descargar
        </button>
      )}
      <ActionStatus {...action} />
      {download && !unavailable ? (
        <div className="panel">
          <a className="button" href={download.downloadUrl} rel="noreferrer">
            Obtener instalador {download.version}
          </a>
          <p>{download.sizeBytes} bytes</p>
          <p className="hash">SHA-256: {download.sha256}</p>
        </div>
      ) : null}
    </div>
  );
}
