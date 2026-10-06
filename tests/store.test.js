import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createStore } from '../src/server/store.js';

const catalogPath = new URL('../fixtures/catalog.json', import.meta.url);

async function loadCatalogFixture() {
  return JSON.parse(await readFile(catalogPath, 'utf8'));
}

async function makeStore() {
  return createStore(await loadCatalogFixture());
}

test('catalog fixture has the required deterministic shape', async () => {
  const catalog = await loadCatalogFixture();

  assert.equal(catalog.length, 24);
  assert.deepEqual(
    [...new Set(catalog.map((product) => product.category))].sort(),
    ['headphones', 'keyboards', 'mice', 'monitors'],
  );

  const sonicLite = catalog.find((product) => product.id === 'hp-sonic-lite');
  assert.deepEqual(sonicLite, {
    id: 'hp-sonic-lite',
    name: 'Sonic Lite ANC',
    category: 'headphones',
    description: 'Compact wireless headphones with active noise cancellation.',
    priceCents: 12900,
    tags: ['wireless', 'noise-cancelling'],
    colors: ['black', 'blue'],
    stockByColor: { black: 8, blue: 0 },
    image: '/images/hp-sonic-lite.svg',
    rating: 4.4,
  });

  const eligible = catalog.filter(
    (product) =>
      product.category === 'headphones' &&
      product.tags.includes('noise-cancelling') &&
      product.priceCents < 20000 &&
      Object.values(product.stockByColor).some((stock) => stock > 0),
  );

  assert.ok(eligible.length >= 3);
  assert.equal(
    Math.min(...eligible.map((product) => product.priceCents)),
    sonicLite.priceCents,
  );
});

test('search filters and sorts products without mutating the catalog', async () => {
  const store = await makeStore();

  const products = store.searchProducts({
    category: 'headphones',
    maxPriceCents: 20000,
    tags: ['noise-cancelling'],
    inStockOnly: true,
    sort: 'price_asc',
  });

  assert.deepEqual(products.map((product) => product.id), [
    'hp-sonic-lite',
    'hp-quiet-pro',
    'hp-travel-calm',
  ]);
  assert.equal(products[0].stockByColor.black, 8);
  assert.deepEqual(store.getProduct('hp-sonic-lite').stockByColor, { black: 8, blue: 0 });
});

test('cart validates color stock and calculates a fixed shipping fee', async () => {
  const store = await makeStore();

  const added = store.setCartItem({ productId: 'hp-sonic-lite', color: 'black', quantity: 2 });
  assert.equal(added.subtotalCents, 25800);
  assert.equal(added.shippingCents, 500);
  assert.equal(added.totalCents, 26300);
  assert.throws(
    () => store.setCartItem({ productId: 'hp-sonic-lite', color: 'blue', quantity: 1 }),
    /out of stock/i,
  );
  assert.throws(
    () => store.setCartItem({ productId: 'hp-sonic-lite', color: 'black', quantity: 9 }),
    /stock/i,
  );
});

test('checkout validates fields, decrements stock, clears cart, and returns deterministic order', async () => {
  const store = await makeStore();
  store.setCartItem({ productId: 'hp-sonic-lite', color: 'black', quantity: 1 });

  assert.throws(
    () => store.placeTestOrder({ name: 'Alex Morgan', email: '' }),
    /email/i,
  );

  const order = store.placeTestOrder({
    name: 'Alex Morgan',
    email: 'alex@example.com',
    address: '10 Market Street',
    city: 'Boston',
    postalCode: '02110',
    country: 'United States',
  });

  assert.equal(order.orderId, 'order-0001');
  assert.equal(order.status, 'confirmed');
  assert.equal(order.totalCents, 13400);
  assert.equal(store.getCart().lines.length, 0);
  assert.equal(store.getProduct('hp-sonic-lite').stockByColor.black, 7);
});
