import type React from 'react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/core/stores/authStore';
import { useLeanWorkflowStore } from '@/core/stores/leanWorkflowStore';

const Header: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { createNewWorkflow } = useLeanWorkflowStore();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleCreateWorkflow = async () => {
    const name = prompt('Enter workflow name:');
    if (name) {
      if (name.trim().length === 0) {
        toast.error('Please enter a valid workflow name.');
        return;
      }

      try {
        await createNewWorkflow(name.trim(), navigate);
        toast.success('Workflow created successfully!');
      } catch (error) {
        console.error('Failed to create workflow:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to create workflow';
        toast.error(errorMessage);
      }
    }
  };

  const handleLogout = async () => {
    await logout();
    setShowUserMenu(false);
  };

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link to="/dashboard" className="text-xl font-bold text-gray-900">
            ⚡ Workflow Automation
          </Link>
        </div>

        <nav className="flex items-center space-x-6">
          <Link to="/dashboard" className="text-gray-600 hover:text-gray-900 font-medium">
            Dashboard
          </Link>
          <Link to="/credentials" className="text-gray-600 hover:text-gray-900 font-medium">
            Credentials
          </Link>
          <Link to="/executions" className="text-gray-600 hover:text-gray-900 font-medium">
            Executions
          </Link>
        </nav>

        <div className="flex items-center space-x-4">
          <button
            onClick={handleCreateWorkflow}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create Workflow
          </button>

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
            >
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-blue-600">
                  {user?.firstName?.[0]?.toUpperCase() || 'U'}
                </span>
              </div>
              <span className="text-sm font-medium">
                {user?.firstName} {user?.lastName}
              </span>
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-50">
                <div className="py-1">
                  <div className="px-4 py-2 text-sm text-gray-700 border-b border-gray-100">
                    <div className="font-medium">
                      {user?.firstName} {user?.lastName}
                    </div>
                    <div className="text-gray-500">{user?.email}</div>
                  </div>
                  <Link
                    to="/settings"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setShowUserMenu(false)}
                  >
                    Settings
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
