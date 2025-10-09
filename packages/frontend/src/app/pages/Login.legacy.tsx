import type React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/core/stores/authStore';
import { AuthForm } from '@/design-system/components/AuthForm';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login, isLoading, error } = useAuthStore();

  const handleLogin = async (values: { email: string; password: string }) => {
    try {
      await login({ ...values, rememberMe: false });
      navigate('/dashboard');
    } catch (_error) {
      // Error is handled by the store
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <AuthForm
        type="login"
        onSubmit={handleLogin}
        loading={isLoading}
        error={error || undefined}
      />
    </div>
  );
};

export default Login;
