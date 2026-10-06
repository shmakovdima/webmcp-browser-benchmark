import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const require = createRequire(import.meta.url);
const packageJsonPath = require.resolve('@playwright/mcp/package.json');
const defaultCliPath = join(dirname(packageJsonPath), 'cli.js');

function notStarted() {
  throw new Error('Playwright MCP client is not started');
}

export function createPlaywrightMcpClient({
  targetUrl,
  browser = 'chrome',
  headless = true,
  isolated = true,
  noWebMcp = true,
  command = process.env.PLAYWRIGHT_MCP_NODE ?? 'node',
  cliPath = defaultCliPath,
  cwd = process.cwd(),
  extraArgs = [],
} = {}) {
  let client;
  let transport;

  return {
    async start() {
      if (!targetUrl) throw new Error('Playwright MCP target URL is required');
      if (client) throw new Error('Playwright MCP client is already started');

      const args = [cliPath];
      if (headless) args.push('--headless');
      if (browser) args.push('--browser', browser);
      if (isolated) args.push('--isolated');
      if (noWebMcp) args.push('--no-webmcp');
      args.push('--allowed-hosts', new URL(targetUrl).hostname);
      args.push(...extraArgs);

      client = new Client({ name: 'webmcp-browser-benchmark', version: '0.1.0' });
      transport = new StdioClientTransport({
        command,
        args,
        cwd,
        stderr: 'pipe',
      });
      await client.connect(transport);
      await client.callTool({
        name: 'browser_navigate',
        arguments: { url: targetUrl },
      });
      return { targetUrl, pid: transport.pid };
    },

    async close() {
      if (!client) return;
      await client.close();
      client = undefined;
      transport = undefined;
    },

    async listTools({ allowedToolNames } = {}) {
      if (!client) notStarted();
      const listed = await client.listTools();
      if (!allowedToolNames) return listed;
      const allowed = new Set(allowedToolNames);
      return {
        ...listed,
        tools: listed.tools.filter((tool) => allowed.has(tool.name)),
      };
    },

    async callTool(name, args = {}) {
      if (!client) notStarted();
      return client.callTool({ name, arguments: args });
    },
  };
}
