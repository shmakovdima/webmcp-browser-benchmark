import { createStore } from '../server/store.js';

let storePromise;

function loadStore() {
  storePromise ??= fetch('./catalog.json').then((response) => {
    if (!response.ok) throw new Error(`Static catalog failed: ${response.status}`);
    return response.json();
  }).then((catalog) => createStore(catalog));
  return storePromise;
}

export function isStaticDemo() {
  return document.documentElement.dataset.staticDemo === 'true' || window.location.hostname.endsWith('github.io');
}

export function createStaticRequest() {
  return async function staticRequest(path, options = {}) {
    const store = await loadStore();
    const url = new URL(path, window.location.href);

    if (url.pathname === '/api/products') {
      const tags = url.searchParams.get('tags');
      return { products: store.searchProducts({
        query: url.searchParams.get('query') ?? '',
        category: url.searchParams.get('category') ?? '',
        maxPriceCents: url.searchParams.has('maxPriceCents') ? Number(url.searchParams.get('maxPriceCents')) : undefined,
        tags: tags ? tags.split(',').filter(Boolean) : [],
        inStockOnly: url.searchParams.get('inStockOnly') === 'true',
        sort: url.searchParams.get('sort') ?? undefined,
      }) };
    }

    const productMatch = url.pathname.match(/^\/api\/products\/([^/]+)$/);
    if (productMatch) return store.getProduct(decodeURIComponent(productMatch[1]));
    if (url.pathname === '/api/cart' && (!options.method || options.method === 'GET')) return store.getCart();

    const cartMatch = url.pathname.match(/^\/api\/cart\/items\/([^/]+)$/);
    if (cartMatch && options.method === 'PUT') {
      const body = JSON.parse(options.body ?? '{}');
      return store.setCartItem({ ...body, productId: decodeURIComponent(cartMatch[1]) });
    }
    if (url.pathname === '/api/orders/test' && options.method === 'POST') {
      return store.placeTestOrder(JSON.parse(options.body ?? '{}'));
    }
    throw new Error(`Static demo does not support ${options.method ?? 'GET'} ${url.pathname}`);
  };
}
