import { ExtendedTool, ToolHandlers } from '../../utils/types'
import { createToolSchema } from '../../utils/tool'
import { QueryMetricsZodSchema } from './schema'
import { MetricsApiClient } from '../../utils/coralogix'

type MetricsToolName = 'query_metrics'
type MetricsTool = ExtendedTool<MetricsToolName>

export const METRICS_TOOLS: MetricsTool[] = [
  createToolSchema(
    QueryMetricsZodSchema,
    'query_metrics',
    'Retrieve metrics data from Coralogix',
  ),
] as const

type MetricsToolHandlers = ToolHandlers<MetricsToolName>

export const createMetricsToolHandlers = (
  apiClient: MetricsApiClient,
): MetricsToolHandlers => ({
  query_metrics: async (request) => {
    const { query, from, to } = QueryMetricsZodSchema.parse(
      request.params.arguments,
    )

    const response = await apiClient.queryMetrics({
      query,
      from,
      to,
    })

    if (!response) {
      throw new Error('No metrics data returned')
    }

    return {
      content: [
        {
          type: 'text',
          text: `Metrics data: ${JSON.stringify(response)}`,
        },
      ],
    }
  },
})
