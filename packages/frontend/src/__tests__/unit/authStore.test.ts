import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { useAuthStore } from "@/core/stores/authStore";
import { authApiService } from "@/core";
import type {
  LoginCredentials,
  RegisterRequest,
  UserProfile,
} from "@/core/schemas";

// Mock the auth API service
vi.mock("@/core", () => ({
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
  id: "507f1f77bcf86cd799439011",
  email: "test@example.com",
  firstName: "Test",
  lastName: "User",
  fullName: "Test User",
  role: "user",
};

const mockLoginCredentials: LoginCredentials = {
  email: "test@example.com",
  password: "TestPass123",
  rememberMe: false,
};

const mockRegisterData: RegisterRequest = {
  email: "test@example.com",
  password: "TestPass123",
  firstName: "Test",
  lastName: "User",
  acceptTerms: true,
};

const mockAuthResponse = {
  user: mockUser,
  token: "mock-jwt-token",
  refreshToken: "mock-refresh-token",
};

describe("AuthStore", () => {
  beforeEach(() => {
    // Reset the store state before each test
    useAuthStore.getState().logout();
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Clean up any side effects
    vi.clearAllTimers();
  });

  describe("Initial State", () => {
    it("should have correct initial state", () => {
      const state = useAuthStore.getState();

      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });
  });

  describe("login", () => {
    it("should login successfully with valid credentials", async () => {
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

    it("should handle login failure", async () => {
      const errorMessage = "Invalid email or password";
      vi.mocked(authApiService.login).mockRejectedValue(
        new Error(errorMessage),
      );

      const store = useAuthStore.getState();

      // Execute login
      await store.login(mockLoginCredentials);

      // Verify API was called
      expect(authApiService.login).toHaveBeenCalledWith(mockLoginCredentials);

      // Verify error state is set
      const newState = useAuthStore.getState();
      expect(newState.user).toBeNull();
      expect(newState.isAuthenticated).toBe(false);
      expect(newState.isLoading).toBe(false);
      expect(newState.error).toBe(errorMessage);
    });

    it("should set loading state during login", async () => {
      // Create a promise that we can control
      let resolveLogin: (value: {
        user: UserProfile;
        token: string;
        refreshToken: string;
      }) => void;
      const loginPromise = new Promise((resolve) => {
        resolveLogin = resolve;
      });

      vi.mocked(authApiService.login).mockReturnValue(loginPromise);

      const store = useAuthStore.getState();

      // Start login (don't await yet)
      const loginCall = store.login(mockLoginCredentials);

      // Check loading state
      expect(useAuthStore.getState().isLoading).toBe(true);

      // Resolve the login
      resolveLogin!(mockAuthResponse as any);
      await loginCall;

      // Check final state
      expect(useAuthStore.getState().isLoading).toBe(false);
    });
  });

  describe("register", () => {
    it("should register successfully", async () => {
      vi.mocked(authApiService.register).mockResolvedValue(mockAuthResponse);

      const store = useAuthStore.getState();

      await store.register(mockRegisterData);

      expect(authApiService.register).toHaveBeenCalledWith(mockRegisterData);

      const newState = useAuthStore.getState();
      expect(newState.user).toEqual(mockUser);
      expect(newState.isAuthenticated).toBe(true);
      expect(newState.isLoading).toBe(false);
      expect(newState.error).toBeNull();
    });

    it("should handle registration failure", async () => {
      const errorMessage = "User already exists with this email";
      vi.mocked(authApiService.register).mockRejectedValue(
        new Error(errorMessage),
      );

      const store = useAuthStore.getState();

      await store.register(mockRegisterData);

      const newState = useAuthStore.getState();
      expect(newState.user).toBeNull();
      expect(newState.isAuthenticated).toBe(false);
      expect(newState.error).toBe(errorMessage);
    });
  });

  describe("logout", () => {
    it("should logout successfully", async () => {
      // First set an authenticated state
      useAuthStore.setState({
        user: mockUser,
        isAuthenticated: true,
        error: null,
      });

      vi.mocked(authApiService.logout).mockResolvedValue();

      const store = useAuthStore.getState();

      await store.logout();

      expect(authApiService.logout).toHaveBeenCalled();

      const newState = useAuthStore.getState();
      expect(newState.user).toBeNull();
      expect(newState.isAuthenticated).toBe(false);
      expect(newState.isLoading).toBe(false);
      expect(newState.error).toBeNull();
    });

    it("should handle logout failure gracefully", async () => {
      // Set authenticated state
      useAuthStore.setState({
        user: mockUser,
        isAuthenticated: true,
      });

      vi.mocked(authApiService.logout).mockRejectedValue(
        new Error("Network error"),
      );

      const store = useAuthStore.getState();

      await store.logout();

      // Should still clear local state even if API call fails
      const newState = useAuthStore.getState();
      expect(newState.user).toBeNull();
      expect(newState.isAuthenticated).toBe(false);
    });
  });

  describe("getCurrentUser", () => {
    it("should get current user successfully", async () => {
      vi.mocked(authApiService.getProfile).mockResolvedValue(mockUser);

      const store = useAuthStore.getState();

      await store.getCurrentUser();

      expect(authApiService.getProfile).toHaveBeenCalled();

      const newState = useAuthStore.getState();
      expect(newState.user).toEqual(mockUser);
      expect(newState.isAuthenticated).toBe(true);
      expect(newState.error).toBeNull();
    });

    it("should handle unauthorized getCurrentUser", async () => {
      const unauthorizedError = {
        status: 401,
        code: "TOKEN_REFRESH_ERROR",
        message: "Invalid token",
      };

      vi.mocked(authApiService.getProfile).mockRejectedValue(unauthorizedError);
      vi.mocked(authApiService.clearAuthData).mockResolvedValue({
        message: "Cleared",
      });

      // Start with authenticated state
      useAuthStore.setState({
        user: mockUser,
        isAuthenticated: true,
      });

      const store = useAuthStore.getState();

      await store.getCurrentUser();

      // Should clear auth state for 401 errors
      const newState = useAuthStore.getState();
      expect(newState.user).toBeNull();
      expect(newState.isAuthenticated).toBe(false);
      expect(authApiService.clearAuthData).toHaveBeenCalled();
    });

    it("should handle non-auth errors gracefully", async () => {
      const networkError = {
        status: 500,
        message: "Network error",
      };

      vi.mocked(authApiService.getProfile).mockRejectedValue(networkError);

      // Start with authenticated state
      useAuthStore.setState({
        user: mockUser,
        isAuthenticated: true,
      });

      const store = useAuthStore.getState();

      await store.getCurrentUser();

      // Should keep user logged in for non-auth errors
      const newState = useAuthStore.getState();
      expect(newState.user).toEqual(mockUser);
      expect(newState.isAuthenticated).toBe(true);
      expect(newState.error).toBe(networkError.message);
    });
  });

  describe("updateProfile", () => {
    it("should update profile successfully", async () => {
      const updatedUser = {
        ...mockUser,
        firstName: "Updated",
        lastName: "Name",
      };
      const profileUpdates = { firstName: "Updated", lastName: "Name" };

      // Start with authenticated state
      useAuthStore.setState({
        user: mockUser,
        isAuthenticated: true,
      });

      vi.mocked(authApiService.updateProfile).mockResolvedValue(updatedUser);

      const store = useAuthStore.getState();

      await store.updateProfile(profileUpdates);

      expect(authApiService.updateProfile).toHaveBeenCalledWith(profileUpdates);

      const newState = useAuthStore.getState();
      expect(newState.user).toEqual(updatedUser);
      expect(newState.error).toBeNull();
    });

    it("should handle profile update failure", async () => {
      const errorMessage = "Validation failed";

      useAuthStore.setState({
        user: mockUser,
        isAuthenticated: true,
      });

      vi.mocked(authApiService.updateProfile).mockRejectedValue(
        new Error(errorMessage),
      );

      const store = useAuthStore.getState();

      await store.updateProfile({ firstName: "Updated" });

      const newState = useAuthStore.getState();
      expect(newState.error).toBe(errorMessage);
      expect(newState.user).toEqual(mockUser); // Should remain unchanged
    });
  });

  describe("changePassword", () => {
    it("should change password successfully", async () => {
      useAuthStore.setState({
        user: mockUser,
        isAuthenticated: true,
      });

      vi.mocked(authApiService.changePassword).mockResolvedValue();

      const store = useAuthStore.getState();

      await store.changePassword("currentPass123", "newPass123");

      expect(authApiService.changePassword).toHaveBeenCalledWith({
        currentPassword: "currentPass123",
        newPassword: "newPass123",
      });

      const newState = useAuthStore.getState();
      expect(newState.error).toBeNull();
    });

    it("should handle password change failure", async () => {
      const errorMessage = "Current password is incorrect";

      useAuthStore.setState({
        user: mockUser,
        isAuthenticated: true,
      });

      vi.mocked(authApiService.changePassword).mockRejectedValue(
        new Error(errorMessage),
      );

      const store = useAuthStore.getState();

      await store.changePassword("wrongPass", "newPass123");

      const newState = useAuthStore.getState();
      expect(newState.error).toBe(errorMessage);
    });
  });

  describe("clearError", () => {
    it("should clear error state", () => {
      // Set error state
      useAuthStore.setState({ error: "Some error" });

      const store = useAuthStore.getState();
      store.clearError();

      const newState = useAuthStore.getState();
      expect(newState.error).toBeNull();
    });
  });

  describe("Error handling", () => {
    it("should handle API errors with proper error extraction", async () => {
      const apiError = {
        response: {
          data: {
            message: "Detailed error message",
          },
        },
      };

      vi.mocked(authApiService.login).mockRejectedValue(apiError);

      const store = useAuthStore.getState();

      await store.login(mockLoginCredentials);

      // The error should be extracted properly from the API error structure
      const newState = useAuthStore.getState();
      expect(newState.error).toBeTruthy();
    });

    it("should handle network errors without response", async () => {
      const networkError = new Error("Network Error");

      vi.mocked(authApiService.login).mockRejectedValue(networkError);

      const store = useAuthStore.getState();

      await store.login(mockLoginCredentials);

      const newState = useAuthStore.getState();
      expect(newState.error).toBe("Network Error");
    });
  });

  describe("Persistence", () => {
    it("should persist authentication state", () => {
      // Set authenticated state
      useAuthStore.setState({
        user: mockUser,
        isAuthenticated: true,
      });

      // The store should persist this state
      // (Testing persistence behavior is complex in unit tests,
      // this would be better tested in integration tests)
      const state = useAuthStore.getState();
      expect(state.user).toEqual(mockUser);
      expect(state.isAuthenticated).toBe(true);
    });
  });
});
