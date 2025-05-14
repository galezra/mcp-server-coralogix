import { describe, it, expect } from 'vitest'
import { createCoralogixConfig } from '../../src/utils/config'
import { TracesApiClient } from '../../src/utils/coralogix'
import { createTracesToolHandlers } from '../../src/tools/traces/tool'
import { createMockToolRequest } from '../helpers/mock'
import { http, HttpResponse } from 'msw'
import { setupServer } from '../helpers/msw'
import { baseUrl, CoralogixToolResponse } from '../helpers/coralogix'

const tracesEndpoint = `${baseUrl}/traces/search`

describe('Traces Tool', () => {
  // Create a mock Coralogix API client
  const axiosInstance = createCoralogixConfig({
    apiKey: 'test-api-key',
    region: 'EUROPE',
  })
  
  const apiClient = new TracesApiClient(axiosInstance)
  const toolHandlers = createTracesToolHandlers(apiClient)

  describe.concurrent('search_traces', async () => {
    it('should search traces with basic query', async () => {
      const mockHandler = http.post(tracesEndpoint, async () => {
        return HttpResponse.json({
          traces: [
            {
              traceId: 'trace-id-1',
              spanId: 'span-id-1',
              parentSpanId: 'parent-id-1',
              service: 'web-api',
              name: 'http.request',
              resource: 'GET /api/users',
              timestamp: 1640995100000,
              duration: 500,
              error: true,
              tags: {
                'http.method': 'GET',
                'http.status_code': '500',
                'error.type': 'Internal Server Error',
              },
            },
            {
              traceId: 'trace-id-2',
              spanId: 'span-id-2',
              parentSpanId: 'parent-id-2',
              service: 'web-api',
              name: 'http.request',
              resource: 'GET /api/products',
              timestamp: 1640995000000,
              duration: 300,
              error: true,
              tags: {
                'http.method': 'GET',
                'http.status_code': '500',
                'error.type': 'Internal Server Error',
              },
            },
          ],
          pagination: {
            nextToken: 'cursor-value',
          },
        })
      })

      const server = setupServer(mockHandler)

      await server.boundary(async () => {
        const request = createMockToolRequest('search_traces', {
          query: 'http.status_code:500',
          from: 1640995000,
          to: 1640996000,
          limit: 50,
        })
        const response = (await toolHandlers.search_traces(
          request,
        )) as unknown as CoralogixToolResponse

        expect(response.content[0].text).toContain('Traces:')
        expect(response.content[0].text).toContain('web-api')
        expect(response.content[0].text).toContain('GET /api/users')
        expect(response.content[0].text).toContain('GET /api/products')
      })()

      server.close()
    })

    it('should include service and operation filters', async () => {
      const mockHandler = http.post(tracesEndpoint, async () => {
        return HttpResponse.json({
          traces: [
            {
              traceId: 'trace-id-3',
              spanId: 'span-id-3',
              parentSpanId: 'parent-id-3',
              service: 'payment-service',
              name: 'process-payment',
              resource: 'process-payment',
              timestamp: 1640995100000,
              duration: 800,
              error: true,
              tags: {
                'error.type': 'PaymentProcessingError',
              },
            },
          ],
          pagination: {
            nextToken: null,
          },
        })
      })

      const server = setupServer(mockHandler)

      await server.boundary(async () => {
        const request = createMockToolRequest('search_traces', {
          query: 'error:true',
          from: 1640995000,
          to: 1640996000,
          service: 'payment-service',
          operation: 'process-payment',
        })
        const response = (await toolHandlers.search_traces(
          request,
        )) as unknown as CoralogixToolResponse

        expect(response.content[0].text).toContain('payment-service')
        expect(response.content[0].text).toContain('process-payment')
        expect(response.content[0].text).toContain('PaymentProcessingError')
      })()

      server.close()
    })

    it('should handle empty response', async () => {
      const mockHandler = http.post(tracesEndpoint, async () => {
        return HttpResponse.json({
          traces: [],
          pagination: {},
        })
      })

      const server = setupServer(mockHandler)

      await server.boundary(async () => {
        const request = createMockToolRequest('search_traces', {
          query: 'service:non-existent',
          from: 1640995000,
          to: 1640996000,
        })
        const response = (await toolHandlers.search_traces(
          request,
        )) as unknown as CoralogixToolResponse

        expect(response.content[0].text).toContain('Traces:')
        expect(response.content[0].text).toContain('[]')
      })()

      server.close()
    })

    it('should handle null response data', async () => {
      const mockHandler = http.post(tracesEndpoint, async () => {
        return HttpResponse.json({
          traces: null,
        })
      })

      const server = setupServer(mockHandler)

      await server.boundary(async () => {
        const request = createMockToolRequest('search_traces', {
          query: '',
          from: 1640995000,
          to: 1640996000,
        })
        await expect(toolHandlers.search_traces(request)).rejects.toThrow(
          'No traces data returned',
        )
      })()

      server.close()
    })

    it('should handle authentication errors', async () => {
      const mockHandler = http.post(tracesEndpoint, async () => {
        return HttpResponse.json(
          { message: 'Authentication failed' },
          { status: 403 },
        )
      })

      const server = setupServer(mockHandler)

      await server.boundary(async () => {
        const request = createMockToolRequest('search_traces', {
          query: '',
          from: 1640995000,
          to: 1640996000,
        })
        await expect(toolHandlers.search_traces(request)).rejects.toThrow()
      })()

      server.close()
    })

    it('should handle rate limit errors', async () => {
      const mockHandler = http.post(tracesEndpoint, async () => {
        return HttpResponse.json(
          { message: 'Rate limit exceeded' },
          { status: 429 },
        )
      })

      const server = setupServer(mockHandler)

      await server.boundary(async () => {
        const request = createMockToolRequest('search_traces', {
          query: '',
          from: 1640995000,
          to: 1640996000,
        })
        await expect(toolHandlers.search_traces(request)).rejects.toThrow(
          'Rate limit exceeded',
        )
      })()

      server.close()
    })
  })
})
