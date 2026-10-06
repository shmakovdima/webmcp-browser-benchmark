import { getWebMcpToolDefinitions } from '../../web/webmcp.js';

export function createWebMcpMode() {
  return {
    name: 'webmcp',
    allowedCapabilities: ['navigate', 'webmcp_tool'],
    buildTools() {
      return getWebMcpToolDefinitions();
    },
    validateObservation(observation = {}) {
      if (observation.screenshot || observation.dom || observation.accessibilitySnapshot) {
        throw new Error('forbidden observation for webmcp mode');
      }
      return true;
    },
  };
}
