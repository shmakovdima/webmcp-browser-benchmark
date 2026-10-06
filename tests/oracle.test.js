import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createManifest } from '../src/runner/manifest.js';
import { createMetrics } from '../src/runner/metrics.js';
import { validateTask } from '../src/runner/oracle.js';

const baseShipping = {
  name: 'Alex Morgan',
  email: 'alex@example.com',
  address: '10 Market Street',
  city: 'Boston',
  postalCode: '02110',
  country: 'United States',
};

test('oracle accepts a correct read-only product discovery result', () => {
  const result = validateTask('T1', {
    snapshot: { cart: { lines: [] }, orders: [] },
    finalAnswer: 'The cheapest option is Sonic Lite ANC at $129.00.',
    answerData: { productId: 'hp-sonic-lite', priceCents: 12900 },
  });

  assert.deepEqual(result, { oraclePassed: true, finalAnswerPassed: true, failureCategory: null });
});

test('oracle rejects a wrong cart quantity even when the final answer claims success', () => {
  const result = validateTask('T2', {
    snapshot: {
      cart: {
        lines: [{ productId: 'hp-sonic-lite', color: 'black', quantity: 1, unitPriceCents: 12900 }],
      },
      orders: [],
    },
    finalAnswer: 'Added two headphones. Subtotal $258.00.',
  });

  assert.equal(result.oraclePassed, false);
  assert.equal(result.finalAnswerPassed, true);
  assert.equal(result.failureCategory, 'backend-state-mismatch');
});

test('oracle validates the order state and returned final answer', () => {
  const result = validateTask('T3', {
    snapshot: {
      cart: { lines: [] },
      products: [{ id: 'hp-sonic-lite', stockByColor: { black: 7 } }],
      orders: [{
        orderId: 'order-0001',
        totalCents: 13400,
        lines: [{ productId: 'hp-sonic-lite', color: 'black', quantity: 1 }],
        shipping: baseShipping,
      }],
    },
    finalAnswer: 'Order order-0001 confirmed. Total $134.00.',
  });

  assert.deepEqual(result, { oraclePassed: true, finalAnswerPassed: true, failureCategory: null });
});

test('metrics aggregate provider token fields without estimating from text length', async () => {
  const metrics = createMetrics();
  metrics.record({ eventType: 'model_response', inputTokens: 100, cachedInputTokens: 20, outputTokens: 30, reasoningTokens: 5, totalTokens: 130, elapsedMs: 40 });
  metrics.record({ eventType: 'tool_call', toolCalls: 1, observationBytes: 1200, elapsedMs: 15 });

  assert.deepEqual(metrics.summary(), {
    inputTokens: 100,
    cachedInputTokens: 20,
    outputTokens: 30,
    reasoningTokens: 5,
    totalTokens: 130,
    wallTimeMs: 55,
    modelRequests: 0,
    toolCalls: 1,
    observationBytes: 1200,
  });
});

test('manifest records fixture checksums and never serializes provider secrets', () => {
  const manifest = createManifest({
    mode: 'webmcp',
    modelId: 'test-model',
    seed: 42,
    versions: { browser: 'test-browser' },
    providerConfig: { apiKey: 'do-not-write', endpoint: 'https://example.test' },
  });

  assert.equal(manifest.mode, 'webmcp');
  assert.equal(manifest.modelId, 'test-model');
  assert.equal(manifest.seed, 42);
  assert.ok(manifest.fixtureChecksums.catalog.length > 10);
  assert.equal(JSON.stringify(manifest).includes('do-not-write'), false);
});
