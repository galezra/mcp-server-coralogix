import axios, { AxiosInstance } from 'axios'

interface CoralogixConfig {
  apiKey: string
  region?: string
}

// Coralogix region endpoints
const CORALOGIX_ENDPOINTS = {
  EUROPE: 'https://api.coralogix.com',
  EUROPE2: 'https://api.eu2.coralogix.com',
  INDIA: 'https://api.app.coralogix.in',
  US: 'https://api.coralogix.us',
  SINGAPORE: 'https://api.coralogixsg.com',
}

export const createCoralogixConfig = (config: CoralogixConfig): AxiosInstance => {
  if (!config.apiKey) {
    throw new Error('Coralogix API key is required')
  }

  // Default to EU region if not specified
  const baseURL = config.region ? CORALOGIX_ENDPOINTS[config.region.toUpperCase() as keyof typeof CORALOGIX_ENDPOINTS] : CORALOGIX_ENDPOINTS.EUROPE
  
  if (!baseURL) {
    throw new Error(`Invalid region: ${config.region}. Valid regions are: ${Object.keys(CORALOGIX_ENDPOINTS).join(', ')}`)
  }

  // Create axios instance with the API key in headers
  const axiosInstance = axios.create({
    baseURL,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
    },
  })

  return axiosInstance
}

// Helper to get the current region URL
export const getCoralogixEndpoint = (region?: string): string => {
  if (!region) return CORALOGIX_ENDPOINTS.EUROPE
  
  const endpoint = CORALOGIX_ENDPOINTS[region.toUpperCase() as keyof typeof CORALOGIX_ENDPOINTS]
  if (!endpoint) {
    throw new Error(`Invalid region: ${region}. Valid regions are: ${Object.keys(CORALOGIX_ENDPOINTS).join(', ')}`)
  }
  
  return endpoint
}
