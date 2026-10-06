import { useCallback, useEffect, useMemo, useState } from 'react';
import { buildProductQuery } from './product-query.js';
import { createStaticRequest, isStaticDemo } from './static-api.js';
import { ProductArt } from './ProductArt.jsx';
import { registerWebMcpTools } from './webmcp.js';

const categories = ['headphones', 'keyboards', 'mice', 'monitors'];
const defaultFilters = { query: '', category: '', feature: '', inStockOnly: false };
const emptyCart = { lines: [], subtotalCents: 0, shippingCents: 0, totalCents: 0 };
const money = (cents) => `$${(cents / 100).toFixed(2)}`;

function createRequest() {
  if (isStaticDemo()) return createStaticRequest();

  return async (path, options = {}) => {
    const response = await fetch(path, {
      ...options,
      headers: {
        'content-type': 'application/json',
        ...(options.headers ?? {}),
      },
    });
    const body = await response.json();
    if (!response.ok) throw new Error(body.error ?? 'Request failed');
    return body;
  };
}

function Rating({ value }) {
  return (
    <span className="rating">
      <svg className="rating-star" viewBox="0 0 20 20" aria-hidden="true">
        <path d="M10 1.5l2.65 5.37 5.93.86-4.29 4.18 1.01 5.91L10 15.03l-5.3 2.79 1.01-5.91-4.29-4.18 5.93-.86L10 1.5z" />
      </svg>
      {value.toFixed(1)}
    </span>
  );
}

function Header({ cartCount }) {
  return (
    <header className="site-header">
      <a className="brand" href="#catalog" aria-label="Northstar Store home">
        <span className="brand-mark">N</span>
        <h2 className="brand-name">Northstar Store</h2>
      </a>
      <nav aria-label="Primary navigation">
        <a href="#catalog">Catalog</a>
        <a href="#cart">
          Cart <span className="cart-badge" data-testid="cart-count">{cartCount}</span>
        </a>
        <a className="nav-cta" href="#checkout">Checkout</a>
      </nav>
    </header>
  );
}

function BenchmarkPanel() {
  return (
    <aside className="benchmark-panel" aria-label="Benchmark information">
      <div className="panel-topline"><span className="live-dot" /> Agent-ready store</div>
      <p>One shared cart.<br /><strong>Two ways to operate it.</strong></p>
      <div className="panel-modes"><span>WebMCP</span><span>Playwright MCP</span></div>
      <div className="panel-stats">
        <div><strong>24</strong><small>products</small></div>
        <div><strong>5</strong><small>tasks</small></div>
        <div><strong>0</strong><small>real charges</small></div>
      </div>
    </aside>
  );
}

function Filters({ filters, setFilters, resultCount, onApply }) {
  const updateFilter = (name, value) => {
    setFilters((current) => ({ ...current, [name]: value }));
  };

  return (
    <section className="catalog-toolbar" aria-label="Catalog filters">
      <div>
        <p className="eyebrow">Curated inventory</p>
        <h2>Find your next setup.</h2>
        <p className="result-count">{resultCount} deterministic products</p>
      </div>
      <form id="filters" className="filters" onSubmit={onApply}>
        <label>
          Search
          <input
            name="query"
            type="search"
            value={filters.query}
            onChange={(event) => updateFilter('query', event.target.value)}
            placeholder="Search products"
          />
        </label>
        <label>
          Category
          <span className="select-wrap">
            <select
              name="category"
              aria-label="Category"
              value={filters.category}
              onChange={(event) => updateFilter('category', event.target.value)}
            >
              <option value="">All categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category[0].toUpperCase() + category.slice(1)}
                </option>
              ))}
            </select>
            <span className="select-arrow" aria-hidden="true" />
          </span>
        </label>
        <label>
          Feature
          <span className="select-wrap">
            <select
              name="feature"
              aria-label="Feature"
              value={filters.feature}
              onChange={(event) => updateFilter('feature', event.target.value)}
            >
              <option value="">All features</option>
              <option value="noise-cancelling">Noise cancelling</option>
              <option value="wireless">Wireless</option>
              <option value="mechanical">Mechanical</option>
              <option value="gaming">Gaming</option>
            </select>
            <span className="select-arrow" aria-hidden="true" />
          </span>
        </label>
        <label className="checkbox-label">
          <input
            name="inStockOnly"
            type="checkbox"
            checked={filters.inStockOnly}
            onChange={(event) => updateFilter('inStockOnly', event.target.checked)}
          />
          <span>In stock only</span>
        </label>
        <button type="submit">Apply filters</button>
      </form>
    </section>
  );
}

