const { defineConfig } = require('@playwright/test');

// En CI se usa el Chromium que instala Playwright; en local se puede indicar otro con PW_CHROMIUM
const launchOptions = process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {};

module.exports = defineConfig({
  testDir: './tests',
  timeout: 45000,
  reporter: 'list',
  webServer: { command: 'python3 -m http.server 8090', port: 8090, reuseExistingServer: true },
  use: { baseURL: 'http://localhost:8090', headless: true, launchOptions },
  projects: [
    { name: 'escritorio', use: { viewport: { width: 1440, height: 900 } } },
    { name: 'celular', use: { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true } },
    { name: 'movimiento-reducido', use: { viewport: { width: 1280, height: 800 }, reducedMotion: 'reduce' } },
  ],
});
