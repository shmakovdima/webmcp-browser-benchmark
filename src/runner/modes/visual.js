const capabilities = ['navigate', 'screenshot', 'coordinate_click', 'type', 'press', 'scroll'];

export function createVisualMode() {
  return {
    name: 'visual',
    allowedCapabilities: [...capabilities],
    buildTools() {
      return capabilities.map((name) => ({ name, mode: 'visual' }));
    },
    validateObservation(observation = {}) {
      if (observation.accessibilitySnapshot || observation.dom || observation.webmcpTools) {
        throw new Error('forbidden observation for visual mode');
      }
      return true;
    },
  };
}
