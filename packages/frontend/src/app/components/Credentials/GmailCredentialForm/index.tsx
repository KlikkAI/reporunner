import { Alert } from 'antd';
import { cn } from '@/design-system';
import { CredentialNameField } from '../shared/CredentialNameField';
import { GmailSetupSteps } from './GmailSetupSteps';

interface GmailCredentialFormProps {
  /**
   * Current value of the credential name
   */
  credentialName: string;

  /**
   * Called when credential name changes
   */
  onNameChange: (name: string) => void;

  /**
   * Whether the connection is in progress
   */
  isConnecting: boolean;

  /**
   * Called when the connect button is clicked
   */
  onConnect: () => void;
}

export const GmailCredentialForm = ({
  credentialName,
  onNameChange,
  isConnecting,
  onConnect,
}: GmailCredentialFormProps) => {
  return (
    <div className="space-y-6">
      <Alert
        type="info"
        message="Easy Setup!"
        description="No technical configuration required. We'll connect to Gmail using secure OAuth2 authentication."
        showIcon
      />

      <GmailSetupSteps />

      <CredentialNameField
        value={credentialName}
        onChange={onNameChange}
        placeholder="e.g., Personal Gmail, Work Gmail"
        helperText="Choose a name to identify this Gmail connection"
      />

      <div className="pt-4">
        <button
          onClick={onConnect}
          disabled={isConnecting || !credentialName.trim()}
          className={cn(
            'w-full py-3 px-4 rounded-lg',
            'bg-blue-600 text-white hover:bg-blue-700',
            'flex items-center justify-center space-x-2 text-sm font-medium',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
        >
          <span>🔗</span>
          <span>{isConnecting ? 'Connecting...' : 'Connect with Google'}</span>
        </button>
      </div>
    </div>
  );
};
