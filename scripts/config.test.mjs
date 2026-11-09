import { access, readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { test } from 'node:test';
import assert from 'node:assert/strict';

const root = path.resolve(import.meta.dirname, '..');

test('el ejemplo público no trae secretos', async () => {
  const example = await readFile(path.join(root, '.env.example'), 'utf8');
  for (const name of [
    'VITE_API_BASE_URL',
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_PUBLISHABLE_KEY',
    'VITE_SIGNUP_MODE',
    'VITE_CONFIRM_SIGNUP_TYPE',
  ]) {
    assert.match(example, new RegExp(`^${name}=`, 'm'));
  }
  assert.equal(example.includes('sb_secret'), false);
  assert.equal(example.includes('TEST_USER'), false);
  assert.equal(example.includes('ETHEREAL'), false);
  assert.equal(example.includes('ANTHROPIC'), false);
  assert.match(example, /VITE_SIGNUP_MODE=open/);
});

test('las versiones elegidas no usan rangos', async () => {
  const pkg = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'));
  const expected = {
    react: '19.3.1',
    'react-dom': '19.3.1',
    zod: '4.6.7',
    typescript: '5.9.3',
    vite: '7.3.7',
    '@vitejs/plugin-react': '5.2.0',
    '@types/react': '19.3.0',
    '@types/react-dom': '19.3.0',
    '@types/node': '24.19.0',
    eslint: '10.11.0',
    'typescript-eslint': '8.71.0',
    'eslint-plugin-react-hooks': '7.1.1',
    prettier: '3.9.9',
    vitest: '4.1.11',
    playwright: '1.63.0',
  };
  const all = { ...pkg.dependencies, ...pkg.devDependencies };
  assert.deepEqual(all, expected);
});

test('el código no persiste sesión ni incorpora fixtures o transportes alternos', async () => {
  const files = await walk(path.join(root, 'src'));
  const source = (await Promise.all(files.map(async (file) => readFile(file, 'utf8')))).join('\n');
  for (const word of [
    'localStorage',
    'sessionStorage',
    'document.cookie',
    'indexedDB',
    'tests/fixtures',
    'XMLHttpRequest',
    'WebSocket',
    'VITE_UI_FIXTURES',
  ]) {
    assert.equal(source.includes(word), false, word);
  }
});

test('Pages conserva CSP A7 exacta y rutas SPA, sin relajar scripts o estilos', async () => {
  const headers = await readFile(path.join(root, 'public/_headers'), 'utf8');
  assert.match(
    headers,
    /connect-src 'self' https:\/\/cybersocbackend.onrender.com https:\/\/cgvjthwobrlzmhmzuuvg.supabase.co;/,
  );
  for (const value of [
    "script-src 'self'",
    "style-src 'self'",
    "frame-ancestors 'none'",
    "base-uri 'none'",
    "form-action 'self'",
    'Referrer-Policy: no-referrer',
    'X-Content-Type-Options: nosniff',
    'camera=(), microphone=(), geolocation=()',
  ])
    assert.ok(headers.includes(value));
  assert.equal(headers.includes('unsafe-inline'), false);
  // Pages usa su fallback SPA al no existir 404.html; no interceptar los assets con /*.
  await assert.rejects(access(path.join(root, 'public/404.html')), { code: 'ENOENT' });
  await assert.rejects(access(path.join(root, 'public/_redirects')), { code: 'ENOENT' });
});

test('git ignora entornos reales y conserva el ejemplo', async () => {
  const ignore = await readFile(path.join(root, '.gitignore'), 'utf8');
  assert.match(ignore, /^\.env\.\*$/m);
  assert.match(ignore, /^!\.env\.example$/m);
});

test('confirmación configurada, verificación y destino derivan de la constante signup única', async () => {
  const paths = [
    'config/publicConfig.ts',
    'auth/authClient.ts',
    'auth/confirmFlow.ts',
    'pages/ConfirmPage.tsx',
  ];
  const source = await Promise.all(
    paths.map((file) => readFile(path.join(root, 'src', file), 'utf8')),
  );
  assert.equal(source.join('\n').match(/CONFIRM_SIGNUP_TYPE\s*=/g)?.length, 1);
  assert.ok(source[0].includes("CONFIRM_SIGNUP_TYPE = 'signup'"));
  for (const part of source.slice(1)) assert.ok(part.includes('CONFIRM_SIGNUP_TYPE'));
  assert.ok(source[1].includes('type: input.type'));
  assert.ok(source[3].includes("state.type === 'recovery'"));
});

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(full)));
    else if (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) files.push(full);
  }
  return files;
}
