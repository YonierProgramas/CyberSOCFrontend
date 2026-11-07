import { useEffect, useState } from 'react';
import { useAction, usePortal, useResource } from '../app/portal';
import { applyTheme } from '../app/theme';
import { preferencesSchema, type PreferenceView } from '../api/schemas';
import { ActionStatus, ResourceStatus } from '../components/AsyncState';
import { Icon } from '../components/Icon';

export function PreferencesPage() {
  const { api } = usePortal();
  const resource = useResource(api.loadMe);
  const saved = resource.state.status === 'ready' ? resource.state.data.preferences.theme : null;
  useEffect(() => {
    if (saved) applyTheme(saved);
  }, [saved]);
  return (
    <div className="page-grid">
      <ResourceStatus {...resource} />
      {resource.state.status === 'ready' ? (
        <PreferencesForm value={resource.state.data.preferences} reload={resource.reload} />
      ) : null}
    </div>
  );
}

const themes: { value: PreferenceView['theme']; label: string }[] = [
  { value: 'system', label: 'Según el sistema' },
  { value: 'light', label: 'Claro' },
  { value: 'dark', label: 'Oscuro' },
];

function PreferencesForm({ value, reload }: { value: PreferenceView; reload: () => void }) {
  const { api } = usePortal();
  const [locale, setLocale] = useState(value.locale);
  const [timezone, setTimezone] = useState(value.timezone);
  const [theme, setTheme] = useState(value.theme);
  const [error, setError] = useState('');
  const action = useAction();
  return (
    <form
      className="settings bare"
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
          const stored = await api.savePreferences(next);
          // Se aplica lo que confirmó la API, no lo que se intentó guardar.
          applyTheme(stored.theme);
          action.setMessage('Preferencias guardadas.');
        });
      }}
    >
      <p className="muted">
        Estas opciones se guardan en tu cuenta. El tema se aplica al guardar y se recupera cada vez
        que entras.
      </p>
      <section className="card settings-section" aria-labelledby="pref-region">
        <h2 id="pref-region">
          <Icon name="clock" /> Idioma y región
        </h2>
        <div className="field-row">
          <div className="field">
            <label htmlFor="idioma">Idioma</label>
            <select
              id="idioma"
              value={locale}
              onChange={(event) => setLocale(event.target.value === 'es' ? 'es' : 'es-CO')}
            >
              <option value="es-CO">Español de Colombia</option>
              <option value="es">Español</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="zona">Zona horaria</label>
            <input
              id="zona"
              value={timezone}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? 'zona-error' : 'zona-ayuda'}
              onChange={(event) => setTimezone(event.target.value)}
            />
            {error ? (
              <p id="zona-error" className="field-error" role="alert">
                {error}
              </p>
            ) : (
              <p id="zona-ayuda" className="hint">
                Formato IANA, por ejemplo America/Bogota.
              </p>
            )}
          </div>
        </div>
      </section>
      <section className="card settings-section" aria-labelledby="pref-apariencia">
        <h2 id="pref-apariencia">
          <Icon name="settings" /> Apariencia
        </h2>
        <div className="field">
          <label htmlFor="tema">Tema</label>
          <select
            id="tema"
            value={theme}
            aria-describedby="tema-ayuda"
            onChange={(event) => setTheme(event.target.value as PreferenceView['theme'])}
          >
            {themes.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
          <p id="tema-ayuda" className="hint">
            «Según el sistema» sigue el modo claro u oscuro de tu equipo.
          </p>
        </div>
        <div className="theme-preview" aria-hidden="true">
          <span className="swatch-card light">Claro</span>
          <span className="swatch-card dark">Oscuro</span>
        </div>
      </section>
      <div className="actions sticky-actions">
        <button type="submit" disabled={action.busy}>
          <Icon name="check" />
          Guardar preferencias
        </button>
        <button type="button" className="quiet" onClick={reload}>
          <Icon name="refresh" />
          Consultar preferencias
        </button>
      </div>
      <ActionStatus {...action} />
    </form>
  );
}
