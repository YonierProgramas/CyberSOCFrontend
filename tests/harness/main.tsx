import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from '../../src/app/App';
import { createPortalRuntime } from '../../src/app/runtime';
import { config, fakeServer } from '../fixtures/network';
import { presentation } from '../fixtures/presentation';
import '../../src/styles/global.css';
if (window.location.pathname !== '/') window.history.replaceState({}, '', '/');
const server = fakeServer();
const runtime = createPortalRuntime(config, server.fetcher);
function navigate(path: string) {
  window.history.pushState({}, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
}
const root = document.getElementById('root');
if (!root) throw new Error('Falta el contenedor de pruebas.');
createRoot(root).render(
  <StrictMode>
    <App
      runtime={runtime}
      homeExtra={
        <div className="stack">
          <p className="notice">{presentation.banner}</p>
          <div className="actions">
            <button
              type="button"
              onClick={() => {
                void runtime.session
                  .signIn('a@example.invalid', 'fake-password')
                  .then(() => navigate('/cuenta'));
              }}
            >
              Ver cuenta de ejemplo
            </button>
            <button
              type="button"
              onClick={() => {
                void runtime.session
                  .verify({ type: 'recovery', tokenHash: 'abcdefghijklmnopqrst' })
                  .then(() => navigate('/nueva-contrasena'));
              }}
            >
              Ver nueva contraseña de ejemplo
            </button>
          </div>
        </div>
      }
    />
  </StrictMode>,
);
