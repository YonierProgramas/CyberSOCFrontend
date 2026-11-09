import { useRef, useState } from 'react';
import { z } from 'zod';
import { useAction, usePortal } from '../app/portal';
import { FormField, StatusMessage } from '../components/FormField';
import { ActionStatus } from '../components/AsyncState';
import { RouteLink } from '../components/Shell';
export function AccessPage({
  onNavigate,
  notice,
}: {
  onNavigate: (path: string) => void;
  notice: string;
}) {
  const { session } = usePortal();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [revealed, setRevealed] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const action = useAction();
  return (
    <form
      className="stack"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        const nextEmail = z.email().max(254).safeParse(email.trim()).success
          ? ''
          : 'Escribe un correo válido.';
        const nextPassword =
          password.length > 0 && password.length <= 4096 ? '' : 'Escribe la contraseña.';
        setEmailError(nextEmail);
        setPasswordError(nextPassword);
        if (nextEmail || nextPassword) {
          if (nextEmail) emailRef.current?.focus();
          else passwordRef.current?.focus();
          return;
        }
        void action.run(async () => {
          try {
            await session.signIn(email.trim(), password);
            onNavigate('/');
          } finally {
            setPassword('');
          }
        }, true);
      }}
    >
      <p className="muted">
        Entra con tu cuenta o usa una de las cuentas de demostración. Al recargar o abrir otra
        pestaña tendrás que entrar de nuevo.
      </p>
      {notice ? <StatusMessage kind="info">{notice}</StatusMessage> : null}
      <section className="demo-access" aria-label="Cuentas de demostración">
        <strong>Acceso para el profesor</strong>
        <p>Cuentas públicas de demostración:</p>
        <dl>
          <div>
            <dt>Cuenta 1</dt>
            <dd>
              Correo: <code>usuario1@gmail.com</code>
            </dd>
            <dd>
              Contraseña: <code>demo123A*</code>
            </dd>
          </div>
          <div>
            <dt>Cuenta 2</dt>
            <dd>
              Correo: <code>usuario2@gmail.com</code>
            </dd>
            <dd>
              Contraseña: <code>demo123B*</code>
            </dd>
          </div>
        </dl>
      </section>
      <FormField
        id="correo"
        label="Correo"
        type="email"
        autoComplete="username"
        value={email}
        error={emailError}
        inputRef={emailRef}
        onChange={setEmail}
      />
      <FormField
        id="clave"
        label="Contraseña"
        type="password"
        autoComplete="current-password"
        value={password}
        error={passwordError}
        inputRef={passwordRef}
        revealed={revealed}
        onToggle={() => setRevealed((value) => !value)}
        onChange={setPassword}
      />
      <button type="submit" className="block" disabled={action.busy} aria-busy={action.pending}>
        {action.pending ? <span className="spinner" aria-hidden="true" /> : null}
        Entrar
      </button>
      <ActionStatus {...action} />
      <div className="auth-links">
        <RouteLink href="/recuperar" onNavigate={onNavigate}>
          Olvidé mi contraseña
        </RouteLink>
        <RouteLink href="/registro" onNavigate={onNavigate}>
          Crear una cuenta
        </RouteLink>
      </div>
    </form>
  );
}
