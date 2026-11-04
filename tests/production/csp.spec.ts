import { test, expect, login } from '../e2e/support';
import path from 'node:path';
test('build real con CSP A7: rutas directas, Auth/API por fetch, sin violaciones ni fixtures', async ({
  page,
  mock,
}) => {
  const errors: string[] = [];
  const evidence = process.env.S9D_EVIDENCE_DIR;
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    // Chrome informa el 503 esperado de la fixture de release; no es una violación CSP.
    const expectedRelease =
      message.text() ===
        'Failed to load resource: the server responded with a status of 503 (Service Unavailable)' &&
      message.location().url.includes('/v1/releases/latest?platform=windows-x64');
    if (message.type() === 'error' && !expectedRelease) errors.push(message.text());
  });
  for (const route of [
    '/acceso',
    '/registro',
    '/recuperar',
    '/auth/confirm',
    '/nueva-contrasena',
    '/cuenta',
    '/cuenta/preferencias',
    '/cuenta/consentimientos',
    '/cuenta/descarga',
    '/cuenta/equipos',
    '/no-existe',
  ]) {
    const response = await page.goto(route);
    expect(response?.status()).toBe(200);
    const headers = response?.headers() ?? {};
    expect(headers['content-security-policy']).toContain("script-src 'self'; style-src 'self'");
    expect(headers['content-security-policy']).not.toContain('unsafe-inline');
    expect(headers['referrer-policy']).toBe('no-referrer');
    await expect(page.locator('h1')).toBeVisible();
  }
  await login(page);
  await expect(page.getByLabel('Nombre visible')).toHaveValue('Cuenta de ejemplo');
  if (evidence)
    await page.screenshot({
      path: path.join(evidence, '01-cuenta-escritorio.png'),
      fullPage: true,
    });
  await page.getByRole('link', { name: 'Consentimientos', exact: true }).click();
  await expect(page.getByRole('group')).toHaveCount(2);
  for (const width of [360, 640, 1280]) {
    await page.setViewportSize({ width, height: 800 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1,
      ),
    ).toBe(true);
  }
  if (evidence) {
    await page.setViewportSize({ width: 360, height: 800 });
    await page.screenshot({
      path: path.join(evidence, '02-consentimientos-360.png'),
      fullPage: true,
    });
  }
  await page.getByRole('link', { name: 'Descarga', exact: true }).click();
  await expect(page.getByText('Instalador pendiente.', { exact: true })).toBeVisible();
  await expect(page.locator('a[href*="github.com"]')).toHaveCount(0);
  if (evidence)
    await page.screenshot({
      path: path.join(evidence, '03-instalador-pendiente.png'),
      fullPage: true,
    });
  mock.emptyDevices();
  await page.getByRole('link', { name: 'Equipos', exact: true }).click();
  await expect(page.getByText('Todavía no hay equipos vinculados.')).toBeVisible();
  await page.reload();
  await expect(page).toHaveURL('/acceso');
  await page.goto('/auth/confirm?token_hash=abcdefghijklmnopqrst&type=signup');
  await expect(page).toHaveURL('/cuenta');
  await page.goto('/auth/confirm?token_hash=abcdefghijklmnopqrst&type=recovery');
  await expect(page).toHaveURL('/nueva-contrasena');
  expect(
    mock.requests
      .filter((request) => request.path === '/auth/v1/verify')
      .map((request) => request.body),
  ).toEqual([
    { type: 'signup', token_hash: 'abcdefghijklmnopqrst' },
    { type: 'recovery', token_hash: 'abcdefghijklmnopqrst' },
  ]);
  expect(errors).toEqual([]);
  // La fixture se entrega desde el interceptor; no está dentro de assets de producción.
  expect(mock.requests.some((request) => request.path === '/v1/me')).toBe(true);
});
