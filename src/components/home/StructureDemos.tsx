import { useState } from 'react';
import { Icon } from '../Icon';

// Explicaciones interactivas de las tres estructuras centrales del antivirus. Son modelos
// visuales de pocos elementos para la portada: no ejecutan análisis ni muestran resultados.
// Las versiones reales están en CyberSOC: Queue.ts (cola circular), FileDiscovery.ts (pila del
// recorrido en profundidad) y signature_engine.py (dict de firmas por SHA-256).

const MAX_ITEMS = 5;
type Block = { id: number; name: string };

// Huecos libres que se dibujan para mostrar la capacidad fija (cola y pila acotadas).
function emptySlots(used: number): string[] {
  return Array.from({ length: MAX_ITEMS - used }, (_, index) => `libre-${index}`);
}

// ---------------------------------------------------------------------------------------------
// Cola FIFO. Invariante: el elemento de la posición 0 es el que lleva más tiempo esperando y
// siempre es el siguiente en salir. En la app real la cola es circular: encolar y desencolar
// cuestan O(1). Aquí, con un máximo de 5 elementos, un arreglo con slice basta para dibujarla
// (desencolar con slice es O(n), pero n ≤ 5 y el estado de React debe ser inmutable).
// Nombres cortos: caben en las cinco casillas incluso a 360 px.
const queuePool = ['nota.txt', 'run.ps1', 'clip.mp4', 'hoja.xls', 'guia.doc'];

function QueueDemo() {
  // Cada bloque lleva un id estable: solo se anima el que entra.
  const [items, setItems] = useState<Block[]>([
    { id: -3, name: 'doc.pdf' },
    { id: -2, name: 'app.exe' },
    { id: -1, name: 'foto.jpg' },
  ]);
  const [next, setNext] = useState(0);
  const [status, setStatus] = useState('Pulsa Desencolar: sale el primero que entró.');
  function enqueue() {
    if (items.length >= MAX_ITEMS) return;
    const name = queuePool[next % queuePool.length]!;
    setItems([...items, { id: next, name }]); // entra por el final
    setNext(next + 1);
    setStatus(`${name} entra al final de la cola.`);
  }
  function dequeue() {
    const first = items[0];
    if (first === undefined) return;
    setItems(items.slice(1)); // sale por el frente
    setStatus(`${first.name} sale hacia el motor: era el primero en la cola.`);
  }
  return (
    <article className="structure-card">
      <header>
        <span className="structure-icon">
          <Icon name="queue" />
        </span>
        <div>
          <h3>Cola FIFO</h3>
          <p className="structure-rule">Primero en entrar, primero en salir</p>
        </div>
      </header>
      <p>Ordena los archivos pendientes: el motor los analiza en orden de llegada.</p>
      <div className="queue-viz" aria-hidden="true">
        <div className="viz-ends">
          <span>Frente · sale</span>
          <span>Final · entra</span>
        </div>
        <ol className="queue-lane">
          {items.map((item, index) => (
            <li key={item.id} className={index === 0 ? 'viz-block first' : 'viz-block'}>
              <Icon name="file" />
              {item.name}
            </li>
          ))}
          {emptySlots(items.length).map((slot) => (
            <li key={slot} className="viz-slot" />
          ))}
        </ol>
        <p className="viz-capacity">
          Capacidad {MAX_ITEMS} · {items.length} en espera
        </p>
      </div>
      <p className="viz-status" role="status">
        {status}
      </p>
      <div className="viz-actions">
        <button
          type="button"
          className="quiet"
          onClick={enqueue}
          disabled={items.length >= MAX_ITEMS}
        >
          Encolar
        </button>
        <button type="button" className="quiet" onClick={dequeue} disabled={items.length === 0}>
          Desencolar
        </button>
      </div>
      <p className="structure-cost">Encolar O(1) · Desencolar O(1)</p>
    </article>
  );
}

// ---------------------------------------------------------------------------------------------
// Pila LIFO. Invariante: el último elemento del arreglo es el tope y siempre es el siguiente en
// salir. push y pop sobre el final de un arreglo cuestan O(1) (amortizado al crecer). La app la
// usa para recorrer carpetas en profundidad (DFS) sin recursión; no tiene relación con la
// cuarentena.
const stackPool = ['Descargas\\fotos', 'Documentos\\clase', 'Descargas\\juegos', 'Música'];