function ProductCard({ product, onOpen }) {
  const stock = Object.values(product.stockByColor).reduce((total, value) => total + value, 0);

  return (
    <article className="product-card">
      <div className="product-card__art">
        <ProductArt category={product.category} />
        <span className="stock-pill">{stock > 0 ? 'In stock' : 'Sold out'}</span>
      </div>
      <div className="product-card__copy">
        <div className="product-card__meta">
          <span>{product.category}</span>
          <Rating value={product.rating} />
        </div>
        <h3>{product.name}</h3>
        <p>{product.description}</p>
      </div>
      <footer>
        <span className="price">{money(product.priceCents)}</span>
        <button type="button" data-product-id={product.id} onClick={() => onOpen(product.id)}>
          View {product.name}
        </button>
      </footer>
    </article>
  );
}

function Catalog({ products, filters, setFilters, onApply, onOpen }) {
  return (
    <section id="catalog-view" data-view="catalog" aria-labelledby="catalog-heading">
      <Filters filters={filters} setFilters={setFilters} resultCount={products.length} onApply={onApply} />
      <div id="product-grid" className="product-grid">
        {products.map((product) => <ProductCard key={product.id} product={product} onOpen={onOpen} />)}
      </div>
    </section>
  );
}

function ProductDetail({ product, onBack, onAdd }) {
  const [color, setColor] = useState(
    product.colors.find((value) => product.stockByColor[value] > 0) ?? product.colors[0],
  );
  const [quantity, setQuantity] = useState(1);
  const max = product.stockByColor[color] ?? 0;

  return (
    <section id="product-view" data-view="product" aria-labelledby="product-heading">
      <button className="text-button" type="button" data-action="back-to-catalog" onClick={onBack}>
        Back to catalog
      </button>
      <div id="product-detail" className="detail-card">
        <div>
          <ProductArt category={product.category} large />
          <p className="eyebrow">{product.category} <Rating value={product.rating} /></p>
          <h2 id="product-heading">{product.name}</h2>
          <p>{product.description}</p>
          <p className="price">{money(product.priceCents)}</p>
        </div>
        <form
          className="purchase-card"
          id="add-to-cart-form"
          onSubmit={(event) => {
            event.preventDefault();
            onAdd(product, color, Number(quantity));
          }}
        >
          <p>Choose your finish</p>
          <label>
            Color
            <span className="select-wrap">
              <select name="color" aria-label="Color" value={color} onChange={(event) => setColor(event.target.value)}>
                {product.colors.map((value) => (
                  <option key={value} value={value} disabled={product.stockByColor[value] === 0}>
                    {value} ({product.stockByColor[value]} in stock)
                  </option>
                ))}
              </select>
              <span className="select-arrow" aria-hidden="true" />
            </span>
          </label>
          <label>
            Quantity
            <input
              name="quantity"
              aria-label="Quantity"
              type="number"
              min="1"
              max={max}
              value={quantity}
              onChange={(event) => setQuantity(event.target.value)}
            />
          </label>
          <button type="submit">Add to cart</button>
          <small>Secure synthetic checkout. No payment is processed.</small>
        </form>
      </div>
    </section>
  );
}

function Cart({ cart }) {
  return (
    <section id="cart-view" data-view="cart" aria-labelledby="cart-heading" className="content-view">
      <p className="eyebrow">Your selected gear</p>
      <h2 id="cart-heading">Cart</h2>
      <div id="cart-detail" className="cart-detail">
        {cart.lines.length === 0 ? (
          <div className="empty-state">
            <strong>Your cart is waiting.</strong>
            <p>Pick a product and this benchmark state will update for both humans and agents.</p>
            <a href="#catalog">Browse catalog</a>
          </div>
        ) : (
          <>
            <div className="cart-lines">
              {cart.lines.map((line) => (
                <div className="cart-line" key={`${line.productId}-${line.color}`}>
                  <span>
                    {line.name}
                    <small>{line.color} - Qty {line.quantity}</small>
                  </span>
                  <strong>{money(line.unitPriceCents * line.quantity)}</strong>
                </div>
              ))}
            </div>
            <div className="cart-summary">
              <div><span>Subtotal</span><strong>{money(cart.subtotalCents)}</strong></div>
              <div><span>Shipping</span><strong>{money(cart.shippingCents)}</strong></div>
              <div className="cart-total"><span>Total</span><strong>{money(cart.totalCents)}</strong></div>
              <a className="button-link" href="#checkout">Continue to checkout</a>
            </div>
          </>
        )}
      </div>
    </section>
  );
}

function Checkout({ cart, onSubmit, confirmation }) {
  const itemCount = cart.lines.reduce((count, line) => count + line.quantity, 0);

  return (
    <section id="checkout-view" data-view="checkout" aria-labelledby="checkout-heading" className="content-view">
      <p className="eyebrow">Synthetic checkout</p>
      <h2 id="checkout-heading">Place a test order</h2>
      <p className="checkout-intro">The same order API is exposed to WebMCP. This form is the visual route through the identical state.</p>
      <div className="checkout-layout">
        <form id="checkout-form" className="checkout-form" onSubmit={onSubmit}>
          <label>Full name<input name="name" required /></label>
          <label>Email<input name="email" type="email" required /></label>
          <label className="full-row">Address<input name="address" required /></label>
          <label>City<input name="city" required /></label>
          <label>Postal code<input name="postalCode" required /></label>
          <label className="full-row">Country<input name="country" required /></label>
          <button type="submit" disabled={cart.lines.length === 0}>Place test order</button>
        </form>
        <aside className="order-card">
          <span>Order total</span>
          <strong>{money(cart.totalCents)}</strong>
          <small>{itemCount} item{cart.lines.length === 1 ? '' : 's'} in cart</small>
          <p>No payment details are collected.</p>
        </aside>
      </div>
      <div id="order-confirmation" className="confirmation" role="status" hidden={!confirmation}>
        {confirmation}
      </div>
    </section>
  );
}

