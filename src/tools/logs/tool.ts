import { ExtendedTool, ToolHandlers } from '../../utils/types'
import { createToolSchema } from '../../utils/tool'
import { GetLogsZodSchema, GetAllServicesZodSchema } from './schema'
import { LogsApiClient } from '../../utils/coralogix'

type LogsToolName = 'get_logs' | 'get_all_services'
type LogsTool = ExtendedTool<LogsToolName>

export const LOGS_TOOLS: LogsTool[] = [
  createToolSchema(
    GetLogsZodSchema,
    'get_logs',
    'Search and retrieve logs from Coralogix',
  ),
  createToolSchema(
    GetAllServicesZodSchema,
    'get_all_services',
    'Extract all unique service names from logs in Coralogix',
  ),
] as const

type LogsToolHandlers = ToolHandlers<LogsToolName>

export const createLogsToolHandlers = (
  apiClient: LogsApiClient,
): LogsToolHandlers => ({
  get_logs: async (request) => {
    const { query, from, to, limit } = GetLogsZodSchema.parse(
      request.params.arguments,
    )

    const response = await apiClient.searchLogs({
      query,
      from,
      to,
      limit,
    })

    if (!response || !response.logs) {
      throw new Error('No logs data returned')
    }

    return {
      content: [
        {
          type: 'text',
          text: `Logs data: ${JSON.stringify(response.logs)}`,
        },
      ],
    }
  },

  get_all_services: async (request) => {
    const { query, from, to, limit } = GetAllServicesZodSchema.parse(
      request.params.arguments,
    )

    // First try to get services from the services API if available
    try {
      const servicesResponse = await apiClient.getServices()
      if (servicesResponse && servicesResponse.services && servicesResponse.services.length > 0) {
        return {
          content: [
            {
              type: 'text',
              text: `Services: ${JSON.stringify(servicesResponse.services.sort())}`,
            },
          ],
        }
      }
    } catch (error) {
      // If services API fails, fall back to extracting from logs
      console.error('Services API failed, falling back to log extraction', error)
    }

    // Fallback: Extract services from logs
    const response = await apiClient.searchLogs({
      query,
      from,
      to,
      limit,
    })

    if (!response || !response.logs) {
      throw new Error('No logs data returned')
    }

    // Extract unique services from logs
    const services = new Set<string>()

    for (const log of response.logs) {
      // Access service attribute from logs based on the Coralogix structure
      if (log.service) {
        services.add(log.service)
      } else if (log.attributes && log.attributes.service) {
        services.add(log.attributes.service)
      }
    }

    return {
      content: [
        {
          type: 'text',
          text: `Services: ${JSON.stringify(Array.from(services).sort())}`,
        },
      ],
    }
  },
})
