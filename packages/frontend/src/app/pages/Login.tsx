/**
 * Login Page - Migrated to UniversalForm + PageGenerator
 *
 * Migrated from AuthForm to configurable form generation.
 * Demonstrates authentication page creation using factory patterns.
 *
 * Reduction: ~30 lines → ~60 lines (expansion for better UX)
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LoginOutlined, UserOutlined, LockOutlined } from '@ant-design/icons';
import { useAuthStore } from '@/core/stores/authStore';
import {
  UniversalForm,
  ComponentGenerator,
} from '@/design-system';
import type { PropertyRendererConfig } from '@/design-system';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login, loading, error } = useAuthStore();

  // Login form properties
  const loginProperties: PropertyRendererConfig[] = [
    {
      id: 'email',
      type: 'email',
      label: 'Email Address',
      required: true,
      placeholder: 'Enter your email',
      validation: {
        rules: [
          { type: 'required', message: 'Email is required' },
          { type: 'pattern', value: '^[\\w-\\.]+@([\\w-]+\\.)+[\\w-]{2,4}$', message: 'Please enter a valid email' },
        ],
      },
      styling: {
        size: 'lg',
        fullWidth: true,
      },
    },
    {
      id: 'password',
      type: 'password',
      label: 'Password',
      required: true,
      placeholder: 'Enter your password',
      validation: {
        rules: [
          { type: 'required', message: 'Password is required' },
          { type: 'min', value: 8, message: 'Password must be at least 8 characters' },
        ],
      },
      styling: {
        size: 'lg',
        fullWidth: true,
      },
    },
    {
      id: 'rememberMe',
      type: 'checkbox',
      label: 'Remember me',
      defaultValue: false,
      styling: {
        customClasses: ['mt-2'],
      },
    },
  ];

  const handleLogin = async (values: { email: string; password: string; rememberMe?: boolean }) => {
    const success = await login(values.email, values.password);
    if (success) {
      navigate('/dashboard');
    }
  };

  // Create login card using ComponentGenerator
  const loginCard = ComponentGenerator.generateCard({
    id: 'login-card',
    type: 'card',
    className: 'max-w-md w-full',
    children: [
      {
        id: 'login-header',
        type: 'content',
        props: {
          children: (
            <div className="text-center mb-8">
              <div className="mx-auto w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mb-4">
                <UserOutlined className="text-2xl text-blue-600 dark:text-blue-400" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Welcome Back</h2>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Sign in to your Reporunner account
              </p>
            </div>
          ),
        },
      },
      {
        id: 'login-form',
        type: 'content',
        props: {
          children: (
            <div>
              {error && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </div>
              )}

              <UniversalForm
                properties={loginProperties}
                onSubmit={handleLogin}
                submitText="Sign In"
                loading={loading}
                layout="vertical"
                className="space-y-4"
              />

              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Don't have an account?{' '}
                  <button
                    onClick={() => navigate('/register')}
                    className="text-blue-600 dark:text-blue-400 hover:text-blue-500 font-medium"
                  >
                    Sign up
                  </button>
                </p>
              </div>

              <div className="mt-4 text-center">
                <button
                  onClick={() => navigate('/forgot-password')}
                  className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-500"
                >
                  Forgot your password?
                </button>
              </div>
            </div>
          ),
        },
      },
    ],
  });

  // Alternative actions
  const alternativeActions = ComponentGenerator.generateActionBar([
    {
      label: 'Demo Account',
      type: 'secondary',
      onClick: () => handleLogin({ email: 'demo@reporunner.com', password: 'demo123456' }),
    },
    {
      label: 'GitHub OAuth',
      icon: <LockOutlined />,
      onClick: () => {
        // GitHub OAuth integration
        window.location.href = '/auth/github';
      },
    },
  ]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="space-y-6">
        {loginCard}

        <div className="text-center">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300 dark:border-gray-700" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-50 dark:bg-gray-900 text-gray-500">Or</span>
            </div>
          </div>

          <div className="mt-4">
            {alternativeActions}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;