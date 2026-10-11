// Pruebas de la landing: errores, desbordes, navegación, interacciones, accesibilidad y seguridad.
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

test.beforeEach(async ({ page }) => {
  page._errores = [];
  // Se ignora solo el aviso de red por el embed de Instagram, que las pruebas bloquean a propósito
  page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) page._errores.push(m.text()); });
  page.on('requestfailed', (r) => { if (!/instagram\.com/.test(r.url())) page._errores.push('Falló: ' + r.url()); });
  page.on('pageerror', (e) => page._errores.push(e.message));
  // Instagram se bloquea en las pruebas para que sean deterministas (se ve la tarjeta de respaldo)
  await page.route(/instagram\.com/, (r) => r.abort());
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
  await expect(page.locator('a[href="https://api.whatsapp.com/message/KINW7CGQKIVFO1"]')).toHaveCount(1);
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

test('Instagram: 4 publicaciones oficiales que se cargan al acercarse', async ({ page }) => {
  const posts = page.locator('#insta-grid blockquote.instagram-media');
  await expect(posts).toHaveCount(4);
  const enlaces = await posts.evaluateAll((b) => b.map((x) => x.dataset.instgrmPermalink));
  expect(enlaces.every((u) => /^https:\/\/www\.instagram\.com\/(p|reel)\/[\w-]+\/$/.test(u))).toBe(true);
  expect(await page.evaluate(() => !!document.querySelector('script[src*="instagram.com/embed.js"]'))).toBe(false);
  await page.locator('#instagram').scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  expect(await page.evaluate(() => !!document.querySelector('script[src*="instagram.com/embed.js"]'))).toBe(true);
  await expect(posts.first().locator('a')).toHaveAttribute('href', /instagram\.com\/reel\//);
});

test('Instagram: cuando el embed reemplaza las tarjetas por iframes, quedan visibles', async ({ page }) => {
  // Simula embed.js: cambia cada blockquote por un iframe copiando sus estilos en línea, como hace Instagram
  await page.unroute(/instagram\.com/);
  await page.route(/instagram\.com\/embed\.js/, (r) => r.fulfill({ contentType: 'text/javascript', body: `
    window.instgrm = { Embeds: { process() {
      document.querySelectorAll('blockquote.instagram-media').forEach((b) => {
        const f = document.createElement('iframe');
        f.className = 'instagram-media instagram-media-rendered';
        f.style.cssText = b.style.cssText + ';height:540px;';
        f.src = 'about:blank';
        b.replaceWith(f);
      });
    } } };` }));
  await page.route(/instagram\.com\/(?!embed\.js)/, (r) => r.abort());
  await page.locator('#instagram').scrollIntoViewIfNeeded();
  await page.waitForTimeout(2500);
  const estados = await page.$$eval('#insta-grid iframe', (fs) => fs.map((f) => {
    const r = f.getBoundingClientRect(), cs = getComputedStyle(f);
    return { opacidad: +cs.opacity, alto: Math.round(r.height), ancho: Math.round(r.width), visible: cs.visibility };
  }));
  expect(estados.length).toBe(4);
  for (const e of estados) { expect(e.opacidad).toBe(1); expect(e.alto).toBeGreaterThan(300); expect(e.ancho).toBeGreaterThan(200); expect(e.visible).toBe('visible'); }
});

test('el pie aclara que es un concepto no oficial', async ({ page }) => {
  await expect(page.locator('.pie-aviso')).toContainText('Sitio no oficial de Med Procesos');
});
