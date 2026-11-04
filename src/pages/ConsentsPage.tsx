import { useState } from 'react';
import { useAction, usePortal, useResource } from '../app/portal';
import type { ConsentView } from '../api/schemas';
import { ActionStatus, ResourceStatus } from '../components/AsyncState';
const titles = {
  scan_summaries: 'Resúmenes de análisis',
  report_storage: 'Guardar informes',
} as const;
export function ConsentsPage() {
  const { api } = usePortal();
  const resource = useResource(api.loadConsents);
  return (
    <div className="stack">
      <p>
        Este permiso no hace falta para descargar el instalador y no enciende el análisis del
        escritorio.
      </p>
      <ResourceStatus {...resource} />
      {resource.state.status === 'ready'
        ? resource.state.data.map((consent) => (
            <ConsentChoice
              key={consent.purpose + ':' + consent.currentPolicyVersion + ':' + consent.changedAt}
              consent={consent}
              reload={resource.reload}
            />
          ))
        : null}
      <button type="button" className="quiet" onClick={resource.reload}>
        Consultar consentimientos
      </button>
    </div>
  );
}
function ConsentChoice({ consent, reload }: { consent: ConsentView; reload: () => void }) {
  const { api } = usePortal();
  const action = useAction();
  const [accepted, setAccepted] = useState(false);
  const [outdated, setOutdated] = useState(false);
  async function save(granted: boolean) {
    await action.run(async () => {
      try {
        await api.saveConsent(
          consent.purpose,
          granted
            ? { granted: true, policyVersion: consent.currentPolicyVersion }
            : { granted: false },
        );
        action.setMessage(granted ? 'Consentimiento concedido.' : 'Consentimiento retirado.');
        reload();
      } catch (error) {
        // No se acepta automáticamente una política que cambió durante la decisión.
        setOutdated(true);
        throw error;
      }
    });
  }
  return (
    <fieldset className="panel">
      <legend>{titles[consent.purpose]}</legend>
      <p>
        {consent.effective
          ? 'Consentimiento vigente.'
          : consent.granted
            ? 'Necesita renovación; no está vigente.'
            : 'Sin consentimiento vigente.'}
      </p>
      <p>
        Política vigente: {consent.currentPolicyVersion}. La autorización permite sincronizar estos
        datos; puedes retirarla en cualquier momento.
      </p>
      <label className="consent-accept">
        <input
          type="checkbox"
          checked={accepted}
          onChange={(event) => setAccepted(event.target.checked)}
        />
        He leído y acepto esta versión para {titles[consent.purpose].toLowerCase()}.
      </label>
      <div className="actions">
        <button
          type="button"
          disabled={action.busy || !accepted || outdated}
          onClick={() => {
            void save(true);
          }}
        >
          Conceder
        </button>
        <button
          type="button"
          className="quiet"
          disabled={action.busy}
          onClick={() => {
            void save(false);
          }}
        >
          Retirar
        </button>
      </div>
      <ActionStatus {...action} />
      {outdated ? (
        <button type="button" onClick={reload}>
          Consultar política y estado
        </button>
      ) : null}
    </fieldset>
  );
}
