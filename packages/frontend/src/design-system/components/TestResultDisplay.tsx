import type React from 'react';

export interface TestResultDisplayProps {
  testResult: any;
}

const TestResultDisplay: React.FC<TestResultDisplayProps> = ({ testResult }) => {
  if (!testResult) {
    return null;
  }

  const { success, message, data } = testResult;

  return (
    <div className="bg-gray-750 rounded p-3 border border-gray-600">
      <div className="text-sm font-medium text-gray-200 mb-2">Test Results:</div>
      <div className="space-y-2">
        <div className="flex items-center space-x-2 text-xs">
          <span
            className={`w-2 h-2 rounded-full ${success ? 'bg-green-400' : 'bg-red-400'}`}
          ></span>
          <span className="text-gray-300">{message}</span>
        </div>
        {data && (
          <pre className="bg-gray-900 p-2 rounded text-xs text-white">
            {JSON.stringify(data, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
};

export default TestResultDisplay;
