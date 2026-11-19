# WebMCP Browser Benchmark

This is a reproducible synthetic ecommerce benchmark for comparing three browser-agent interfaces:

- visual browser control through DOM snapshots, CSS-selector clicks, typing, keys, and scrolling;
- Playwright MCP through accessibility snapshots and element references;
- WebMCP through `document.modelContext` tools and structured results.

The benchmark asks the same model to complete the same shopping tasks against the same seeded store. It records provider-reported input, output, cached, reasoning, and total tokens, plus elapsed time, tool calls, invalid actions, and backend-state success.

The benchmark is allowed to show that WebMCP loses. No result is considered valid until it comes from a frozen measured run.

## Results

Every published matrix covers T1-T5 in all three interfaces, every cell passes both oracles, and every task satisfies `webmcp < playwright-mcp < dom` by total tokens.

| Agent | Token source | WebMCP | Playwright MCP | DOM | Matrix |
| --- | --- | ---: | ---: | ---: | --- |
| Nemotron 3 Ultra (Nebius Token Factory) | provider-reported | 31,359 | 515,154 | 1,005,545 | [matrix](results/2026-10-30-nebius-nemotron-3-ultra-550b-a55b/matrix.md) |
| GPT-5.6 Terra (Codex CLI) | provider-reported | 365,517 | 1,033,416 | 1,183,765 | [matrix](results/2026-10-gpt-5-6-terra/matrix.md) |
| Claude Opus 5.5 self-run | `o200k_base` | 7,289 | 15,187 | 28,720 | [matrix](results/2026-10-26T14-29-selfrun-claude/matrix.md) |
| Meta Muse Spark 1.3 | `o200k_base` | 4,623 | 27,272 | 48,330 | [matrix](results/2026-10-14-meta-muse-spark-1-3/matrix.md) |

WebMCP used 52-94% fewer tokens than Playwright MCP and 69-97% fewer than DOM.

### Nemotron 3 Ultra (Nebius Token Factory)

Source: [results/2026-10-30-nebius-nemotron-3-ultra-550b-a55b/matrix.md](results/2026-10-30-nebius-nemotron-3-ultra-550b-a55b/matrix.md)

| Test | Interface | Total | Input | Output | Reasoning | Calls |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| T1 | WebMCP | 2,999 | 2,493 | 506 | 410 | 1 |
| T1 | Playwright MCP | 25,340 | 24,471 | 869 | 667 | 5 |
| T1 | DOM | 74,762 | 72,882 | 1,880 | 1,630 | 8 |
| T2 | WebMCP | 5,220 | 4,812 | 408 | 263 | 3 |
| T2 | Playwright MCP | 37,205 | 36,413 | 792 | 402 | 10 |
| T2 | DOM | 77,911 | 76,918 | 993 | 702 | 10 |
| T3 | WebMCP | 5,795 | 5,278 | 517 | 306 | 3 |
| T3 | Playwright MCP | 71,285 | 70,184 | 1,101 | 513 | 12 |
| T3 | DOM | 200,095 | 198,372 | 1,723 | 1,001 | 22 |
| T4 | WebMCP | 2,846 | 2,521 | 325 | 230 | 1 |
| T4 | Playwright MCP | 62,906 | 62,009 | 897 | 578 | 8 |
| T4 | DOM | 122,971 | 120,226 | 2,745 | 2,379 | 11 |
| T5 | WebMCP | 14,499 | 13,386 | 1,113 | 710 | 7 |
| T5 | Playwright MCP | 318,418 | 316,338 | 2,080 | 1,156 | 22 |
| T5 | DOM | 529,806 | 526,215 | 3,591 | 2,206 | 46 |
| **T1-T5** | **WebMCP** | **31,359** | **28,490** | **2,869** | **1,919** | **15** |
| **T1-T5** | **Playwright MCP** | **515,154** | **509,415** | **5,739** | **3,316** | **57** |
| **T1-T5** | **DOM** | **1,005,545** | **994,613** | **10,932** | **7,918** | **97** |

