import React, { useState, useEffect } from "react";
import { WorkflowApiService } from "@/core";
import type { WorkflowExecution } from "@/core/types/execution";

const workflowApiService = new WorkflowApiService();

const Executions: React.FC = () => {
  const [executions, setExecutions] = useState<WorkflowExecution[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<
    "all" | "pending" | "running" | "success" | "error" | "cancelled"
  >("all");
  const [page, setPage] = useState(1);
  const [, setHasMore] = useState(true);

  useEffect(() => {
    loadExecutions();
  }, [filter, page]);

  const loadExecutions = async () => {
    setIsLoading(true);
    try {
      const result = await workflowApiService.getExecutions({
        status: filter === "all" ? undefined : filter,
        page,
        limit: 20,
      });

      if (page === 1) {
        setExecutions(result.items);
      } else {
        setExecutions((prev) => [...prev, ...result.items]);
      }
      setHasMore(result.hasMore);
    } catch (error) {
      console.error("Failed to load executions:", error);
      setExecutions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStopExecution = async (executionId: string) => {
    try {
      await workflowApiService.stopExecution(executionId);
      // Refresh executions
      setPage(1);
      loadExecutions();
    } catch (error) {
      console.error("Failed to stop execution:", error);
      alert("Failed to stop execution");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "success":
        return "bg-green-100 text-green-800";
      case "running":
        return "bg-blue-100 text-blue-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "error":
        return "bg-red-100 text-red-800";
      case "cancelled":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDuration = (execution: WorkflowExecution) => {
    if (!execution.endTime || !execution.startTime) return "N/A";
    const start = new Date(execution.startTime).getTime();
    const end = new Date(execution.endTime).getTime();
    const seconds = Math.floor((end - start) / 1000);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Workflow Executions
        </h1>
        <p className="text-gray-600">Monitor and track your workflow runs</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {[
          { name: "Total Executions", value: executions.length, color: "blue" },
          {
            name: "Running",
            value: executions.filter((e) => e.status === "running").length,
            color: "blue",
          },
          {
            name: "Success",
            value: executions.filter((e) => e.status === "success").length,
            color: "green",
          },
          {
            name: "Failed",
            value: executions.filter((e) => e.status === "error").length,
            color: "red",
          },
        ].map((stat) => (
          <div key={stat.name} className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div
                className={`w-4 h-4 rounded-full mr-3 bg-${stat.color}-500`}
              ></div>
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stat.value}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-4 border-b border-gray-200">
          <div className="flex space-x-4">
            {[
              { key: "all", label: "All" },
              { key: "pending", label: "Pending" },
              { key: "running", label: "Running" },
              { key: "success", label: "Success" },
              { key: "error", label: "Failed" },
              { key: "cancelled", label: "Cancelled" },
            ].map((filterOption) => (
              <button
                key={filterOption.key}
                onClick={() => setFilter(filterOption.key as any)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === filterOption.key
                    ? "bg-blue-100 text-blue-700"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                {filterOption.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Executions List */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading executions...</p>
            </div>
          ) : executions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600">No executions found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {executions.map((execution) => (
                <div
                  key={execution.id}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h3 className="font-medium text-gray-900">
                          Workflow ID: {execution.workflowId}
                        </h3>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(execution.status)}`}
                        >
                          {execution.status}
                        </span>
                      </div>
                      <div className="mt-2 flex items-center space-x-6 text-sm text-gray-600">
                        <span>
                          Started:{" "}
                          {execution.startTime
                            ? new Date(execution.startTime).toLocaleString()
                            : "N/A"}
                        </span>
                        <span>Duration: {formatDuration(execution)}</span>
                        <span>Triggered by: {execution.triggerType}</span>
                      </div>
                      {execution.nodeExecutions &&
                        execution.nodeExecutions.length > 0 && (
                          <div className="mt-3">
                            <details className="group">
                              <summary className="cursor-pointer text-sm text-blue-600 hover:text-blue-800">
                                View Node Results (
                                {execution.nodeExecutions.length} nodes)
                              </summary>
                              <div className="mt-2 bg-gray-50 rounded p-3 text-sm">
                                {execution.nodeExecutions.map(
                                  (nodeExec, index) => (
                                    <div
                                      key={index}
                                      className="text-gray-700 mb-1"
                                    >
                                      <span className="font-medium">
                                        {nodeExec.nodeName || nodeExec.nodeId}:
                                      </span>
                                      <span
                                        className={`ml-2 ${nodeExec.status === "success" ? "text-green-600" : nodeExec.status === "error" ? "text-red-600" : "text-blue-600"}`}
                                      >
                                        {nodeExec.status}
                                      </span>
                                      {nodeExec.duration && (
                                        <span className="ml-2 text-gray-500">
                                          ({nodeExec.duration}ms)
                                        </span>
                                      )}
                                    </div>
                                  ),
                                )}
                              </div>
                            </details>
                          </div>
                        )}
                    </div>
                    <div className="flex items-center space-x-2">
                      {(execution.status === "running" ||
                        execution.status === "pending") && (
                        <button
                          onClick={() => handleStopExecution(execution.id)}
                          className="text-red-600 hover:text-red-800 px-3 py-1 text-sm border border-red-200 rounded"
                        >
                          Cancel
                        </button>
                      )}
                      <button className="text-gray-400 hover:text-gray-600">
                        ⋮
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Executions;
