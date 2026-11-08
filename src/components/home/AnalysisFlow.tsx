import { useId, useState } from 'react';
import { Icon, type IconName } from '../Icon';

// Recorrido real de un análisis en la aplicación de escritorio, en orden. Cada texto se
// contrastó con el código de CyberSOC (FileDiscovery, ScanQueue, motores Python, RiskPolicy y
// QuarantineManager). La pila LIFO solo recorre carpetas; la cuarentena usa identificadores.
type Stage = {
  icon: IconName;
  title: string;
  short: string;
  detail: string;
  points: string[];
};

const stages: Stage[] = [
  {
    icon: 'folder',
    title: 'Selección y descubrimiento',
    short: 'Eliges un archivo o una carpeta.',
    detail:
      'La aplicación te muestra el plan de escaneo y espera tu confirmación. Para recorrer las subcarpetas usa una pila (LIFO): explora primero la última carpeta encontrada, sin recursión.',
    points: [
      'Un conjunto de carpetas visitadas evita repetirlas.',
      'Los enlaces simbólicos y las uniones de carpetas no se siguen.',
    ],
  },
  {
    icon: 'queue',
    title: 'Cola FIFO',
    short: 'Cada archivo espera su turno.',
    detail:
      'Cada archivo encontrado entra en una cola acotada: el primero que entra es el primero que se analiza. Si la cola se llena, el recorrido espera a que el motor libere espacio.',
    points: ['Encolar y desencolar cuestan O(1).', 'La capacidad fija evita llenar la memoria.'],
  },
  {
    icon: 'fingerprint',
    title: 'Firmas SHA-256',
    short: 'Se compara su huella digital.',
    detail:
      'El motor calcula la huella SHA-256 del archivo y la busca en un diccionario de firmas conocidas, donde la huella es la clave.',
    points: [
      'Buscar una clave cuesta O(1) en promedio.',
      'Una coincidencia exacta identifica un archivo ya conocido.',
    ],
  },
  {
    icon: 'pulse',
    title: 'Heurística y reglas',
    short: 'Se buscan señales de riesgo.',
    detail:
      'Además de las firmas, el motor revisa el tipo real del archivo por sus primeros bytes, reglas de patrones, la entropía de los bytes, la estructura de los ejecutables y el contenido de los scripts.',
    points: [
      'Cada capa aporta señales con su explicación.',
      'Un nombre como «factura.pdf.exe» no engaña al tipo real.',
    ],
  },
  {
    icon: 'gauge',
    title: 'Resultado',
    short: 'La política de riesgo decide.',
    detail:
      'La política de riesgo combina las señales de todas las capas y asigna un resultado. La inteligencia artificial nunca decide el veredicto.',
    points: ['Sin hallazgos', 'Sospechoso', 'Detectado', 'No analizado, si no se pudo leer'],
  },
  {
    icon: 'vault',
    title: 'Cuarentena',
    short: 'Tú confirmas antes de apartar.',
    detail:
      'Si decides apartar un archivo, la aplicación pide tu confirmación, lo guarda cifrado en su bóveda y lo identifica con un código propio. Restaurarlo también exige confirmación.',
    points: [
      'El archivo no se borra: se puede restaurar.',
      'Si algo falla durante el traslado, el original se conserva.',
    ],
  },
];

export function AnalysisFlow() {
  const [active, setActive] = useState(0);
  const base = useId();
  const stage = stages[active]!;
  return (
    <div className="flow">
      <ol className="flow-steps">
        {stages.map((item, index) => (
          <li key={item.title} className={index === active ? 'flow-step active' : 'flow-step'}>
            <button
              type="button"
              aria-current={index === active ? 'step' : undefined}
              aria-controls={`${base}-detalle`}
              onClick={() => setActive(index)}
            >
              <span className="flow-index" aria-hidden="true">
                {index + 1}
              </span>
              <span className="flow-icon">
                <Icon name={item.icon} />
              </span>
              <span className="flow-text">
                <span className="flow-title">{item.title}</span>
                <span className="flow-short">{item.short}</span>
              </span>
            </button>
          </li>
        ))}
      </ol>
      <div
        id={`${base}-detalle`}
        className="flow-detail"
        role="region"
        aria-live="polite"
        aria-label={`Etapa ${active + 1}: ${stage.title}`}
      >
        <div className="flow-detail-art" aria-hidden="true">
          <span className="flow-detail-ring" />
          <Icon name={stage.icon} />
        </div>
        <div className="flow-detail-copy" key={stage.title}>
          <p className="flow-detail-kicker">
            Etapa {active + 1} de {stages.length}
          </p>
          <h3>{stage.title}</h3>
          <p>{stage.detail}</p>
          <ul className={active === 4 ? 'flow-points verdicts' : 'flow-points'}>
            {stage.points.map((point, index) => (
              <li key={point} className={active === 4 ? `verdict verdict-${index}` : undefined}>
                {active === 4 ? null : <Icon name="check" />}
                {point}
              </li>
            ))}
          </ul>
          <div className="flow-nav">
            <button
              type="button"
              className="quiet"
              disabled={active === 0}
              onClick={() => setActive((value) => Math.max(0, value - 1))}
            >
              Etapa anterior
            </button>
            <button
              type="button"
              className="quiet"
              disabled={active === stages.length - 1}
              onClick={() => setActive((value) => Math.min(stages.length - 1, value + 1))}
            >
              Etapa siguiente
              <Icon name="arrow" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
