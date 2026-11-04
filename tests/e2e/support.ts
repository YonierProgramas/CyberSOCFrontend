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
  await expect(page).toHaveURL('/cuenta');
  await expect(page.getByLabel('Nombre visible')).toBeVisible();
}