export function App() {
  const request = useMemo(createRequest, []);
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState(emptyCart);
  const [filters, setFilters] = useState(defaultFilters);
  const [view, setView] = useState('catalog');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [status, setStatus] = useState('Synthetic store for a browser-agent benchmark. No payment is processed.');
  const [confirmation, setConfirmation] = useState('');

  const loadProducts = useCallback(async (next = defaultFilters) => {
    const query = buildProductQuery({
      query: next.query,
      category: next.category,
      tags: next.feature ? [next.feature] : [],
      inStockOnly: next.inStockOnly,
      sort: 'price_asc',
    });
    setProducts((await request(`/api/products?${query}`)).products);
  }, [request]);

  const syncRoute = useCallback(async () => {
    const hash = window.location.hash.slice(1) || 'catalog';
    if (hash === 'cart' || hash === 'checkout') {
      setCart(await request('/api/cart'));
      setView(hash);
      return;
    }
    setView('catalog');
  }, [request]);

  useEffect(() => {
    loadProducts().catch((error) => setStatus(error.message));
    request('/api/cart').then(setCart).catch((error) => setStatus(error.message));
  }, [loadProducts, request]);

  useEffect(() => {
    registerWebMcpTools({ request }).catch((error) => setStatus(error.message));
  }, [request]);

  useEffect(() => {
    const onHash = () => syncRoute().catch((error) => setStatus(error.message));
    onHash();
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, [syncRoute]);

  async function openProduct(productId) {
    setSelectedProduct(await request(`/api/products/${encodeURIComponent(productId)}`));
    setView('product');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function addToCart(product, color, quantity) {
    const next = await request(`/api/cart/items/${encodeURIComponent(product.id)}`, {
      method: 'PUT',
      body: JSON.stringify({ color, quantity }),
    });
    setCart(next);
    setStatus(`${product.name} added to cart.`);
    window.location.hash = 'cart';
  }

  async function placeOrder(event) {
    event.preventDefault();
    try {
      const order = await request('/api/orders/test', {
        method: 'POST',
        body: JSON.stringify(Object.fromEntries(new FormData(event.currentTarget))),
      });
      setCart(await request('/api/cart'));
      setConfirmation(`Order ${order.orderId} confirmed. Total ${money(order.totalCents)}. No payment was processed.`);
      setStatus('Test order created.');
    } catch (error) {
      setStatus(error.message);
    }
  }

  const cartCount = cart.lines.reduce((sum, line) => sum + line.quantity, 0);
  const applyFilters = (event) => {
    event.preventDefault();
    loadProducts(filters).catch((error) => setStatus(error.message));
  };

  return (
    <>
      <Header cartCount={cartCount} />
      <main>
        <p className="notice" role="status" data-testid="status">{status}</p>
        <section className="hero">
          <div>
            <p className="eyebrow">WebMCP Browser Benchmark</p>
            <h1>Shop the signal,<br /><em>skip the noise.</em></h1>
            <p className="hero-copy">A deterministic store built to compare browser automation with an in-page, typed agent interface.</p>
            <div className="hero-actions">
              <a className="button-link" href="#catalog">Browse catalog</a>
              <a className="text-link" href="#checkout">Try synthetic checkout <span>→</span></a>
            </div>
          </div>
          <BenchmarkPanel />
        </section>
        <div className="trust-strip">
          <span>Shared cart state</span>
          <span>Deterministic fixtures</span>
          <span>Document-level WebMCP</span>
          <span>Zero payment processing</span>
        </div>
        {view === 'catalog' && (
          <Catalog
            products={products}
            filters={filters}
            setFilters={setFilters}
            onApply={applyFilters}
            onOpen={(id) => openProduct(id).catch((error) => setStatus(error.message))}
          />
        )}
        {view === 'product' && selectedProduct && (
          <ProductDetail
            product={selectedProduct}
            onBack={() => { window.location.hash = 'catalog'; }}
            onAdd={(product, color, quantity) => addToCart(product, color, quantity).catch((error) => setStatus(error.message))}
          />
        )}
        {view === 'cart' && <Cart cart={cart} />}
        {view === 'checkout' && <Checkout cart={cart} onSubmit={placeOrder} confirmation={confirmation} />}
      </main>
      <footer className="site-footer">
        <span>Northstar Store</span>
        <span>Built for reproducible agent benchmarks</span>
      </footer>
    </>
  );
}
