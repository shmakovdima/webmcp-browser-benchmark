const capabilities = ['navigate', 'accessibility_snapshot', 'element_ref', 'click_ref', 'type_ref', 'press'];
const toolNames = [
  'browser_navigate',
  'browser_snapshot',
  'browser_click',
  'browser_type',
  'browser_press_key',
];

export function createPlaywrightMcpMode() {
  return {
    name: 'playwright-mcp',
    allowedCapabilities: [...capabilities],
    allowedToolNames: [...toolNames],
    buildTools() {
      return capabilities.map((name) => ({ name, mode: 'playwright-mcp' }));
    },
    validateObservation(observation = {}) {
      if (observation.screenshot || observation.dom || observation.webmcpTools) {
        throw new Error('forbidden observation for playwright-mcp mode');
      }
      return true;
    },
  };
}
