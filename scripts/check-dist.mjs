import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..', 'dist');
const banned = [
  'TEST_USER',
  'sb_secret',
  'service_role',
  'ETHEREAL',
  'eyJ',
  'Ejemplo de interfaz',
  'Equipo de ejemplo',
  'Cuenta de ejemplo',
  '100 % protegido',
  '100% protegido',
  'fake-access-',
  'fake-refresh-',
  'fixture.exe',
  '@example.invalid',
  '.env.ops.local',
  'VITE_UI_FIXTURES',
];
const files = await walk(root);
let failed = false;
for (const file of files) {
  const text = await readFile(file, 'utf8');
  for (const word of banned) {
    if (text.includes(word)) {
      console.error(`dist contiene «${word}» en ${path.relative(root, file)}`);
      failed = true;
    }
  }
}
if (files.length === 0) {
  console.error('dist está vacío');
  failed = true;
}
if (failed) process.exit(1);
console.log(`dist revisado: ${files.length} archivos, sin ejemplos ni secretos`);

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(full)));
    else files.push(full);
  }
  return files;
}
