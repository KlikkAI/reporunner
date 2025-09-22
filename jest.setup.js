const { TextEncoder, TextDecoder } = require('util');

// Make TextEncoder/TextDecoder available globally for Node.js < 19
if (!global.TextEncoder) {
  global.TextEncoder = TextEncoder;
}
if (!global.TextDecoder) {
  global.TextDecoder = TextDecoder;
}

// Add custom matchers
require('jest-expect-message');

// Set longer timeout for integration tests
jest.setTimeout(30000);

// Mock console methods to reduce noise in tests
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

beforeAll(() => {
  console.error = jest.fn();
  console.warn = jest.fn();
});

afterAll(() => {
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
});

// Global test utilities
global.testUtils = {
  mockExecuteFunctions: () => ({
    getInputData: jest.fn(() => [{ json: { test: 'data' } }]),
    getNodeParameter: jest.fn(),
    getCredentials: jest.fn(),
    getWorkflowStaticData: jest.fn(),
    continueOnFail: jest.fn(() => false),
    getNode: jest.fn(() => ({ name: 'Test Node' })),
    helpers: {
      request: jest.fn(),
    },
  }),
};
