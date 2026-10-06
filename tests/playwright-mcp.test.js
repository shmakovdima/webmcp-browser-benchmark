import { readFile } from 'node:fs/promises';
import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { createBenchmarkServer } from '../src/server/server.js';
import { createPlaywrightMcpClient } from '../src/runner/playwright-mcp-client.js';
import { createPlaywrightMcpMode } from '../src/runner/modes/playwright-mcp.js';

const catalogUrl = new URL('../fixtures/catalog.json', import.meta.url);
let app;
let client;

before(async () => {
  const catalog = JSON.parse(await readFile(catalogUrl, 'utf8'));
  app = await createBenchmarkServer({ catalog, port: 4318, host: '127.0.0.1' });
  client = createPlaywrightMcpClient({
    targetUrl: app.url,
    browser: 'chrome',
    headless: true,
    cwd: new URL('..', import.meta.url).pathname,
  });
  await client.start();
});

after(async () => {
  await client?.close();
  await app?.close();
});

test('official Playwright MCP navigates to the benchmark and exposes snapshot tools', async () => {
  const listed = await client.listTools();
  const names = listed.tools.map((tool) => tool.name);

  assert.ok(names.includes('browser_navigate'));
  assert.ok(names.includes('browser_snapshot'));
  assert.ok(names.includes('browser_click'));
  assert.ok(names.includes('browser_type'));
  assert.ok(names.includes('browser_press_key'));
  assert.ok(names.includes('browser_take_screenshot'));

  const mode = createPlaywrightMcpMode();
  const exposed = await client.listTools({ allowedToolNames: mode.allowedToolNames });
  assert.deepEqual(
    exposed.tools.map((tool) => tool.name).sort(),
    [...mode.allowedToolNames].sort(),
  );

  const snapshot = await client.callTool('browser_snapshot');
  const text = snapshot.content
    .filter((part) => part.type === 'text')
    .map((part) => part.text)
    .join('\n');
  assert.match(text, /Northstar Store/);
});
