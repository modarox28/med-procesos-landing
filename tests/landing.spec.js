const { test, expect } = require('@playwright/test');

test.beforeEach(async ({ page }) => {
  const errors = [];
  page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
  page.on('pageerror', err => errors.push(err.message));
  page._testErrors = errors;
  await page.goto('/');
  // Esperar a que Lenis y GSAP carguen
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(800);
});

test('Sin errores en consola', async ({ page }) => {
  expect(page._testErrors).toEqual([]);
});

test('Sin desborde horizontal', async ({ page }) => {
  const overflow = await page.evaluate(() => document.body.scrollWidth > window.innerWidth);
  expect(overflow).toBe(false);
});

test('Hero visible y h1 presente', async ({ page }) => {
  const h1 = page.locator('#hero-heading');
  await expect(h1).toBeVisible();
  const text = await h1.textContent();
  expect(text).toContain('residencia médica');
});

test('Navegación: todos los links del nav existen', async ({ page }) => {
  await expect(page.locator('.nav-links a')).toHaveCount(5);
});

test('Tabs de cronograma funcionan', async ({ page }) => {
  await page.locator('#tab-provincia').click();
  await expect(page.locator('#crono-provincia')).toBeVisible();
  await expect(page.locator('#crono-uba')).toBeHidden();

  await page.locator('#tab-uba').click();
  await expect(page.locator('#crono-uba')).toBeVisible();
});

test('Flip cards de mitos se voltean al hacer clic', async ({ page }) => {
  const card = page.locator('.mito-card').first();
  await card.click();
  await expect(card).toHaveClass(/flipped/);
});

test('FAQ accordion abre y cierra', async ({ page }) => {
  const item = page.locator('.faq-item').first();
  await item.locator('summary').click();
  await expect(item).toHaveAttribute('open', '');
});

test('Botón CTA principal tiene href válido', async ({ page }) => {
  const btn = page.locator('a[href*="calendly.com"]').first();
  await expect(btn).toBeVisible();
  const href = await btn.getAttribute('href');
  expect(href).toContain('calendly.com/asesorias-medprocesos');
});

test('Secciones clave existen en el DOM', async ({ page }) => {
  for (const id of ['inicio', 'proceso', 'servicios', 'resultados', 'faq', 'agenda']) {
    await expect(page.locator(`#${id}`)).toBeAttached();
  }
});

test('Screenshot completo', async ({ page, browserName }, testInfo) => {
  const vp = testInfo.project.name;
  // Scroll para disparar animaciones ScrollTrigger
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(600);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(400);

  await page.screenshot({
    path: `tests/screenshots/${vp}-full.png`,
    fullPage: true,
  });

  // Screenshot del hero
  await page.locator('.hero').screenshot({
    path: `tests/screenshots/${vp}-hero.png`,
  });
});
