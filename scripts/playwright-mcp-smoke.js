import { readFile } from 'node:fs/promises';
import { createBenchmarkServer } from '../src/server/server.js';
import { createPlaywrightMcpClient } from '../src/runner/playwright-mcp-client.js';
import { createPlaywrightMcpMode } from '../src/runner/modes/playwright-mcp.js';

const catalog = JSON.parse(await readFile(new URL('../fixtures/catalog.json', import.meta.url), 'utf8'));
const port = Number(process.env.PLAYWRIGHT_MCP_PORT ?? 4318);
const app = await createBenchmarkServer({ catalog, port, host: '127.0.0.1' });
const client = createPlaywrightMcpClient({
  targetUrl: app.url,
  browser: 'chrome',
  headless: true,
  cwd: new URL('..', import.meta.url).pathname,
});

try {
  await client.start();
  const mode = createPlaywrightMcpMode();
  const listed = await client.listTools({ allowedToolNames: mode.allowedToolNames });
  const snapshot = await client.callTool('browser_snapshot');
  const snapshotText = snapshot.content
    .filter((part) => part.type === 'text')
    .map((part) => part.text)
    .join('\n');

  console.log(JSON.stringify({
    status: 'connected',
    mode: mode.name,
    targetUrl: app.url,
    toolNames: listed.tools.map((tool) => tool.name),
    snapshotBytes: Buffer.byteLength(snapshotText, 'utf8'),
    containsNorthstarStore: snapshotText.includes('Northstar Store'),
  }, null, 2));
} finally {
  await client.close();
  await app.close();
}
