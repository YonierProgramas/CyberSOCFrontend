import { useEffect, useSyncExternalStore } from 'react';
import { usePortal, useSession } from '../app/portal';
import { PortalError } from '../api/fault';
import { CONFIRM_SIGNUP_TYPE } from '../config/publicConfig';
import { StatusMessage } from '../components/FormField';
import { RouteLink } from '../components/Shell';
export function ConfirmPage({ onNavigate }: { onNavigate: (path: string) => void }) {
  const { confirmation } = usePortal();
  const { session } = useSession();
  const state = useSyncExternalStore(confirmation.subscribe, confirmation.getSnapshot);
  useEffect(() => {
    void confirmation.consume(window.location, window.history);
  }, [confirmation]);
  useEffect(() => {
    if (state.status !== 'success') return;
    if (state.type === CONFIRM_SIGNUP_TYPE && session?.kind === 'access') onNavigate('/cuenta');
    if (state.type === 'recovery' && session?.kind === 'recovery') onNavigate('/nueva-contrasena');
  }, [state, session, onNavigate]);
  return (
    <div className="stack">
      <StatusMessage kind={state.status === 'error' ? 'error' : 'loading'}>
        {state.status === 'error'
          ? new PortalError('LINK_INVALID').message
          : 'Verificando el enlace. Espera un momento.'}
      </StatusMessage>
      <p>
        <RouteLink href="/acceso" onNavigate={onNavigate}>
          Volver al acceso
        </RouteLink>
      </p>
      <p>
        <RouteLink href="/recuperar" onNavigate={onNavigate}>
          Pedir enlace nuevo
        </RouteLink>
      </p>
    </div>
  );
}
