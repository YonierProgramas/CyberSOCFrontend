import { useId, useState } from 'react';
import { Icon, type IconName } from '../Icon';

// Capturas reales de la aplicación de Electron, tomadas en la validación del candidato S11
// (construccion/sprints/sprint-11-distribucion/evidencias/11A-candidato: 92, 95 y 72b).
// Solo se recortó la parte inferior para quitar el puntero; no se editó el contenido.
const shots: { id: string; label: string; src: string; alt: string; text: string }[] = [
  {
    id: 'resumen',
    label: 'Resumen',
    src: '/capturas/escritorio-resumen.webp',
    alt: 'Pantalla Resumen de la aplicación de escritorio: análisis en curso, último análisis completado y actividad de siete días.',
    text: 'La pantalla de inicio resume el análisis en curso, el último completado y la actividad de los últimos siete días. Las cifras salen de los análisis guardados en tu equipo.',
  },
  {
    id: 'escaneo',
    label: 'Escaneo',
    src: '/capturas/escritorio-escaneo.webp',
    alt: 'Pantalla Analizar archivos: botones para escanear una carpeta o un archivo y elección del perfil automático por zona o personalizado.',
    text: 'Eliges una carpeta o un archivo y el perfil: automático según la zona (por ejemplo, Descargas) o personalizado. El análisis se puede cancelar en cualquier momento.',
  },
  {
    id: 'historial',
    label: 'Historial y asistente',
    src: '/capturas/escritorio-historial-asistente.webp',
    alt: 'Pantalla de análisis guardados con filtros por estado, fecha y veredicto, junto al panel del asistente con preguntas sugeridas.',
    text: 'El historial guarda cada análisis con filtros por estado, fechas, veredicto y riesgo. El asistente se abre al lado; sin una clave, avisa que la IA no está configurada.',
  },
];

const highlights: { icon: IconName; title: string; text: string }[] = [
  { icon: 'scan', title: 'Escaneo', text: 'Archivo o carpeta, con perfiles por zona.' },
  { icon: 'history', title: 'Historial', text: 'Análisis guardados en SQLite local.' },
  { icon: 'vault', title: 'Cuarentena', text: 'Aislar y restaurar con confirmación.' },
  { icon: 'chat', title: 'Asistente', text: 'Explica resultados si configuras Claude.' },
];

export function DesktopShowcase() {
  const [current, setCurrent] = useState(0);
  const caption = useId();
  const shot = shots[current]!;
  return (
    <div className="showcase">
      <div className="showcase-stage">
        <div className="showcase-tabs" role="group" aria-label="Pantalla de la aplicación">
          {shots.map((item, index) => (
            <button
              key={item.id}
              type="button"
              className={index === current ? 'chip-button selected' : 'chip-button'}
              aria-pressed={index === current}
              onClick={() => setCurrent(index)}
            >
              {item.label}
            </button>
          ))}
        </div>
        <figure className="showcase-frame" aria-describedby={caption}>
          <img
            key={shot.id}
            src={shot.src}
            alt={shot.alt}
            width={886}
            height={500}
            loading="lazy"
            decoding="async"
          />
        </figure>
      </div>
      <div className="showcase-copy">
        <p className="showcase-kicker">
          <Icon name="window" />
          Captura real · Windows
        </p>
        <h3>{shot.label}</h3>
        <p id={caption} aria-live="polite">
          {shot.text}
        </p>
        <ul className="showcase-highlights">
          {highlights.map((item) => (
            <li key={item.title}>
              <span className="mini-icon">
                <Icon name={item.icon} />
              </span>
              <span>
                <strong>{item.title}</strong>
                {item.text}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
