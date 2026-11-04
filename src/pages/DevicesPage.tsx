import { useCallback, useState } from 'react';
import { useAction, usePortal, useResource } from '../app/portal';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { ActionStatus, ResourceStatus } from '../components/AsyncState';
export function DevicesPage() {
  const { api } = usePortal();
  const [cursor, setCursor] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<{ id: string; name: string } | null>(null);
  const load = useCallback(() => api.loadDevices(cursor), [api, cursor]);
  const resource = useResource(load);
  const action = useAction();
  function restart() {
    setCursor(null);
    resource.reload();
  }
  return (
    <div className="stack">
      <p>Equipos de esta cuenta. La vinculación desde el escritorio queda pendiente.</p>
      <ResourceStatus {...resource} />
      {resource.state.status === 'ready' ? (
        <>
          {resource.state.data.items.length === 0 ? (
            <p className="notice" role="status">
              Todavía no hay equipos vinculados.
            </p>
          ) : (
            resource.state.data.items.map((device) => (
              <article className="panel" key={device.deviceId}>
                <h2>{device.displayName}</h2>
                <p>
                  {device.appVersion} · {device.revokedAt ? 'Acceso revocado' : 'Registrado'}
                </p>
                <button
                  type="button"
                  className="quiet"
                  disabled={action.busy || Boolean(device.revokedAt)}
                  onClick={() => setConfirming({ id: device.deviceId, name: device.displayName })}
                >
                  Revocar equipo
                </button>
              </article>
            ))
          )}
          <button
            type="button"
            disabled={!resource.state.data.nextCursor || action.busy}
            onClick={() => {
              if (resource.state.status === 'ready') {
                setCursor(resource.state.data.nextCursor);
                resource.reload();
              }
            }}
          >
            Siguiente
          </button>
        </>
      ) : null}
      <button type="button" className="quiet" onClick={restart}>
        Reiniciar lista
      </button>
      <p>
        La lista puede caducar a los 10 minutos o al reiniciarse el servidor. Si caduca, reiníciala.
        El cursor es opaco y solo sirve para esta cuenta y consulta.
      </p>
      <ActionStatus {...action} />
      {confirming ? (
        <ConfirmDialog
          title="Revocar equipo"
          message={
            'Se revocará el acceso de ' + confirming.name + '. No se borran archivos del equipo.'
          }
          confirmLabel="Revocar"
          onCancel={() => setConfirming(null)}
          onConfirm={() => {
            const id = confirming.id;
            setConfirming(null);
            void action.run(async () => {
              await api.revokeDevice(id);
              action.setMessage('Equipo revocado.');
              restart();
            });
          }}
        />
      ) : null}
    </div>
  );
}
