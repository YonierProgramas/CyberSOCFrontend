import { expect, test } from './support';
import type { CDPSession, Locator, Page } from 'playwright/test';
test.beforeEach(async ({ page }) => {
  await page.route('**/auth/v1/token?grant_type=password', (route) =>
    route.fulfill({ status: 400, contentType: 'application/json', body: '{}' }),
  );
});

const routes = ['/acceso', '/registro', '/recuperar', '/nueva-contrasena'];

test('la escala nativa de página al 200 % no es zoom CSS y no desborda', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  const session = await page.context().newCDPSession(page);
  await page.goto('/acceso');
  await expectScale(page, session);
  for (const path of routes) {
    await page.goto(path);
    await expectScale(page, session);
  }
  await showAccessErrors(page);
  await expectScale(page, session);
  await showRecoveryError(page);
  await expectScale(page, session);
  await openExampleDialog(page);
  await expectScale(page, session);
});

test('con la escala al 200 % se usan acceso, recuperación y el diálogo', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  const session = await page.context().newCDPSession(page);

  await page.goto('/acceso');
  await activateScale(page, session);
  await tabUntil(page, page.getByRole('button', { name: 'Entrar' }));
  await page.keyboard.press('Enter');
  await expect(page.locator('#correo')).toBeFocused();
  const emailError = page.getByRole('alert').filter({ hasText: 'Escribe un correo válido.' });
  const passwordError = page.getByRole('alert').filter({ hasText: 'Escribe la contraseña.' });
  await expect(page.locator('#correo')).toHaveAttribute('aria-invalid', 'true');
  await expect(page.locator('#clave')).toHaveAttribute('aria-invalid', 'true');
  await expectInView(page.locator('#correo'));
  await expectInView(emailError);
  await tabUntil(page, page.locator('#clave'));
  await expectInView(page.locator('#clave'));
  await expectInView(passwordError);
  for (const control of [
    page.getByRole('button', { name: 'Mostrar contraseña' }),
    page.getByRole('button', { name: 'Entrar' }),
    page.getByRole('link', { name: 'Olvidé mi contraseña' }),
    page.getByRole('link', { name: 'Crear una cuenta' }),
  ]) {
    await tabUntil(page, control);
    await expectInView(control);
  }

  await tabUntil(page, page.locator('#correo'));
  await page.keyboard.type('persona@example.com');
  await tabUntil(page, page.getByRole('button', { name: 'Mostrar contraseña' }));
  await page.keyboard.press('Enter');
  const hide = page.getByRole('button', { name: 'Ocultar contraseña' });
  await expect(hide).toBeFocused();
  await expect(hide).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#clave')).toHaveAttribute('type', 'text');
  await expectInView(hide);
  await tabUntil(page, page.getByRole('button', { name: 'Entrar' }));
  await page.keyboard.press('Enter');
  await expect(page.locator('#clave')).toBeFocused();
  await expect(page.locator('#correo')).toHaveAttribute('aria-invalid', 'false');
  await expectInView(passwordError);
  await page.keyboard.type('clave-de-ejemplo');
  await tabUntil(page, page.getByRole('button', { name: 'Entrar' }));
  await page.keyboard.press('Enter');
  const pending = page.getByRole('alert').filter({
    hasText: 'Correo o contraseña incorrectos.',
  });
  await expect(pending).toBeVisible();
  await expectInView(pending);

  await page.goto('/recuperar');
  await activateScale(page, session);
  await tabUntil(page, page.getByRole('button', { name: 'Enviar enlace' }));
  await page.keyboard.press('Enter');
  const recoveryError = page.getByRole('alert').filter({ hasText: 'Escribe un correo válido.' });
  await expect(page.locator('#correo-recuperar')).toBeFocused();
  await expectInView(page.locator('#correo-recuperar'));
  await expectInView(recoveryError);
  await page.keyboard.type('persona@example.com');
  await tabUntil(page, page.getByRole('button', { name: 'Enviar enlace' }));
  await page.keyboard.press('Enter');
  const neutral = page.getByText('Si el correo es válido, recibirás un mensaje.');
  await expect(neutral).toBeVisible();
  await expectInView(neutral);
  await tabUntil(page, page.getByRole('link', { name: 'Volver al acceso' }));
  await expectInView(page.getByRole('link', { name: 'Volver al acceso' }));

  await page.goto('/tests/harness/index.html');
  await activateScale(page, session);
  await tabUntil(page, page.getByRole('button', { name: 'Ver cuenta de ejemplo' }));
  await page.keyboard.press('Enter');
  await tabUntil(page, mainNav(page).getByRole('link', { name: 'Equipos' }));
  await page.keyboard.press('Enter');
  const remove = page.getByRole('button', { name: 'Revocar equipo' });
  await tabUntil(page, remove);
  await page.keyboard.press('Enter');
  const dialog = page.getByRole('dialog', { name: 'Revocar equipo' });
  const confirm = dialog.getByRole('button', { name: 'Revocar' });
  const cancel = dialog.getByRole('button', { name: 'Cancelar' });
  await expect(dialog).toBeVisible();
  await expect(confirm).toBeFocused();
  await expectInView(dialog);
  await expectInView(
    dialog.getByText(
      'Se revocará el acceso de Equipo de ejemplo. No se borran archivos del equipo.',
    ),
  );
  await page.keyboard.press('Shift+Tab');
  await expect(cancel).toBeFocused();
  await expectInView(cancel);
  await page.keyboard.press('Tab');
  await expect(confirm).toBeFocused();
  await expect(dialog).toBeVisible();
  await page.keyboard.press('Tab');
  await expect(cancel).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(dialog).toHaveCount(0);
  await expect(remove).toBeFocused();
  await expectInView(remove);
});

