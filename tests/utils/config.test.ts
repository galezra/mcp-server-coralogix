import { createCoralogixConfig, getCoralogixEndpoint } from '../../src/utils/config'

describe('createCoralogixConfig', () => {
  it('should create a Coralogix config with custom region when CORALOGIX_REGION is configured', () => {
    const axiosInstance = createCoralogixConfig({
      apiKey: 'test-api-key',
      region: 'US',
    })
    
    expect(axiosInstance.defaults.baseURL).toBe('https://api.coralogix.us')
    expect(axiosInstance.defaults.headers).toHaveProperty('Authorization', 'Bearer test-api-key')
  })

  it('should create a Coralogix config with default region when CORALOGIX_REGION is not configured', () => {
    const axiosInstance = createCoralogixConfig({
      apiKey: 'test-api-key',
    })
    
    expect(axiosInstance.defaults.baseURL).toBe('https://api.coralogix.com')
    expect(axiosInstance.defaults.headers).toHaveProperty('Authorization', 'Bearer test-api-key')
  })

  it('should throw an error when CORALOGIX_API_KEY is not configured', () => {
    expect(() =>
      createCoralogixConfig({
        apiKey: '',
      }),
    ).toThrow('Coralogix API key is required')
  })

  it('should throw an error when an invalid region is provided', () => {
    expect(() =>
      createCoralogixConfig({
        apiKey: 'test-api-key',
        region: 'INVALID_REGION',
      }),
    ).toThrow('Invalid region: INVALID_REGION')
  })
})

describe('getCoralogixEndpoint', () => {
  it('should return custom endpoint when region is provided', () => {
    const endpoint = getCoralogixEndpoint('US')
    expect(endpoint).toBe('https://api.coralogix.us')
  })

  it('should return default endpoint when region is not provided', () => {
    const endpoint = getCoralogixEndpoint()
    expect(endpoint).toBe('https://api.coralogix.com')
  })

  it('should throw an error when an invalid region is provided', () => {
    expect(() => getCoralogixEndpoint('INVALID_REGION')).toThrow('Invalid region: INVALID_REGION')
  })
}) 