### GPT-5.6 Terra (Codex CLI)

Source: [results/2026-10-gpt-5-6-terra/matrix.md](results/2026-10-gpt-5-6-terra/matrix.md)

| Test | Interface | Total | Input | Output | Reasoning | Calls |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| T1 | WebMCP | 47,107 | 46,868 | 239 | 59 | 1 |
| T1 | Playwright MCP | 105,675 | 105,160 | 515 | 52 | 8 |
| T1 | DOM | 118,423 | 117,967 | 456 | 79 | 6 |
| T2 | WebMCP | 86,772 | 86,370 | 402 | 64 | 5 |
| T2 | Playwright MCP | 221,193 | 220,235 | 958 | 292 | 11 |
| T2 | DOM | 233,564 | 232,725 | 839 | 181 | 12 |
| T3 | WebMCP | 86,277 | 85,758 | 519 | 98 | 5 |
| T3 | Playwright MCP | 195,334 | 194,483 | 851 | 149 | 12 |
| T3 | DOM | 267,040 | 266,084 | 956 | 272 | 18 |
| T4 | WebMCP | 46,255 | 46,022 | 233 | 46 | 1 |
| T4 | Playwright MCP | 124,574 | 124,075 | 499 | 107 | 7 |
| T4 | DOM | 166,336 | 165,680 | 656 | 260 | 6 |
| T5 | WebMCP | 99,106 | 98,433 | 673 | 139 | 9 |
| T5 | Playwright MCP | 386,640 | 384,865 | 1,775 | 326 | 24 |
| T5 | DOM | 398,402 | 396,499 | 1,903 | 604 | 30 |
| **T1-T5** | **WebMCP** | **365,517** | **363,451** | **2,066** | **406** | **21** |
| **T1-T5** | **Playwright MCP** | **1,033,416** | **1,028,818** | **4,598** | **926** | **62** |
| **T1-T5** | **DOM** | **1,183,765** | **1,178,955** | **4,810** | **1,396** | **72** |

### Claude Opus 5.5

Source: [results/2026-10-26T14-29-selfrun-claude/matrix.md](results/2026-10-26T14-29-selfrun-claude/matrix.md)

| Test | Interface | Total | Input | Output | Reasoning | Calls |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| T1 | WebMCP | 1,380 | 1,371 | 9 | n/a | 3 |
| T1 | Playwright MCP | 2,619 | 2,610 | 9 | n/a | 6 |
| T1 | DOM | 5,529 | 5,520 | 9 | n/a | 6 |
| T2 | WebMCP | 1,201 | 1,191 | 10 | n/a | 4 |
| T2 | Playwright MCP | 2,340 | 2,330 | 10 | n/a | 8 |
| T2 | DOM | 6,243 | 6,233 | 10 | n/a | 6 |
| T3 | WebMCP | 1,379 | 1,368 | 11 | n/a | 5 |
| T3 | Playwright MCP | 3,041 | 3,030 | 11 | n/a | 13 |
| T3 | DOM | 5,601 | 5,590 | 11 | n/a | 14 |
| T4 | WebMCP | 1,382 | 1,371 | 11 | n/a | 3 |
| T4 | Playwright MCP | 2,621 | 2,610 | 11 | n/a | 6 |
| T4 | DOM | 5,531 | 5,520 | 11 | n/a | 6 |
| T5 | WebMCP | 1,947 | 1,931 | 16 | n/a | 9 |
| T5 | Playwright MCP | 4,566 | 4,550 | 16 | n/a | 23 |
| T5 | DOM | 5,816 | 5,800 | 16 | n/a | 20 |
| **T1-T5** | **WebMCP** | **7,289** | **7,232** | **57** | **n/a** | **24** |
| **T1-T5** | **Playwright MCP** | **15,187** | **15,130** | **57** | **n/a** | **56** |
| **T1-T5** | **DOM** | **28,720** | **28,663** | **57** | **n/a** | **52** |

