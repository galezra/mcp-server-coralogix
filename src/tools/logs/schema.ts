import { z } from 'zod'

export const GetLogsZodSchema = z.object({
  query: z.string().describe('Coralogix logs query string'),
  from: z.number().describe('Start time in epoch seconds'),
  to: z.number().describe('End time in epoch seconds'),
  limit: z
    .number()
    .describe('Maximum number of logs to return')
    .optional()
    .default(100),
})

/**
 * Schema for retrieving all unique service names from logs.
 * Defines parameters for querying logs within a time window.
 *
 * @param query - Optional. Additional query filter for log search. Defaults to "*" (all logs)
 * @param from - Required. Start time in epoch seconds
 * @param to - Required. End time in epoch seconds
 * @param limit - Optional. Maximum number of logs to search through. Default is 1000.
 */
export const GetAllServicesZodSchema = z.object({
  query: z
    .string()
    .describe('Coralogix logs query string')
    .optional()
    .default('*'),
  from: z.number().describe('Start time in epoch seconds'),
  to: z.number().describe('End time in epoch seconds'),
  limit: z
    .number()
    .describe('Maximum number of logs to return for service extraction')
    .optional()
    .default(1000),
})
