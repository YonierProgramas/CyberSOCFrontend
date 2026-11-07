import { Icon } from '../components/Icon';
import { RouteLink } from '../components/Shell';

// El registro está cerrado por configuración (publicConfig: signupMode es literalmente
// «closed»). Esta pantalla no tiene formulario ni hace solicitudes: no simula altas.
export function RegistrationPage({ onNavigate }: { onNavigate: (path: string) => void }) {
  return (
    <div className="stack">
      <p className="notice">Registro cerrado. La demo no acepta cuentas nuevas.</p>
      <ol className="auth-steps">
        <li>
          <Icon name="user" />
          <span>
            <strong>Las cuentas de prueba ya existen.</strong> La demostración usa cuentas creadas
            de antemano.
          </span>
        </li>
        <li>
          <Icon name="info" />
          <span>
            <strong>El correo es de prueba.</strong> El correo de esta demo lo recoge Ethereal y no
            llega a Gmail.
          </span>
        </li>
        <li>
          <Icon name="privacy" />
          <span>
            <strong>Sin datos de más.</strong> No hay formulario de alta y no se envía ninguna
            solicitud.
          </span>
        </li>
      </ol>
      <RouteLink href="/acceso" onNavigate={onNavigate} className="button block">
        Volver al acceso
      </RouteLink>
    </div>
  );
}
