import { useState } from 'react';
import { useAction, usePortal, useResource } from '../app/portal';
import { preferencesSchema, type PreferenceView } from '../api/schemas';
import { ActionStatus, ResourceStatus } from '../components/AsyncState';
export function PreferencesPage() {
  const { api } = usePortal();
  const resource = useResource(api.loadMe);
  return (
    <div className="stack">
      <ResourceStatus {...resource} />
      {resource.state.status === 'ready' ? (
        <PreferencesForm value={resource.state.data.preferences} reload={resource.reload} />
      ) : null}
    </div>
  );
}
function PreferencesForm({ value, reload }: { value: PreferenceView; reload: () => void }) {
  const { api } = usePortal();
  const [locale, setLocale] = useState(value.locale);
  const [timezone, setTimezone] = useState(value.timezone);
  const [theme, setTheme] = useState(value.theme);
  const [error, setError] = useState('');
  const action = useAction();
  return (
    <form
      className="stack"
      onSubmit={(event) => {
        event.preventDefault();
        const next = { locale, timezone, theme };
        if (!preferencesSchema.safeParse(next).success) {
          setError('Escribe una zona horaria válida.');
          document.getElementById('zona')?.focus();
          return;
        }
        setError('');
        void action.run(async () => {
          await api.savePreferences(next);
          action.setMessage('Preferencias guardadas.');
        });
      }}
    >
      <p>
        Estas opciones se guardan en tu cuenta. El tema del portal conserva la guía visual de la
        demo.
      </p>
      <label htmlFor="idioma">Idioma</label>
      <select
        id="idioma"
        value={locale}
        onChange={(event) => setLocale(event.target.value === 'es' ? 'es' : 'es-CO')}
      >
        <option value="es-CO">Español de Colombia</option>
        <option value="es">Español</option>
      </select>
      <label htmlFor="zona">Zona horaria</label>
      <input
        id="zona"
        value={timezone}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? 'zona-error' : undefined}
        onChange={(event) => setTimezone(event.target.value)}
      />
      {error ? (
        <p id="zona-error" className="field-error" role="alert">
          {error}
        </p>
      ) : null}
      <label htmlFor="tema">Tema</label>
      <select
        id="tema"
        value={theme}
        onChange={(event) => setTheme(event.target.value as PreferenceView['theme'])}
      >
        <option value="system">Según el sistema</option>
        <option value="light">Claro</option>
        <option value="dark">Oscuro</option>
      </select>
      <button type="submit" disabled={action.busy}>
        Guardar preferencias
      </button>
      <ActionStatus {...action} />
      <button type="button" className="quiet" onClick={reload}>
        Consultar preferencias
      </button>
    </form>
  );
}
