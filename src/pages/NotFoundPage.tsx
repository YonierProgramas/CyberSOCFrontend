import { RouteLink } from '../components/Shell';
import { EmptyState } from '../components/ui';

export function NotFoundPage({ onNavigate }: { onNavigate: (path: string) => void }) {
  return (
    <EmptyState icon="alert" title="Esta pantalla no existe">
      <p>La dirección no corresponde a una pantalla del portal.</p>
      <div className="actions">
        <RouteLink href="/acceso" onNavigate={onNavigate} className="button">
          Ir al acceso
        </RouteLink>
        <RouteLink href="/" onNavigate={onNavigate} className="button ghost-light">
          Volver a la portada
        </RouteLink>
      </div>
    </EmptyState>
  );
}
