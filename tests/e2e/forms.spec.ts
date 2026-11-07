import { expect, test, login, openAccountPage } from './support';
test('acceso valida/focaliza, muestra clave y bloquea doble envío sin mensaje upstream', async ({
  page,
  mock,
}) => {
  let hits = 0;
  let release!: () => void;
  const pending = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route('**/auth/v1/token?grant_type=password', async (route) => {
    hits += 1;
    await pending;
    await route.fulfill({
      status: 400,
      contentType: 'application/json',
      body: JSON.stringify({ msg: 'SQL private upstream' }),
    });
  });
  await page.goto('/acceso');
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await expect(page.getByLabel('Correo')).toBeFocused();
  await expect(page.getByLabel('Correo')).toHaveAttribute('aria-invalid', 'true');
  await expect(page.getByLabel('Contraseña', { exact: true })).toHaveAttribute(
    'aria-invalid',
    'true',
  );
  await page.getByLabel('Correo').fill('a@example.invalid');
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await expect(page.getByLabel('Contraseña', { exact: true })).toBeFocused();
  await page.getByLabel('Contraseña', { exact: true }).fill('fake-password');
  await page.getByRole('button', { name: 'Mostrar contraseña' }).click();
  await expect(page.getByLabel('Contraseña', { exact: true })).toHaveAttribute('type', 'text');
  const box = await page.getByRole('button', { name: 'Entrar', exact: true }).boundingBox();
  if (!box) throw new Error('Falta el botón de acceso.');
  await page.mouse.dblclick(box.x + box.width / 2, box.y + box.height / 2);
  await expect.poll(() => hits).toBe(1);
  release();
  await expect(page.getByText('Correo o contraseña incorrectos.')).toBeVisible();
  await expect(page.locator('body')).not.toContainText('SQL private');
  expect(mock.requests.filter((item) => item.path.includes('password'))).toHaveLength(0);
  expect(hits).toBe(1);
});
test('registro cerrado no tiene formulario ni solicitudes', async ({ page, mock }) => {
  await page.goto('/registro');
  await expect(page.getByText('Registro cerrado. La demo no acepta cuentas nuevas.')).toBeVisible();
  await expect(page.locator('input')).toHaveCount(0);
  await expect(page.getByText('no llega a Gmail')).toBeVisible();
  expect(mock.requests).toHaveLength(0);
});
test('perfil inexistente abre creación y preferencias se guardan por API', async ({
  page,
  mock,
}) => {
  mock.setMissing(true);
  await page.goto('/acceso');
  await page.getByLabel('Correo').fill('a@example.invalid');
  await page.getByLabel('Contraseña', { exact: true }).fill('fake-password');
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await expect(page.getByText('Crea tu perfil para continuar.')).toBeVisible();
  await page.getByRole('link', { name: 'Crear mi perfil' }).click();
  await page.getByLabel('Nombre visible').fill('Perfil local');
  await page.getByRole('button', { name: 'Crear perfil' }).click();
  await expect(page.getByRole('button', { name: 'Guardar nombre' })).toBeVisible();
  await openAccountPage(page, 'Preferencias');
  await expect(page.getByLabel('Zona horaria')).toHaveValue('America/Bogota');
  await page.getByLabel('Tema', { exact: true }).selectOption('dark');
  await page.getByRole('button', { name: 'Guardar preferencias' }).click();
  await expect(page.getByText('Preferencias guardadas.')).toBeVisible();
  expect(mock.requests.find((item) => item.path === '/v1/me/preferences')?.body).toEqual({
    locale: 'es-CO',
    timezone: 'America/Bogota',
    theme: 'dark',
  });
});
test('consentimiento exige decisión explícita y retirada no lleva versión', async ({
  page,
  mock,
}) => {
  await login(page);
  await openAccountPage(page, 'Consentimientos');
  const section = page.getByRole('group', { name: 'Resúmenes de análisis' });
  await expect(section.getByRole('button', { name: 'Conceder' })).toBeDisabled();
  await section.getByRole('checkbox').check();
  await section.getByRole('button', { name: 'Conceder' }).click();
  await expect(section.getByText('Consentimiento vigente.', { exact: true })).toBeVisible();
  await section.getByRole('button', { name: 'Retirar' }).click();
  await expect(section.getByText('Sin consentimiento vigente.')).toBeVisible();
  expect(
    mock.requests
      .filter((item) => item.path === '/v1/me/consents/scan_summaries' && item.method === 'PUT')
      .map((item) => item.body),
  ).toEqual([{ granted: true, policyVersion: 'demo-v1' }, { granted: false }]);
});
test('release ausente: Instalador pendiente; equipo vacío real y recarga pide login', async ({
  page,
  mock,
}) => {
  mock.emptyDevices();
  await login(page);
  await page.getByRole('link', { name: 'Descarga', exact: true }).click();
  await expect(page.getByText('Instalador pendiente.', { exact: true })).toBeVisible();
  await expect(page.locator('a[href*="github.com"]')).toHaveCount(0);
  expect(mock.requests.filter((item) => item.path === '/v1/downloads')).toHaveLength(0);
  await page.getByRole('link', { name: 'Equipos', exact: true }).click();
  await expect(page.getByText('Todavía no hay equipos vinculados.')).toBeVisible();
  await page.reload();
  await expect(page).toHaveURL('/acceso');
});
test('solo POST válido muestra URL; no se visita ni descarga fixture', async ({ page, mock }) => {
  mock.setAvailable(true);
  await login(page);
  await page.getByRole('link', { name: 'Descarga', exact: true }).click();
  await expect(page.locator('a[href*="github.com"]')).toHaveCount(0);
  await page.getByRole('button', { name: 'Descargar', exact: true }).click();
  await expect(page.getByRole('link', { name: 'Obtener instalador 0.0.0-local' })).toHaveAttribute(
    'href',
    /github.com\/YonierProgramas\/CyberSOC\/releases\/download\//,
  );
  expect(mock.requests.filter((item) => item.path === '/v1/downloads')).toHaveLength(1);
  expect(mock.requests.filter((item) => item.path.includes('/consents'))).toHaveLength(0);
});
test('logout sin red limpia y otra cuenta no conserva datos de A', async ({ page, mock }) => {
  await login(page);
  await page.route('**/auth/v1/logout?scope=*', (route) => route.abort());
  await openAccountPage(page, 'Mi perfil');
  await page.getByRole('button', { name: 'Cerrar en todos los dispositivos' }).click();
  await expect(page).toHaveURL('/acceso');
  await expect(page.getByText('cierre remoto no confirmado')).toBeVisible();
  await page.getByLabel('Correo').fill('b@example.invalid');
  await page.getByLabel('Contraseña', { exact: true }).fill('fake-password');
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Hola, Cuenta B local' })).toBeVisible();
  await openAccountPage(page, 'Mi perfil');
  await expect(page.getByLabel('Nombre visible')).toHaveValue('Cuenta B local');
  expect(mock.requests.filter((item) => item.path.includes('password'))).toHaveLength(2);
  await expect(page.locator('body')).not.toContainText('Cuenta de ejemplo');
});
test('recuperación neutral y 429 obliga a esperar sin reenvío automático', async ({
  page,
  mock,
}) => {
  await page.goto('/recuperar');
  await page.getByLabel('Correo').fill('unknown@example.invalid');
  await page.getByRole('button', { name: 'Enviar enlace' }).click();
  await expect(page.getByText('Si el correo es válido, recibirás un mensaje.')).toBeVisible();
  await page.route('**/auth/v1/recover', (route) =>
    route.fulfill({
      status: 429,
      contentType: 'application/json',
      headers: { 'Retry-After': '60' },
      body: '{}',
    }),
  );
  await page.getByRole('button', { name: 'Enviar enlace' }).click();
  await expect(
    page.getByText('Demasiados intentos. Espera antes de volver a intentarlo.'),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: 'Enviar enlace' })).toBeDisabled();
  expect(mock.requests.filter((item) => item.path.includes('/recover'))).toHaveLength(1);
});
test('timeout simulado de mutación no repite ni afirma guardado', async ({ page, mock }) => {
  await login(page);
  await openAccountPage(page, 'Preferencias');
  await page.route('**/v1/me/preferences', (route) => route.abort());
  await page.getByRole('button', { name: 'Guardar preferencias' }).click();
  await expect(
    page.getByText(
      'No se pudo confirmar el resultado. No se repitió la acción. Consulta su estado.',
    ),
  ).toBeVisible();
  await expect(page.getByText('Preferencias guardadas.')).toHaveCount(0);
  expect(mock.requests.filter((item) => item.path.includes('/preferences'))).toHaveLength(0);
});
