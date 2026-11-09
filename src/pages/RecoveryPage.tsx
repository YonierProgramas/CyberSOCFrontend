import { useRef, useState } from 'react';
import { z } from 'zod';
import { useAction, usePortal } from '../app/portal';
import { ActionStatus } from '../components/AsyncState';
import { FormField } from '../components/FormField';
import { RouteLink } from '../components/Shell';
export function RecoveryPage({ onNavigate }: { onNavigate: (path: string) => void }) {
  const { recover } = usePortal();
  const action = useAction();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const ref = useRef<HTMLInputElement>(null);
  return (
    <form
      className="stack"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        if (!z.email().max(254).safeParse(email.trim()).success) {
          setError('Escribe un correo válido.');
          ref.current?.focus();
          return;
        }
        setError('');
        void action.run(async () => {
          await recover(email.trim());
          action.setMessage('Si el correo es válido, recibirás un mensaje.');
        });
      }}
    >
      <p className="muted">
        Recuperación para cuentas existentes. El mensaje es el mismo exista o no la cuenta, para no
        revelar qué correos están registrados.
      </p>
      <FormField
        id="correo-recuperar"
        label="Correo"
        type="email"
        autoComplete="email"
        value={email}
        error={error}
        inputRef={ref}
        onChange={setEmail}
      />
      <button type="submit" className="block" disabled={action.busy} aria-busy={action.pending}>
        {action.pending ? <span className="spinner" aria-hidden="true" /> : null}
        Enviar enlace
      </button>
      <ActionStatus {...action} />
      <div className="auth-links">
        <RouteLink href="/acceso" onNavigate={onNavigate}>
          Volver al acceso
        </RouteLink>
      </div>
    </form>
  );
}
