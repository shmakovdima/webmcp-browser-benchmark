import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createModelClient } from '../src/runner/model-client.js';
import { createVisualMode } from '../src/runner/modes/visual.js';
import { createPlaywrightMcpMode } from '../src/runner/modes/playwright-mcp.js';
import { createWebMcpMode } from '../src/runner/modes/webmcp.js';
import { createPlaywrightMcpClient } from '../src/runner/playwright-mcp-client.js';
import { runBenchmark } from '../src/runner/run.js';

test('model client refuses measured execution without an explicit model ID', () => {
  assert.throws(() => createModelClient({}), /MODEL_ID/i);
});

test('visual mode allows screenshots and coordinates but rejects accessibility data', () => {
  const mode = createVisualMode();
  assert.equal(mode.name, 'visual');
  assert.ok(mode.allowedCapabilities.includes('screenshot'));
  assert.ok(mode.allowedCapabilities.includes('coordinate_click'));
  assert.equal(mode.validateObservation({ screenshot: 'data:image/png;base64,x' }), true);
  assert.throws(() => mode.validateObservation({ accessibilitySnapshot: 'button' }), /forbidden/i);
});

test('Playwright MCP mode allows snapshots and refs but rejects screenshots', () => {
  const mode = createPlaywrightMcpMode();
  assert.ok(mode.allowedCapabilities.includes('accessibility_snapshot'));
  assert.ok(mode.allowedCapabilities.includes('element_ref'));
  assert.throws(() => mode.validateObservation({ screenshot: 'data:image/png;base64,x' }), /forbidden/i);
});

test('Playwright MCP client requires a target URL before starting a session', async () => {
  const client = createPlaywrightMcpClient({
    command: 'node',
    args: ['-e', 'process.stdin.resume()'],
  });

  await assert.rejects(client.start(), /target URL/i);
});

test('Playwright MCP client exposes the official MCP operation surface', () => {
  const client = createPlaywrightMcpClient({
    command: 'node',
    args: ['-e', 'process.stdin.resume()'],
    targetUrl: 'http://127.0.0.1:4173/',
  });

  assert.equal(typeof client.start, 'function');
  assert.equal(typeof client.close, 'function');
  assert.equal(typeof client.listTools, 'function');
  assert.equal(typeof client.callTool, 'function');
});

test('WebMCP mode allows structured tool results but rejects DOM observations', () => {
  const mode = createWebMcpMode();
  assert.ok(mode.allowedCapabilities.includes('webmcp_tool'));
  assert.equal(mode.validateObservation({ toolName: 'get_cart', result: { lines: [] } }), true);
  assert.throws(() => mode.validateObservation({ dom: '<button>' }), /forbidden/i);
});

test('development dry-run validates the pipeline without a model call', async () => {
  const result = await runBenchmark({ mode: 'webmcp', taskId: 'T1', stage: 'development', dryRun: true });

  assert.deepEqual(result, {
    status: 'dry-run',
    mode: 'webmcp',
    taskId: 'T1',
    stage: 'development',
    modelCalls: 0,
    capabilities: ['webmcp_tool'],
  });
});

test('full benchmark requires explicit approval', async () => {
  await assert.rejects(
    runBenchmark({ mode: 'webmcp', taskId: 'T1', stage: 'full', dryRun: true }),
    /approval/i,
  );
});
