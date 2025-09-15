import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuthStore } from "@/core/stores/authStore";
import { useLeanWorkflowStore } from "@/core/stores/leanWorkflowStore";

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, onToggle }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuthStore();
  const { createNewWorkflow } = useLeanWorkflowStore();

  const navigation = [
    { name: "Workflows", href: "/", icon: "🔄" },
    { name: "Executions", href: "/executions", icon: "▶️" },
    { name: "Credentials", href: "/credentials", icon: "🔐" },
    { name: "Settings", href: "/settings", icon: "⚙️" },
  ];

  const handleCreateWorkflow = async () => {
    const name = prompt("Enter workflow name:");
    if (name) {
      if (name.trim().length === 0) {
        toast.error("Please enter a valid workflow name.");
        return;
      }

      try {
        await createNewWorkflow(name.trim(), navigate);
        toast.success("Workflow created successfully!");
      } catch (error) {
        console.error("Failed to create workflow:", error);
        const errorMessage =
          error instanceof Error ? error.message : "Failed to create workflow";
        toast.error(errorMessage);
      }
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      // Navigation will be handled by ProtectedRoute when auth state changes
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <div
      className={`${isCollapsed ? "w-16" : "w-64"} bg-white border-r border-gray-200 transition-all duration-300 ease-in-out flex flex-col h-full`}
    >
      {/* Header Section */}
      <div className="border-b border-gray-200 p-4">
        <div className="flex flex-col items-center justify-between">
          <button
            onClick={onToggle}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <span className="text-lg">{isCollapsed ? "→" : "←"}</span>
          </button>
          {!isCollapsed && (
            <Link
              to="/"
              className="text-xl font-bold text-gray-900 flex items-center space-x-2"
            >
              <span>🔄</span>
              <span>RepoRunner</span>
            </Link>
          )}
          {isCollapsed && (
            <Link to="/" className="text-2xl" title="RepoRunner">
              🔄
            </Link>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      {!isCollapsed && (
        <div className="p-4 border-b border-gray-200">
          <button
            onClick={handleCreateWorkflow}
            className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center font-medium"
          >
            + Create Workflow
          </button>
        </div>
      )}

      {isCollapsed && (
        <div className="p-2 border-b border-gray-200">
          <button
            onClick={handleCreateWorkflow}
            className="w-full bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
            title="Create Workflow"
          >
            <span className="text-lg">+</span>
          </button>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto">
        <div className={`${isCollapsed ? "px-2 py-2" : "px-4 py-4"}`}>
          <ul className="space-y-2">
            {navigation.map(
              (item: { name: string; href: string; icon: string }) => (
                <li key={item.name}>
                  <Link
                    to={item.href}
                    className={`flex items-center ${isCollapsed ? "px-2 py-3 justify-center" : "px-4 py-2"} text-sm font-medium rounded-lg transition-all duration-200 ${
                      location.pathname === item.href
                        ? "bg-blue-50 text-blue-700"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    }`}
                    title={isCollapsed ? item.name : undefined}
                  >
                    <span className={`text-lg ${isCollapsed ? "" : "mr-3"}`}>
                      {item.icon}
                    </span>
                    {!isCollapsed && (
                      <span className="transition-opacity duration-200">
                        {item.name}
                      </span>
                    )}
                  </Link>
                </li>
              ),
            )}
          </ul>
        </div>
      </nav>

      {/* User Section */}
      <div className="border-t border-gray-200 p-4">
        {!isCollapsed && (
          <div className="space-y-4">
            {/* User Info */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-medium text-sm">
                {user?.firstName?.[0]?.toUpperCase() || "U"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {user?.email || "user@example.com"}
                </p>
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-start space-x-3 px-3 py-2.5 text-sm text-gray-700 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 border border-gray-200 hover:border-red-200"
              title="Logout"
            >
              <span className="text-base">🚪</span>
              <span className="font-medium">Sign out</span>
            </button>
          </div>
        )}
        {isCollapsed && (
          <div className="space-y-3">
            {/* User Avatar */}
            <div className="flex justify-center">
              <div
                className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-medium text-sm cursor-pointer hover:from-blue-600 hover:to-blue-700 transition-all duration-200"
                title={`${user?.firstName} ${user?.lastName} - ${user?.email || "user@example.com"}`}
              >
                {user?.firstName?.[0]?.toUpperCase() || "U"}
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center p-2.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 border border-gray-200 hover:border-red-200"
              title="Sign out"
            >
              <span className="text-base">🚪</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