function StackDemo() {
  const [items, setItems] = useState<Block[]>([
    { id: -2, name: 'Documentos' },
    { id: -1, name: 'Descargas' },
  ]);
  const [next, setNext] = useState(0);
  const [status, setStatus] = useState('Pulsa Desapilar: sale la última carpeta que entró.');
  function push() {
    if (items.length >= MAX_ITEMS) return;
    const name = stackPool[next % stackPool.length]!;
    setItems([...items, { id: next, name }]); // push: queda en el tope
    setNext(next + 1);
    setStatus(`Apilar: ${name} queda en el tope.`);
  }
  function pop() {
    const top = items[items.length - 1];
    if (top === undefined) return;
    setItems(items.slice(0, -1)); // pop: sale el tope
    setStatus(`Desapilar: se explora ${top.name}, la última en entrar.`);
  }
  // Se dibuja de arriba abajo empezando por el tope.
  const fromTop = [...items].reverse();
  return (
    <article className="structure-card">
      <header>
        <span className="structure-icon">
          <Icon name="layers" />
        </span>
        <div>
          <h3>Pila LIFO</h3>
          <p className="structure-rule">Último en entrar, primero en salir</p>
        </div>
      </header>
      <p>Recorre las carpetas en profundidad: siempre explora primero la última encontrada.</p>
      <div className="stack-viz" aria-hidden="true">
        <ol className="stack-column">
          {emptySlots(items.length).map((slot) => (
            <li key={slot} className="viz-slot" />
          ))}
          {fromTop.map((item, index) => (
            <li key={item.id} className={index === 0 ? 'viz-block top' : 'viz-block'}>
              <Icon name="folder" />
              {item.name}
              {index === 0 ? <span className="viz-tag">Tope</span> : null}
            </li>
          ))}
        </ol>
      </div>
      <p className="viz-status" role="status">
        {status}
      </p>
      <div className="viz-actions">
        <button type="button" className="quiet" onClick={push} disabled={items.length >= MAX_ITEMS}>
          Apilar (push)
        </button>
        <button type="button" className="quiet" onClick={pop} disabled={items.length === 0}>
          Desapilar (pop)
        </button>
      </div>
      <p className="structure-cost">push O(1) · pop O(1)</p>
    </article>
  );
}

// ---------------------------------------------------------------------------------------------
// Diccionario de firmas. Invariante: cada huella SHA-256 aparece una sola vez como clave.
// Buscar con get cuesta O(1) en promedio, sin importar cuántas firmas haya. Las huellas de
// abajo están abreviadas e inventadas para la explicación: no son firmas reales.
const signatures = new Map<string, string>([
  ['4be1…c9a2', 'Descargador conocido'],
  ['9d07…11fe', 'Script malicioso conocido'],
  ['e3a0…7b54', 'Ejecutable alterado conocido'],
]);
const samples = [
  { name: 'factura.pdf.exe', hash: 'e3a0…7b54' },
  { name: 'vacaciones.jpg', hash: '51c8…0d3e' },
  { name: 'macro.ps1', hash: '9d07…11fe' },
];

function DictionaryDemo() {
  const [selected, setSelected] = useState<number | null>(null);
  const sample = selected === null ? null : samples[selected]!;
  const match = sample ? signatures.get(sample.hash) : undefined; // O(1) promedio
  return (
    <article className="structure-card">
      <header>
        <span className="structure-icon">
          <Icon name="key" />
        </span>
        <div>
          <h3>Diccionario de firmas</h3>
          <p className="structure-rule">Clave: huella SHA-256 · Valor: firma</p>
        </div>
      </header>
      <p>Busca la huella del archivo directamente por su clave, sin recorrer toda la lista.</p>
      <div className="viz-actions" role="group" aria-label="Archivo para consultar">
        {samples.map((item, index) => (
          <button
            key={item.name}
            type="button"
            className={selected === index ? 'chip-button selected' : 'chip-button'}
            aria-pressed={selected === index}
            onClick={() => setSelected(index)}
          >
            {item.name}
          </button>
        ))}
      </div>
      <div className="dict-viz" aria-hidden="true">
        <div className="dict-query">
          <Icon name="hash" />
          {sample ? <code>{sample.hash}</code> : <span>Elige un archivo</span>}
        </div>
        <ul className="dict-table">
          {[...signatures].map(([hash, label]) => (
            <li key={hash} className={sample?.hash === hash ? 'hit' : undefined}>
              <code>{hash}</code>
              <span>{label}</span>
            </li>
          ))}
        </ul>
      </div>
      <p className="viz-status" role="status">
        {sample
          ? match
            ? `${sample.name}: la huella coincide con «${match}».`
            : `${sample.name}: la huella no está en el diccionario; siguen las demás capas.`
          : 'Elige un archivo para buscar su huella.'}
      </p>
      <p className="structure-cost">Buscar O(1) promedio · Huellas abreviadas e ilustrativas</p>
    </article>
  );
}

export function StructureDemos() {
  return (
    <div className="structures-grid">
      <QueueDemo />
      <StackDemo />
      <DictionaryDemo />
    </div>
  );
}
