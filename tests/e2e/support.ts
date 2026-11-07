import { test as base, expect, type Page } from 'playwright/test';
import { fakeServer } from '../fixtures/network';
export const test = base.extend<{ mock: ReturnType<typeof fakeServer> }>({
  mock: [
    async ({ page }, use) => {
      const mock = fakeServer();
      await page.route('https://**/*', async (route) => {
        const request = route.request();
        const url = new URL(request.url());
        if (
          !['cybersocbackend.onrender.com', 'cgvjthwobrlzmhmzuuvg.supabase.co'].includes(
            url.hostname,
          )
        ) {
          await route.abort();
          return;
        }
        const response = await mock.fetcher(request.url(), {
          method: request.method(),
          headers: request.headers(),
          ...(request.postData() ? { body: request.postData()! } : {}),
        });
        await route.fulfill({
          status: response.status,
          headers: Object.fromEntries(response.headers),
          body: await response.text(),
        });
      });
      await use(mock);
    },
    { auto: true },
  ],
});
export { expect };
export async function login(page: Page, email = 'a@example.invalid') {
  await page.goto('/acceso');
  await page.getByLabel('Correo', { exact: true }).fill(email);
  await page.getByLabel('Contraseña', { exact: true }).fill('fake-password');
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  // Tras entrar se llega al panel de Inicio.
  await expect(page).toHaveURL('/');
  await expect(page.getByRole('heading', { level: 1, name: /^Hola, / })).toBeVisible();
}

// Enlace de la barra principal. En pantallas estrechas está tras el botón de menú.
export async function clickNav(page: Page, name: string) {
  const toggle = page.getByRole('button', { name: 'Abrir menú' });
  if (await toggle.isVisible()) await toggle.click();
  await page
    .getByRole('navigation', { name: 'Principal' })
    .getByRole('link', { name, exact: true })
    .click();
}

// Mi perfil, Preferencias y Consentimientos están dentro del menú «Mi cuenta».
export async function openAccountPage(page: Page, label: string) {
  await page.getByRole('button', { name: 'Mi cuenta' }).click();
  await page.getByRole('link', { name: label, exact: true }).click();
}
