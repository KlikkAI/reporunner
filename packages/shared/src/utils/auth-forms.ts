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

export const authFormSubmitHandler = async (data: any, _type: 'login' | 'register') => {
  // Common form submission logic
  return { success: true, data };
};

export const authFormErrorHandler = (error: any) => {
  return error.response?.data?.message || 'Authentication failed';
};
