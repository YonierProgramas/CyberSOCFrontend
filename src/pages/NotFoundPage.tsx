import { RouteLink } from '../components/Shell';

export function NotFoundPage({ onNavigate }: { onNavigate: (path: string) => void }) {
  return (
    <div className="stack">
      <p>La dirección no corresponde a una pantalla del portal.</p>
      <p>
        <RouteLink href="/acceso" onNavigate={onNavigate}>
          Ir al acceso
        </RouteLink>
      </p>
    </div>
  );
}
