import { z } from 'zod'

export const QueryMetricsZodSchema = z.object({
  query: z.string().describe('Coralogix metrics query string'),
  from: z.number().describe('Start time in epoch seconds'),
  to: z.number().describe('End time in epoch seconds'),
})

export type QueryMetricsArgs = z.infer<typeof QueryMetricsZodSchema>
