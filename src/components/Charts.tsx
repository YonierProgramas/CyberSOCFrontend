// Gráficos en SVG propio: sin librerías nuevas (ADR-009) y sin estilos en línea (CSP).
// Cada gráfico lleva su tabla con las mismas cifras (guía visual S7, decisión 5) y un
// nombre accesible; el color nunca es la única pista porque cada valor tiene su etiqueta.

export type Tone = 'ok' | 'warn' | 'danger' | 'muted' | 'accent';
export type Datum = { label: string; value: number; tone?: Tone };

function DataTable({ caption, data, unit }: { caption: string; data: Datum[]; unit: string }) {
  return (
    <details className="chart-table">
      <summary>Ver tabla</summary>
      <table>
        <caption>{caption}</caption>
        <thead>
          <tr>
            <th scope="col">Categoría</th>
            <th scope="col">{unit}</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item) => (
            <tr key={item.label}>
              <th scope="row">{item.label}</th>
              <td>{item.value.toLocaleString('es-CO')}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </details>
  );
}

// Barras verticales. La altura se escala al máximo de la serie; un cero es un hueco.
export function BarChart({
  title,
  data,
  unit,
  wide = false,
}: {
  title: string;
  data: Datum[];
  unit: string;
  wide?: boolean;
}) {
  const max = Math.max(1, ...data.map((item) => item.value));
  // En una tarjeta ancha el lienzo es más ancho para no dejar las barras en el centro.
  const width = wide ? 680 : 320;
  const height = 150;
  const slot = width / data.length;
  const bar = Math.min(wide ? 44 : 28, slot * 0.6);
  return (
    <figure className="chart">
      <svg
        viewBox={`0 0 ${width} ${height + 34}`}
        role="img"
        aria-label={`${title}: ${data.map((d) => `${d.label} ${d.value}`).join(', ')}`}
      >
        {[0.25, 0.5, 0.75, 1].map((step) => (
          <line
            key={step}
            className="chart-gridline"
            x1="0"
            x2={width}
            y1={height - height * step}
            y2={height - height * step}
          />
        ))}
        {data.map((item, index) => {
          const h = (item.value / max) * (height - 18);
          const x = index * slot + (slot - bar) / 2;
          return (
            <g key={item.label}>
              <rect
                className={`chart-bar tone-${item.tone ?? 'accent'}`}
                x={x}
                y={height - h}
                width={bar}
                height={h}
                rx="4"
              />
              <text className="chart-value" x={x + bar / 2} y={height - h - 5} textAnchor="middle">
                {item.value}
              </text>
              <text className="chart-label" x={x + bar / 2} y={height + 20} textAnchor="middle">
                {item.label}
              </text>
            </g>
          );
        })}
      </svg>
      <DataTable caption={title} data={data} unit={unit} />
    </figure>
  );
}

// Anillo de distribución con leyenda de cantidades y porcentajes (nunca con total cero).
export function DonutChart({ title, data, unit }: { title: string; data: Datum[]; unit: string }) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;
  return (
    <figure className="chart chart-donut">
      <div className="donut-wrap">
        <svg
          viewBox="0 0 140 140"
          role="img"
          aria-label={`${title}: ${data.map((d) => `${d.label} ${d.value}`).join(', ')}`}
        >
          <circle className="donut-track" cx="70" cy="70" r={radius} />
          {total > 0
            ? data.map((item) => {
                const length = (item.value / total) * circumference;
                const segment = (
                  <circle
                    key={item.label}
                    className={`donut-segment tone-${item.tone ?? 'accent'}`}
                    cx="70"
                    cy="70"
                    r={radius}
                    strokeDasharray={`${length} ${circumference - length}`}
                    strokeDashoffset={-offset}
                    transform="rotate(-90 70 70)"
                  />
                );
                offset += length;
                return segment;
              })
            : null}
          <text className="donut-total" x="70" y="68" textAnchor="middle">
            {total.toLocaleString('es-CO')}
          </text>
          <text className="donut-caption" x="70" y="86" textAnchor="middle">
            {unit.toLowerCase()}
          </text>
        </svg>
        <ul className="legend">
          {data.map((item) => (
            <li key={item.label}>
              <span className={`swatch tone-${item.tone ?? 'accent'}`} aria-hidden="true" />
              <span className="legend-label">{item.label}</span>
              <span className="legend-value">
                {item.value.toLocaleString('es-CO')}
                {total > 0 ? ` · ${((item.value / total) * 100).toFixed(1)} %` : ''}
              </span>
            </li>
          ))}
        </ul>
      </div>
      <DataTable caption={title} data={data} unit={unit} />
    </figure>
  );
}

// Barras horizontales para comparar categorías con nombres largos.
export function HBarChart({ title, data, unit }: { title: string; data: Datum[]; unit: string }) {
  const max = Math.max(1, ...data.map((item) => item.value));
  return (
    <figure className="chart">
      <svg
        viewBox={`0 0 320 ${data.length * 34}`}
        role="img"
        aria-label={`${title}: ${data.map((d) => `${d.label} ${d.value}`).join(', ')}`}
      >
        {data.map((item, index) => {
          const y = index * 34;
          const w = (item.value / max) * 190;
          return (
            <g key={item.label}>
              <text className="chart-label" x="0" y={y + 20}>
                {item.label}
              </text>
              <rect className="hbar-track" x="104" y={y + 8} width="190" height="16" rx="8" />
              <rect
                className={`chart-bar tone-${item.tone ?? 'accent'}`}
                x="104"
                y={y + 8}
                width={w}
                height="16"
                rx="8"
              />
              <text className="chart-value" x="316" y={y + 21} textAnchor="end">
                {item.value}
              </text>
            </g>
          );
        })}
      </svg>
      <DataTable caption={title} data={data} unit={unit} />
    </figure>
  );
}
