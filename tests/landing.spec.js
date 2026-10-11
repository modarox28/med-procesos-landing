// Pruebas de la landing: errores, desbordes, navegación, interacciones, accesibilidad y seguridad.
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

test.beforeEach(async ({ page }) => {
  page._errores = [];
  page.on('console', (m) => { if (m.type() === 'error') page._errores.push(m.text()); });
  page.on('pageerror', (e) => page._errores.push(e.message));
  await page.goto('/');
  await page.waitForLoadState('networkidle');
});

// Recorre la página para disparar todas las animaciones de scroll
async function recorrer(page) {
  const alto = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < alto; y += 500) { await page.mouse.wheel(0, 500); await page.waitForTimeout(120); }
  await page.waitForTimeout(800);
}

test('sin errores en consola después de recorrer toda la página', async ({ page }) => {
  await recorrer(page);
  expect(page._errores).toEqual([]);
});

test('sin desborde horizontal', async ({ page }) => {
  await recorrer(page);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('el logo es el isotipo de la marca y el título principal está presente', async ({ page }) => {
  await expect(page.locator('.nav .marca-iso .trazo')).toHaveCount(4);
  await expect(page.locator('#t-hero')).toContainText('residencia médica');
  await expect(page.locator('#t-hero')).toContainText('Argentina');
});

test('el mapa usa siluetas reales de Colombia y Argentina', async ({ page }) => {
  const largo = await page.evaluate(() => [document.querySelector('.pais-col').getAttribute('d').length, document.querySelector('.pais-arg').getAttribute('d').length]);
  expect(largo[0]).toBeGreaterThan(1500);
  expect(largo[1]).toBeGreaterThan(3000);
});

test('el avión termina en Buenos Aires y se marcan las paradas', async ({ page }) => {
  await page.locator('.hero-mapa').scrollIntoViewIfNeeded();
  await page.waitForTimeout(4500);
  await expect(page.locator('.parada.activa')).toHaveCount(3);
});

test('todos los enlaces internos llevan a una sección que existe', async ({ page }) => {
  const rotos = await page.evaluate(() => [...document.querySelectorAll('a[href^="#"]')].map((a) => a.getAttribute('href')).filter((h) => h.length > 1 && !document.querySelector(h)));
  expect(rotos).toEqual([]);
});

test('los enlaces externos abren en pestaña nueva con rel="noopener"', async ({ page }) => {
  const malos = await page.evaluate(() => [...document.querySelectorAll('a[href^="http"]')].filter((a) => a.target !== '_blank' || !/noopener/.test(a.rel)).map((a) => a.href));
  expect(malos).toEqual([]);
  await expect(page.locator('a[href^="https://calendly.com/asesorias-medprocesos/sesion-de-claridad"]')).toHaveCount(1);
  await expect(page.locator('a[href="https://wa.me/message/KINW7CGQKIVFO1"]')).toHaveCount(1);
});

test('mito o realidad: la tarjeta se voltea al tocarla', async ({ page }) => {
  const m = page.locator('.mito').nth(2);
  await m.scrollIntoViewIfNeeded();
  await page.waitForTimeout(1500);
  const antes = await m.getAttribute('aria-pressed');
  await m.click();
  expect(await m.getAttribute('aria-pressed')).not.toBe(antes);
});

test('cronograma: las pestañas cambian el panel (también con el teclado)', async ({ page }) => {
  await page.locator('#tab-esp').click();
  await expect(page.locator('#panel-esp')).toBeVisible();
  await expect(page.locator('#panel-readj')).toBeHidden();
  await page.locator('#tab-esp').press('ArrowRight');
  await expect(page.locator('#panel-readj')).toBeVisible();
});

test('preguntas frecuentes: se abren y se cierran', async ({ page }) => {
  const d = page.locator('.faq-item').first();
  await d.locator('summary').scrollIntoViewIfNeeded();
  await d.locator('summary').click();
  await expect(d).toHaveAttribute('open', '');
  await page.waitForTimeout(600);
  await d.locator('summary').click();
  await page.waitForTimeout(600);
  await expect(d).not.toHaveAttribute('open', '');
});

test('menú de celular: abre, navega y se cierra', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'solo celular');
  await page.locator('.nav-boton').click();
  await expect(page.locator('#menu')).toHaveClass(/abierto/);
  await page.keyboard.press('Escape');
  await expect(page.locator('#menu')).not.toHaveClass(/abierto/);
  await page.locator('.nav-boton').click();
  await page.locator('#menu a[href="#preguntas"]').click();
  await expect(page.locator('#menu')).not.toHaveClass(/abierto/);
});

test('al terminar las animaciones el contenido queda visible y el contador llega a 120', async ({ page }) => {
  await recorrer(page);
  await page.waitForTimeout(2000);
  await expect(page.locator('.res-num')).toHaveText('120');
  const ocultos = await page.evaluate(() => [...document.querySelectorAll('.titulo, .carta, .mito, .caso, .lista-docs li, .etapa')]
    .filter((e) => +getComputedStyle(e).opacity < 0.99).map((e) => e.className));
  expect(ocultos).toEqual([]);
});

test('accesibilidad: axe sin fallas WCAG 2 A/AA', async ({ page }) => {
  await recorrer(page);
  await page.waitForTimeout(1500);
  // Se inyecta por el protocolo del navegador: la CSP de la página (bien) bloquea scripts en línea
  await page.evaluate(fs.readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8'));
  const fallas = await page.evaluate(async () => (await axe.run(document, { runOnly: ['wcag2a', 'wcag2aa'] })).violations
    .map((v) => `${v.id}: ${v.nodes.slice(0, 3).map((n) => n.target.join(' ')).join(', ')}`));
  expect(fallas).toEqual([]);
});

test('seguridad: CSP presente y sin scripts de dominios no permitidos', async ({ page }) => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  expect(html).toMatch(/http-equiv="Content-Security-Policy"/);
  const externos = [...html.matchAll(/<script[^>]+src="(https?:[^"]+)"/g)].map((m) => m[1]);
  expect(externos).toEqual([]);
  expect(html).not.toMatch(/NUMERO_WHATSAPP/);
});

test('el pie aclara que es un concepto no oficial', async ({ page }) => {
  await expect(page.locator('.pie-aviso')).toContainText('Sitio no oficial de Med Procesos');
});
