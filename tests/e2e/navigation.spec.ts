import { expect, login, test } from './support';
import type { Page } from 'playwright/test';

// Barra sin sesión: Inicio, las cinco páginas informativas, Registro y Acceso.
const guestNav = [
  'Inicio',
  'Cómo funciona',
  'Tecnología',
  'Estructuras',
  'Aplicación',
  'Preguntas',
  'Registro',
  'Acceso',
];

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
  for (const path of [
    '/',
    '/como-funciona',
    '/tecnologia',
    '/estructuras',
    '/aplicacion',
    '/preguntas',
    '/acceso',
    '/registro',
    '/recuperar',
    '/nueva-contrasena',
  ]) {
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
  await page
    .getByRole('navigation', { name: 'Principal' })
    .getByRole('link', { name: 'Acceso' })
    .click();
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
  // Hacia atrás desde el título: la barra tiene ocho enlaces sin sesión.
  const skip = page.getByRole('link', { name: 'Saltar al contenido' });
  for (let step = 0; step < 12; step += 1) {
    if (await skip.evaluate((node) => node === document.activeElement)) break;
    await page.keyboard.press('Shift+Tab');
  }
  await expect(skip).toBeFocused();
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
  const nav = page.getByRole('navigation', { name: 'Principal' });
  await expect(nav.getByRole('link', { name: 'Equipos' })).toBeHidden();
  await toggle.click();
  await expect(page.getByRole('button', { name: 'Cerrar menú' })).toHaveAttribute(
    'aria-expanded',
    'true',
  );
  expect(await fits(page)).toBe(true);
  await nav.getByRole('link', { name: 'Equipos' }).click();
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
  await expect(nav.getByRole('link')).toHaveText(guestNav);
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
    'Qué ofrece el antivirus',
    'Conoce cada parte a fondo',
    'Principios de funcionamiento',
    'Instálalo en Windows',
  ]);
  await expect(page.getByRole('link', { name: 'Iniciar sesión' })).toHaveAttribute(
    'href',
    '/acceso',
  );
  await expect(page.getByRole('link', { name: 'Conoce la tecnología' })).toHaveAttribute(
    'href',
    '/tecnologia',
  );
  // Ya no hay menú de anclas dentro de la portada: las secciones son páginas de la barra.
  await expect(page.getByRole('navigation', { name: 'Secciones de la portada' })).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Entrar para descargar' })).toHaveAttribute(
    'href',
    '/acceso',
  );
  // Nada privado, ningún aviso de demostración y ninguna descarga directa antes de entrar.
  await expect(page.getByText('Sesión activa')).toHaveCount(0);
  await expect(page.locator('body')).not.toContainText(
    /tiempo real|100 ?% protegido|Datos de demostración|demo cerrada/i,
  );
  await expect(page.locator('a[href*="github.com"], a[download]')).toHaveCount(0);
  expect(await fits(page)).toBe(true);
  await page.setViewportSize({ width: 1280, height: 800 });
  expect(await fits(page)).toBe(true);
});

