import { buildProductQuery } from './product-query.js';

const toolDefinitions = [
  {
    name: 'search_products',
    title: 'Search products',
    description: 'Find store products by text, category, price, tags, and stock availability.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string' },
        category: { type: 'string', enum: ['headphones', 'keyboards', 'mice', 'monitors'] },
        maxPriceCents: { type: 'integer' },
        tags: { type: 'array', items: { type: 'string' } },
        inStockOnly: { type: 'boolean' },
        sort: { type: 'string', enum: ['price_asc', 'price_desc', 'rating_desc'] },
      },
    },
    annotations: { readOnlyHint: true },
  },
  {
    name: 'get_product',
    title: 'Get product',
    description: 'Get the complete product details shown on the product detail page.',
    inputSchema: {
      type: 'object',
      properties: { productId: { type: 'string' } },
      required: ['productId'],
    },
    annotations: { readOnlyHint: true },
  },
  {
    name: 'set_cart_item',
    title: 'Update cart item',
    description: 'Add, update, or remove one product color and quantity in the cart.',
    inputSchema: {
      type: 'object',
      properties: {
        productId: { type: 'string' },
        color: { type: 'string' },
        quantity: { type: 'integer', minimum: 0 },
      },
      required: ['productId', 'color', 'quantity'],
    },
    annotations: { readOnlyHint: false },
  },
  {
    name: 'get_cart',
    title: 'Get cart',
    description: 'Return the current cart lines, subtotal, shipping fee, and total.',
    inputSchema: { type: 'object', properties: {} },
    annotations: { readOnlyHint: true },
  },
  {
    name: 'place_test_order',
    title: 'Place test order',
    description: 'Place a synthetic test order using the current cart and shipping details. No payment occurs.',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        email: { type: 'string', format: 'email' },
        address: { type: 'string' },
        city: { type: 'string' },
        postalCode: { type: 'string' },
        country: { type: 'string' },
      },
      required: ['name', 'email', 'address', 'city', 'postalCode', 'country'],
    },
    annotations: { consequentialHint: true },
  },
];

function clone(value) {
  return structuredClone(value);
}

export function getWebMcpToolDefinitions() {
  return clone(toolDefinitions);
}

export function createWebMcpTools({ request }) {
  const definitions = getWebMcpToolDefinitions();
  const handlers = {
    search_products: (input = {}) => request(`/api/products?${buildProductQuery(input)}`),
    get_product: (input) => request(`/api/products/${encodeURIComponent(input.productId)}`),
    set_cart_item: (input) => request(`/api/cart/items/${encodeURIComponent(input.productId)}`, {
      method: 'PUT',
      body: JSON.stringify({ color: input.color, quantity: input.quantity }),
    }),
    get_cart: () => request('/api/cart'),
    place_test_order: (input) => request('/api/orders/test', {
      method: 'POST',
      body: JSON.stringify(input),
    }),
  };

  return Object.fromEntries(definitions.map((definition) => [
    definition.name,
    async (input, context = {}) => handlers[definition.name](input, context),
  ]));
}

export async function registerWebMcpTools(api, modelContext = globalThis.document?.modelContext ?? null) {
  const definitions = getWebMcpToolDefinitions();
  const toolNames = definitions.map((tool) => tool.name);
  if (!modelContext || typeof modelContext.registerTool !== 'function') {
    return { registered: false, apiName: null, toolNames };
  }

  const handlers = createWebMcpTools(api);
  for (const definition of definitions) {
    await modelContext.registerTool({
      ...definition,
      execute: handlers[definition.name],
    });
  }

  return { registered: true, apiName: 'document.modelContext', toolNames };
}
