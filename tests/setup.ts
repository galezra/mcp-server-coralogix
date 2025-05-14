import { afterEach, vi } from 'vitest'

// Set up test environment variables
process.env.CORALOGIX_API_KEY = 'cxup_yr67ZMacapGCDDZZN6UYKLEELWYSJH'
process.env.CORALOGIX_REGION = 'EUROPE'

// Reset handlers after each test
afterEach(() => {
  // server.resetHandlers()
  vi.clearAllMocks()
})
