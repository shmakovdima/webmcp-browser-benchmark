Current subscription runner: `bun run benchmark T1`, pinned to `gpt-5.6-terra`. See README for raw-usage accounting and the rendered-DOM interface. The older multi-model procedure below is historical and is not the default runner.

# WebMCP benchmark runbook

This document is the restart point for the WebMCP browser benchmark. It states exactly what exists, what does not yet count as a measured result, and the required path to a valid comparison.

## Goal

Compare the same model on the same five ecommerce tasks through three interfaces:

- `webmcp`: the page exposes five WebMCP tools through `document.modelContext`.
- `playwright-mcp`: the agent operates through the restricted official Playwright MCP interface, using accessibility snapshots and element references.
- `visual`: the agent operates a browser through DOM snapshots, CSS-selector clicks, typing, scrolling, and key presses only.

Every mode must use the same synthetic store, frozen task fixture, model, task prompt, timeout, viewport, and backend oracle. The benchmark measures only the interface difference.

## Important distinction: WebMCP is not MCP

`document.modelContext` is the WebMCP browser API. It is not an MCP server and it does not expose a standalone Model Context Protocol endpoint.

The page registers tools with `document.modelContext.registerTool(...)`. A browser agent host that supports WebMCP discovers those page tools and makes them available to its model. The model then returns structured tool calls and the browser executes the corresponding registered handler in the page context.

The Playwright arm is different: it starts an actual `@playwright/mcp` process over stdio. That process is MCP. Its capability set is restricted so it cannot use screenshots, DOM evaluation, or WebMCP.

Do not describe the WebMCP arm as an MCP API test. It is a WebMCP browser API test.

## What is already implemented

- A synthetic Northstar Store, available locally and at the public demo URL.
- Shared backend semantics for both the human UI and WebMCP tool handlers.
- Five WebMCP tool definitions in `src/web/webmcp.js`:
  - `search_products`
  - `get_product`
  - `set_cart_item`
  - `get_cart`
  - `place_test_order`
- Five frozen tasks in `fixtures/tasks.json`.
- A backend-state oracle in `src/runner/oracle.js`.
- Per-run metrics and manifest helpers in `src/runner/metrics.js` and `src/runner/manifest.js`.
- Three capability-isolated mode contracts in `src/runner/modes/`.
- An official Playwright MCP stdio client and connection smoke test.
- Static GitHub Pages deployment.

Public demo: https://shmakovdima.github.io/webmcp-browser-benchmark/

The public demo is a safe static store demonstration. It contains no provider credentials, benchmark runner, private results, or live payment flow.

## Provider-backed experiment entrypoint

The provider-neutral runner is covered by unit tests, and `scripts/run-experiment.js` adds the live provider-backed path. The repository includes adapters for OpenAI, Anthropic, and the Nebius Token Factory OpenAI-compatible endpoint. Provider keys are read from environment variables only and are redacted from manifests and summaries.

The repository can therefore verify:

- page registration of the five WebMCP tools;
- the correctness of each tool handler;
- Playwright MCP process startup and snapshot access;
- capability isolation contracts;
- UI, store, checkout, reset, Pages packaging, and backend oracle.

Only completed attempts with both the backend-state oracle and final-answer oracle passing can produce publishable comparison numbers. Failed browser connections and incomplete attempts remain diagnostics and are not placed in comparison rows.

## Secrets and permission boundary

Local `.env` is ignored by Git and contains the provider credentials supplied for later tests. It must remain untracked.

Never print, copy, commit, upload, or place either credential in a command, log, result file, issue, or article. In particular, no OpenAI API call is allowed unless the user gives direct and specific permission in the current turn. Storing the credential is not permission to spend it.

Before any live run, confirm that `.env` is ignored:

```bash
git check-ignore -v .env
git status --ignored --short .env
```

Neither command should cause a credential value to appear.

## Model execution order

The source of truth is `config/benchmark.config.json`. Complete all five tasks in all three modes for both models in a pair before moving to the next pair.

1. Required first pair: GPT-6.1 Sol (`gpt-6.1-sol`) and Claude Sonnet 5.5 (`claude-sonnet-5-5`).
2. Only if budget remains after Pair 1: GPT-5.6 Terra (`gpt-5.6-terra`) and Claude Opus 5.5 (`claude-opus-5-5`).
3. Only if budget remains after Pair 2: GPT-5.6 Luna (`gpt-5.6-luna`) and Claude Haiku 4.5 (`claude-haiku-4-5-20251001`).

Do not substitute model names, mix pairs, or start a later pair early. Record the exact returned provider model identifier and API version in every run manifest.

## Frozen tasks and success condition

