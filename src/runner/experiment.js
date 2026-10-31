import { randomUUID } from 'node:crypto';
import { createBenchmarkServer } from '../server/server.js';
import { createManifest } from './manifest.js';
import { createPlaywrightMcpClient } from './playwright-mcp-client.js';
import { createChromeDevToolsMcpClient } from './chrome-devtools-mcp-client.js';
import { createPlaywrightMcpMode } from './modes/playwright-mcp.js';
import { createWebMcpRuntime } from './runtimes/webmcp.js';
import { createPlaywrightMcpRuntime } from './runtimes/playwright-mcp.js';
import { createDomRuntime } from './runtimes/dom.js';
import { writeAttemptResult } from './result-writer.js';
import { getTask, runBenchmark } from './run.js';
import { buildScoredPrompt } from './final-benchmark.js';

async function createDefaultRuntime({ mode, targetUrl }) {
  if (mode === 'webmcp') {
    return createWebMcpRuntime({ client: createChromeDevToolsMcpClient({ targetUrl }) });
  }
  if (mode === 'playwright-mcp') {
    const modeContract = createPlaywrightMcpMode();
    return createPlaywrightMcpRuntime({
      client: createPlaywrightMcpClient({ targetUrl }),
      allowedToolNames: modeContract.allowedToolNames,
    });
  }
  if (mode === 'visual') return createDomRuntime({ targetUrl });
  throw new Error(`unknown benchmark mode: ${mode}`);
}
export async function executeExperimentAttempt({
  mode,
  taskId,
  stage = 'smoke',
  provider,
  outputDir = 'results',
  runId = randomUUID(),
  createServer = createBenchmarkServer,
  createRuntime = createDefaultRuntime,
} = {}) {
  if (!provider || typeof provider.complete !== 'function') throw new Error('experiment requires a configured provider');
  let server;
  let runtime;
  let manifest;
  try {
    server = await createServer();
    server.store.reset();
    runtime = await createRuntime({ mode, targetUrl: server.url });
    manifest = createManifest({
      mode,
      modelId: provider.model,
      providerConfig: { provider: provider.provider, model: provider.model },
    });
    const scoredPrompt = `${buildScoredPrompt(mode, server.url, getTask(taskId).prompt)}\nIf a tool returns an error, do not repeat the same failed call. Re-read the current page state and choose a corrected selector or action.\nFor comparisons and numeric answers, collect every matching item from the current page, identify the requested items by the stated filters, and calculate the result from their displayed values before answering. For a two-cheapest comparison, explicitly verify that the second item is the second-lowest qualifying price, then subtract lower from higher.\nBefore returning the final answer, verify every requested constraint and numeric calculation against the current page state. Do not guess or rely on an earlier observation.`;
    const result = await runBenchmark({
      mode,
      taskId,
      stage,
      modelId: provider.model,
      provider,
      prompt: scoredPrompt,
      runtime: {
        ...runtime,
        getSnapshot: async () => server.store.snapshot(),
      },
    });
    const resultPaths = await writeAttemptResult({
      outputDir,
      runId,
      manifest,
      summary: result,
      events: result.events,
    });
    return { ...result, resultPaths };
  } catch (error) {
    const failure = {
      status: 'failed',
      mode,
      taskId,
      stage,
      modelId: provider.model,
      error: error instanceof Error ? error.message : String(error),
      events: error?.events ?? [],
      metrics: error?.metrics ?? null,
      oraclePassed: false,
      finalAnswerPassed: false,
    };
    const resultPaths = await writeAttemptResult({
      outputDir,
      runId,
      manifest: manifest ?? createManifest({
        mode,
        modelId: provider.model,
        providerConfig: { provider: provider.provider, model: provider.model },
      }),
      summary: failure,
      events: failure.events,
    });
    return { ...failure, resultPaths };
  } finally {
    await runtime?.close();
    await server?.close();
  }
}
