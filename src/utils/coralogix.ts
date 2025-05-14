import { AxiosInstance } from 'axios'

// Base interface for API clients
export interface CoralogixApiClient {
  axiosInstance: AxiosInstance
}

// Alert API client
export class AlertsApiClient implements CoralogixApiClient {
  constructor(public axiosInstance: AxiosInstance) {}

  async listAlerts(params?: { 
    status?: string, 
    severity?: string, 
    limit?: number, 
    offset?: number 
  }) {
    const response = await this.axiosInstance.get('/api/v1/alerts', { params })
    return response.data
  }

  async getAlert(alertId: string) {
    const response = await this.axiosInstance.get(`/api/v1/alerts/${alertId}`)
    return response.data
  }
}

// Logs API client
export class LogsApiClient implements CoralogixApiClient {
  constructor(public axiosInstance: AxiosInstance) {}

  async searchLogs(params: {
    query: string,
    from: number,
    to: number,
    limit?: number
  }) {
    // Convert timestamps from seconds to milliseconds for Coralogix
    const fromMs = params.from * 1000
    const toMs = params.to * 1000
    
    const response = await this.axiosInstance.post('/api/v1/logs/search', {
      query: params.query,
      startTime: fromMs,
      endTime: toMs,
      limit: params.limit || 100
    })
    return response.data
  }

  async getServices() {
    const response = await this.axiosInstance.get('/api/v1/services')
    return response.data
  }
}

// Metrics API client
export class MetricsApiClient implements CoralogixApiClient {
  constructor(public axiosInstance: AxiosInstance) {}

  async queryMetrics(params: {
    query: string,
    from: number,
    to: number
  }) {
    // Convert timestamps from seconds to milliseconds for Coralogix
    const fromMs = params.from * 1000
    const toMs = params.to * 1000
    
    const response = await this.axiosInstance.post('/api/v1/metrics/query', {
      query: params.query,
      startTime: fromMs,
      endTime: toMs
    })
    return response.data
  }
}

// Direct Query API client (DataPrime)
export class QueryApiClient implements CoralogixApiClient {
  constructor(public axiosInstance: AxiosInstance) {}

  async executeQuery(params: {
    query: string,
    from: number,
    to: number
  }) {
    // Convert timestamps from seconds to milliseconds for Coralogix
    const fromMs = params.from * 1000
    const toMs = params.to * 1000
    
    const response = await this.axiosInstance.post('/api/v1/dataprime/query', {
      query: params.query,
      startTime: fromMs,
      endTime: toMs
    })
    return response.data
  }
}

// Traces API client
export class TracesApiClient implements CoralogixApiClient {
  constructor(public axiosInstance: AxiosInstance) {}

  async searchTraces(params: {
    query: string,
    from: number,
    to: number,
    limit?: number
  }) {
    // Convert timestamps from seconds to milliseconds for Coralogix
    const fromMs = params.from * 1000
    const toMs = params.to * 1000
    
    const response = await this.axiosInstance.post('/api/v1/traces/search', {
      query: params.query,
      startTime: fromMs,
      endTime: toMs,
      limit: params.limit || 100
    })
    return response.data
  }
} 