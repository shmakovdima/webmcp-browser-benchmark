export function createModelClient({ modelId = process.env.MODEL_ID, providerCall } = {}) {
  if (!modelId) {
    throw new Error('MODEL_ID is required for measured model execution');
  }

  return {
    modelId,
    async runTurn(input) {
      if (typeof providerCall !== 'function') {
        throw new Error('providerCall is required for measured model execution');
      }
      return providerCall({ ...input, model: modelId });
    },
  };
}
