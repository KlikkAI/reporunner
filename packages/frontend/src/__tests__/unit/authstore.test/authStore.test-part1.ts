/* eslint-disable @typescript-eslint/no-explicit-any */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { authApiService } from '@/core';
import type { LoginCredentials, RegisterRequest, UserProfile } from '@/core/schemas';
import { useAuthStore } from '@/core/stores/authStore';

// Mock the auth API service
vi.mock('@/core', () => ({
  authApiService: {
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    getProfile: vi.fn(),
    updateProfile: vi.fn(),
    changePassword: vi.fn(),
    clearAuthData: vi.fn(),
    isAuthenticated: vi.fn(),
  },
}));

// Mock data
const mockUser: UserProfile = {
  id: '507f1f77bcf86cd799439011',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  fullName: 'Test User',
  role: 'user',
};

const mockLoginCredentials: LoginCredentials = {
  email: 'test@example.com',
  password: 'TestPass123',
  rememberMe: false,
};

const mockRegisterData: RegisterRequest = {
  email: 'test@example.com',
  password: 'TestPass123',
  firstName: 'Test',
  lastName: 'User',
  acceptTerms: true,
};

const mockAuthResponse = {
  user: mockUser,
  token: 'mock-jwt-token',
  refreshToken: 'mock-refresh-token',
};

describe('AuthStore', () => {
  beforeEach(() => {
    // Reset the store state before each test
    useAuthStore.getState().logout();
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Clean up any side effects
    vi.clearAllTimers();
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const state = useAuthStore.getState();

      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });
  });

  describe('login', () => {
    it('should login successfully with valid credentials', async () => {
      // Mock successful login response
      vi.mocked(authApiService.login).mockResolvedValue(mockAuthResponse);

      const store = useAuthStore.getState();

      // Execute login
      await store.login(mockLoginCredentials);

      // Verify API was called with correct credentials
      expect(authApiService.login).toHaveBeenCalledWith(mockLoginCredentials);

      // Verify state is updated correctly
      const newState = useAuthStore.getState();
      expect(newState.user).toEqual(mockUser);
      expect(newState.isAuthenticated).toBe(true);
      expect(newState.isLoading).toBe(false);
      expect(newState.error).toBeNull();
    });

    it('should handle login failure', async () => {
      const errorMessage = 'Invalid email or password';
      vi.mocked(authApiService.login).mockRejectedValue(new Error(errorMessage));

      const store = useAuthStore.getState();
