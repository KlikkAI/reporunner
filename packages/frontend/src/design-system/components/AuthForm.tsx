// Shared Authentication Form Component

import { Button, Form, Input } from 'antd';
import type React from 'react';

interface AuthFormProps {
  type: 'login' | 'register';
  onSubmit: (values: any) => void;
  loading?: boolean;
  error?: string;
}

export const AuthForm: React.FC<AuthFormProps> = ({ type, onSubmit, loading, error }) => {
  const [form] = Form.useForm();

  const handleSubmit = (values: any) => {
    onSubmit(values);
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-center mb-6">
        {type === 'login' ? 'Sign In' : 'Create Account'}
      </h2>

      <Form form={form} onFinish={handleSubmit} layout="vertical">
        <Form.Item
          name="email"
          label="Email"
          rules={[
            { required: true, message: 'Please input your email!' },
            { type: 'email', message: 'Please enter a valid email!' },
          ]}
        >
          <Input placeholder="Enter your email" />
        </Form.Item>

        <Form.Item
          name="password"
          label="Password"
          rules={[
            { required: true, message: 'Please input your password!' },
            { min: 8, message: 'Password must be at least 8 characters!' },
          ]}
        >
          <Input.Password placeholder="Enter your password" />
        </Form.Item>

        {type === 'register' && (
          <Form.Item
            name="confirmPassword"
            label="Confirm Password"
            dependencies={['password']}
            rules={[
              { required: true, message: 'Please confirm your password!' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('Passwords do not match!'));
                },
              }),
            ]}
          >
            <Input.Password placeholder="Confirm your password" />
          </Form.Item>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading} className="w-full">
            {type === 'login' ? 'Sign In' : 'Create Account'}
          </Button>
        </Form.Item>

        <div className="text-center">
          {type === 'login' ? (
            <p>
              Don't have an account? <a href="/register">Sign up</a>
            </p>
          ) : (
            <p>
              Already have an account? <a href="/login">Sign in</a>
            </p>
          )}
        </div>
      </Form>
    </div>
  );
};

export default AuthForm;
