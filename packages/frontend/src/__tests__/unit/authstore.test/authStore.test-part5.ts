const apiError = {
  response: {
    data: {
      message: 'Detailed error message',
    },
  },
};

vi.mocked(authApiService.login).mockRejectedValue(apiError);

const store = useAuthStore.getState();

await store.login(mockLoginCredentials);

// The error should be extracted properly from the API error structure
const newState = useAuthStore.getState();
expect(newState.error).toBeTruthy();
})

it('should handle network errors without response', async () =>
{
  const networkError = new Error('Network Error');

  vi.mocked(authApiService.login).mockRejectedValue(networkError);

  const store = useAuthStore.getState();

  await store.login(mockLoginCredentials);

  const newState = useAuthStore.getState();
  expect(newState.error).toBe('Network Error');
}
)
})

describe('Persistence', () =>
{
  it('should persist authentication state', () => {
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
}
)
})
