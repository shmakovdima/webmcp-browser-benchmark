import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createWebMcpTools, getWebMcpToolDefinitions, registerWebMcpTools } from '../src/web/webmcp.js';

test('WebMCP exposes exactly the five store operations with compact schemas', () => {
  const definitions = getWebMcpToolDefinitions();

  assert.deepEqual(definitions.map((tool) => tool.name), [
    'search_products',
    'get_product',
    'set_cart_item',
    'get_cart',
    'place_test_order',
  ]);
  assert.deepEqual(definitions.find((tool) => tool.name === 'get_cart').inputSchema, {
    type: 'object',
    properties: {},
  });
  assert.deepEqual(definitions.find((tool) => tool.name === 'place_test_order').annotations, {
    consequentialHint: true,
  });
  assert.ok(definitions.every((tool) => tool.description.length > 20));
});

test('WebMCP handlers delegate to the same API operations as the UI', async () => {
  const calls = [];
  const api = async (path, options) => {
    calls.push({ path, options });
    if (path.startsWith('/api/products?')) return { products: [{ id: 'hp-sonic-lite', priceCents: 12900 }] };
    if (path === '/api/cart') return { lines: [], subtotalCents: 0, shippingCents: 0, totalCents: 0 };
    return { ok: true };
  };
  const tools = createWebMcpTools({ request: api });

  const products = await tools.search_products({ category: 'headphones', tags: ['noise-cancelling'] });
  const cart = await tools.get_cart({});

  assert.deepEqual(products, { products: [{ id: 'hp-sonic-lite', priceCents: 12900 }] });
  assert.deepEqual(cart, { lines: [], subtotalCents: 0, shippingCents: 0, totalCents: 0 });
  assert.equal(calls.length, 2);
  assert.match(calls[0].path, /^\/api\/products\?/);
});

test('registration is safe when the browser does not support document model context', async () => {
  const result = await registerWebMcpTools({ request: async () => ({}) }, null);

  assert.deepEqual(result, {
    registered: false,
    apiName: null,
    toolNames: [
      'search_products',
      'get_product',
      'set_cart_item',
      'get_cart',
      'place_test_order',
    ],
  });
});

test('registration uses document model context and records the selected API', async () => {
  const registered = [];
  const modelContext = {
    registerTool: async (tool) => registered.push(tool),
  };
  const result = await registerWebMcpTools({ request: async () => ({}) }, modelContext);

  assert.equal(result.registered, true);
  assert.equal(result.apiName, 'document.modelContext');
  assert.equal(registered.length, 5);
  assert.equal(typeof registered[0].execute, 'function');
});
