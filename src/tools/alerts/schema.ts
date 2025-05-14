import { z } from 'zod'

export const ListAlertsZodSchema = z.object({
  status: z
    .string()
    .describe('Filter alerts by status (e.g., "active", "resolved")')
    .optional(),
  severity: z
    .string()
    .describe('Filter alerts by severity (e.g., "critical", "warning", "info")')
    .optional(),
  limit: z
    .number()
    .describe('Maximum number of alerts to return')
    .optional()
    .default(20),
  offset: z
    .number()
    .describe('Offset for pagination')
    .optional()
    .default(0),
})

export const GetAlertZodSchema = z.object({
  alert_id: z.string().describe('ID of the alert to fetch'),
}) 