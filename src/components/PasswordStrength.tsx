// Ayuda visual de fortaleza para la contraseña nueva. NO sustituye la validación real
// (entre 8 y 4096 caracteres, la que se aplica al enviar): solo orienta mientras se escribe.
// Puntúa longitud y variedad de tipos de carácter; O(n) en la longitud del texto.
export function passwordScore(password: string): 0 | 1 | 2 | 3 {
  if (password.length < 8) return 0;
  const kinds = [/[a-záéíóúñ]/, /[A-ZÁÉÍÓÚÑ]/, /\d/, /[^\p{L}\d]/u].filter((pattern) =>
    pattern.test(password),
  ).length;
  if (password.length >= 14 && kinds >= 3) return 3;
  if (password.length >= 10 && kinds >= 2) return 2;
  return 1;
}

const labels = ['Demasiado corta', 'Aceptable', 'Buena', 'Fuerte'] as const;
const tones = ['danger', 'warn', 'accent', 'ok'] as const;

export function PasswordStrength({ password, id }: { password: string; id: string }) {
  if (password === '') return null;
  const score = passwordScore(password);
  return (
    <div className={`strength tone-${tones[score]}`} id={id}>
      <div className="strength-bars" aria-hidden="true">
        {[0, 1, 2, 3].map((step) => (
          <span key={step} className={step <= score ? 'on' : undefined} />
        ))}
      </div>
      <p className="hint">
        Fortaleza orientativa: {labels[score]}. Mínimo 8 caracteres; más largo y variado es mejor.
      </p>
    </div>
  );
}
