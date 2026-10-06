# WebMCP Browser Benchmark

This is a reproducible synthetic ecommerce benchmark for comparing three browser-agent interfaces:

- visual browser control through screenshots and coordinates;
- Playwright MCP through accessibility snapshots and element references;
- WebMCP through `document.modelContext` tools and structured results.

The benchmark asks the same model to complete the same shopping tasks against the same seeded store. It records provider-reported input, output, cached, reasoning, and total tokens, plus elapsed time, tool calls, invalid actions, and backend-state success.

The benchmark is allowed to show that WebMCP loses. No result is considered valid until it comes from a frozen measured run.

## Local setup

Requires Bun 1.3 or newer. The repository intentionally uses Bun for installation, scripts, tests, and the local server.

```bash
bun install
bun run test
bun run lint:check
bun run start
```

Open `http://127.0.0.1:4173/`.

The store is synthetic. Checkout creates a test order and never contacts a payment provider.

## Staging status and local run

The staging demo is ready. It includes the synthetic catalog, category and feature filters, product details, cart, checkout, and the WebMCP tool surface backed by the same store as the human UI. It does not use model-provider keys or make real payments.

Run the staging server locally:

```bash
cd /Users/shmakovdima/doka/webmcp-browser-benchmark
bun install
bun run start
```

Open `http://127.0.0.1:4173/` in Chrome. The server should print `Northstar Store listening at http://127.0.0.1:4173`.

Check that the server is alive from a second terminal:

```bash
curl http://127.0.0.1:4173/health
```

Expected response:

```json
{"ok":true}
```

The staging server is local and uses an in-memory synthetic store. Restarting it resets the state. For the static public version, use the [GitHub Pages instructions](#publish-this-folder-to-github-pages) below.

## Browser tests

Browser tests run through Playwright but compare agent interfaces, not direct Playwright API calls. Playwright is the browser driver used to open the same page and run deterministic UI checks.

The browser test uses the locally installed Google Chrome channel, so a system Chrome installation is required:

```bash
bun run test:browser
```

The test opens a temporary localhost server, checks `/health`, filters the catalog, adds two headphones, validates subtotal and total, and creates a synthetic checkout order.

## Playwright MCP connection

The official `@playwright/mcp` server is wired through the MCP SDK over stdio. The connection smoke test starts the local store, launches headless system Chrome, navigates through `browser_navigate`, and reads `browser_snapshot`:

```bash
bun run test:playwright-mcp
bun run smoke:playwright-mcp
```

The MCP server itself exposes more tools than the comparison allows, including screenshot and evaluation tools. The benchmark filters the server result before it reaches the model and exposes only `browser_navigate`, `browser_snapshot`, `browser_click`, `browser_type`, and `browser_press_key`. The server also starts with `--no-webmcp`, so the Playwright MCP arm cannot consume the page's WebMCP tools.

## Test tasks

The frozen fixture contains five tasks:

- T1 finds the cheapest in-stock noise-cancelling headphones under $200;
- T2 configures two black headphones and checks the cart;
- T3 completes a synthetic test order;
- T4 compares two eligible products;
- T5 changes a multi-line cart before completing a test order.

The expected state is validated against the backend, not only against the model's final text.

## Dry-run pipeline

Dry-run checks the mode and task contracts without a model call or provider key:

```bash
bun run smoke:dry
```

Measured execution requires an explicit model identifier:

```bash
MODEL_ID=your-frozen-model bun src/runner/run.js --stage smoke --mode webmcp --task T1
```

The current runner stops at the provider-neutral contract boundary until a model provider adapter is configured for the experiment. The official Playwright MCP process wiring is present and covered by a separate local smoke test. Do not treat a `ready` response as a benchmark result.

The full stage additionally requires a deliberate approval flag:

```bash
FULL_BENCHMARK_APPROVED=1 MODEL_ID=your-frozen-model bun src/runner/run.js --stage full --mode webmcp --task T1
```

No smoke, pilot, or full model run is part of `bun run test` or application startup.

## Public demo

The app has two deployment targets:

- GitHub Pages for a self-contained static demo with browser-local store state;
- a Bun Node service for local or private benchmark runs.

Build the Pages artifact with:

```bash
bun run build:pages
```

The generated `site/` folder is repository-subpath safe and is deployed by [.github/workflows/pages.yml](.github/workflows/pages.yml). See [deploy/README.md](deploy/README.md). The public demo exposes the synthetic store and WebMCP tools only. It does not expose the benchmark runner, model keys, or private state.

## Publish this folder to GitHub Pages

Run these commands from this folder:

```bash
git init
git add .
git commit -m "feat: publish WebMCP browser benchmark"
git branch -M main
git remote add origin https://github.com/<your-account>/<your-repository>.git
git push -u origin main
```

Then open the repository on GitHub and select `Settings -> Pages`. Set `Source` to `GitHub Actions`. The workflow at `.github/workflows/pages.yml` will build the static demo and deploy it after every push to `main`.

The public URL will be:

```text
https://<your-account>.github.io/<your-repository>/
```

The exact deployed URL is also printed in the `Deploy WebMCP benchmark` workflow run under the `github-pages` environment.

## WebMCP surface

The page registers exactly five imperative tools through `document.modelContext.registerTool(...)` when the browser supports the current WebMCP API:

- `search_products`;
- `get_product`;
- `set_cart_item`;
- `get_cart`;
- `place_test_order`.

When WebMCP is not available, the human UI remains functional and registration returns a safe no-support result.

## Official sources used for the API boundary

These sources were checked on 2026-10-06:

- [Chrome WebMCP overview](https://developer.chrome.com/docs/ai/webmcp)
- [Chrome WebMCP Imperative API](https://developer.chrome.com/docs/ai/webmcp/imperative-api)
- [Chrome WebMCP security](https://developer.chrome.com/docs/ai/webmcp/secure-tools)
- [WebMCP living specification](https://github.com/webmachinelearning/webmcp/blob/main/index.bs)
- [Playwright MCP repository](https://github.com/microsoft/playwright-mcp)

The WebMCP API is still evolving. This benchmark intentionally freezes the implementation to `document.modelContext` and records the exact browser and API surface in a future run manifest.

## Project status

Implemented locally:

- staging demo ready for local run and GitHub Pages deployment;
- deterministic store and reset state;
- accessible UI and checkout flow;
- five WebMCP tool definitions backed by the same API as the UI;
- oracle, metrics, manifest, capability-isolated mode contracts, and dry-run guard;
- official Playwright MCP stdio client, capability filter, and local connection smoke test;
- Bun tests and deployment packaging.

Still required before publishing benchmark numbers:

- provider adapter with actual token usage;
- frozen smoke and pilot runs;
- separate approval before the full run;
- aggregate result files and the HackerNoon article drafts.
