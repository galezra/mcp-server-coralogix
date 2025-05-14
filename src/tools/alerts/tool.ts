import { ExtendedTool, ToolHandlers } from '../../utils/types'
import { createToolSchema } from '../../utils/tool'
import { ListAlertsZodSchema, GetAlertZodSchema } from './schema'
import { AlertsApiClient } from '../../utils/coralogix'

type AlertsToolName = 'list_alerts' | 'get_alert'
type AlertsTool = ExtendedTool<AlertsToolName>

export const ALERTS_TOOLS: AlertsTool[] = [
  createToolSchema(
    ListAlertsZodSchema,
    'list_alerts',
    'Retrieve a list of alerts from Coralogix',
  ),
  createToolSchema(
    GetAlertZodSchema,
    'get_alert',
    'Retrieve detailed information about a specific Coralogix alert',
  ),
] as const

type AlertsToolHandlers = ToolHandlers<AlertsToolName>

export const createAlertToolHandlers = (
  apiClient: AlertsApiClient,
): AlertsToolHandlers => ({
  list_alerts: async (request) => {
    const { status, severity, limit, offset } = ListAlertsZodSchema.parse(
      request.params.arguments,
    )

    const response = await apiClient.listAlerts({
      status,
      severity,
      limit,
      offset
    })

    if (!response || !response.alerts) {
      throw new Error('No alerts data returned')
    }

    return {
      content: [
        {
          type: 'text',
          text: `Alerts: ${JSON.stringify(response.alerts)}`,
        },
      ],
    }
  },

  get_alert: async (request) => {
    const { alert_id } = GetAlertZodSchema.parse(
      request.params.arguments,
    )

    const response = await apiClient.getAlert(alert_id)

    if (!response) {
      throw new Error('No alert data returned')
    }

    return {
      content: [
        {
          type: 'text',
          text: `Alert details: ${JSON.stringify(response)}`,
        },
      ],
    }
  },
}) 