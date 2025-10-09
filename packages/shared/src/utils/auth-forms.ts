// Shared Authentication Form Utilities
export const createAuthFormValidation = () => ({
  email: { required: true, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
  password: { required: true, minLength: 8 },
});

export const createAuthFormState = () => ({
  email: '',
  password: '',
  confirmPassword: '',
  loading: false,
  error: null,
});

interface AuthFormData {
  email: string;
  password: string;
  confirmPassword?: string;
}

interface AuthResponse {
  success: boolean;
  data: AuthFormData;
}

interface ApiError {
  response?: {
    data?: {
      message?: string;
    };
  };
}

export const authFormSubmitHandler = async (
  data: AuthFormData,
  _type: 'login' | 'register'
): Promise<AuthResponse> => {
  // Common form submission logic
  return { success: true, data };
};

export const authFormErrorHandler = (error: unknown): string => {
  const apiError = error as ApiError;
  return apiError.response?.data?.message || 'Authentication failed';
};
