import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createStore } from '../src/server/store.js';
import { createResetGuard } from '../src/server/reset.js';

const catalogPath = new URL('../fixtures/catalog.json', import.meta.url);

async function makeStore() {
  return createStore(JSON.parse(await readFile(catalogPath, 'utf8')));
}

test('reset restores inventory and order numbering', async () => {
  const store = await makeStore();
  store.setCartItem({ productId: 'hp-sonic-lite', color: 'black', quantity: 1 });
  store.placeTestOrder({
    name: 'Alex Morgan',
    email: 'alex@example.com',
    address: '10 Market Street',
    city: 'Boston',
    postalCode: '02110',
    country: 'United States',
  });

  store.reset();

  assert.equal(store.getProduct('hp-sonic-lite').stockByColor.black, 8);
  assert.equal(store.snapshot().orders.length, 0);
  store.setCartItem({ productId: 'hp-sonic-lite', color: 'black', quantity: 1 });
  assert.equal(
    store.placeTestOrder({
      name: 'Alex Morgan',
      email: 'alex@example.com',
      address: '10 Market Street',
      city: 'Boston',
      postalCode: '02110',
      country: 'United States',
    }).orderId,
    'order-0001',
  );
});

test('reset guard accepts only its issued token', () => {
  const guard = createResetGuard();
  const token = guard.issueToken();

  assert.doesNotThrow(() => guard.assertToken(token));
  assert.throws(() => guard.assertToken('wrong-token'), /invalid reset token/i);
  assert.throws(() => guard.assertToken(''), /invalid reset token/i);
});
