import type { PreferenceView } from '../api/schemas';

// Aplica la preferencia de tema guardada en la cuenta. Antes se guardaba en la API pero el
// portal nunca la usaba: por eso «Oscuro» no cambiaba nada. «Según el sistema» quita el
// atributo y deja decidir a prefers-color-scheme (tokens.css). Sin sesión, siempre sistema.
export function applyTheme(theme: PreferenceView['theme']): void {
  const root = document.documentElement;
  if (theme === 'system') delete root.dataset.theme;
  else root.dataset.theme = theme;
}
