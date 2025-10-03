import { Alert } from 'antd';
import { cn } from '@/design-system';
import type { TestResult } from './types';

interface TestCredentialButtonProps {
  /**
   * Whether the test is in progress
   */
  isTesting: boolean;

  /**
   * Called when the test button is clicked
   */
  onTest: () => void;

  /**
   * Whether the button should be disabled
   */
  disabled?: boolean;

  /**
   * Optional test result to display
   */
  testResult?: TestResult | null;
}

export const TestCredentialButton = ({
  isTesting,
  onTest,
  disabled,
  testResult,
}: TestCredentialButtonProps) => {
  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={onTest}
        disabled={isTesting || disabled}
        className={cn(
          'w-full py-2 px-4 rounded-lg',
          'flex items-center justify-center space-x-2 text-sm font-medium',
          'bg-yellow-600 text-white hover:bg-yellow-700',
          'disabled:opacity-50 disabled:cursor-not-allowed'
        )}
      >
        <span>{isTesting ? '⏳' : '🧪'}</span>
        <span>{isTesting ? 'Testing Connection...' : 'Test Connection'}</span>
      </button>

      {testResult && (
        <div className="space-y-2">
          <Alert
            type={testResult.success ? 'success' : 'error'}
            message={testResult.success ? 'Connection Successful!' : 'Connection Failed'}
            description={testResult.message}
            showIcon
          />
          {testResult.details && (
            <pre className="text-xs bg-gray-800 text-gray-100 p-2 rounded overflow-auto">
              {JSON.stringify(testResult.details, null, 2)}
            </pre>
          )}
        </div>
      )}
    </div>
  );
};
