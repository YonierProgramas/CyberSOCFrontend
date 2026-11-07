import { test, expect, login, clickNav, openAccountPage } from './support';
import { me } from '../fixtures/network';

test('AUD-04: StrictMode deduplica; abandonar Descarga cancela espera sin más retries', async ({
  page,
}) => {
  let hits = 0;
  await page.route('**/v1/releases/latest?*', async (route) => {
    hits += 1;
    await route.fulfill({
      status: 503,
      contentType: 'application/json',
      body: JSON.stringify({
        error: { code: 'UPSTREAM_UNAVAILABLE', message: 'Fixture', requestId: me().userId },
      }),
    });
  });
  await login(page);
  await expect.poll(() => hits).toBe(1); // El panel de Claude también consulta la versión.
  await clickNav(page, 'Equipos');
  await clickNav(page, 'Descarga');
  await expect.poll(() => hits).toBe(2);
  await clickNav(page, 'Equipos');
  const departed = hits;
  await page.waitForTimeout(7600); // Supera las dos esperas 2+5 s del cliente.
  expect(hits).toBe(departed);
  await clickNav(page, 'Descarga');
  await expect.poll(() => hits).toBe(3);
  await clickNav(page, 'Equipos');
});

test('AUD-05: tema de Claude guarda, recupera, sigue sistema y se limpia al salir', async ({
  page,
}) => {
  let theme: 'system' | 'light' | 'dark' = 'system';
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.route('**/v1/me', (route) =>
    route.fulfill({ json: { ...me(), preferences: { ...me().preferences, theme } } }),
  );
  await page.route('**/v1/me/preferences', async (route) => {
    theme = route.request().postDataJSON().theme;
    await route.fulfill({ json: { ...me().preferences, theme } });
  });
  await page.emulateMedia({ colorScheme: 'light' });
  await login(page);
  await openAccountPage(page, 'Preferencias');
  for (const next of ['dark', 'light', 'system'] as const) {
    await page.getByLabel('Tema', { exact: true }).selectOption(next);
    await page.getByRole('button', { name: 'Guardar preferencias', exact: true }).click();
    await expect(page.getByText('Preferencias guardadas.', { exact: true })).toBeVisible();
    await expect
      .poll(() => page.evaluate(() => document.documentElement.dataset.theme ?? 'system'))
      .toBe(next);
    await expect
      .poll(() => page.evaluate(() => getComputedStyle(document.documentElement).colorScheme))
      .toBe(next === 'system' ? 'light' : next);
  }
  await page.emulateMedia({ colorScheme: 'dark' });
  await expect
    .poll(() => page.evaluate(() => getComputedStyle(document.documentElement).colorScheme))
    .toBe('dark');
  await page.getByLabel('Tema', { exact: true }).selectOption('light');
  await page.getByRole('button', { name: 'Guardar preferencias', exact: true }).click();
  await expect
    .poll(() => page.evaluate(() => document.documentElement.dataset.theme))
    .toBe('light');
  await clickNav(page, 'Equipos');
  await expect
    .poll(() => page.evaluate(() => getComputedStyle(document.documentElement).colorScheme))
    .toBe('light');
  await page.getByRole('button', { name: 'Salir', exact: true }).click();
  await expect
    .poll(() => page.evaluate(() => document.documentElement.dataset.theme ?? 'system'))
    .toBe('system');
  await login(page);
  await expect
    .poll(() => page.evaluate(() => document.documentElement.dataset.theme))
    .toBe('light');
  await expect(page.getByRole('contentinfo')).toBeVisible();
  expect(errors).toEqual([]);
});
