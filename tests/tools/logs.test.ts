import { describe, it, expect } from 'vitest'
import { createCoralogixConfig } from '../../src/utils/config'
import { LogsApiClient } from '../../src/utils/coralogix'
import { createLogsToolHandlers } from '../../src/tools/logs/tool'
import { createMockToolRequest } from '../helpers/mock'
import { http, HttpResponse } from 'msw'
import { setupServer } from '../helpers/msw'
import { baseUrl, CoralogixToolResponse } from '../helpers/coralogix'

const logsEndpoint = `${baseUrl}/logs/search`

describe('Logs Tool', () => {
  // Create a mock Coralogix API client
  const axiosInstance = createCoralogixConfig({
    apiKey: 'test-api-key',
    region: 'EUROPE',
  })
  
  const apiClient = new LogsApiClient(axiosInstance)
  const toolHandlers = createLogsToolHandlers(apiClient)

  describe.concurrent('get_logs', async () => {
    it('should retrieve logs', async () => {
      // Mock API response based on Coralogix API
      const mockHandler = http.post(logsEndpoint, async () => {
        return HttpResponse.json({
          logs: [
            {
              id: 'log-id-1',
              timestamp: 1640995199999,
              severity: 'INFO',
              message: 'Test log message',
              service: 'test-service',
              tags: ['env:test'],
            },
          ],
          pagination: {
            next: 'next-token',
          },
        })
      })

      const server = setupServer(mockHandler)

      await server.boundary(async () => {
        const request = createMockToolRequest('get_logs', {
          query: 'service:test-service',
          from: 1640995100, // epoch seconds
          to: 1640995200, // epoch seconds
          limit: 10,
        })
        const response = (await toolHandlers.get_logs(
          request,
        )) as unknown as CoralogixToolResponse
        expect(response.content[0].text).toContain('Logs data')
        expect(response.content[0].text).toContain('Test log message')
      })()

      server.close()
    })

    it('should handle empty response', async () => {
      const mockHandler = http.post(logsEndpoint, async () => {
        return HttpResponse.json({
          logs: [],
          pagination: {},
        })
      })

      const server = setupServer(mockHandler)

      await server.boundary(async () => {
        const request = createMockToolRequest('get_logs', {
          query: 'service:non-existent',
          from: 1640995100,
          to: 1640995200,
        })
        const response = (await toolHandlers.get_logs(
          request,
        )) as unknown as CoralogixToolResponse
        expect(response.content[0].text).toContain('Logs data')
        expect(response.content[0].text).toContain('[]')
      })()

      server.close()
    })

    it('should handle null response data', async () => {
      const mockHandler = http.post(logsEndpoint, async () => {
        return HttpResponse.json({
          logs: null,
        })
      })

      const server = setupServer(mockHandler)

      await server.boundary(async () => {
        const request = createMockToolRequest('get_logs', {
          query: 'service:test',
          from: 1640995100,
          to: 1640995200,
        })
        await expect(toolHandlers.get_logs(request)).rejects.toThrow(
          'No logs data returned',
        )
      })()

      server.close()
    })

    it('should handle authentication errors', async () => {
      const mockHandler = http.post(logsEndpoint, async () => {
        return HttpResponse.json(
          { message: 'Authentication failed' },
          { status: 403 },
        )
      })

      const server = setupServer(mockHandler)

      await server.boundary(async () => {
        const request = createMockToolRequest('get_logs', {
          query: 'service:test',
          from: 1640995100,
          to: 1640995200,
        })
        await expect(toolHandlers.get_logs(request)).rejects.toThrow()
      })()

      server.close()
    })

    it('should handle rate limit errors', async () => {
      const mockHandler = http.post(logsEndpoint, async () => {
        return HttpResponse.json(
          { message: 'Rate limit exceeded' },
          { status: 429 },
        )
      })

      const server = setupServer(mockHandler)

      await server.boundary(async () => {
        const request = createMockToolRequest('get_logs', {
          query: 'service:test',
          from: 1640995100,
          to: 1640995200,
        })
        await expect(toolHandlers.get_logs(request)).rejects.toThrow(
          'Rate limit exceeded',
        )
      })()

      server.close()
    })

    it('should handle server errors', async () => {
      const mockHandler = http.post(logsEndpoint, async () => {
        return HttpResponse.json(
          { message: 'Internal server error' },
          { status: 500 },
        )
      })

      const server = setupServer(mockHandler)

      await server.boundary(async () => {
        const request = createMockToolRequest('get_logs', {
          query: 'service:test',
          from: 1640995100,
          to: 1640995200,
        })
        await expect(toolHandlers.get_logs(request)).rejects.toThrow(
          'Internal server error',
        )
      })()

      server.close()
    })
  })

  describe.concurrent('get_all_services', async () => {
    it('should extract unique service names from logs', async () => {
      // Mock API response with multiple services
      const mockHandler = http.post(logsEndpoint, async () => {
        return HttpResponse.json({
          logs: [
            {
              id: 'log-id-1',
              timestamp: 1640995199000,
              severity: 'INFO',
              message: 'Test log message 1',
              service: 'web-service',
              tags: ['env:test'],
            },
            {
              id: 'log-id-2',
              timestamp: 1640995198000,
              severity: 'INFO',
              message: 'Test log message 2',
              service: 'api-service',
              tags: ['env:test'],
            },
            {
              id: 'log-id-3',
              timestamp: 1640995197000,
              severity: 'INFO',
              message: 'Test log message 3',
              service: 'web-service', // Duplicate service to test uniqueness
              tags: ['env:test'],
            },
            {
              id: 'log-id-4',
              timestamp: 1640995196000,
              severity: 'ERROR',
              message: 'Test error message',
              service: 'database-service',
              tags: ['env:test'],
            },
          ],
        })
      })

      const server = setupServer(mockHandler)

      await server.boundary(async () => {
        const request = createMockToolRequest('get_all_services', {
          query: '*',
          from: 1640995100,
          to: 1640995200,
        })
        const response = (await toolHandlers.get_all_services(
          request,
        )) as unknown as CoralogixToolResponse
        expect(response.content[0].text).toContain('Services')
        // Verify that the services are unique and sorted
        expect(response.content[0].text).toContain(
          JSON.stringify(['api-service', 'database-service', 'web-service']),
        )
      })()

      server.close()
    })

    it('should handle services API', async () => {
      // Mock services API response
      const servicesEndpoint = `${baseUrl}/services`
      const mockHandler = http.get(servicesEndpoint, async () => {
        return HttpResponse.json({
          services: ['auth-service', 'api-service', 'web-service'],
        })
      })

      const server = setupServer(mockHandler)

      await server.boundary(async () => {
        const request = createMockToolRequest('get_all_services', {
          from: 1640995100,
          to: 1640995200,
        })
        const response = (await toolHandlers.get_all_services(
          request,
        )) as unknown as CoralogixToolResponse
        expect(response.content[0].text).toContain('Services')
        expect(response.content[0].text).toContain(
          JSON.stringify(['api-service', 'auth-service', 'web-service']),
        )
      })()

      server.close()
    })

    it('should handle empty response from services API', async () => {
      // Mock services API with empty response
      const servicesEndpoint = `${baseUrl}/services`
      const mockServicesHandler = http.get(servicesEndpoint, async () => {
        return HttpResponse.json({
          services: [],
        })
      })

      // Mock logs API as fallback
      const logsHandler = http.post(logsEndpoint, async () => {
        return HttpResponse.json({
          logs: [
            {
              id: 'log-id-1',
              timestamp: 1640995199000,
              severity: 'INFO',
              message: 'Fallback log',
              service: 'fallback-service',
              tags: ['env:test'],
            },
          ],
        })
      })

      const server = setupServer(mockServicesHandler, logsHandler)

      await server.boundary(async () => {
        const request = createMockToolRequest('get_all_services', {
          from: 1640995100,
          to: 1640995200,
        })
        const response = (await toolHandlers.get_all_services(
          request,
        )) as unknown as CoralogixToolResponse
        expect(response.content[0].text).toContain('Services')
        expect(response.content[0].text).toContain(
          JSON.stringify(['fallback-service']),
        )
      })()

      server.close()
    })
  })
})
