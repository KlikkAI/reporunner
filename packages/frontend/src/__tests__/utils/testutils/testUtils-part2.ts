{
  user: mockUser,
}
,
  },
  refreshSuccess:
{
  success: true, message;
  : 'Token refreshed successfully',
    data: mockTokens,
}
,
  loginError:
{
  success: false, message;
  : 'Invalid email or password',
}
,
  unauthorized:
{
  success: false, message;
  : 'Access token is required',
}
,
}

// Helper to setup localStorage mocks
export const setupLocalStorageMock = () => {
  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
    writable: true,
  });

  // Reset all mocks
  vi.clearAllMocks();
};

// Helper to setup authenticated user in localStorage
export const setupAuthenticatedUser = () => {
  localStorageMock.getItem.mockImplementation((key: string) => {
    switch (key) {
      case 'token':
        return mockTokens.token;
      case 'refreshToken':
        return mockTokens.refreshToken;
      case 'user':
        return JSON.stringify(mockUser);
      default:
        return null;
    }
  });
};

// Helper to setup unauthenticated state
export const setupUnauthenticatedUser = () => {
  localStorageMock.getItem.mockReturnValue(null);
};

// Helper to wait for async operations in tests
export const waitForAsync = () => new Promise((resolve) => setTimeout(resolve, 0));

// Mock fetch for API calls
export const setupFetchMock = () => {
  global.fetch = vi.fn();
  return fetch as ReturnType<typeof vi.fn>;
};

// Helper to mock successful API responses
export const mockApiResponse = (data: any, status = 200) => {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(data),
    headers: new Headers(),
    redirected: false,
    statusText: status === 200 ? 'OK' : 'Error',
    type: 'basic' as ResponseType,
    url: '',
    clone: vi.fn(),
    body: null,
    bodyUsed: false,
    arrayBuffer: vi.fn(),
    blob: vi.fn(),
    formData: vi.fn(),
    text: vi.fn(),
    bytes: vi.fn(),
  } as Response);
};

// Helper to mock API errors
export const mockApiError = (status = 500, message = 'Server Error') => {
  return Promise.resolve({
    ok: false,
    status,
    json: () => Promise.resolve({ success: false, message }),
    headers: new Headers(),
    redirected: false,
    statusText: message,
    type: 'basic' as ResponseType,
    url: '',
    clone: vi.fn(),
    body: null,
    bodyUsed: false,
    arrayBuffer: vi.fn(),
    blob: vi.fn(),
    formData: vi.fn(),
    text: vi.fn(),
