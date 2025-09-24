import type React from 'react';
import { useCallback, useEffect, useState } from 'react';
import { WorkflowApiService } from '@/core';
import type { WorkflowExecution } from '@/core/types/execution';

const workflowApiService = new WorkflowApiService();

const Executions: React.FC = () => {
  const [executions, setExecutions] = useState<WorkflowExecution[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<
    'all' | 'pending' | 'running' | 'success' | 'error' | 'cancelled'
  >('all');
  const [page, setPage] = useState(1);
  const [, setHasMore] = useState(true);

  const loadExecutions = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await workflowApiService.getExecutions({
        status: filter === 'all' ? undefined : filter,
        limit: 20,
        offset: (page - 1) * 20,
        sortOrder: 'desc',
      });

      // Transform results to match WorkflowExecution interface
      const transformedExecutions = result.items.map((execution) => ({
        ...execution,
        error: execution.error
          ? typeof execution.error === 'string'
            ? {
                message: execution.error,
                nodeId: undefined,
                code: undefined,
                stack: undefined,
              }
            : execution.error
          : undefined,
        logs: Array.isArray(execution.logs)
          ? execution.logs.map((log: any) =>
              typeof log === 'string' ? log : log.message || String(log)
            )
          : [],
        results: Array.isArray(execution.results)
          ? execution.results.map((nodeResult) => ({
              ...nodeResult,
              status:
                nodeResult.status === 'completed'
                  ? ('success' as const)
                  : nodeResult.status === 'failed'
                    ? ('error' as const)
                    : (nodeResult.status as 'success' | 'error' | 'skipped'),
            }))
          : undefined,
      }));

      if (page === 1) {
        setExecutions(transformedExecutions);
      } else {
        setExecutions((prev) => [...prev, ...transformedExecutions]);
      }
      setHasMore(result.hasMore);
    } catch (_error) {
      setExecutions([]);
    } finally {
      setIsLoading(false);
    }
  }, [filter, page]);

  useEffect(() => {
    loadExecutions();
  }, [loadExecutions]);

  const handleStopExecution = async (executionId: string) => {
    try {
      await workflowApiService.stopExecution(executionId);
      // Refresh executions
      setPage(1);
      loadExecutions();
    } catch (_error) {
      alert('Failed to stop execution');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-500/20 text-green-300 border border-green-500/30';
      case 'running':
        return 'bg-blue-500/20 text-blue-300 border border-blue-500/30';
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30';
      case 'error':
        return 'bg-red-500/20 text-red-300 border border-red-500/30';
      case 'cancelled':
        return 'bg-slate-500/20 text-slate-300 border border-slate-500/30';
      default:
        return 'bg-slate-500/20 text-slate-300 border border-slate-500/30';
    }
  };

  const formatDuration = (execution: WorkflowExecution) => {
    if (!execution.endTime || !execution.startTime) return 'N/A';
    const start = new Date(execution.startTime).getTime();
    const end = new Date(execution.endTime).getTime();
    const seconds = Math.floor((end - start) / 1000);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Workflow Executions</h1>
        <p className="text-slate-300">Monitor and track your workflow runs</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {[
          { name: 'Total Executions', value: executions.length, icon: '▶️' },
          {
            name: 'Running',
            value: executions.filter((e) => e.status === 'running').length,
            icon: '🔄',
          },
          {
            name: 'Success',
            value: executions.filter((e) => e.status === 'success').length,
            icon: '✅',
          },
          {
            name: 'Failed',
            value: executions.filter((e) => e.status === 'error').length,
            icon: '❌',
          },
        ].map((stat) => (
          <div
            key={stat.name}
            className="bg-white/10 backdrop-blur-md p-6 rounded-lg border border-white/20 shadow-lg hover:bg-white/15 transition-all duration-300"
          >
            <div className="flex items-center">
              <div className="text-2xl mr-4">{stat.icon}</div>
              <div>
                <p className="text-sm font-medium text-slate-300">{stat.name}</p>
                <p className="text-2xl font-semibold text-white">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white/10 backdrop-blur-md rounded-lg border border-white/20 shadow-lg mb-6">
        <div className="p-4">
          <div className="flex space-x-4">
            {[
              { key: 'all', label: 'All' },
              { key: 'pending', label: 'Pending' },
              { key: 'running', label: 'Running' },
              { key: 'success', label: 'Success' },
              { key: 'error', label: 'Failed' },
              { key: 'cancelled', label: 'Cancelled' },
            ].map((filterOption) => (
              <button
                key={filterOption.key}
                onClick={() => setFilter(filterOption.key as any)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                  filter === filterOption.key
                    ? 'bg-white/20 text-blue-300 backdrop-blur-sm border border-white/30'
                    : 'text-slate-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                {filterOption.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Executions List */}
      <div className="bg-white/10 backdrop-blur-md rounded-lg border border-white/20 shadow-lg">
        <div className="p-6">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto"></div>
              <p className="mt-2 text-slate-300">Loading executions...</p>
            </div>
          ) : executions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-slate-300">No executions found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {executions.map((execution) => (
                <div
                  key={execution.id}
                  className="bg-white/5 backdrop-blur-sm border border-white/20 rounded-lg p-4 hover:bg-white/10 transition-all duration-300"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h3 className="font-medium text-white">
                          Workflow ID: {execution.workflowId}
                        </h3>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(execution.status)}`}
                        >
                          {execution.status}
                        </span>
                      </div>
                      <div className="mt-2 flex items-center space-x-6 text-sm text-slate-300">
                        <span>
                          Started:{' '}
                          {execution.startTime
                            ? new Date(execution.startTime).toLocaleString()
                            : 'N/A'}
                        </span>
                        <span>Duration: {formatDuration(execution)}</span>
                        <span>Triggered by: {execution.triggerType}</span>
                      </div>
                      {execution.nodeExecutions && execution.nodeExecutions.length > 0 && (
                        <div className="mt-3">
                          <details className="group">
                            <summary className="cursor-pointer text-sm text-blue-300 hover:text-blue-200 transition-colors">
                              View Node Results ({execution.nodeExecutions.length} nodes)
                            </summary>
                            <div className="mt-2 bg-white/10 backdrop-blur-sm rounded p-3 text-sm border border-white/20">
                              {execution.nodeExecutions.map((nodeExec, index) => (
                                <div key={index} className="text-slate-300 mb-1">
                                  <span className="font-medium text-white">
                                    {nodeExec.nodeName || nodeExec.nodeId}:
                                  </span>
                                  <span
                                    className={`ml-2 ${nodeExec.status === 'completed' ? 'text-green-300' : nodeExec.status === 'failed' ? 'text-red-300' : 'text-blue-300'}`}
                                  >
                                    {nodeExec.status}
                                  </span>
                                  {nodeExec.duration && (
                                    <span className="ml-2 text-slate-400">
                                      ({nodeExec.duration}ms)
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </details>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      {(execution.status === 'running' || execution.status === 'pending') && (
                        <button
                          onClick={() => handleStopExecution(execution.id)}
                          className="text-red-300 hover:text-red-200 px-3 py-1 text-sm border border-red-500/30 rounded bg-red-500/20 backdrop-blur-sm transition-colors"
                        >
                          Cancel
                        </button>
                      )}
                      <button className="text-slate-400 hover:text-white transition-colors">
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
