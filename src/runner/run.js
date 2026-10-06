import { createModelClient } from './model-client.js';
import { createVisualMode } from './modes/visual.js';
import { createPlaywrightMcpMode } from './modes/playwright-mcp.js';
import { createWebMcpMode } from './modes/webmcp.js';

const modes = {
  visual: createVisualMode,
  'playwright-mcp': createPlaywrightMcpMode,
  webmcp: createWebMcpMode,
};
const taskIds = new Set(['T1', 'T2', 'T3', 'T4', 'T5']);
const stages = new Set(['development', 'smoke', 'pilot', 'full']);

function getMode(name) {
  if (!modes[name]) throw new Error(`unknown benchmark mode: ${name}`);
  return modes[name]();
}

function validateInputs({ mode, taskId, stage }) {
  if (!taskIds.has(taskId)) throw new Error(`unknown benchmark task: ${taskId}`);
  if (!stages.has(stage)) throw new Error(`unknown benchmark stage: ${stage}`);
  return getMode(mode);
}

export async function runBenchmark({ mode, taskId, stage = 'development', dryRun = false, modelId, providerCall } = {}) {
  const selectedMode = validateInputs({ mode, taskId, stage });
  if (stage === 'full' && process.env.FULL_BENCHMARK_APPROVED !== '1') {
    throw new Error('full benchmark requires explicit approval');
  }

  if (dryRun) {
    return {
      status: 'dry-run',
      mode,
      taskId,
      stage,
      modelCalls: 0,
      capabilities: selectedMode.allowedCapabilities.filter((capability) => capability !== 'navigate'),
    };
  }

  const client = createModelClient({ modelId, providerCall });
  return {
    status: 'ready',
    mode,
    taskId,
    stage,
    modelId: client.modelId,
    capabilities: selectedMode.allowedCapabilities,
  };
}

if (process.argv[1]?.endsWith('/run.js')) {
  const values = process.argv.slice(2);
  const args = {};
  args.stage = process.env.BENCHMARK_STAGE ?? values.find((value) => stages.has(value));
  args.mode = process.env.BENCHMARK_MODE ?? values.find((value) => modes[value]);
  args.taskId = process.env.BENCHMARK_TASK ?? values.find((value) => taskIds.has(value));
  args.dryRun = process.env.BENCHMARK_DRY_RUN === '1';
  if (stages.has(values[0])) values.shift();
  for (let index = 0; index < values.length; index += 1) {
    const argument = values[index];
    if (!argument.startsWith('--')) continue;
    const key = argument.slice(2);
    if (key === 'dry-run') args.dryRun = true;
    else if (key === 'stage') args.stage = values[index + 1];
    else if (key === 'mode') args.mode = values[index + 1];
    else if (key === 'task') args.taskId = values[index + 1];
  }
  runBenchmark(args).then((result) => console.log(JSON.stringify(result, null, 2))).catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
