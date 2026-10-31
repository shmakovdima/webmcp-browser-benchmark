import { executeExperimentAttempt } from '../src/runner/experiment.js';
import { createProvider } from '../src/runner/provider-factory.js';

const [mode, taskId] = process.argv.slice(2);
const providerName = process.env.BENCHMARK_PROVIDER;
const model = process.env.MODEL_ID;
const stage = process.env.BENCHMARK_STAGE ?? 'smoke';
const outputDir = process.env.BENCHMARK_OUTPUT_DIR ?? 'results';

if (!mode || !taskId || !providerName || !model) {
  throw new Error('usage: BENCHMARK_PROVIDER=openai|anthropic|nebius-token-factory MODEL_ID=model bun scripts/run-experiment.js mode task-id');
}

const apiKey = providerName === 'openai'
  ? process.env.OPENAI_API_KEY
  : providerName === 'anthropic'
    ? process.env.ANTHROPIC_API_KEY
    : process.env.NEBIUS_TOKEN_FACTORY_KEY;
const provider = createProvider({ provider: providerName, model, apiKey });
const result = await executeExperimentAttempt({ mode, taskId, stage, provider, outputDir });

console.log(JSON.stringify({
  status: result.status,
  mode: result.mode,
  taskId: result.taskId,
  modelId: result.modelId,
  elapsedMs: result.elapsedMs,
  metrics: result.metrics,
  oraclePassed: result.oraclePassed,
  finalAnswerPassed: result.finalAnswerPassed,
  failureCategory: result.failureCategory,
  resultPaths: result.resultPaths,
}, null, 2));
