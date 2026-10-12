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
  await expect(page.locator('a[href^="https://calendly.com/asesorias-medprocesos/sesion-de-claridad"]')).toHaveCount(2); // agenda y resultado del test
  await expect(page.locator('a[href="https://api.whatsapp.com/message/KINW7CGQKIVFO1"]')).toHaveCount(2); // agenda y botón flotante
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

test('menú de celular: después de bajar, ocupa toda la pantalla y sus enlaces se ven', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'solo celular');
  // Bajar activa el fondo con blur del nav (antes encerraba el menú en ~120px de alto)
  await page.evaluate(() => window.scrollTo(0, 2500));
  await expect(page.locator('.nav')).toHaveClass(/con-fondo/);
  await page.evaluate(() => window.scrollTo(0, 2300)); // subir un poco para que el nav reaparezca
  await page.locator('.nav-boton').click();
  await expect(page.locator('#menu')).toHaveClass(/abierto/);
  await page.waitForTimeout(800);
  const { alto, vh, ultimoVisible } = await page.evaluate(() => {
    const m = document.querySelector('#menu').getBoundingClientRect();
    const enlaces = [...document.querySelectorAll('#menu a')];
    const u = enlaces[enlaces.length - 1].getBoundingClientRect();
    return { alto: m.height, vh: window.innerHeight, ultimoVisible: u.bottom <= window.innerHeight && u.top >= 0 };
  });
  expect(alto).toBeGreaterThanOrEqual(vh - 1);
  expect(ultimoVisible).toBe(true);
  await page.locator('#menu a[href="#agenda"]').click();
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

test('test de etapa: con clics llega al resultado correcto y se puede repetir', async ({ page }) => {
  const test_ = page.locator('#test-etapa');
  await test_.scrollIntoViewIfNeeded();
  await expect(test_.locator('.test-pregunta.activa legend')).toContainText('título');
  await test_.locator('label.opcion', { hasText: 'Sí, ya lo tengo' }).click();
  await expect(test_.locator('.test-n')).toHaveText('2');
  await test_.locator('label.opcion', { hasText: 'Tengo la precaria' }).click();
  await expect(test_.locator('.test-n')).toHaveText('3');
  // Atrás conserva la respuesta anterior
  await test_.locator('.test-atras').click();
  await expect(test_.locator('.test-n')).toHaveText('2');
  await expect(test_.locator('input[name=dni][value=precaria]')).toBeChecked();
  await test_.locator('label.opcion', { hasText: 'Tengo la precaria' }).click();
  await test_.locator('label.opcion', { hasText: 'Ya presenté el examen' }).click();
  await test_.locator('label.opcion', { hasText: 'En la próxima convocatoria' }).click();
  await expect(test_.locator('.test-resultado')).toBeVisible();
  await expect(test_.locator('.test-titulo')).toHaveText('Adjudicación y matrícula');
  await expect(test_.locator('.test-num')).toHaveText('04');
  await expect(test_.locator('.test-servicios li')).toHaveCount(3);
  await test_.locator('.test-copiar').click();
  await expect(test_.locator('.test-copiado a')).toHaveAttribute('href', /api\.whatsapp\.com/);
  await test_.locator('.test-repetir').click();
  await expect(test_.locator('.test-resultado')).toBeHidden();
  await expect(test_.locator('.test-n')).toHaveText('1');
  expect(page._errores).toEqual([]);
});

test('test de etapa: con teclado las flechas no saltan de pregunta y Enter avanza', async ({ page, isMobile }) => {
  test.skip(isMobile, 'solo teclado');
  const test_ = page.locator('#test-etapa');
  await test_.scrollIntoViewIfNeeded();
  await test_.locator('input[name=titulo]').first().focus();
  await page.keyboard.press('ArrowDown'); // elige "En trámite"
  await page.waitForTimeout(400);
  await expect(test_.locator('.test-n')).toHaveText('1');
  await page.keyboard.press('Enter');
  await expect(test_.locator('.test-n')).toHaveText('2');
  for (const v of ['no', 'no', 'pronto']) {
    await test_.locator(`.test-pregunta.activa input[value=${v}]`).check();
    await page.keyboard.press('Enter');
  }
  await expect(test_.locator('.test-titulo')).toHaveText('DNI y convalidación');
  await expect(test_.locator('.test-aviso')).toBeVisible();
});

test('test de etapa: la lógica asigna cada etapa', async ({ page }) => {
  const r = await page.evaluate(async () => {
    const { calcularEtapa } = await import('/assets/js/modulos/etapa.js');
    const c = (titulo, dni, examen, cuando = 'anio') => calcularEtapa({ titulo, dni, examen, cuando }).etapa;
    return [c('no', 'si', 'presentado'), c('tramite', 'si', 'no'), c('si', 'no', 'no'), c('si', 'precaria', 'preparando'), c('si', 'si', 'presentado')];
  });
  expect(r).toEqual([1, 2, 2, 3, 4]);
});

test('WhatsApp flotante: oculto en el inicio, visible al bajar y oculto en la agenda', async ({ page }) => {
  const wa = page.locator('.wa-flotante');
  await expect(wa).not.toHaveClass(/visible/);
  await page.locator('#mitos').scrollIntoViewIfNeeded();
  await expect(wa).toHaveClass(/visible/);
  await expect(wa).toHaveAttribute('href', 'https://api.whatsapp.com/message/KINW7CGQKIVFO1');
  await page.locator('#agenda').scrollIntoViewIfNeeded();
  await page.evaluate(() => document.querySelector('#agenda').scrollIntoView({ block: 'center' }));
  await expect(wa).not.toHaveClass(/visible/);
});

test('vista previa al compartir: imagen, título y datos estructurados', async ({ page, request }) => {
  const og = await page.locator('meta[property="og:image"]').getAttribute('content');
  expect(og).toMatch(/^https:\/\/modarox28\.github\.io\/med-procesos-landing\/assets\/img\/og\.png$/);
  expect((await request.get('/assets/img/og.png')).ok()).toBe(true);
  expect((await request.get('/assets/img/apple-touch-icon.png')).ok()).toBe(true);
  expect((await request.get('/sitemap.xml')).ok()).toBe(true);
  const ld = JSON.parse(await page.locator('script[type="application/ld+json"]').textContent());
  expect(ld['@type']).toBe('WebPage');
  expect(ld.about.name).toBe('Med Procesos');
});

test('página 404 con la marca y enlace al inicio', async ({ page }) => {
  // En GitHub Pages las rutas llevan /med-procesos-landing/; aquí se sirven desde la carpeta local
  await page.route(/\/med-procesos-landing\//, (r) => {
    const ruta = new URL(r.request().url()).pathname.replace('/med-procesos-landing/', '') || 'index.html';
    r.fulfill({ path: path.join(__dirname, '..', ruta.split('?')[0]) });
  });
  const errores = [];
  page.on('console', (m) => m.type() === 'error' && errores.push(m.text()));
  await page.goto('/404.html');
  await expect(page.locator('h1')).toContainText('se desvió del camino');
  await expect(page.locator('a.boton-naranja')).toHaveAttribute('href', '/med-procesos-landing/');
  expect(await page.evaluate(() => getComputedStyle(document.querySelector('.e404-n')).fontFamily)).toContain('Oswald');
  expect(errores).toEqual([]);
});
