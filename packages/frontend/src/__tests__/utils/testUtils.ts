/// <reference types="vitest/globals" />
import { render, RenderOptions } from '@testing-library/react'
import { ReactElement } from 'react'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { vi } from 'vitest'

// Mock localStorage for tests
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(),
}

// Create a QueryClient for tests
const createTestQueryClient = () => 
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 0,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  })

// Custom render function with providers
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialEntries?: string[]
  queryClient?: QueryClient
}

const customRender = (
  ui: ReactElement,
  {
    initialEntries = ['/'],
    queryClient = createTestQueryClient(),
    ...renderOptions
  }: CustomRenderOptions = {}
) => {
  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <BrowserRouter>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </BrowserRouter>
    )
  }

  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
    queryClient,
  }
}

// Test Backend Configuration
export const TEST_BACKEND_URL = 'http://localhost:5000'

// Mock user data for tests
export const mockUser = {
  id: '507f1f77bcf86cd799439011',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  fullName: 'Test User',
  role: 'user' as const,
}

// Mock tokens
export const mockTokens = {
  token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.token',
  refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.refresh.token',
}

// Test API responses
export const mockAuthResponses = {
  loginSuccess: {
    success: true,
    message: 'Login successful',
    data: {
      user: mockUser,
      ...mockTokens,
    },
  },
  registerSuccess: {
    success: true,
    message: 'User registered successfully',
    data: {
      user: mockUser,
      ...mockTokens,
    },
  },
  profileSuccess: {
    success: true,
    data: {
      user: mockUser,
    },
  },
  refreshSuccess: {
    success: true,
    message: 'Token refreshed successfully',
    data: mockTokens,
  },
  loginError: {
    success: false,
    message: 'Invalid email or password',
  },
  unauthorized: {
    success: false,
    message: 'Access token is required',
  },
}

// Helper to setup localStorage mocks
export const setupLocalStorageMock = () => {
  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
    writable: true,
  })
  
  // Reset all mocks
  vi.clearAllMocks()
}

// Helper to setup authenticated user in localStorage
export const setupAuthenticatedUser = () => {
  localStorageMock.getItem.mockImplementation((key: string) => {
    switch (key) {
      case 'token':
        return mockTokens.token
      case 'refreshToken':
        return mockTokens.refreshToken
      case 'user':
        return JSON.stringify(mockUser)
      default:
        return null
    }
  })
}

// Helper to setup unauthenticated state
export const setupUnauthenticatedUser = () => {
  localStorageMock.getItem.mockReturnValue(null)
}

// Helper to wait for async operations in tests
export const waitForAsync = () => new Promise(resolve => setTimeout(resolve, 0))

// Mock fetch for API calls
export const setupFetchMock = () => {
  global.fetch = vi.fn()
  return fetch as ReturnType<typeof vi.fn>
}

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
  } as Response)
}

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
}

// Re-export everything from testing library
export * from '@testing-library/react'
export { default as userEvent } from '@testing-library/user-event'

// Custom render as default export
export { customRender as render }