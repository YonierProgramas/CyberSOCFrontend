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
      <p>Recuperación para cuentas existentes. La demo mantiene el registro cerrado.</p>
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
      <button type="submit" disabled={action.busy}>
        Enviar enlace
      </button>
      <ActionStatus {...action} />
      <p>
        <RouteLink href="/acceso" onNavigate={onNavigate}>
          Volver al acceso
        </RouteLink>
      </p>
    </form>
  );
}
