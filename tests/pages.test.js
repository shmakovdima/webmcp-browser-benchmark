import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildPages } from '../scripts/build-pages.js';

test('GitHub Pages build contains a self-contained static WebMCP demo', async () => {
  const siteDir = await buildPages();
  const index = await readFile(`${siteDir}/index.html`, 'utf8');
  const catalog = JSON.parse(await readFile(`${siteDir}/catalog.json`, 'utf8'));

  assert.match(index, /data-static-demo="true"/);
  assert.match(index, /assets\//);
  assert.equal(catalog.length, 24);
});
