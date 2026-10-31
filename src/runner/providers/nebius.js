const endpoint = 'https://api.tokenfactory.nebius.com/v1/chat/completions';

function asFunctionTools(toolDefinitions) {
  return toolDefinitions.map((tool) => ({
    type: 'function',
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.inputSchema,
    },
  }));
}

function parseFunctionCalls(toolCalls = []) {
  return toolCalls.map((call) => ({
    id: call.id,
    name: call.function?.name,
    input: JSON.parse(call.function?.arguments || '{}'),
  }));
}

function normalizeUsage(usage = {}) {
  return {
    inputTokens: usage.prompt_tokens ?? null,
    cachedInputTokens: usage.prompt_tokens_details?.cached_tokens ?? null,
    outputTokens: usage.completion_tokens ?? null,
    reasoningTokens: usage.completion_tokens_details?.reasoning_tokens ?? null,
    totalTokens: usage.total_tokens ?? null,
  };
}

async function readError(response) {
  const body = await response.text();
  return body || response.statusText;
}

export function createNebiusProvider({ apiKey, model, fetchImpl = globalThis.fetch, requestTimeoutMs = 300000 } = {}) {
  if (!apiKey) throw new Error('Nebius Token Factory API key is required');
  if (!model) throw new Error('Nebius Token Factory model is required');
  if (typeof fetchImpl !== 'function') throw new Error('Nebius Token Factory provider requires fetch');

  const messages = [];

  return {
    provider: 'nebius-token-factory',
    model,
    async complete({ prompt, toolDefinitions, toolResults = [] } = {}) {
      if (messages.length === 0) messages.push({ role: 'user', content: prompt });
      if (toolResults.length > 0) {
        messages.push(...toolResults.map((toolResult) => ({
          role: 'tool',
          tool_call_id: toolResult.toolCallId,
          content: JSON.stringify(toolResult.result ?? null),
        })));
      }

      const response = await fetchImpl(endpoint, {
        method: 'POST',
        signal: AbortSignal.timeout(requestTimeoutMs),
        headers: {
          authorization: `Bearer ${apiKey}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages,
          tools: asFunctionTools(toolDefinitions),
          tool_choice: 'auto',
          parallel_tool_calls: false,
          temperature: 0,
          max_tokens: 4096,
        }),
      });
      if (!response.ok) throw new Error(`Nebius Token Factory Chat Completions failed: ${response.status} ${await readError(response)}`);

      const body = await response.json();
      const message = body.choices?.[0]?.message;
      if (!message) throw new Error('Nebius Token Factory response did not include a chat message');
      const toolCalls = Array.isArray(message.tool_calls) ? message.tool_calls : [];
      messages.push({
        role: 'assistant',
        content: message.content ?? null,
        ...(toolCalls.length ? { tool_calls: toolCalls } : {}),
      });

      return {
        toolCalls: parseFunctionCalls(toolCalls),
        finalText: typeof message.content === 'string' ? message.content : undefined,
        usage: normalizeUsage(body.usage),
        providerRequestId: body.id ?? null,
        returnedModelId: body.model ?? null,
      };
    },
  };
}
