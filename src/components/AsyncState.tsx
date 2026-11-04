import { StatusMessage } from './FormField';
import type { Resource } from '../app/portal';
import type { PortalError } from '../api/fault';
import { useEffect, useState } from 'react';
function RetryRead({ error, reload }: { error: PortalError; reload: () => void }) {
  const [waiting, setWaiting] = useState(error.code === 'RATE_LIMITED');
  useEffect(() => {
    if (error.code !== 'RATE_LIMITED') return;
    const timer = setTimeout(
      () => setWaiting(false),
      Math.min(2147483647, error.retryAfterMs || 60000),
    );
    return () => clearTimeout(timer);
  }, [error]);
  return (
    <button type="button" disabled={waiting} onClick={reload}>
      Consultar de nuevo
    </button>
  );
}
export function ResourceStatus<T>({ state, reload }: { state: Resource<T>; reload: () => void }) {
  if (state.status === 'loading')
    return <StatusMessage kind="loading">Cargando. Espera un momento.</StatusMessage>;
  if (state.status === 'error')
    return (
      <div className="stack">
        <StatusMessage kind="error">{state.error.message}</StatusMessage>
        {state.error.code !== 'RELEASE_UNAVAILABLE' && (
          <RetryRead error={state.error} reload={reload} />
        )}
      </div>
    );
  return null;
}
export function ActionStatus({
  pending,
  error,
  message,
}: {
  pending: boolean;
  error: PortalError | null;
  message: string;
}) {
  return (
    <>
      {pending ? <StatusMessage kind="loading">Enviando. Espera un momento.</StatusMessage> : null}
      {error ? <StatusMessage kind="error">{error.message}</StatusMessage> : null}
      {message ? <StatusMessage kind="info">{message}</StatusMessage> : null}
    </>
  );
}
