import { useEffect, useRef, type KeyboardEvent } from 'react';
import { reveal } from './revealFocus';

type DialogProps = {
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
};

// Tab en el último control de un diálogo modal no debe salir al resto de la página.
// Si sale, el foco se pierde aunque el diálogo siga abierto. Por eso vuelve al primero.
function keepFocus(event: KeyboardEvent<HTMLDialogElement>) {
  if (event.key !== 'Tab') return;
  const dialog = event.currentTarget;
  const items = [
    ...dialog.querySelectorAll<HTMLElement>('button, a, input, select, textarea'),
  ].filter((item) => !item.hasAttribute('disabled'));
  const first = items[0];
  const last = items[items.length - 1];
  if (!first || !last) return;
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

export function ConfirmDialog({ title, message, confirmLabel, onConfirm, onCancel }: DialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLElement | null>(null);

  useEffect(() => {
    opener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const dialog = dialogRef.current;
    dialog?.showModal();
    return () => {
      dialog?.close();
      reveal(opener.current);
    };
  }, []);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="confirm-title"
      onCancel={(event) => {
        event.preventDefault();
        onCancel();
      }}
      onKeyDown={keepFocus}
    >
      <h2 id="confirm-title">{title}</h2>
      <p>{message}</p>
      <div className="actions">
        <button type="button" onClick={onConfirm}>
          {confirmLabel}
        </button>
        <button type="button" className="quiet" onClick={onCancel}>
          Cancelar
        </button>
      </div>
    </dialog>
  );
}
