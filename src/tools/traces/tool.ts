import { ExtendedTool, ToolHandlers } from '../../utils/types'
import { createToolSchema } from '../../utils/tool'
import { SearchTracesZodSchema } from './schema'
import { TracesApiClient } from '../../utils/coralogix'

type TracesToolName = 'search_traces'
type TracesTool = ExtendedTool<TracesToolName>

export const TRACES_TOOLS: TracesTool[] = [
  createToolSchema(
    SearchTracesZodSchema,
    'search_traces',
    'Search and retrieve traces from Coralogix',
  ),
] as const

type TracesToolHandlers = ToolHandlers<TracesToolName>

export const createTracesToolHandlers = (
  apiClient: TracesApiClient,
): TracesToolHandlers => ({
  search_traces: async (request) => {
    const { query, from, to, limit, service, operation } = SearchTracesZodSchema.parse(
      request.params.arguments,
    )

    // Add service and operation to the query if provided
    let finalQuery = query
    if (service) {
      finalQuery = `${finalQuery} service:${service}`
    }
    if (operation) {
      finalQuery = `${finalQuery} operation:${operation}`
    }

    const response = await apiClient.searchTraces({
      query: finalQuery,
      from,
      to,
      limit,
    })

    if (!response || !response.traces) {
      throw new Error('No traces data returned')
    }

    return {
      content: [
        {
          type: 'text',
          text: `Traces: ${JSON.stringify(response.traces)}`,
        },
      ],
    }
  },
})
