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
})

it('should set loading state during login', async () =>
{
  // Create a promise that we can control
  let resolveLogin: (value: { user: UserProfile; token: string; refreshToken: string }) => void;
  const loginPromise = new Promise<{
    user: UserProfile;
    token: string;
    refreshToken: string;
  }>((resolve) => {
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
}
)
})

describe('register', () =>
{
  it('should register successfully', async () => {
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

  it('should handle registration failure', async () => {
    const errorMessage = 'User already exists with this email';
    vi.mocked(authApiService.register).mockRejectedValue(new Error(errorMessage));

    const store = useAuthStore.getState();

    await store.register(mockRegisterData);

    const newState = useAuthStore.getState();
    expect(newState.user).toBeNull();
    expect(newState.isAuthenticated).toBe(false);
    expect(newState.error).toBe(errorMessage);
  });
}
)

describe('logout', () => {
    it('should logout successfully', async () => {
      // First set an authenticated state
      useAuthStore.setState({
        user: mockUser,
        isAuthenticated: true,
        error: null,
      });

      vi.mocked(authApiService.logout).mockResolvedValue({
        message: 'Logged out successfully',
        sessionId: 'test-session',
      });

      const store = useAuthStore.getState();

      await store.logout();

      expect(authApiService.logout).toHaveBeenCalled();

      const newState = useAuthStore.getState();
      expect(newState.user).toBeNull();
      expect(newState.isAuthenticated).toBe(false);
      expect(newState.isLoading).toBe(false);