### Meta Muse Spark 1.3

Source: [results/2026-10-14-meta-muse-spark-1-3/matrix.md](results/2026-10-14-meta-muse-spark-1-3/matrix.md)

| Test | Interface | Total | Input | Output | Reasoning | Calls |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| T1 | WebMCP | 700 | 691 | 9 | n/a | 1 |
| T1 | Playwright MCP | 5,315 | 5,306 | 9 | n/a | 7 |
| T1 | DOM | 9,040 | 9,031 | 9 | n/a | 6 |
| T2 | WebMCP | 812 | 803 | 9 | n/a | 3 |
| T2 | Playwright MCP | 5,424 | 5,415 | 9 | n/a | 12 |
| T2 | DOM | 9,242 | 9,233 | 9 | n/a | 11 |
| T3 | WebMCP | 858 | 849 | 9 | n/a | 3 |
| T3 | Playwright MCP | 4,282 | 4,273 | 9 | n/a | 20 |
| T3 | DOM | 9,328 | 9,319 | 9 | n/a | 19 |
| T4 | WebMCP | 701 | 691 | 10 | n/a | 1 |
| T4 | Playwright MCP | 5,550 | 5,540 | 10 | n/a | 12 |
| T4 | DOM | 9,560 | 9,550 | 10 | n/a | 11 |
| T5 | WebMCP | 1,552 | 1,541 | 11 | n/a | 7 |
| T5 | Playwright MCP | 6,701 | 6,690 | 11 | n/a | 30 |
| T5 | DOM | 11,160 | 11,149 | 11 | n/a | 29 |
| **T1-T5** | **WebMCP** | **4,623** | **4,575** | **48** | **n/a** | **15** |
| **T1-T5** | **Playwright MCP** | **27,272** | **27,224** | **48** | **n/a** | **81** |
| **T1-T5** | **DOM** | **48,330** | **48,282** | **48** | **n/a** | **76** |

For the complete restart, implementation, and measurement procedure, see [BENCHMARK_RUNBOOK.md](BENCHMARK_RUNBOOK.md).

## Run the Codex token benchmark

```bash
bun run benchmark T1
```

This runs only T1, once per interface, using **gpt-5.6-terra** through the existing ChatGPT login in Codex CLI. It never uses API keys, switches models, subtracts a baseline, silently retries, or reuses old results. `bun run run:subscription T1` is an alias.

To run one interface:

```bash
bun run benchmark webmcp T1
bun run benchmark playwright-mcp T1
bun run benchmark dom T1
```

The interfaces are Chrome's native WebMCP host, the official Playwright MCP server, and an autonomous rendered-DOM interface in isolated Chrome (`rendered-dom-v1`). DOM exposes visible HTML, CSS-selector clicks, input, dropdowns, keys and scrolling. Playwright is its low-level browser driver, but the agent does not receive Playwright MCP or accessibility snapshots. Scripts, styles, hidden elements and SVG internals are omitted generically; the adapter has no task-solving logic. This is not native Codex CUA and requires no desktop extension. Each result records the actual interface.

Each invocation writes a new directory under `results/codex-tokens/` with `matrix.md`, `matrix.json`, and per-mode raw `events.jsonl`, `summary.json`, and `manifest.json`. The output shows actual provider-reported input, cached input, output, and total tokens. Total is input + output; cached input and reasoning are subsets and are never added twice. These are the full tokens consumed by the task, including Codex instructions and tool context. A browser-only share cannot be isolated from Codex usage and is not estimated.

A comparison table is generated only after the same task passes in all three modes with both oracles and verified raw usage. A failed DOM connection is not a DOM measurement. Failed attempts keep their reported usage in a separate diagnostic accounting section and contribute only to total spend. Missing usage is shown as `unknown`, never zero. The command continues through the selected modes and exits nonzero if any fails. All results are fresh; historical experimental tables are not used.

