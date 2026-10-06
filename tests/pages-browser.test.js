import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { join, normalize } from 'node:path';
import { chromium } from '@playwright/test';
import { buildPages } from '../scripts/build-pages.js';

let server;
let browser;
let page;
let baseUrl;

before(async () => {
  const siteDir = await buildPages();
  server = Bun.serve({
    hostname: '127.0.0.1',
    port: 0,
    fetch(request) {
      const url = new URL(request.url);
      const relative = url.pathname === '/' ? 'index.html' : url.pathname.slice(1);
      const filePath = normalize(join(siteDir, relative));
      if (!filePath.startsWith(`${siteDir}/`)) return new Response('Not found', { status: 404 });
      const file = Bun.file(filePath);
      return file.exists().then((exists) => (exists ? new Response(file) : new Response('Not found', { status: 404 })));
    },
  });
  baseUrl = `http://127.0.0.1:${server.port}`;
  browser = await chromium.launch({ channel: 'chrome', headless: true });
  page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(baseUrl);
});

after(async () => {
  await page?.close();
  await browser?.close();
  server?.stop();
});

test('static GitHub Pages artifact completes catalog and cart flow without Node API', async () => {
  await assert.doesNotReject(page.getByRole('heading', { name: 'Northstar Store' }).waitFor());
  await assert.doesNotReject(page.getByRole('heading', { name: 'Shop the signal, skip the noise.' }).waitFor({ timeout: 1000 }));
  await page.getByLabel('Category').selectOption('headphones');
  await page.getByLabel('Feature').selectOption('noise-cancelling');
  await page.getByLabel('In stock only').check();
  await page.getByRole('button', { name: 'Apply filters' }).click();
  await page.getByRole('button', { name: 'View Sonic Lite ANC' }).click();
  await page.getByLabel('Color').selectOption('black');
  await page.getByLabel('Quantity').fill('2');
  await page.getByRole('button', { name: 'Add to cart' }).click();
  await page.waitForURL(/#cart$/);
  await page.getByText('$258.00').first().waitFor();
  assert.match(await page.locator('body').innerText(), /\$263\.00/);
});
