import { useState } from 'react';
import { useAction, usePortal, useResource } from '../app/portal';
import type { ConsentView } from '../api/schemas';
import { ActionStatus, ResourceStatus } from '../components/AsyncState';
import { Icon, type IconName } from '../components/Icon';
import { Badge, formatDate } from '../components/ui';

const titles = {
  scan_summaries: 'Resúmenes de análisis',
  report_storage: 'Guardar informes',
} as const;

const details: Record<ConsentView['purpose'], { icon: IconName; text: string }> = {
  scan_summaries: {
    icon: 'chart',
    text: 'Cuando exista la vinculación del escritorio, autoriza enviar a tu cuenta solo contadores de cada análisis (totales por veredicto, zona y capa). Nunca nombres, rutas, hashes ni contenido de archivos.',
  },
  report_storage: {
    icon: 'file',
    text: 'Autoriza guardar en tu cuenta una copia de los informes anonimizados. La función aún no existe: hoy no se envía nada.',
  },
};

export function ConsentsPage() {
  const { api } = usePortal();
  const resource = useResource(api.loadConsents);
  return (
    <div className="page-grid">
      <p className="callout tone-accent">
        <Icon name="privacy" />
        <span>
          Este permiso no hace falta para descargar el instalador y no enciende el análisis del
          escritorio. Nada se concede sin que marques la casilla.
        </span>
      </p>
      <ResourceStatus {...resource} />
      <div className="consent-grid">
        {resource.state.status === 'ready'
          ? resource.state.data.map((consent) => (
              <ConsentChoice
                key={consent.purpose + ':' + consent.currentPolicyVersion + ':' + consent.changedAt}
                consent={consent}
                reload={resource.reload}
              />
            ))
          : null}
      </div>
      <div className="actions">
        <button type="button" className="quiet" onClick={resource.reload}>
          <Icon name="refresh" />
          Consultar consentimientos
        </button>
      </div>
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
  const status = consent.effective
    ? { tone: 'ok' as const, badge: 'Vigente', text: 'Consentimiento vigente.' }
    : consent.granted
      ? {
          tone: 'warn' as const,
          badge: 'Renovar',
          text: 'Necesita renovación; no está vigente.',
        }
      : { tone: 'muted' as const, badge: 'Sin conceder', text: 'Sin consentimiento vigente.' };
  return (
    <fieldset className="card consent-card">
      <legend>{titles[consent.purpose]}</legend>
      <div className="consent-head">
        <span className="consent-icon">
          <Icon name={details[consent.purpose].icon} />
        </span>
        <Badge tone={status.tone}>{status.badge}</Badge>
      </div>
      <p className="consent-status">{status.text}</p>
      <p className="muted">{details[consent.purpose].text}</p>
      <dl className="meta">
        <div>
          <dt>Política vigente</dt>
          <dd>{consent.currentPolicyVersion}</dd>
        </div>
        <div>
          <dt>Último cambio</dt>
          <dd>{formatDate(consent.changedAt)}</dd>
        </div>
      </dl>
      <p className="muted">
        La autorización permite sincronizar estos datos; puedes retirarla en cualquier momento.
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
          <Icon name="check" />
          Conceder
        </button>
        <button
          type="button"
          className="quiet danger"
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
