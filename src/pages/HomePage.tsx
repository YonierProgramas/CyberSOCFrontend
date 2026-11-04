import type { ReactNode } from 'react';
import { RouteLink } from '../components/Shell';

export function HomePage({
  onNavigate,
  extra,
}: {
  onNavigate: (path: string) => void;
  extra?: ReactNode;
}) {
  return (
    <div className="stack">
      <p>
        Portal de la demo cerrada: entrar, revisar la cuenta y descargar el instalador de Windows
        cuando exista.
      </p>
      <p>
        El análisis de archivos se hace en la aplicación de escritorio. Esta página no muestra
        resultados, gráficas ni porcentajes.
      </p>
      <p>
        <RouteLink href="/acceso" onNavigate={onNavigate}>
          Entrar
        </RouteLink>
      </p>
      {extra}
    </div>
  );
}
