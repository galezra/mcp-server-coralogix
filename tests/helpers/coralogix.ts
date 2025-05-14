// Base URL for Coralogix API
export const baseUrl = 'https://api.coralogix.com/api/v1'

export interface CoralogixToolResponse {
  content: Array<{
    type: string
    text: string
  }>
} 