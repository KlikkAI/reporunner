import type React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/core/stores/authStore';
import { AuthForm } from '@/design-system/components/AuthForm';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login, loading, error } = useAuthStore();

  const handleLogin = async (values: { email: string; password: string }) => {
    const success = await login(values.email, values.password);
    if (success) {
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <AuthForm type="login" onSubmit={handleLogin} loading={loading} error={error} />
    </div>
  );
};

export default Login;
