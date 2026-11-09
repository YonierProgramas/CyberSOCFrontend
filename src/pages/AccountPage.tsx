import { useEffect, useRef, useState } from 'react';
import { useAction, usePortal, useResource } from '../app/portal';
import { applyTheme } from '../app/theme';
import { profileSchema, type Me } from '../api/schemas';
import { FormField } from '../components/FormField';
import { ActionStatus, ResourceStatus } from '../components/AsyncState';
import { Icon } from '../components/Icon';
import { RouteLink } from '../components/Shell';
import { Badge, formatDate, initials } from '../components/ui';

export function AccountPage({ onNavigate }: { onNavigate: (path: string) => void }) {
  const { api, session } = usePortal();
  const resource = useResource(api.loadMe);
  const missing =
    resource.state.status === 'error' && resource.state.error.code === 'PROFILE_NOT_FOUND';
  const me = resource.state.status === 'ready' ? resource.state.data : null;
  const theme = me?.preferences.theme ?? null;
  useEffect(() => {
    if (theme) applyTheme(theme);
  }, [theme]);
  return (
    <div className="page-grid">
      {me ? (
        <section className="card profile-head" aria-label="Datos de la cuenta">
          <span className="avatar" aria-hidden="true">
            {initials(me.profile.displayName)}
          </span>
          <div className="profile-id">
            <p className="profile-name">{me.profile.displayName}</p>
            {me.email ? <p className="muted">{me.email}</p> : null}
            <p className="muted">Cuenta creada el {formatDate(me.profile.createdAt)}</p>
          </div>
          <div className="profile-badges">
            <Badge tone="ok">Sesión activa</Badge>
            <Badge tone="accent">Proyecto académico</Badge>
          </div>
        </section>
      ) : missing ? (
        <p className="callout tone-warn">
          <Icon name="info" />
          <span>Crea tu perfil para continuar.</span>
        </p>
      ) : (
        <ResourceStatus {...resource} />
      )}
      <div className="two-col">
        {me || missing ? (
          <section className="card" aria-labelledby="perfil-nombre">
            <h2 id="perfil-nombre">
              <Icon name="user" /> Tu nombre en el portal
            </h2>
            <p className="muted">
              Es el nombre con el que te saluda el portal. No se comparte con otros usuarios.
            </p>
            <ProfileForm key={resource.state.status} me={me} reload={resource.reload} />
          </section>
        ) : null}
        <section className="card" aria-labelledby="perfil-sesion">
          <h2 id="perfil-sesion">
            <Icon name="lock" /> Sesión y seguridad
          </h2>
          <p className="muted">
            La sesión vive solo en esta pestaña y se cierra tras 30 minutos sin actividad.
          </p>
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
              className="quiet danger"
              onClick={() => {
                void session.logout('global');
              }}
            >
              Cerrar en todos los dispositivos
            </button>
          </div>
          <p className="callout tone-muted">
            <Icon name="info" />
            <span>
              La memoria se borra incluso sin red. Un acceso copiado puede seguir válido en el
              servidor hasta su vencimiento, hasta una hora con la configuración de la demo.
            </span>
          </p>
          <p className="muted">
            ¿Quieres cambiar el tema o revisar tus permisos?{' '}
            <RouteLink href="/cuenta/preferencias" onNavigate={onNavigate}>
              Ir a ajustes
            </RouteLink>
          </p>
        </section>
      </div>
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
      className="stack bare"
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
      <div className="actions">
        <button type="submit" disabled={action.busy}>
          {me ? 'Guardar nombre' : 'Crear perfil'}
        </button>
        <button type="button" className="quiet" onClick={reload}>
          Consultar perfil
        </button>
      </div>
      <ActionStatus {...action} />
    </form>
  );
}
