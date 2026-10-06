import { createReadStream } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createStore } from './store.js';
import { createResetGuard } from './reset.js';

const rootDir = fileURLToPath(new URL('../..', import.meta.url));
const fixtureUrl = new URL('../../fixtures/catalog.json', import.meta.url);
const staticDir = join(rootDir, 'dist');
const contentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
};

function sendJson(response, status, value) {
  const body = JSON.stringify(value);
  response.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'content-length': Buffer.byteLength(body),
    'cache-control': 'no-store',
  });
  response.end(body);
}

function sendText(response, status, body, contentType) {
  response.writeHead(status, {
    'content-type': contentType,
    'content-length': Buffer.byteLength(body),
    'cache-control': 'no-store',
  });
  response.end(body);
}

function errorResponse(response, error) {
  const message = error instanceof Error ? error.message : 'request failed';
  const status = /unknown|not found/i.test(message) ? 404 : 400;
  sendJson(response, status, { error: message });
}

async function readJson(request) {
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  if (chunks.length === 0) return {};
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

function isTestRequest(request, guard) {
  const token = request.headers['x-test-token'];
  guard.assertToken(token);
}

async function serveStatic(request, response, pathname) {
  const specialFiles = { '/catalog.json': fileURLToPath(fixtureUrl) };
  const relativePath = pathname === '/' ? 'index.html' : pathname.slice(1);
  const filePath = specialFiles[pathname] ?? normalize(join(staticDir, relativePath));
  if (!specialFiles[pathname] && !filePath.startsWith(`${staticDir}/`)) {
    sendJson(response, 404, { error: 'not found' });
    return;
  }

  try {
    const body = await readFile(filePath);
    sendText(response, 200, body, contentTypes[extname(filePath)] ?? 'application/octet-stream');
  } catch {
    sendJson(response, 404, { error: 'not found' });
  }
}

export async function createBenchmarkServer({ catalog, port = 0, host = '127.0.0.1' } = {}) {
  const fixture = catalog ?? JSON.parse(await readFile(fixtureUrl, 'utf8'));
  const store = createStore(fixture);
  const resetGuard = createResetGuard();
  const resetToken = resetGuard.issueToken();

  const server = createServer(async (request, response) => {
    const requestUrl = new URL(request.url, `http://${request.headers.host ?? 'localhost'}`);
    const { pathname } = requestUrl;

    try {
      if (request.method === 'GET' && pathname === '/health') {
        sendJson(response, 200, { ok: true });
        return;
      }

      if (pathname === '/api/products' && request.method === 'GET') {
        const tags = requestUrl.searchParams.get('tags');
        const maxPrice = requestUrl.searchParams.get('maxPriceCents');
        sendJson(response, 200, {
          products: store.searchProducts({
            query: requestUrl.searchParams.get('query') ?? '',
            category: requestUrl.searchParams.get('category') ?? '',
            maxPriceCents: maxPrice ? Number(maxPrice) : undefined,
            tags: tags ? tags.split(',').filter(Boolean) : [],
            inStockOnly: requestUrl.searchParams.get('inStockOnly') === 'true',
            sort: requestUrl.searchParams.get('sort') ?? undefined,
          }),
        });
        return;
      }

      const productMatch = pathname.match(/^\/api\/products\/([^/]+)$/);
      if (productMatch && request.method === 'GET') {
        sendJson(response, 200, store.getProduct(decodeURIComponent(productMatch[1])));
        return;
      }

      if (pathname === '/api/cart' && request.method === 'GET') {
        sendJson(response, 200, store.getCart());
        return;
      }

      const cartMatch = pathname.match(/^\/api\/cart\/items\/([^/]+)$/);
      if (cartMatch && request.method === 'PUT') {
        sendJson(response, 200, store.setCartItem({
          ...await readJson(request),
          productId: decodeURIComponent(cartMatch[1]),
        }));
        return;
      }

      if (pathname === '/api/orders/test' && request.method === 'POST') {
        sendJson(response, 201, store.placeTestOrder(await readJson(request)));
        return;
      }

      if (pathname === '/api/test/reset' && request.method === 'POST') {
        isTestRequest(request, resetGuard);
        store.reset();
        sendJson(response, 200, { ok: true, snapshot: store.snapshot() });
        return;
      }

      if (pathname === '/api/state' && request.method === 'GET') {
        isTestRequest(request, resetGuard);
        sendJson(response, 200, store.snapshot());
        return;
      }

      if (request.method === 'GET') {
        await serveStatic(request, response, pathname);
        return;
      }

      sendJson(response, 404, { error: 'not found' });
    } catch (error) {
      errorResponse(response, error);
    }
  });

  await new Promise((resolve) => server.listen(port, host, resolve));
  const address = server.address();
  const actualPort = typeof address === 'object' && address ? address.port : port;

  return {
    server,
    store,
    resetToken,
    url: `http://${host}:${actualPort}`,
    close: () => new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve()))),
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT ?? 4173);
  const host = process.env.HOST ?? '127.0.0.1';
  createBenchmarkServer({ port, host }).then(({ url }) => {
    console.log(`Northstar Store listening at ${url}`);
  });
}
