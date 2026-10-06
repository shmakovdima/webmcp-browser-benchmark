import { readFile } from 'node:fs/promises';
import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from '@playwright/test';
import { createBenchmarkServer } from '../src/server/server.js';

const catalogPath = new URL('../fixtures/catalog.json', import.meta.url);
let browser;
let page;
let app;
let baseUrl;

before(async () => {
  const catalog = JSON.parse(await readFile(catalogPath, 'utf8'));
  app = await createBenchmarkServer({ catalog, port: 0, host: '127.0.0.1' });
  baseUrl = app.url;
  browser = await chromium.launch({ channel: 'chrome', headless: true });
  page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(baseUrl);
});

after(async () => {
  await page?.close();
  await browser?.close();
  await app?.close();
});

test('health, accessible catalog, cart, and test checkout use the deterministic backend', async () => {
  const health = await page.context().request.get(`${baseUrl}/health`);
  assert.equal(health.status(), 200);
  assert.deepEqual(await health.json(), { ok: true });
  await assert.doesNotReject(page.getByRole('heading', { name: 'Northstar Store' }).waitFor());
  await assert.doesNotReject(page.getByRole('heading', { name: 'Shop the signal, skip the noise.' }).waitFor({ timeout: 1000 }));
  await assert.doesNotReject(page.getByText('24 deterministic products').waitFor());
  await assert.doesNotReject(page.getByRole('heading', { name: 'Sonic Lite ANC' }).waitFor());
  await page.getByLabel('Category').selectOption('headphones');
  await page.getByLabel('Feature').selectOption('noise-cancelling');
  await page.getByLabel('In stock only').check();
  await page.getByRole('button', { name: 'Apply filters' }).click();
  await page.getByRole('button', { name: 'View Sonic Lite ANC' }).click();
  await page.getByLabel('Color').selectOption('black');
  await page.getByLabel('Quantity').fill('2');
  await page.getByRole('button', { name: 'Add to cart' }).click();
  await page.waitForURL(/#cart$/);
  await assert.doesNotReject(page.getByText('$258.00').first().waitFor());
  await page.waitForTimeout(100);
  assert.match(await page.locator('body').innerText(), /\$263\.00/);
  await page.getByRole('link', { name: 'Checkout', exact: true }).click();
  await page.getByLabel('Full name').fill('Alex Morgan');
  await page.getByLabel('Email').fill('alex@example.com');
  await page.getByLabel('Address').fill('10 Market Street');
  await page.getByLabel('City').fill('Boston');
  await page.getByLabel('Postal code').fill('02110');
  await page.getByLabel('Country').fill('United States');
  await page.getByRole('button', { name: 'Place test order' }).click();
  await assert.doesNotReject(page.getByText('No payment was processed').waitFor());
});
