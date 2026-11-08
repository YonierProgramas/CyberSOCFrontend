import { useCallback, useState } from 'react';
import { useAction, usePortal, useResource } from '../app/portal';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { ActionStatus, ResourceStatus } from '../components/AsyncState';
import { Icon } from '../components/Icon';
import { Badge, EmptyState, formatDate } from '../components/ui';

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
    <div className="page-grid">
      <p className="callout tone-accent">
        <Icon name="info" />
        <span>
          Equipos de esta cuenta. La vinculación desde el escritorio queda pendiente: cuando exista,
          cada equipo donde inicies sesión aparecerá aquí.
        </span>
      </p>
      <ResourceStatus {...resource} />
      {resource.state.status === 'ready' ? (
        <>
          {resource.state.data.items.length === 0 ? (
            <EmptyState icon="devices" title="Todavía no hay equipos vinculados.">
              <p className="muted">
                Cuando la aplicación de escritorio pueda vincularse, verás aquí el nombre de cada
                equipo, su versión y su última conexión, y podrás revocar su acceso.
              </p>
              <ul className="empty-points">
                <li>
                  <Icon name="devices" />
                  Nombre y versión de cada equipo
                </li>
                <li>
                  <Icon name="clock" />
                  Fecha de vinculación y última conexión
                </li>
                <li>
                  <Icon name="lock" />
                  Revocar el acceso cuando quieras
                </li>
              </ul>
            </EmptyState>
          ) : (
            <div className="device-grid">
              {resource.state.data.items.map((device) => (
                <article className="card device-card" key={device.deviceId}>
                  <div className="device-top">
                    <Icon name="devices" />
                    {device.revokedAt ? (
                      <Badge tone="muted">Revocado</Badge>
                    ) : (
                      <Badge tone="ok">Activo</Badge>
                    )}
                  </div>
                  <h2>{device.displayName}</h2>
                  <p>
                    {device.appVersion} · {device.revokedAt ? 'Acceso revocado' : 'Registrado'}
                  </p>
                  <dl className="meta">
                    <div>
                      <dt>Plataforma</dt>
                      <dd>Windows x64</dd>
                    </div>
                    <div>
                      <dt>Vinculado</dt>
                      <dd>{formatDate(device.createdAt)}</dd>
                    </div>
                    <div>
                      <dt>Última conexión</dt>
                      <dd>{formatDate(device.lastSeenAt)}</dd>
                    </div>
                  </dl>
                  <button
                    type="button"
                    className="quiet danger"
                    disabled={action.busy || Boolean(device.revokedAt)}
                    onClick={() => setConfirming({ id: device.deviceId, name: device.displayName })}
                  >
                    Revocar equipo
                  </button>
                </article>
              ))}
            </div>
          )}
          <div className="actions">
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
            <button type="button" className="quiet" onClick={restart}>
              <Icon name="refresh" />
              Reiniciar lista
            </button>
          </div>
        </>
      ) : (
        <div className="actions">
          <button type="button" className="quiet" onClick={restart}>
            <Icon name="refresh" />
            Reiniciar lista
          </button>
        </div>
      )}
      <p className="hint">
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
