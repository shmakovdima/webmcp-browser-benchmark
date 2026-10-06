const DEFAULT_SHIPPING_CENTS = 500;

function clone(value) {
  return structuredClone(value);
}

function normalizeText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function ensureInteger(value, fieldName) {
  if (!Number.isInteger(value)) {
    throw new Error(`${fieldName} must be an integer`);
  }
}

function cartSummary(lines, shippingCents) {
  const normalizedLines = clone(lines);
  const subtotalCents = normalizedLines.reduce(
    (sum, line) => sum + line.unitPriceCents * line.quantity,
    0,
  );
  const appliedShippingCents = normalizedLines.length > 0 ? shippingCents : 0;

  return {
    lines: normalizedLines,
    subtotalCents,
    shippingCents: appliedShippingCents,
    totalCents: subtotalCents + appliedShippingCents,
  };
}

function validateCheckout(input) {
  const fields = ['name', 'email', 'address', 'city', 'postalCode', 'country'];
  const shipping = Object.fromEntries(fields.map((field) => [field, normalizeText(input?.[field])]));

  for (const field of fields) {
    if (!shipping[field]) {
      throw new Error(`${field} is required`);
    }
  }
  if (!/^\S+@\S+\.\S+$/.test(shipping.email)) {
    throw new Error('email is invalid');
  }

  return shipping;
}

export function createStore(catalog, { shippingCents = DEFAULT_SHIPPING_CENTS } = {}) {
  const originalCatalog = clone(catalog);
  let products;
  let cart;
  let orders;
  let nextOrderNumber;

  function reset() {
    products = clone(originalCatalog);
    cart = [];
    orders = [];
    nextOrderNumber = 1;
  }

  function getProduct(productId) {
    const product = products.find((candidate) => candidate.id === productId);
    if (!product) {
      throw new Error(`unknown product: ${productId}`);
    }
    return clone(product);
  }

  function searchProducts(input = {}) {
    const query = normalizeText(input.query).toLowerCase();
    const category = normalizeText(input.category);
    const tags = Array.isArray(input.tags) ? input.tags.filter(Boolean) : [];
    const maxPriceCents = input.maxPriceCents;
    if (maxPriceCents !== undefined) {
      ensureInteger(maxPriceCents, 'maxPriceCents');
    }

    const result = products.filter((product) => {
      const searchable = `${product.name} ${product.description} ${product.tags.join(' ')}`.toLowerCase();
      const inStock = Object.values(product.stockByColor).some((stock) => stock > 0);
      return (
        (!query || searchable.includes(query)) &&
        (!category || product.category === category) &&
        (maxPriceCents === undefined || product.priceCents <= maxPriceCents) &&
        tags.every((tag) => product.tags.includes(tag)) &&
        (!input.inStockOnly || inStock)
      );
    });

    if (input.sort === 'price_asc') {
      result.sort((a, b) => a.priceCents - b.priceCents || a.id.localeCompare(b.id));
    } else if (input.sort === 'price_desc') {
      result.sort((a, b) => b.priceCents - a.priceCents || a.id.localeCompare(b.id));
    } else if (input.sort === 'rating_desc') {
      result.sort((a, b) => b.rating - a.rating || a.id.localeCompare(b.id));
    }

    return clone(result);
  }

  function getCart() {
    return cartSummary(cart, shippingCents);
  }

  function setCartItem({ productId, color, quantity }) {
    ensureInteger(quantity, 'quantity');
    if (quantity < 0) {
      throw new Error('quantity cannot be negative');
    }

    const product = products.find((candidate) => candidate.id === productId);
    if (!product) {
      throw new Error(`unknown product: ${productId}`);
    }
    if (!product.colors.includes(color)) {
      throw new Error(`invalid color for ${productId}`);
    }
    if (quantity > product.stockByColor[color]) {
      throw new Error(`out of stock: requested quantity exceeds stock for ${productId}`);
    }

    const existingIndex = cart.findIndex((line) => line.productId === productId && line.color === color);
    if (quantity === 0) {
      if (existingIndex >= 0) cart.splice(existingIndex, 1);
      return getCart();
    }

    const line = {
      productId,
      name: product.name,
      color,
      quantity,
      unitPriceCents: product.priceCents,
    };
    if (existingIndex >= 0) cart[existingIndex] = line;
    else cart.push(line);
    return getCart();
  }

  function placeTestOrder(input) {
    if (cart.length === 0) {
      throw new Error('cart is empty');
    }
    const shipping = validateCheckout(input);
    for (const line of cart) {
      const product = products.find((candidate) => candidate.id === line.productId);
      if (line.quantity > product.stockByColor[line.color]) {
        throw new Error(`out of stock: requested quantity exceeds stock for ${line.productId}`);
      }
    }

    const summary = getCart();
    for (const line of cart) {
      const product = products.find((candidate) => candidate.id === line.productId);
      product.stockByColor[line.color] -= line.quantity;
    }

    const order = {
      orderId: `order-${String(nextOrderNumber).padStart(4, '0')}`,
      status: 'confirmed',
      lines: clone(summary.lines),
      subtotalCents: summary.subtotalCents,
      shippingCents: summary.shippingCents,
      totalCents: summary.totalCents,
      shipping,
    };
    nextOrderNumber += 1;
    orders.push(order);
    cart = [];
    return clone(order);
  }

  function snapshot() {
    return {
      products: clone(products),
      cart: getCart(),
      orders: clone(orders),
    };
  }

  reset();
  return { searchProducts, getProduct, setCartItem, getCart, placeTestOrder, snapshot, reset };
}
