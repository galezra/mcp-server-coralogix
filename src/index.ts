#!/usr/bin/env node

/**
 * This script sets up the mcp-server-coralogix.
 * It initializes an MCP server that integrates with Coralogix for observability and monitoring.
 * By leveraging MCP, this server can access logs, metrics, traces, and alerts via the Coralogix APIs.
 * With a design built for scalability, future integrations with additional Coralogix APIs are anticipated.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js'
import { log, mcpCoralogixVersion } from './utils/helper'
import { ToolHandlers } from './utils/types'
import { createCoralogixConfig } from './utils/config'
import { 
  AlertsApiClient, 
  LogsApiClient, 
  MetricsApiClient, 
  QueryApiClient,
  TracesApiClient
} from './utils/coralogix'

// Import tool handlers
import { ALERTS_TOOLS, createAlertToolHandlers } from './tools/alerts'
import { LOGS_TOOLS, createLogsToolHandlers } from './tools/logs'
import { METRICS_TOOLS, createMetricsToolHandlers } from './tools/metrics'
import { TRACES_TOOLS, createTracesToolHandlers } from './tools/traces'

const server = new Server(
  {
    name: 'Coralogix MCP Server',
    version: mcpCoralogixVersion,
  },
  {
    capabilities: {
      tools: {},
    },
  },
)

server.onerror = (error) => {
  log('error', `Server error: ${error.message}`, error.stack)
}

/**
 * Handler that retrieves the list of available tools in the mcp-server-coralogix.
 * Currently, it provides observability functionalities by integrating with Coralogix APIs.
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      ...ALERTS_TOOLS,
      ...LOGS_TOOLS,
      ...METRICS_TOOLS,
      ...TRACES_TOOLS,
    ],
  }
})

if (!process.env.CORALOGIX_API_KEY) {
  throw new Error('CORALOGIX_API_KEY must be set')
}

const coralogixConfig = createCoralogixConfig({
  apiKey: process.env.CORALOGIX_API_KEY,
  region: process.env.CORALOGIX_REGION,
})

// Initialize API clients
const alertsApiClient = new AlertsApiClient(coralogixConfig)
const logsApiClient = new LogsApiClient(coralogixConfig)
const metricsApiClient = new MetricsApiClient(coralogixConfig)
const queryApiClient = new QueryApiClient(coralogixConfig)
const tracesApiClient = new TracesApiClient(coralogixConfig)

const TOOL_HANDLERS: ToolHandlers = {
  ...createAlertToolHandlers(alertsApiClient),
  ...createLogsToolHandlers(logsApiClient),
  ...createMetricsToolHandlers(metricsApiClient),
  ...createTracesToolHandlers(tracesApiClient),
}

/**
 * Handler for invoking Coralogix-related tools in the mcp-server-coralogix.
 * The TOOL_HANDLERS object contains various tools that interact with different Coralogix APIs.
 * By specifying the tool name in the request, the LLM can select and utilize the required tool.
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    if (TOOL_HANDLERS[request.params.name]) {
      return await TOOL_HANDLERS[request.params.name](request)
    }
    throw new Error('Unknown tool')
  } catch (unknownError) {
    const error =
      unknownError instanceof Error
        ? unknownError
        : new Error(String(unknownError))
    log(
      'error',
      `Request: ${request.params.name}, ${JSON.stringify(request.params.arguments)} failed`,
      error.message,
      error.stack,
    )
    throw error
  }
})

/**
 * Initializes and starts the mcp-server-coralogix using stdio transport,
 * which sends and receives data through standard input and output.
 */
async function main() {
  const transport = new StdioServerTransport()
  await server.connect(transport)
}

main().catch((error) => {
  log('error', 'Server error:', error)
  process.exit(1)
})