test('páginas informativas: barra, título, flujo, estructuras, capturas y preguntas', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const nav = page.getByRole('navigation', { name: 'Principal' });
  await expect(nav.getByRole('link')).toHaveText(guestNav);
  // Un clic en cualquier parte del contenido no dibuja el recuadro de foco alrededor de todo.
  await page
    .locator('.home-section')
    .first()
    .click({ position: { x: 5, y: 5 } });
  expect(await page.locator('main').evaluate((node) => getComputedStyle(node).outlineStyle)).toBe(
    'none',
  );

  const pages: [string, string, string][] = [
    ['Cómo funciona', '/como-funciona', 'Del archivo al resultado, paso a paso'],
    ['Tecnología', '/tecnologia', 'Más que una interfaz'],
    ['Estructuras', '/estructuras', 'Estructuras de datos en acción'],
    ['Aplicación', '/aplicacion', 'La aplicación para Windows'],
    ['Preguntas', '/preguntas', 'Lo que suelen preguntar'],
  ];
  for (const [label, path, title] of pages) {
    await nav.getByRole('link', { name: label, exact: true }).click();
    await expect(page).toHaveURL(path);
    await expect(page.getByRole('heading', { level: 1, name: title })).toBeFocused();
    await expect(nav.getByRole('link', { name: label, exact: true })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(await fits(page)).toBe(true);
  }

  // Desde el pie, al final de una página larga, la siguiente empieza arriba.
  const footer = page.getByRole('navigation', { name: 'Conoce el proyecto' });
  await footer.scrollIntoViewIfNeeded();
  await footer.getByRole('link', { name: 'Cómo funciona' }).click();
  await expect(page).toHaveURL('/como-funciona');
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeLessThan(200);

  // Flujo del análisis: una sola etapa actual y su detalle cambia al elegir otra.
  const steps = page.locator('.flow-steps button');
  await expect(steps).toHaveCount(6);
  await expect(page.locator('.flow-steps [aria-current="step"]')).toHaveCount(1);
  await steps.nth(5).click();
  await expect(steps.nth(5)).toHaveAttribute('aria-current', 'step');
  await expect(page.getByRole('region', { name: 'Etapa 6: Cuarentena' })).toContainText(
    'confirmación',
  );
  await expect(page.getByRole('button', { name: 'Etapa siguiente' })).toBeDisabled();

  // Cola FIFO: sale el primero que entró. Pila LIFO: sale el último que entró.
  await nav.getByRole('link', { name: 'Estructuras', exact: true }).click();
  await page.getByRole('button', { name: 'Desencolar' }).click();
  await expect(page.getByText('doc.pdf sale hacia el motor')).toBeVisible();
  await page.getByRole('button', { name: 'Apilar (push)' }).click();
  await page.getByRole('button', { name: 'Desapilar (pop)' }).click();
  await expect(page.getByText(/se explora Descargas.fotos, la última en entrar/)).toBeVisible();
  await page.getByRole('button', { name: 'vacaciones.jpg' }).click();
  await expect(page.getByText('no está en el diccionario')).toBeVisible();
  await expect(page.locator('.structure-table li')).toHaveCount(13);

  // Capturas reales de la aplicación: cambian con su botón y cargan.
  await nav.getByRole('link', { name: 'Aplicación', exact: true }).click();
  await page.getByRole('button', { name: 'Escaneo', exact: true }).click();
  const shot = page.locator('.showcase-frame img');
  await expect(shot).toHaveAttribute('src', '/capturas/escritorio-escaneo.webp');
  await expect.poll(() => shot.evaluate((img: HTMLImageElement) => img.naturalWidth)).toBe(886);

  // Preguntas en acordeón nativo, agrupadas por temas.
  await nav.getByRole('link', { name: 'Preguntas', exact: true }).click();
  await expect(page.getByRole('heading', { level: 2 })).toHaveText([
    'General',
    'Análisis',
    'Cuarentena',
    'IA y privacidad',
    'Cuenta e instalación',
  ]);
  const faq = page.locator('.faq details').first();
  await faq.locator('summary').click();
  await expect(faq).toHaveAttribute('open', '');
});

test('con sesión las páginas informativas siguen disponibles desde el pie', async ({ page }) => {
  await login(page);
  const nav = page.getByRole('navigation', { name: 'Principal' });
  await expect(nav.getByRole('link')).toHaveText(['Inicio', 'Descarga', 'Equipos']);
  await page
    .getByRole('navigation', { name: 'Conoce el proyecto' })
    .getByRole('link', { name: 'Tecnología' })
    .click();
  await expect(page.getByRole('heading', { level: 1, name: 'Más que una interfaz' })).toBeFocused();
  await expect(page.getByText('Sesión activa')).toBeVisible();
});

test('acceso: tarjeta y panel de marca, foco en el título y sin datos privados', async ({
  page,
}) => {
  for (const scheme of ['light', 'dark'] as const) {
    await page.emulateMedia({ colorScheme: scheme });
    await page.goto('/acceso');
    const title = page.getByRole('heading', { level: 1, name: 'Acceso' });
    await expect(title).toBeFocused();
    await expect(
      page.getByRole('complementary', { name: 'Sobre CyberSOC Defender' }),
    ).toBeVisible();
    await expect(page.getByText('Sesión activa')).toHaveCount(0);
    await expect(page.getByRole('link', { name: 'Olvidé mi contraseña' })).toBeVisible();
    const background = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    expect(background).toBe(scheme === 'dark' ? 'rgb(11, 18, 32)' : 'rgb(243, 246, 250)');
  }
  // El panel de marca no tiene controles: no cambia el orden de tabulación.
  await expect(
    page.getByRole('complementary').locator('a, button, input, select, textarea'),
  ).toHaveCount(0);
  for (const width of [360, 800, 1280]) {
    await page.setViewportSize({ width, height: 800 });
    expect(await fits(page), String(width)).toBe(true);
  }
});

test('página inexistente ofrece volver al acceso o a la portada', async ({ page }) => {
  await page.goto('/no-existe');
  await expect(page.getByRole('heading', { level: 1, name: 'Página no encontrada' })).toBeVisible();
  await page.getByRole('link', { name: 'Volver a la portada' }).click();
  await expect(page).toHaveURL('/');
  await expect(page.getByRole('heading', { level: 1, name: 'CyberSOC Defender' })).toBeVisible();
});

async function fits(page: Page): Promise<boolean> {
  return page.evaluate(
    () => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1,
  );
}
