import { createMetrics } from './metrics.js';

function usageEvent(usage = {}) {
  return {
    inputTokens: usage.inputTokens ?? null,
    cachedInputTokens: usage.cachedInputTokens ?? null,
    outputTokens: usage.outputTokens ?? null,
    reasoningTokens: usage.reasoningTokens ?? null,
    totalTokens: usage.totalTokens ?? null,
  };
}

export function createAgentLoop({ provider, tools, toolDefinitions, maxTurns = 30, now = () => performance.now() } = {}) {
  if (!provider || typeof provider.complete !== 'function') {
    throw new Error('agent loop requires a provider with a complete method');
  }
  if (!tools || typeof tools !== 'object') throw new Error('agent loop requires tools');
  if (!Array.isArray(toolDefinitions)) throw new Error('agent loop requires tool definitions');

  return {
    async run({ prompt } = {}) {
      if (!prompt) throw new Error('agent loop requires a task prompt');

      const metrics = createMetrics();
      const events = [];
      let toolResults = [];
      const startedAt = now();

      try {
        for (let turn = 1; turn <= maxTurns; turn += 1) {
          const requestStartedAt = now();
          const response = await provider.complete({
            prompt,
            toolDefinitions,
            toolResults,
            turn,
          });
          const requestElapsedMs = now() - requestStartedAt;
          const modelEvent = {
            eventType: 'model_request',
            turn,
            elapsedMs: requestElapsedMs,
            ...usageEvent(response?.usage),
          };
          metrics.record(modelEvent);
          events.push(modelEvent);

          const toolCalls = response?.toolCalls ?? [];
          if (!Array.isArray(toolCalls)) throw new Error('provider returned invalid tool calls');
          if (toolCalls.length === 0 && typeof response?.finalText === 'string') {
            return {
              finalText: response.finalText,
              terminalReason: 'final-answer',
              elapsedMs: now() - startedAt,
              events,
              metrics: metrics.summary(),
            };
          }
          if (toolCalls.length === 0) throw new Error('provider returned neither a tool call nor a final answer');

          toolResults = [];
          for (const toolCall of toolCalls) {
            if (!toolCall?.id || !toolCall.name) throw new Error('provider returned an invalid tool call');
            const execute = tools[toolCall.name];
            if (typeof execute !== 'function') throw new Error(`provider selected unavailable tool: ${toolCall.name}`);

            const toolStartedAt = now();
            const result = await execute(toolCall.input ?? {});
            const toolEvent = {
              eventType: 'tool_call',
              turn,
              toolCallId: toolCall.id,
              toolName: toolCall.name,
              elapsedMs: now() - toolStartedAt,
            };
            metrics.record(toolEvent);
            events.push(toolEvent);
            toolResults.push({ toolCallId: toolCall.id, name: toolCall.name, result });
          }
        }

        throw new Error(`agent loop exceeded the ${maxTurns} turn limit`);
      } catch (error) {
        const failure = error instanceof Error ? error : new Error(String(error));
        failure.events ??= events;
        failure.metrics ??= metrics.summary();
        throw failure;
      }
    },
  };
}
