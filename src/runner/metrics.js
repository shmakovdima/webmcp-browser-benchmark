import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';

export function createMetrics() {
  const events = [];

  return {
    record(event) {
      events.push({ ...event });
    },
    events() {
      return events.map((event) => ({ ...event }));
    },
    summary() {
      return events.reduce((summary, event) => ({
        inputTokens: summary.inputTokens + (event.inputTokens ?? 0),
        cachedInputTokens: summary.cachedInputTokens + (event.cachedInputTokens ?? 0),
        outputTokens: summary.outputTokens + (event.outputTokens ?? 0),
        reasoningTokens: summary.reasoningTokens + (event.reasoningTokens ?? 0),
        totalTokens: summary.totalTokens + (event.totalTokens ?? 0),
        wallTimeMs: summary.wallTimeMs + (event.elapsedMs ?? 0),
        modelRequests: summary.modelRequests + (event.eventType === 'model_request' ? 1 : 0),
        toolCalls: summary.toolCalls + (event.eventType === 'tool_call' ? 1 : 0),
        observationBytes: summary.observationBytes + (event.observationBytes ?? 0),
      }), {
        inputTokens: 0,
        cachedInputTokens: 0,
        outputTokens: 0,
        reasoningTokens: 0,
        totalTokens: 0,
        wallTimeMs: 0,
        modelRequests: 0,
        toolCalls: 0,
        observationBytes: 0,
      });
    },
  };
}

export async function writeJsonl(path, rows) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, rows.map((row) => JSON.stringify(row)).join('\n') + (rows.length ? '\n' : ''), 'utf8');
}
