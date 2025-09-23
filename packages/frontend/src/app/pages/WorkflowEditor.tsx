import type React from 'react';
import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useLeanWorkflowStore } from '@/core';
import WorkflowEditorComponent from '../components/WorkflowEditor';

const WorkflowEditor: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { currentWorkflow, saveWorkflow, loadWorkflow, isLoading } = useLeanWorkflowStore();
  // Integration loading removed - Pure Registry System handles this automatically

  useEffect(() => {
    if (id) {
      // Load specific workflow from API
      loadWorkflow(id).catch((_error) => {
        // If workflow not found, redirect to dashboard or show error
      });
    } else {
    }
  }, [id, loadWorkflow]);

  const handleSave = async () => {
    await saveWorkflow();
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">
              {currentWorkflow?.name || 'New Workflow'}
            </h1>
            <p className="text-sm text-gray-600">
              {(currentWorkflow as any)?.description || 'Design your automation workflow'}
            </p>
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={handleSave}
              disabled={isLoading}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {isLoading ? 'Saving...' : 'Save'}
            </button>
            <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">
              Test Run
            </button>
            <button className="text-gray-600 hover:text-gray-900">⚙️</button>
          </div>
        </div>
      </div>

      {/* Workflow Editor */}
      <div className="flex-1">
        <WorkflowEditorComponent />
      </div>
    </div>
  );
};

export default WorkflowEditor;
