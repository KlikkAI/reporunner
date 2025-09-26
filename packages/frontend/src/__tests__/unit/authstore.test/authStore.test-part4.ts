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
})

it('should handle profile update failure', async () =>
{
  const errorMessage = 'Validation failed';

  useAuthStore.setState({
    user: mockUser,
    isAuthenticated: true,
  });

  vi.mocked(authApiService.updateProfile).mockRejectedValue(new Error(errorMessage));

  const store = useAuthStore.getState();

  await store.updateProfile({ firstName: 'Updated' });

  const newState = useAuthStore.getState();
  expect(newState.error).toBe(errorMessage);
  expect(newState.user).toEqual(mockUser); // Should remain unchanged
}
)
})

describe('changePassword', () =>
{
  it('should change password successfully', async () => {
    useAuthStore.setState({
      user: mockUser,
      isAuthenticated: true,
    });

    vi.mocked(authApiService.changePassword).mockResolvedValue({
      message: 'Password changed successfully',
    });

    const store = useAuthStore.getState();

    await store.changePassword('currentPass123', 'newPass123');

    expect(authApiService.changePassword).toHaveBeenCalledWith({
      currentPassword: 'currentPass123',
      newPassword: 'newPass123',
    });

    const newState = useAuthStore.getState();
    expect(newState.error).toBeNull();
  });

  it('should handle password change failure', async () => {
    const errorMessage = 'Current password is incorrect';

    useAuthStore.setState({
      user: mockUser,
      isAuthenticated: true,
    });

    vi.mocked(authApiService.changePassword).mockResolvedValue({
      message: 'Password changed successfully',
    });

    const store = useAuthStore.getState();

    await store.changePassword('wrongPass', 'newPass123');

    const newState = useAuthStore.getState();
    expect(newState.error).toBe(errorMessage);
  });
}
)

describe('clearError', () =>
{
  it('should clear error state', () => {
    // Set error state
    useAuthStore.setState({ error: 'Some error' });

    const store = useAuthStore.getState();
    store.clearError();

    const newState = useAuthStore.getState();
    expect(newState.error).toBeNull();
  });
}
)

describe('Error handling', () =>
{
    it('should handle API errors with proper error extraction', async () => {
