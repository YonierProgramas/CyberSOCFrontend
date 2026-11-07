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
  // En 360 px los enlaces están plegados tras el botón de menú.
  const toggle = page.getByRole('button', { name: 'Abrir menú' });
  await expect(page.getByRole('link', { name: 'Equipos' })).toBeHidden();
  await toggle.click();
  await expect(page.getByRole('button', { name: 'Cerrar menú' })).toHaveAttribute(
    'aria-expanded',
    'true',
  );
  expect(await fits(page)).toBe(true);
  await page.getByRole('link', { name: 'Equipos' }).click();
  await expect(page.getByRole('button', { name: 'Abrir menú' })).toHaveAttribute(
    'aria-expanded',
    'false',
  );
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
  // Una sola barra: sin el segundo menú de pestañas bajo el título.
  await expect(nav.getByRole('link')).toHaveText(['Inicio', 'Descarga', 'Equipos']);
  await expect(page.getByRole('navigation', { name: 'Cuenta' })).toHaveCount(0);
  await expect(nav.getByRole('link', { name: 'Inicio' })).toHaveAttribute('aria-current', 'page');
  await expect(page.getByRole('link', { name: 'Ir a la descarga' })).toHaveAttribute(
    'href',
    '/cuenta/descarga',
  );
  await expect(page.getByRole('link', { name: 'Entrar' })).toHaveCount(0);
  // «Mi cuenta» se abre, se cierra con Escape devolviendo el foco y lleva a sus páginas.
  const account = page.getByRole('button', { name: 'Mi cuenta' });
  await account.click();
  await expect(account).toHaveAttribute('aria-expanded', 'true');
  await page.keyboard.press('Escape');
  await expect(account).toHaveAttribute('aria-expanded', 'false');
  await expect(account).toBeFocused();
  await account.click();
  await page.getByRole('link', { name: 'Preferencias', exact: true }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Preferencias' })).toBeVisible();
  await expect(account).toHaveAttribute('aria-expanded', 'false');
  await page.getByRole('button', { name: 'Salir' }).click();
  await expect(nav.getByRole('link')).toHaveText(['Inicio', 'Registro', 'Acceso']);
  await expect(page.getByRole('button', { name: 'Salir' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Mi cuenta' })).toHaveCount(0);
});

test('el tema oscuro guardado en la cuenta se aplica y Salir vuelve al del sistema', async ({
  page,
}) => {
  await login(page);
  await page.getByRole('button', { name: 'Mi cuenta' }).click();
  await page.getByRole('link', { name: 'Preferencias', exact: true }).click();
  await page.getByLabel('Tema', { exact: true }).selectOption('dark');
  await page.getByRole('button', { name: 'Guardar preferencias' }).click();
  await expect(page.getByText('Preferencias guardadas.')).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  const background = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  expect(background).toBe('rgb(11, 18, 32)');
  await page.getByRole('button', { name: 'Salir' }).click();
  await expect(page.locator('html')).not.toHaveAttribute('data-theme', /.+/);
});

test('con sesión, Registro y Acceso del historial llevan al panel', async ({ page }) => {
  await page.goto('/registro');
  await page
    .getByRole('navigation', { name: 'Principal' })
    .getByRole('link', { name: 'Acceso' })
    .click();
  await page.getByLabel('Correo', { exact: true }).fill('a@example.invalid');
  await page.getByLabel('Contraseña', { exact: true }).fill('fake-password');
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await expect(page).toHaveURL('/');
  // Al entrar, Acceso se reemplaza en el historial: atrás ya no muestra el formulario.
  await page.goBack();
  await expect(page).toHaveURL('/');
  await expect(page.getByRole('heading', { level: 1, name: /^Hola, / })).toBeVisible();
  await expect(page.getByText('Registro cerrado. La demo no acepta cuentas nuevas.')).toHaveCount(
    0,
  );
  await expect(page.getByLabel('Correo', { exact: true })).toHaveCount(0);
});

test('la portada informa y cabe en 360 px sin recuadro en el título', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await page.goto('/');
  const title = page.getByRole('heading', { level: 1, name: 'CyberSOC Defender' });
  await expect(title).toBeFocused();
  expect(await title.evaluate((node) => getComputedStyle(node).outlineStyle)).toBe('none');
  await expect(page.getByRole('heading', { level: 2 })).toHaveText([
    'Qué hace la aplicación',
    'Cómo empezar',
    'El portal no ve tus archivos',
  ]);
  await expect(page.getByRole('link', { name: 'Entrar' })).toHaveAttribute('href', '/acceso');
  expect(await fits(page)).toBe(true);
  await page.setViewportSize({ width: 1280, height: 800 });
  expect(await fits(page)).toBe(true);
});

async function fits(page: Page): Promise<boolean> {
  return page.evaluate(
    () => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1,
  );
}
