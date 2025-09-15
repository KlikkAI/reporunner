import React, { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useLeanWorkflowStore, WorkflowApiService } from "@/core";
import { VirtualizedList } from "@/design-system";
import type { ExecutionStats } from "@/core/types/execution";
import type { Workflow } from "@/core/types/workflow";

const workflowApiService = new WorkflowApiService();

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const {
    createNewWorkflow,
    deleteWorkflow,
    isLoading,
    shouldRefreshDashboard,
    setShouldRefreshDashboard,
  } = useLeanWorkflowStore();
  const [workflows, setWorkflows] = useState<Workflow[]>([]);

  const [stats, setStats] = useState<ExecutionStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  const loadWorkflows = async () => {
    try {
      const result = await workflowApiService.getWorkflows();
      setWorkflows(result.items);
    } catch (error) {
      console.error("Failed to load workflows:", error);
      setWorkflows([]);
    }
  };

  useEffect(() => {
    loadWorkflows();
    loadStats();
  }, []);

  // Check for refresh flag when component mounts or refresh flag changes
  useEffect(() => {
    if (shouldRefreshDashboard) {
      loadWorkflows();
      loadStats();
      setShouldRefreshDashboard(false);
    }
  }, [shouldRefreshDashboard, setShouldRefreshDashboard]);

  const loadStats = async () => {
    setStatsLoading(true);
    try {
      const executionStats = await workflowApiService.getExecutionStats();
      setStats(executionStats);
    } catch (error) {
      console.error("Failed to load stats:", error);
    } finally {
      setStatsLoading(false);
    }
  };

  const handleCreateWorkflow = async () => {
    const name = prompt("Enter workflow name:");
    if (name) {
      if (name.trim().length === 0) {
        toast.error("Please enter a valid workflow name.");
        return;
      }

      try {
        await createNewWorkflow(name.trim(), navigate);
        // Refresh the dashboard workflows list
        await loadWorkflows();
        toast.success("Workflow created successfully!");
      } catch (error) {
        console.error("Failed to create workflow:", error);
        const errorMessage =
          error instanceof Error ? error.message : "Failed to create workflow";
        toast.error(errorMessage);
      }
    }
  };

  // Render function for workflow items in virtualized list
  const renderWorkflowItem = useCallback(
    (workflow: Workflow) => (
      <div
        key={workflow.id}
        className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors mb-4"
      >
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-3">
              <h3 className="font-medium text-gray-900">{workflow.name}</h3>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  workflow.status === "active" || workflow.isActive
                    ? "bg-green-100 text-green-800"
                    : workflow.status === "error"
                      ? "bg-red-100 text-red-800"
                      : "bg-gray-100 text-gray-800"
                }`}
              >
                {workflow.status === "active" || workflow.isActive
                  ? "active"
                  : workflow.status || "inactive"}
              </span>
            </div>
            <p className="text-sm text-gray-600 mt-1">
              {workflow.description || "No description"}
            </p>
            <div className="flex items-center mt-2 space-x-4">
              <span className="text-xs text-gray-500">
                {workflow.nodes?.length || 0} nodes
              </span>
              <span className="text-xs text-gray-500">
                Updated{" "}
                {workflow.updatedAt
                  ? new Date(workflow.updatedAt).toLocaleDateString()
                  : "N/A"}
              </span>
              {workflow.lastRun && (
                <span className="text-xs text-gray-500">
                  Last run {new Date(workflow.lastRun).toLocaleDateString()}
                </span>
              )}
              {!workflow.lastRun && (
                <span className="text-xs text-gray-500">Never executed</span>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Link
              to={`/workflow/${workflow.id}`}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              Edit
            </Link>
            <button
              onClick={() => handleDeleteWorkflow(workflow.id, workflow.name)}
              className="text-gray-400 hover:text-red-600 px-2 py-2 rounded hover:bg-red-50 transition-colors text-sm"
            >
              🗑️
            </button>
          </div>
        </div>
      </div>
    ),
    [],
  );

  const handleDeleteWorkflow = async (
    workflowId: string,
    workflowName: string,
  ) => {
    if (
      window.confirm(
        `Are you sure you want to delete "${workflowName}"? This action cannot be undone.`,
      )
    ) {
      try {
        await deleteWorkflow(workflowId);
        // Refresh the dashboard workflows list
        await loadWorkflows();
        toast.success("Workflow deleted successfully!");
      } catch (error) {
        toast.error("Failed to delete workflow. Please try again.");
      }
    }
  };

  const dashboardStats = [
    { name: "Total Workflows", value: workflows.length, icon: "🔄" },
    {
      name: "Active Workflows",
      value: workflows.filter((w) => w.isActive || w.status === "active")
        .length,
      icon: "✅",
    },
    {
      name: "Total Executions",
      value: statsLoading ? "..." : (stats?.totalExecutions ?? 0),
      icon: "▶️",
    },
    {
      name: "Success Rate",
      value: statsLoading
        ? "..."
        : stats?.successRate !== undefined
          ? `${Math.round(stats.successRate)}%`
          : stats?.totalExecutions && stats.totalExecutions > 0
            ? `${Math.round(((stats.successfulExecutions || 0) / stats.totalExecutions) * 100)}%`
            : "N/A",
      icon: "📈",
    },
  ];

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Workflows</h1>
        <p className="text-gray-600">
          Create and manage your automation workflows
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {dashboardStats.map((stat) => (
          <div key={stat.name} className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="text-2xl mr-4">{stat.icon}</div>
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stat.value}
                </p>
                {statsLoading && (
                  <p className="text-xs text-gray-400 mt-1">Loading...</p>
                )}
                {!statsLoading &&
                  stats &&
                  stat.name === "Total Executions" &&
                  stats.totalExecutions === 0 && (
                    <p className="text-xs text-gray-400 mt-1">
                      No executions yet
                    </p>
                  )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Workflows */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-900">
              Your Workflows
            </h2>
            <button
              onClick={handleCreateWorkflow}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create New
            </button>
          </div>
        </div>

        <div className="p-6">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading workflows...</p>
            </div>
          ) : workflows.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600 mb-4">No workflows yet</p>
              <button
                onClick={handleCreateWorkflow}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create Your First Workflow
              </button>
            </div>
          ) : (
            <VirtualizedList
              items={workflows}
              renderItem={renderWorkflowItem}
              height={600} // Fixed height for virtualization
              estimateSize={120} // Estimated height per workflow item
              getItemKey={(workflow) => workflow.id}
              gap={0}
              className="workflow-list"
              emptyState={
                <div className="text-center py-8">
                  <p className="text-gray-600 mb-4">No workflows found</p>
                  <button
                    onClick={handleCreateWorkflow}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Create Your First Workflow
                  </button>
                </div>
              }
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
