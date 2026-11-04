import { expect, test } from './support';
test('StrictMode verifica signup una vez y limpia antes de la red', async ({ page }) => {
  let requests = 0;
  await page.route('**/auth/v1/verify', async (route) => {
    requests += 1;
    expect(new URL(page.url()).search).toBe('');
    expect(new URL(page.url()).hash).toBe('');
    expect(route.request().postDataJSON()).toEqual({
      type: 'signup',
      token_hash: 'abcdefghijklmnopqrst',
    });
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        access_token: 'fake-access-confirm',
        refresh_token: 'fake-refresh-confirm',
        expires_in: 3600,
        user: { id: '11111111-1111-4111-8111-111111111111' },
      }),
    });
  });
  await page.goto('/auth/confirm?token_hash=abcdefghijklmnopqrst&type=signup');
  await expect(page).toHaveURL('/cuenta');
  await expect(page.getByLabel('Nombre visible')).toBeVisible();
  await expect(page.locator('body')).not.toContainText('abcdefghijklmnopqrst');
  expect(requests).toBe(1);
});
test('recovery conduce a contraseña; guardar cierra sesión; recarga no recupera privilegio', async ({
  page,
  mock,
}) => {
  await page.goto('/auth/confirm?type=recovery&token_hash=abcdefghijklmnopqrst');
  await expect(page).toHaveURL('/nueva-contrasena');
  await page.getByLabel('Nueva contraseña', { exact: true }).fill('new-fake-password');
  await page.getByRole('button', { name: 'Guardar contraseña' }).click();
  await expect(page).toHaveURL('/acceso');
  await expect(
    page.getByText('Contraseña actualizada. Entra con la nueva contraseña.'),
  ).toBeVisible();
  expect(mock.requests.filter((item) => item.path === '/auth/v1/verify')).toHaveLength(1);
  expect(mock.requests.filter((item) => item.path === '/auth/v1/user')).toHaveLength(1);
  await page.goto('/nueva-contrasena');
  await expect(
    page.getByText('Pide un enlace nuevo. Visitar esta página no abre una sesión.'),
  ).toBeVisible();
});
test('enlace usado tiene error fijo sin reutilización; duplicados e implícito no verifican', async ({
  page,
}) => {
  let requests = 0;
  await page.route('**/auth/v1/verify', async (route) => {
    requests += 1;
    await route.fulfill({
      status: 403,
      contentType: 'application/json',
      body: '{"msg":"private SQL"}',
    });
  });
  await page.goto('/auth/confirm?type=signup&token_hash=abcdefghijklmnopqrst');
  await expect(page.getByText('El enlace venció o ya se usó. Pide uno nuevo.')).toBeVisible();
  expect(requests).toBe(1);
  await page.getByRole('link', { name: 'Volver al acceso', exact: true }).click();
  await page.goBack();
  await expect(page.getByText('El enlace venció o ya se usó. Pide uno nuevo.')).toBeVisible();
  expect(requests).toBe(1);
  for (const url of [
    '/auth/confirm?type=signup&type=signup&token_hash=abcdefghijklmnopqrst',
    '/auth/confirm?type=email&token_hash=abcdefghijklmnopqrst',
    '/auth/confirm#access_token=fake',
  ]) {
    await page.goto(url);
    await expect(page).toHaveURL('/auth/confirm');
    await expect(page.getByText('El enlace venció o ya se usó. Pide uno nuevo.')).toBeVisible();
  }
  expect(requests).toBe(1);
  await expect(page.locator('body')).not.toContainText('private SQL');
});
