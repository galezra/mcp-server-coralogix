import { z } from 'zod'

export const SearchTracesZodSchema = z.object({
  query: z.string().describe('Coralogix trace query string'),
  from: z.number().describe('Start time in epoch seconds'),
  to: z.number().describe('End time in epoch seconds'),
  limit: z
    .number()
    .describe('Maximum number of traces to return')
    .optional()
    .default(100),
  service: z
    .string()
    .describe('Filter by service name')
    .optional(),
  operation: z
    .string()
    .describe('Filter by operation name')
    .optional(),
})
