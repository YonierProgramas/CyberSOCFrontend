import { useRef, useState } from 'react';
import type { PortalSession } from '../auth/session';
import { useAction, usePortal } from '../app/portal';
import { ActionStatus } from '../components/AsyncState';
import { FormField } from '../components/FormField';
import { RouteLink } from '../components/Shell';
export function NewPasswordPage({
  session,
  onNavigate,
}: {
  session: PortalSession | null;
  onNavigate: (path: string) => void;
}) {
  const portal = usePortal();
  const action = useAction();
  const [password, setPassword] = useState('');
  const [revealed, setRevealed] = useState(false);
  const [error, setError] = useState('');
  const ref = useRef<HTMLInputElement>(null);
  if (session?.kind !== 'recovery')
    return (
      <div className="stack">
        <p className="notice">Pide un enlace nuevo. Visitar esta página no abre una sesión.</p>
        <p>
          <RouteLink href="/recuperar" onNavigate={onNavigate}>
            Recuperar acceso
          </RouteLink>
        </p>
      </div>
    );
  return (
    <form
      className="stack"
      onSubmit={(event) => {
        event.preventDefault();
        if (password.length < 8 || password.length > 4096) {
          setError('Usa entre 8 y 4096 caracteres.');
          ref.current?.focus();
          return;
        }
        setError('');
        void action.run(async () => {
          try {
            await portal.session.updatePassword(password);
            onNavigate('/acceso');
          } finally {
            setPassword('');
          }
        }, true);
      }}
    >
      <p>Esta sesión solo permite recuperar la contraseña. Si recargas, pide un enlace nuevo.</p>
      <FormField
        id="nueva-clave"
        label="Nueva contraseña"
        type="password"
        autoComplete="new-password"
        value={password}
        error={error}
        inputRef={ref}
        revealed={revealed}
        onToggle={() => setRevealed((value) => !value)}
        onChange={setPassword}
      />
      <button type="submit" disabled={action.busy}>
        Guardar contraseña
      </button>
      <ActionStatus {...action} />
    </form>
  );
}
