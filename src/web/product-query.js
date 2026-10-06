const QUERY_KEYS = ['query', 'category', 'maxPriceCents', 'inStockOnly', 'sort'];

export function buildProductQuery(input = {}) {
  const params = new URLSearchParams();

  for (const key of QUERY_KEYS) {
    if (input[key] !== undefined && input[key] !== '') {
      params.set(key, String(input[key]));
    }
  }

  if (Array.isArray(input.tags) && input.tags.length > 0) {
    params.set('tags', input.tags.join(','));
  }

  return params.toString();
}
