import { useRef, useState } from 'react';
import { z } from 'zod';
import { useAction, usePortal } from '../app/portal';
import { ActionStatus } from '../components/AsyncState';
import { FormField } from '../components/FormField';
import { PasswordStrength } from '../components/PasswordStrength';
import { RouteLink } from '../components/Shell';

export function RegistrationPage({ onNavigate }: { onNavigate: (path: string) => void }) {
  const { session, signupOpen } = usePortal();
  const action = useAction();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [repeat, setRepeat] = useState('');
  const [revealed, setRevealed] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [repeatError, setRepeatError] = useState('');
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const repeatRef = useRef<HTMLInputElement>(null);
  if (!signupOpen)
    return (
      <div className="stack">
        <p className="notice">Registro cerrado. La demo no acepta cuentas nuevas.</p>
        <RouteLink href="/acceso" onNavigate={onNavigate}>
          Volver al acceso
        </RouteLink>
      </div>
    );
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
          password.length >= 8 && password.length <= 4096 ? '' : 'Usa entre 8 y 4096 caracteres.';
        const nextRepeat = repeat === password ? '' : 'Las contraseñas no coinciden.';
        setEmailError(nextEmail);
        setPasswordError(nextPassword);
        setRepeatError(nextRepeat);
        if (nextEmail || nextPassword || nextRepeat) {
          if (nextEmail) emailRef.current?.focus();
          else if (nextPassword) passwordRef.current?.focus();
          else repeatRef.current?.focus();
          return;
        }
        void action.run(async () => {
          try {
            await session.signUp(email.trim(), password);
            onNavigate('/cuenta');
          } finally {
            setPassword('');
            setRepeat('');
          }
        }, true);
      }}
    >
      <p className="notice">
        En esta demo tu cuenta se activa al registrarte, sin confirmar el correo.
      </p>
      <FormField
        id="registro-correo"
        label="Correo"
        type="email"
        autoComplete="username"
        value={email}
        error={emailError}
        inputRef={emailRef}
        onChange={setEmail}
      />
      <FormField
        id="registro-clave"
        label="Contraseña"
        type="password"
        autoComplete="new-password"
        value={password}
        error={passwordError}
        inputRef={passwordRef}
        revealed={revealed}
        onToggle={() => setRevealed((value) => !value)}
        onChange={setPassword}
      />
      <PasswordStrength password={password} id="registro-fortaleza" />
      <FormField
        id="registro-repetir"
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
        Crear cuenta
      </button>
      <ActionStatus {...action} />
      <RouteLink href="/acceso" onNavigate={onNavigate}>
        Ya tengo una cuenta
      </RouteLink>
    </form>
  );
}
