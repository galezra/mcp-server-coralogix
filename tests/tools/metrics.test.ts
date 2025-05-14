import { describe, it, expect } from 'vitest'
import { createCoralogixConfig } from '../../src/utils/config'
import { MetricsApiClient } from '../../src/utils/coralogix'
import { createMetricsToolHandlers } from '../../src/tools/metrics/tool'
import { createMockToolRequest } from '../helpers/mock'
import { http, HttpResponse } from 'msw'
import { setupServer } from '../helpers/msw'
import { baseUrl, CoralogixToolResponse } from '../helpers/coralogix'

const metricsEndpoint = `${baseUrl}/metrics/query`

describe('Metrics Tool', () => {
  // Create a mock Coralogix API client
  const axiosInstance = createCoralogixConfig({
    apiKey: 'test-api-key',
    region: 'EUROPE',
  })
  
  const apiClient = new MetricsApiClient(axiosInstance)
  const toolHandlers = createMetricsToolHandlers(apiClient)

  describe.concurrent('query_metrics', async () => {
    it('should query metrics data', async () => {
      const mockHandler = http.post(metricsEndpoint, async () => {
        return HttpResponse.json({
          status: 'success',
          data: {
            resultType: 'matrix',
            result: [
              {
                metric: {
                  __name__: 'system_cpu_user',
                  host: 'web-01'
                },
                values: [
                  [1640995000, '23.45'],
                  [1640995060, '24.12'],
                  [1640995120, '22.89'],
                  [1640995180, '25.67'],
                ]
              },
              {
                metric: {
                  __name__: 'system_cpu_user',
                  host: 'web-02'
                },
                values: [
                  [1640995000, '18.32'],
                  [1640995060, '19.01'],
                  [1640995120, '17.76'],
                  [1640995180, '20.45'],
                ]
              }
            ]
          }
        })
      })

      const server = setupServer(mockHandler)

      await server.boundary(async () => {
        const request = createMockToolRequest('query_metrics', {
          from: 1640995000,
          to: 1641095000,
          query: 'system_cpu_user',
        })
        const response = (await toolHandlers.query_metrics(
          request,
        )) as unknown as CoralogixToolResponse

        expect(response.content[0].text).toContain('Metrics data:')
        expect(response.content[0].text).toContain('system_cpu_user')
        expect(response.content[0].text).toContain('web-01')
        expect(response.content[0].text).toContain('web-02')
        expect(response.content[0].text).toContain('23.45')
      })()

      server.close()
    })

    it('should handle empty response', async () => {
      const mockHandler = http.post(metricsEndpoint, async () => {
        return HttpResponse.json({
          status: 'success',
          data: {
            resultType: 'matrix',
            result: []
          }
        })
      })

      const server = setupServer(mockHandler)

      await server.boundary(async () => {
        const request = createMockToolRequest('query_metrics', {
          from: 1640995000,
          to: 1641095000,
          query: 'non_existent_metric',
        })
        const response = (await toolHandlers.query_metrics(
          request,
        )) as unknown as CoralogixToolResponse

        expect(response.content[0].text).toContain('Metrics data:')
        expect(response.content[0].text).toContain('result":[]')
      })()

      server.close()
    })

    it('should handle failed query status', async () => {
      const mockHandler = http.post(metricsEndpoint, async () => {
        return HttpResponse.json({
          status: 'error',
          error: 'Invalid query format'
        })
      })

      const server = setupServer(mockHandler)

      await server.boundary(async () => {
        const request = createMockToolRequest('query_metrics', {
          from: 1640995000,
          to: 1641095000,
          query: 'invalid:query:format',
        })
        const response = (await toolHandlers.query_metrics(
          request,
        )) as unknown as CoralogixToolResponse

        expect(response.content[0].text).toContain('status":"error"')
        expect(response.content[0].text).toContain('Invalid query format')
      })()

      server.close()
    })

    it('should handle authentication errors', async () => {
      const mockHandler = http.post(metricsEndpoint, async () => {
        return HttpResponse.json(
          { message: 'Authentication failed' },
          { status: 403 },
        )
      })

      const server = setupServer(mockHandler)

      await server.boundary(async () => {
        const request = createMockToolRequest('query_metrics', {
          from: 1640995000,
          to: 1641095000,
          query: 'system_cpu_user',
        })
        await expect(toolHandlers.query_metrics(request)).rejects.toThrow()
      })()

      server.close()
    })

    it('should handle rate limit errors', async () => {
      const mockHandler = http.post(metricsEndpoint, async () => {
        return HttpResponse.json(
          { message: 'Rate limit exceeded' },
          { status: 429 },
        )
      })

      const server = setupServer(mockHandler)

      await server.boundary(async () => {
        const request = createMockToolRequest('query_metrics', {
          from: 1640995000,
          to: 1641095000,
          query: 'system_cpu_user',
        })
        await expect(toolHandlers.query_metrics(request)).rejects.toThrow(
          'Rate limit exceeded',
        )
      })()

      server.close()
    })

    it('should handle invalid time range errors', async () => {
      const mockHandler = http.post(metricsEndpoint, async () => {
        return HttpResponse.json(
          { message: 'Time range exceeds allowed limit' },
          { status: 400 },
        )
      })

      const server = setupServer(mockHandler)

      await server.boundary(async () => {
        // Using a very large time range that might exceed limits
        const request = createMockToolRequest('query_metrics', {
          from: 1600000000, // Very old date
          to: 1700000000, // Very recent date
          query: 'system_cpu_user',
        })
        await expect(toolHandlers.query_metrics(request)).rejects.toThrow(
          'Time range exceeds allowed limit',
        )
      })()

      server.close()
    })
  })
})