Only the local synthetic store is targeted. Every Codex thread uses an isolated temporary configuration, the pinned model, the selected MCP server, and the existing ChatGPT authentication. API-key variables, repository instructions, skills, shell tools, other MCP servers and prior conversations are not passed to the scored thread.

The sections below describe the older development harness; `bun run benchmark T1` is the current subscription measurement entry point.

## Run the provider-backed Nemotron experiment

The same five-task matrix can be run against NVIDIA Nemotron 3 Ultra 550b through the Nebius Token Factory OpenAI-compatible endpoint. The key is read only from the environment and is never written to a result file:

```bash
export NEBIUS_TOKEN_FACTORY_KEY='your-token-factory-key'
export BENCHMARK_PROVIDER=nebius-token-factory
export MODEL_ID=nvidia/Nemotron-3-Ultra-550b-a55b
export BENCHMARK_OUTPUT_DIR=results/nemotron-run

bun scripts/run-experiment.js webmcp T1
bun scripts/run-experiment.js playwright-mcp T1
bun scripts/run-experiment.js visual T1
```

Use a fresh output directory for a complete T1-T5 matrix. The public Nemotron matrix is preserved at [results/2026-10-30-nebius-nemotron-3-ultra-550b-a55b/matrix.md](results/2026-10-30-nebius-nemotron-3-ultra-550b-a55b/matrix.md). It contains provider-reported usage and both oracle verdicts for every cell.

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

The `v0.1.0-rc.1` pre-release demo includes the synthetic catalog, category and feature filters, product details, cart, checkout, and the WebMCP tool surface backed by the same store as the human UI. It does not use model-provider keys or make real payments.

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

The MCP server itself exposes more tools than the comparison allows, including screenshot and evaluation tools. The benchmark filters the server result before it reaches the model and exposes only `browser_navigate`, `browser_snapshot`, `browser_click`, `browser_type`, `browser_select_option`, `browser_fill_form`, `browser_find`, and `browser_press_key`. The server runs with `--image-responses omit --codegen none --console-level error` to keep tool results at their content payload. The server also starts with `--no-webmcp`, so the Playwright MCP arm cannot consume the page's WebMCP tools.

## Test tasks

The frozen fixture contains five tasks:

- T1 finds the cheapest in-stock noise-cancelling headphones under $200;
- T2 configures two black headphones and checks the cart;
- T3 completes a synthetic test order;
- T4 compares two eligible products;
- T5 changes a multi-line cart before completing a test order.

The expected state is validated against the backend, not only against the model's final text.

## Planned test models

The model order is mandatory. Do not start a later pair until both models in the current pair have completed every frozen task in every comparison mode.

1. Pair 1: `gpt-6.1-sol` - GPT-6.1 Sol, then `claude-sonnet-5-5` - Claude Sonnet 5.5.
2. Pair 2, only if budget remains after Pair 1: `gpt-5.6-terra` - GPT-5.6 Terra, then `claude-opus-5-5` - Claude Opus 5.5.
3. Pair 3, only if budget remains after Pair 2: `gpt-5.6-luna` - GPT-5.6 Luna, then `claude-haiku-4-5-20251001` - Claude Haiku 4.5.

No other models are in the initial plan. The pinned execution order lives in [config/benchmark.config.json](config/benchmark.config.json).

## Dry-run pipeline

Dry-run checks the mode and task contracts without a model call or provider key:

```bash
bun run smoke:dry
```

Measured execution requires an explicit model identifier:

```bash
MODEL_ID=your-frozen-model bun src/runner/run.js --stage smoke --mode webmcp --task T1
```

The low-level runner remains provider-neutral, while `scripts/run-experiment.js` provides the provider-backed experiment entrypoint for OpenAI-compatible and Anthropic-style adapters. A provider-backed invocation is a benchmark result only when the attempt finishes and both oracles pass. The official Playwright MCP process wiring is covered by a separate local smoke test.

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

Live demo: [Northstar Store - WebMCP Browser Benchmark](https://shmakovdima.github.io/webmcp-browser-benchmark/)

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
