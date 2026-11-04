import { useEffect, useRef, type ReactNode, type Ref } from 'react';
import { reveal } from './revealFocus';

type FieldProps = {
  id: string;
  label: string;
  type: 'email' | 'text' | 'password';
  autoComplete: string;
  value: string;
  error: string;
  inputRef?: Ref<HTMLInputElement>;
  revealed?: boolean;
  onToggle?: () => void;
  onChange: (value: string) => void;
};

export function FormField({
  id,
  label,
  type,
  autoComplete,
  value,
  error,
  inputRef,
  revealed = false,
  onToggle,
  onChange,
}: FieldProps) {
  const errorId = `${id}-error`;
  const shown = type === 'password' && revealed ? 'text' : type;
  return (
    <div className="stack">
      <label htmlFor={id}>{label}</label>
      <div className={type === 'password' ? 'password-row' : undefined}>
        <input
          ref={inputRef}
          id={id}
          name={id}
          type={shown}
          autoComplete={autoComplete}
          value={value}
          aria-invalid={error !== ''}
          aria-describedby={error !== '' ? errorId : undefined}
          onChange={(event) => onChange(event.target.value)}
        />
        {type === 'password' && onToggle ? (
          <button type="button" className="quiet" aria-pressed={revealed} onClick={onToggle}>
            {revealed ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          </button>
        ) : null}
      </div>
      {error !== '' ? (
        <p id={errorId} className="field-error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function StatusMessage({
  children,
  kind,
}: {
  children: ReactNode;
  kind: 'info' | 'error' | 'loading';
}) {
  const messageRef = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    reveal(messageRef.current);
  }, []);
  return (
    <p
      ref={messageRef}
      tabIndex={-1}
      className={kind === 'error' ? 'error' : 'notice'}
      role={kind === 'loading' ? 'status' : 'alert'}
      aria-live="polite"
    >
      {children}
    </p>
  );
}
