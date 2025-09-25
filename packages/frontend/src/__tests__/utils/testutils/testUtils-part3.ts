bytes: vi.fn(),
} as Response)
}

// Test utilities export
export const testUtils = {
  setupLocalStorageMock,
  setupAuthenticatedUser,
  setupUnauthenticatedUser,
  setupFetchMock,
  mockApiResponse,
  mockApiError,
  waitForAsync,
  createTestQueryClient,
};

// Re-export everything from testing library
export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';

// Custom render as default export
export { customRender as render };
