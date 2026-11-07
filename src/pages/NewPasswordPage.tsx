import { useRef, useState } from 'react';
import type { PortalSession } from '../auth/session';
import { useAction, usePortal } from '../app/portal';
import { ActionStatus } from '../components/AsyncState';
import { FormField } from '../components/FormField';
import { Icon } from '../components/Icon';
import { PasswordStrength } from '../components/PasswordStrength';
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
  const [repeat, setRepeat] = useState('');
  const [revealed, setRevealed] = useState(false);
  const [error, setError] = useState('');
  const [repeatError, setRepeatError] = useState('');
  const ref = useRef<HTMLInputElement>(null);
  const repeatRef = useRef<HTMLInputElement>(null);
  if (session?.kind !== 'recovery')
    return (
      <div className="stack">
        <p className="notice">Pide un enlace nuevo. Visitar esta página no abre una sesión.</p>
        <p className="muted">
          Por seguridad, esta pantalla solo funciona justo después de abrir el enlace de
          recuperación del correo, y una sola vez.
        </p>
        <RouteLink href="/recuperar" onNavigate={onNavigate} className="button block">
          Recuperar acceso
        </RouteLink>
      </div>
    );
  return (
    <form
      className="stack"
      onSubmit={(event) => {
        event.preventDefault();
        if (password.length < 8 || password.length > 4096) {
          setError('Usa entre 8 y 4096 caracteres.');
          setRepeatError('');
          ref.current?.focus();
          return;
        }
        setError('');
        // Comprobación solo en el navegador: el servicio recibe la misma contraseña de antes.
        if (repeat !== password) {
          setRepeatError('Las contraseñas no coinciden.');
          repeatRef.current?.focus();
          return;
        }
        setRepeatError('');
        void action.run(async () => {
          try {
            await portal.session.updatePassword(password);
            onNavigate('/acceso');
          } finally {
            setPassword('');
            setRepeat('');
          }
        }, true);
      }}
    >
      <p className="callout tone-accent">
        <Icon name="info" />
        <span>
          Esta sesión solo permite recuperar la contraseña. Si recargas, pide un enlace nuevo.
        </span>
      </p>
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
      <PasswordStrength password={password} id="nueva-clave-fortaleza" />
      <FormField
        id="repetir-clave"
        label="Repite la contraseña"
        type="password"
        autoComplete="new-password"
        value={repeat}
        error={repeatError}
        inputRef={repeatRef}
        revealed={revealed}
        onChange={setRepeat}
      />
      <button type="submit" className="block" disabled={action.busy} aria-busy={action.pending}>
        {action.pending ? <span className="spinner" aria-hidden="true" /> : null}
        Guardar contraseña
      </button>
      <ActionStatus {...action} />
    </form>
  );
}