| Task | Required outcome |
| --- | --- |
| T1 | Find Sonic Lite ANC at $129.00 without changing cart or orders. |
| T2 | Put two black Sonic Lite ANC units in the cart, subtotal $258.00, without ordering. |
| T3 | Order one black Sonic Lite ANC for the fixed synthetic recipient, total $134.00. |
| T4 | Compare the two eligible ANC headphones and report Sonic Lite ANC with a $20.00 difference, without changing state. |
| T5 | Perform a multi-step cart change, retain two black Sonic Lite ANC units, remove the keyboard, and place an order totalling $263.00. |

A task passes only if both conditions are true:

1. The backend-state oracle passes.
2. The model's final answer contains the required result.

The final message alone is never enough. It may claim success while the store state is wrong.

## Capability contracts

| Mode | Allowed observations and actions | Explicitly forbidden |
| --- | --- | --- |
| `webmcp` | navigation and WebMCP structured tool calls | screenshot, DOM, accessibility snapshot |
| `playwright-mcp` | navigation, accessibility snapshot, element refs, reference clicks, typing and keys | screenshot, DOM evaluation, WebMCP tools |
| `visual` | DOM snapshots, CSS-selector clicks, typing, keys and scrolling | screenshots, accessibility snapshot, WebMCP tools |

The benchmark runner must reject a run that violates its mode contract. No fallback from WebMCP to DOM or from visual control to accessibility should be silent.

## After reboot: restore the local environment

From the benchmark directory:

```bash
cd /Users/shmakovdima/doka/webmcp-browser-benchmark
bun install
bun run test
bun run lint:check
bun run test:browser
bun run test:playwright-mcp
bun run test:pages:browser
```

Run the commands sequentially. Browser tests compete for the same local port when run concurrently.

Start the local staging store:

```bash
bun run start
```

Open `http://127.0.0.1:4173/`. The health endpoint is `http://127.0.0.1:4173/health` and should return `{"ok":true}`.

The local service is in-memory. Restart it before every task attempt, or add an explicit reset call to the runner, so each task starts from the same seeded state.

## Checks that are safe to run now

These commands make no provider request and spend no API money:

```bash
bun run smoke:dry
bun run smoke:playwright-mcp
bun run test
bun run lint:check
bun run test:browser
bun run test:playwright-mcp
bun run test:pages:browser
```

`bun run smoke:dry` only validates the WebMCP mode contract. It does not prove a model used WebMCP.

## Required implementation before a live benchmark

Implement this before invoking any provider API.

1. Add a provider adapter for OpenAI and a provider adapter for Anthropic. Each adapter must return structured tool calls, final text, provider-reported token fields, provider request ID, and model ID.
2. Add a browser-agent host for the WebMCP mode. It must load the page in a WebMCP-capable browser context, obtain the tools registered through `document.modelContext`, give only their schemas to the model, execute returned tool calls through the browser's WebMCP path, and return the structured tool result to the model. It must not expose DOM, screenshots, or accessibility data.
3. Connect the existing restricted Playwright MCP client to the same model turn loop. Only the five allowed Playwright MCP tools may reach the model.
4. Add a visual browser driver that supplies only DOM snapshots and CSS-selector interaction tools to the same model turn loop. It must not surface screenshots, accessibility snapshots, or WebMCP tools.
5. Build one shared agent loop for all modes: provide the frozen task prompt, call the provider, dispatch only permitted tools, append tool outputs, stop at final text or the configured limit, and record every event.
6. Reset the store before every attempt, then fetch the backend snapshot after the loop ends and run the oracle.
7. Write one JSONL event log and one redacted manifest per attempt. Put generated results in an ignored results directory until they are reviewed.
8. Add tests that prove each adapter normalizes token fields without estimating missing values, that forbidden capabilities fail closed, that resets occur, and that result files never contain a credential.

The WebMCP host in item 2 is the key missing piece. A direct call to `createWebMcpTools()` is useful for unit tests but is not a native end-to-end WebMCP run. It bypasses the browser agent host, so it cannot support the claim that an agent actually consumed the WebMCP page API.

## How a valid WebMCP attempt must work

1. Start a fresh local store and load the page in the WebMCP-capable browser host.
2. Verify that the page registered exactly the five expected tools through `document.modelContext.registerTool(...)`.
3. Give the model the frozen task prompt and only those five tool schemas.
4. When the model chooses a tool, invoke it through the WebMCP host, not by reading the DOM and not by calling the server API from the runner.
5. Return the tool's structured result to the model.
6. Continue until final answer, timeout, or turn limit.
7. Read backend state only after the run for oracle validation. That state must never be sent to the model during the run.
8. Persist redacted trace, provider usage fields, elapsed time, tool-call count, final answer, oracle verdict, and failure category.

The equivalent Playwright and visual attempts must use the same start state and prompt. Only the available interface may differ.

## Token and timing rules

For every provider response, record separately when available:

