import { useId } from 'react';

// Composición original de la portada: los archivos entran por la izquierda, el motor los
// revisa por capas alrededor del escudo (firmas, reglas, heurística) y salen por dos caminos:
// «Sin hallazgos» o «Cuarentena». Es un esquema del recorrido, no muestra cifras ni datos.
// Sin estilos en línea (la CSP solo admite style-src 'self'): colores y animaciones viven en
// home.css; las animaciones SMIL de los puntos se ocultan con prefers-reduced-motion.
const inputLane = 'M24 214 H196';
const toClean = 'M368 214 C410 214 410 128 452 128';
const toVault = 'M368 214 C410 214 410 300 452 300';

function FileGlyph({ className }: { className: string }) {
  return (
    <g className={`ha-file ${className}`}>
      <path d="M0 0h16l8 8v22H0z" className="ha-file-body" />
      <path d="M16 0v8h8" className="ha-file-fold" />
      <path d="M5 15h14M5 20h14M5 25h9" className="ha-file-lines" />
    </g>
  );
}

function Chip({ x, y, width, label }: { x: number; y: number; width: number; label: string }) {
  return (
    <g className="ha-chip" transform={`translate(${x} ${y})`}>
      <rect width={width} height="28" rx="14" />
      <circle cx="15" cy="14" r="4" className="ha-chip-dot" />
      <text x="26" y="18.5">
        {label}
      </text>
    </g>
  );
}

export function HeroArt() {
  const clip = useId();
  return (
    <svg
      className="hero-svg"
      viewBox="0 0 520 430"
      role="img"
      aria-label="Esquema del análisis: los archivos entran al motor, que los revisa por capas (firmas, reglas y heurística) y los separa en sin hallazgos o cuarentena."
    >
      <defs>
        <clipPath id={clip}>
          <path d="M290 132 236 156v40c0 35 22.5 57 54 64 31.5-7 54-29 54-64v-40z" />
        </clipPath>
      </defs>

      {/* Trazas tecnológicas discretas. */}
      <g className="ha-trace">
        <path d="M30 44h70l22 22h40" />
        <path d="M40 372h90l22-22h36" />
        <path d="M150 20h80l16 16h28" />
        <path d="M240 410h60l14-14h30" />
        <circle cx="30" cy="44" r="3" />
        <circle cx="40" cy="372" r="3" />
        <circle cx="150" cy="20" r="3" />
        <circle cx="240" cy="410" r="3" />
      </g>

      {/* Entrada: carril de archivos. */}
      <path d={inputLane} className="ha-lane" />
      <FileGlyph className="ha-file-1" />
      <FileGlyph className="ha-file-2" />
      <FileGlyph className="ha-file-3" />

      {/* Capas de análisis alrededor del motor. */}
      <circle cx="290" cy="200" r="132" className="ha-ring ha-ring-outer" />
      <circle cx="290" cy="200" r="104" className="ha-ring ha-ring-mid" />
      <circle cx="290" cy="200" r="78" className="ha-ring ha-ring-inner" />
      <g className="ha-orbit">
        <circle cx="290" cy="68" r="5" className="ha-node" />
        <circle cx="404" cy="266" r="5" className="ha-node" />
        <circle cx="176" cy="266" r="5" className="ha-node" />
      </g>

      {/* Escudo central con una línea de inspección recortada a su forma. */}
      <path
        d="M290 122 228 150v46c0 40 26 66 62 74 36-8 62-34 62-74v-46z"
        className="ha-shield-outer"
      />
      <path
        d="M290 132 236 156v40c0 35 22.5 57 54 64 31.5-7 54-29 54-64v-40z"
        className="ha-shield-inner"
      />
      <g clipPath={`url(#${clip})`}>
        <rect x="230" y="130" width="120" height="3" className="ha-scan" />
      </g>
      <path d="m266 196 16 16 32-32" className="ha-shield-check" />

      {/* Salidas: sin hallazgos arriba, cuarentena abajo. */}
      <path d={toClean} className="ha-lane ha-lane-ok" />
      <path d={toVault} className="ha-lane ha-lane-warn" />
      <g className="ha-pulses">
        <circle r="4" className="ha-pulse ha-pulse-in">
          <animateMotion dur="3.2s" repeatCount="indefinite" path={inputLane} />
        </circle>
        <circle r="4" className="ha-pulse ha-pulse-ok">
          <animateMotion dur="2.8s" begin="0.6s" repeatCount="indefinite" path={toClean} />
        </circle>
        <circle r="4" className="ha-pulse ha-pulse-warn">
          <animateMotion dur="2.8s" begin="2s" repeatCount="indefinite" path={toVault} />
        </circle>
      </g>
      <g className="ha-out ha-out-ok" transform="translate(452 128)">
        <circle r="20" />
        <path d="m-8 0 5 5 11-11" />
      </g>
      <g className="ha-out ha-out-warn" transform="translate(452 300)">
        <rect x="-18" y="-16" width="36" height="32" rx="6" />
        <circle r="7" />
        <path d="M0-3v6" />
      </g>

      <Chip x={52} y={88} width={146} label="Firmas SHA-256" />
      <Chip x={92} y={300} width={110} label="Heurística" />
      <Chip x={300} y={22} width={88} label="Reglas" />
      <Chip x={396} y={72} width={122} label="Sin hallazgos" />
      <Chip x={398} y={334} width={112} label="Cuarentena" />
    </svg>
  );
}
