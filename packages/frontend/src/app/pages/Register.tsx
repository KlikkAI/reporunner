import type React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/core/stores/authStore';
import { AuthForm } from '@/design-system/components/AuthForm';

const Register: React.FC = () => {
  const navigate = useNavigate();
  const { register, loading, error } = useAuthStore();

  const handleRegister = async (values: { email: string; password: string }) => {
    const success = await register(values.email, values.password);
    if (success) {
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <AuthForm type="register" onSubmit={handleRegister} loading={loading} error={error} />
    </div>
  );
};

export default Register;
