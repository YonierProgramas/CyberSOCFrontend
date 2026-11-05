import { expect, login, test } from './support';
import type { Page } from 'playwright/test';

function watch(page: Page): string[] {
  const hits: string[] = [];
  page.on('request', (request) => {
    const url = request.url();
    if (url.startsWith('http://127.0.0.1') || url.startsWith('ws://127.0.0.1')) return;
    hits.push(url);
  });
  return hits;
}

test('recorre las pantallas públicas sin salir del equipo', async ({ page }) => {
  const hits = watch(page);
  for (const path of ['/', '/acceso', '/registro', '/recuperar', '/nueva-contrasena']) {
    await page.goto(path);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  }
  await page.goto('/no-existe?next=https://evil.example');
  await expect(page.getByRole('heading', { name: 'Página no encontrada' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Ir al acceso' })).toHaveAttribute('href', '/acceso');
  await expect(page.locator('[role=tab]')).toHaveCount(0);
  expect(hits).toEqual([]);
});

test('marca la página actual y vuelve atrás', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Acceso' }).click();
  await expect(
    page.getByRole('navigation', { name: 'Principal' }).getByRole('link', { name: 'Acceso' }),
  ).toHaveAttribute('aria-current', 'page');
  await page.goBack();
  await expect(page.getByRole('heading', { name: 'CyberSOC Defender' })).toBeVisible();
  await page.goForward();
  await expect(page).toHaveURL('/acceso');
});

test('el salto de teclado lleva el foco al contenido', async ({ page }) => {
  await page.goto('/acceso');
  await expect(page.locator('main#contenido')).toHaveCount(1);
  await page.getByRole('heading', { name: 'Acceso' }).focus();
  for (let step = 0; step < 5; step += 1) await page.keyboard.press('Shift+Tab');
  await expect(page.getByRole('link', { name: 'Saltar al contenido' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('main#contenido')).toBeFocused();
  await expect(page.locator('header :focus')).toHaveCount(0);
});

test('cabe en 360 px en los recorridos públicos, el error y el diálogo', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  for (const path of ['/acceso', '/registro', '/recuperar', '/nueva-contrasena']) {
    await page.goto(path);
    expect(await fits(page)).toBe(true);
  }
  await page.goto('/acceso');
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page.getByText('Escribe la contraseña.')).toBeVisible();
  expect(await fits(page)).toBe(true);
  await page.goto('/recuperar');
  await page.getByRole('button', { name: 'Enviar enlace' }).click();
  await expect(page.getByLabel('Correo')).toBeFocused();
  expect(await fits(page)).toBe(true);
  await page.goto('/tests/harness/index.html');
  await page.getByRole('button', { name: 'Ver cuenta de ejemplo' }).click();
  await page.getByRole('link', { name: 'Equipos' }).click();
  await page.getByRole('button', { name: 'Revocar equipo' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  expect(await fits(page)).toBe(true);
});

test('el zoom CSS 200 % no desborda el acceso', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/acceso');
  await page.evaluate(() => {
    document.documentElement.style.zoom = '2';
  });
  expect(await fits(page)).toBe(true);
});

test('con sesión la barra no ofrece Acceso ni Registro y Salir cierra la sesión', async ({
  page,
}) => {
  await login(page);
  const nav = page.getByRole('navigation', { name: 'Principal' });
  await expect(nav.getByRole('link')).toHaveText(['Inicio', 'Cuenta']);
  await page.getByRole('button', { name: 'Salir' }).click();
  await expect(page).toHaveURL('/acceso');
  await expect(nav.getByRole('link')).toHaveText(['Inicio', 'Registro', 'Acceso']);
  await expect(page.getByRole('button', { name: 'Salir' })).toHaveCount(0);
});

test('con sesión, Registro y Acceso del historial llevan a la cuenta', async ({ page }) => {
  await page.goto('/registro');
  await page
    .getByRole('navigation', { name: 'Principal' })
    .getByRole('link', { name: 'Acceso' })
    .click();
  await page.getByLabel('Correo', { exact: true }).fill('a@example.invalid');
  await page.getByLabel('Contraseña', { exact: true }).fill('fake-password');
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await expect(page).toHaveURL('/cuenta');
  // Al entrar, Acceso se reemplaza en el historial: atrás ya no muestra el formulario.
  await page.goBack();
  await expect(page).toHaveURL('/cuenta');
  await expect(page.getByRole('heading', { level: 1, name: 'Tu cuenta' })).toBeVisible();
  await expect(page.getByText('Registro cerrado. La demo no acepta cuentas nuevas.')).toHaveCount(
    0,
  );
  await expect(page.getByLabel('Correo', { exact: true })).toHaveCount(0);
});

async function fits(page: Page): Promise<boolean> {
  return page.evaluate(
    () => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1,
  );
}
