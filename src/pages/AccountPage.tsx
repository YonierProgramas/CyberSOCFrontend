import { useRef, useState } from 'react';
import { useAction, usePortal, useResource } from '../app/portal';
import { profileSchema, type Me } from '../api/schemas';
import { FormField } from '../components/FormField';
import { ActionStatus, ResourceStatus } from '../components/AsyncState';
const links = [
  ['/cuenta', 'Resumen'],
  ['/cuenta/preferencias', 'Preferencias'],
  ['/cuenta/consentimientos', 'Consentimientos'],
  ['/cuenta/descarga', 'Descarga'],
  ['/cuenta/equipos', 'Equipos'],
] as const;
export function AccountNav({
  path,
  onNavigate,
}: {
  path: string;
  onNavigate: (path: string) => void;
}) {
  return (
    <nav aria-label="Cuenta" className="subnav">
      {links.map(([href, label]) => (
        <a
          key={href}
          href={href}
          aria-current={path === href ? 'page' : undefined}
          onClick={(event) => {
            if (
              event.metaKey ||
              event.ctrlKey ||
              event.shiftKey ||
              event.altKey ||
              event.button !== 0
            )
              return;
            event.preventDefault();
            onNavigate(href);
          }}
        >
          {label}
        </a>
      ))}
    </nav>
  );
}
export function AccountPage() {
  const { api, session } = usePortal();
  const resource = useResource(api.loadMe);
  const missing =
    resource.state.status === 'error' && resource.state.error.code === 'PROFILE_NOT_FOUND';
  return (
    <div className="stack">
      {missing ? (
        <p className="notice">Crea tu perfil para continuar.</p>
      ) : (
        <ResourceStatus {...resource} />
      )}
      {resource.state.status === 'ready' || missing ? (
        <ProfileForm
          key={resource.state.status}
          me={resource.state.status === 'ready' ? resource.state.data : null}
          reload={resource.reload}
        />
      ) : null}
      <div className="actions">
        <button
          type="button"
          className="quiet"
          onClick={() => {
            void session.logout('local');
          }}
        >
          Cerrar en esta pestaña
        </button>
        <button
          type="button"
          className="quiet"
          onClick={() => {
            void session.logout('global');
          }}
        >
          Cerrar en todos los dispositivos
        </button>
      </div>
      <p>
        La memoria se borra incluso sin red. Un acceso copiado puede seguir válido en el servidor
        hasta su vencimiento, hasta una hora con la configuración de la demo.
      </p>
    </div>
  );
}
function ProfileForm({ me, reload }: { me: Me | null; reload: () => void }) {
  const { api } = usePortal();
  const [name, setName] = useState(me?.profile.displayName ?? '');
  const [error, setError] = useState('');
  const ref = useRef<HTMLInputElement>(null);
  const action = useAction();
  return (
    <form
      className="stack"
      onSubmit={(event) => {
        event.preventDefault();
        if (!profileSchema.safeParse({ displayName: name }).success) {
          setError('El nombre debe tener entre 1 y 100 caracteres, sin controles.');
          ref.current?.focus();
          return;
        }
        setError('');
        void action.run(async () => {
          await api.saveProfile({ displayName: name });
          action.setMessage('Nombre guardado.');
          reload();
        });
      }}
    >
      <FormField
        id="nombre"
        label="Nombre visible"
        type="text"
        autoComplete="nickname"
        value={name}
        error={error}
        inputRef={ref}
        onChange={setName}
      />
      <button type="submit" disabled={action.busy}>
        {me ? 'Guardar nombre' : 'Crear perfil'}
      </button>
      <ActionStatus {...action} />
      <button type="button" className="quiet" onClick={reload}>
        Consultar perfil
      </button>
    </form>
  );
}