- input tokens;
- cached input tokens;
- output tokens;
- reasoning tokens;
- provider total tokens;
- request elapsed time;
- tool-call count;
- observation byte count.

Never invent or infer token counts. If a provider does not report a field, write `null` for that field and retain the raw normalized usage object. Do not compare a raw CLI session total with provider API token usage.

Wall-clock measurement begins immediately before the first provider request and ends after the final answer or terminal failure. Include browser and tool execution time. Report model requests and tool calls separately from elapsed time.

## Speed measurement protocol

Yes, the benchmark can compare speed. The primary speed metric is task completion time: the monotonic-clock duration from the first provider request for a task until the model returns its final answer or the run reaches a terminal failure. It includes model inference, tool calls, browser interaction, and tool-result round trips. It excludes store startup, browser launch, fixture reset, and the backend oracle, because those are setup costs rather than work required to complete the task.

Record these timestamps for every attempt:

- `firstProviderRequestAt`
- `firstActionAt`, the first tool call or browser action
- `finalAnswerAt`
- `terminalAt`
- `providerRequestElapsedMs` for every model request
- `toolElapsedMs` for every tool call or browser action

Derive these values:

- `taskCompletionMs`: `terminalAt - firstProviderRequestAt`
- `timeToFirstActionMs`: `firstActionAt - firstProviderRequestAt`
- `providerWallTimeMs`: sum of individual provider request durations
- `toolWallTimeMs`: sum of individual tool and browser-action durations
- `orchestrationOverheadMs`: task completion time minus provider and tool wall time, when all timestamps are available

Use a monotonic clock such as `performance.now()` or `process.hrtime.bigint()`, not wall-clock timestamps, for duration calculations. Keep ISO timestamps only for trace ordering.

For a fair comparison, run every mode against the same local server on the same machine, with the same viewport, task, model, prompt, timeout, and reset state. Browser startup and page loading must occur before the timed interval in every mode. Do not compare an API model request made on one day with a browser run made under different network conditions as if the timing difference were caused solely by WebMCP.

Report both per-attempt times and a summary per model, task, and mode. Until repeat count is fixed, describe timing as individual observed attempts, not a stable performance claim. If repeat runs are approved, use the same repeat count and task order for all three modes, retain failures and timeouts, and report median plus all raw attempts.

## Pilot and full-run gates

Run in this order:

1. Dry-run: no provider request. Validate contracts and fixtures.
2. Smoke: one task, one mode, one model. Confirm the provider adapter, trace format, reset, oracle, and no credential leakage.
3. Pilot: all five tasks for one model across all three modes. Inspect every trace and correct deterministic defects.
4. Full Pair 1: all five tasks in all three modes for both required models. Repeat policy must be fixed before starting and applied identically to all modes.
5. Later pairs: only after the user confirms budget remains.

`FULL_BENCHMARK_APPROVED=1` is required by the existing runner for the full stage. That flag is not a substitute for the user's explicit current-turn permission to use a provider credential.

## Result schema required for each attempt

Each attempt needs a redacted manifest and event stream containing at least:

```json
{
  "runId": "immutable-run-id",
  "stage": "smoke",
  "provider": "openai-or-anthropic",
  "requestedModelId": "frozen-model-id",
  "returnedModelId": "provider-returned-id",
  "mode": "webmcp-or-playwright-mcp-or-visual",
  "taskId": "T1-through-T5",
  "fixtureChecksums": {
    "catalog": "sha256",
    "tasks": "sha256"
  },
  "usage": {
    "inputTokens": null,
    "cachedInputTokens": null,
    "outputTokens": null,
    "reasoningTokens": null,
    "totalTokens": null
  },
  "wallTimeMs": 0,
  "modelRequests": 0,
  "toolCalls": 0,
  "finalAnswer": "model response",
  "oraclePassed": false,
  "finalAnswerPassed": false,
  "failureCategory": "null-or-defined-category"
}
```

The raw provider response may be retained only if it is redacted before writing. Provider authorization headers and credentials must never be persisted.

## Publication rule

Do not claim that WebMCP saves tokens, time, money, or failures until a complete, frozen, provider-measured run exists. A truthful interim statement is:

`The benchmark infrastructure and capability boundaries are implemented. Provider-backed measurements are pending.`

## Repository and deployment facts

- Repository: https://github.com/shmakovdima/webmcp-browser-benchmark
- Public demo: https://shmakovdima.github.io/webmcp-browser-benchmark/
- Pages deploy source: `.github/workflows/pages.yml`
- Benchmark configuration: `config/benchmark.config.json`
- Frozen tasks: `fixtures/tasks.json`
- WebMCP page implementation: `src/web/webmcp.js`
- Runner boundary: `src/runner/run.js`

The current branch already has the static demo, its Pages deployment, and the documentation commits pushed. This runbook is local until it is deliberately reviewed, committed, and pushed.
