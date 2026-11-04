import { RouteLink } from '../components/Shell';

export function RegistrationPage({ onNavigate }: { onNavigate: (path: string) => void }) {
  return (
    <div className="stack">
      <p className="notice">Registro cerrado. La demo no acepta cuentas nuevas.</p>
      <p>
        Las cuentas de prueba ya existen. El correo de esta demo lo recoge Ethereal y no llega a
        Gmail.
      </p>
      <p>No hay formulario de alta y no se envía ninguna solicitud.</p>
      <p>
        <RouteLink href="/acceso" onNavigate={onNavigate}>
          Volver al acceso
        </RouteLink>
      </p>
    </div>
  );
}