test('el ancho CSS de un zoom de navegador al 200 % no desborda', async ({ page }) => {
  await page.setViewportSize({ width: 640, height: 800 });
  for (const path of routes) {
    await page.goto(path);
    expect(await fits(page), path).toBe(true);
  }
  await showAccessErrors(page);
  expect(await fits(page)).toBe(true);
  await showRecoveryError(page);
  expect(await fits(page)).toBe(true);
  await openExampleDialog(page);
  expect(await fits(page)).toBe(true);
});

async function showAccessErrors(page: Page) {
  await page.goto('/acceso');
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page.getByText('Escribe la contraseña.')).toBeVisible();
}

async function showRecoveryError(page: Page) {
  await page.goto('/recuperar');
  await page.getByRole('button', { name: 'Enviar enlace' }).click();
  await expect(page.getByLabel('Correo')).toBeFocused();
}

async function openExampleDialog(page: Page) {
  await page.goto('/tests/harness/index.html');
  await page.getByRole('button', { name: 'Ver cuenta de ejemplo' }).click();
  // Por debajo de 62rem de ancho CSS los enlaces están tras el botón de menú.
  const toggle = page.getByRole('button', { name: 'Abrir menú' });
  if (await toggle.isVisible()) await toggle.click();
  await mainNav(page).getByRole('link', { name: 'Equipos' }).click();
  await page.getByRole('button', { name: 'Revocar equipo' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
}

async function activateScale(page: Page, session: CDPSession) {
  await session.send('Emulation.setPageScaleFactor', { pageScaleFactor: 2 });
  const scaled = await page.evaluate(() => ({
    scale: window.visualViewport?.scale ?? 1,
    cssZoom: getComputedStyle(document.documentElement).zoom,
  }));
  expect(scaled.scale).toBe(2);
  expect(scaled.cssZoom === '1' || scaled.cssZoom === 'normal').toBe(true);
}

async function tabUntil(page: Page, locator: Locator) {
  for (let step = 0; step < 25; step += 1) {
    const focused = await locator
      .evaluate((node) => node === document.activeElement)
      .catch(() => false);
    if (focused) return;
    await page.keyboard.press('Tab');
  }
  await expect(locator).toBeFocused();
}

async function expectInView(locator: Locator) {
  await expect(locator).toBeVisible();
  await expect
    .poll(() =>
      locator.evaluate((node) => {
        const viewport = window.visualViewport;
        if (!viewport || viewport.scale < 1.5) return false;
        const box = node.getBoundingClientRect();
        const slop = 2;
        return (
          box.width > 0 &&
          box.height > 0 &&
          box.left >= viewport.offsetLeft - slop &&
          box.top >= viewport.offsetTop - slop &&
          box.right <= viewport.offsetLeft + viewport.width + slop &&
          box.bottom <= viewport.offsetTop + viewport.height + slop
        );
      }),
    )
    .toBe(true);
}

async function expectScale(page: Page, session: CDPSession) {
  await session.send('Emulation.setPageScaleFactor', { pageScaleFactor: 2 });
  const scaled = await page.evaluate(() => ({
    scale: window.visualViewport?.scale ?? 1,
    cssZoom: getComputedStyle(document.documentElement).zoom,
  }));
  expect(scaled.scale).toBe(2);
  expect(scaled.cssZoom === '1' || scaled.cssZoom === 'normal').toBe(true);
  expect(await fits(page)).toBe(true);
}

async function fits(page: Page) {
  return page.evaluate(
    () => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1,
  );
}

// El pie de página repite la navegación: los enlaces de la barra se buscan dentro de ella.
function mainNav(page: Page) {
  return page.getByRole('navigation', { name: 'Principal' });
}
