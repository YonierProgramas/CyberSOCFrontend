import { test, expect, login } from './support';
import { device } from '../fixtures/network';
test('K10: siguiente conserva cursor/límite, caducado exige reinicio, revocación confirma y devuelve foco', async ({
  page,
}) => {
  const cursor = 'c1.' + 'a'.repeat(43);
  const queries: string[] = [];
  await page.route('**/v1/devices?*', async (route) => {
    const url = new URL(route.request().url());
    queries.push(url.search);
    if (url.searchParams.has('cursor')) {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: '{"error":{"code":"INVALID_CURSOR","message":"private","requestId":"11111111-1111-4111-8111-111111111111"}}',
      });
    } else
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ items: [device], nextCursor: cursor }),
      });
  });
  await login(page);
  await page.getByRole('link', { name: 'Equipos', exact: true }).click();
  await page.getByRole('button', { name: 'Siguiente', exact: true }).click();
  await expect(page.getByText('La lista caducó. Reiníciala para continuar.')).toBeVisible();
  expect(queries.at(-1)).toBe('?limit=20&cursor=' + cursor);
  await page.getByRole('button', { name: 'Reiniciar lista' }).click();
  await expect(page.getByRole('heading', { name: 'Equipo de ejemplo' })).toBeVisible();
  await page.getByRole('button', { name: 'Revocar equipo', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByRole('button', { name: 'Revocar', exact: true })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Revocar equipo', exact: true })).toBeFocused();
});
test('429 de lectura no se salta al pulsar reiniciar y no genera bucle', async ({ page }) => {
  let hits = 0;
  await page.route('**/v1/devices?*', async (route) => {
    hits += 1;
    await route.fulfill({
      status: 429,
      contentType: 'application/json',
      headers: { 'Retry-After': '60' },
      body: '{"error":{"code":"RATE_LIMITED","message":"private","requestId":"11111111-1111-4111-8111-111111111111"}}',
    });
  });
  await login(page);
  await page.getByRole('link', { name: 'Equipos', exact: true }).click();
  await expect(
    page.getByText('Demasiados intentos. Espera antes de volver a intentarlo.'),
  ).toBeVisible();
  const before = hits;
  await expect(page.getByRole('button', { name: 'Consultar de nuevo' })).toBeDisabled();
  await page.getByRole('button', { name: 'Reiniciar lista' }).click();
  await expect(
    page.getByText('Demasiados intentos. Espera antes de volver a intentarlo.'),
  ).toBeVisible();
  expect(hits).toBe(before);
});
