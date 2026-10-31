import { createAnthropicProvider } from './providers/anthropic.js';
import { createNebiusProvider } from './providers/nebius.js';
import { createOpenAIProvider } from './providers/openai.js';

export function createProvider({ provider, model, apiKey, fetchImpl } = {}) {
  if (provider === 'openai') return createOpenAIProvider({ apiKey, model, fetchImpl });
  if (provider === 'anthropic') return createAnthropicProvider({ apiKey, model, fetchImpl });
  if (provider === 'nebius-token-factory') return createNebiusProvider({ apiKey, model, fetchImpl });
  throw new Error(`unsupported provider: ${provider}`);
}
