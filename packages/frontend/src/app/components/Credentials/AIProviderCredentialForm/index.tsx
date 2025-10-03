import { Alert } from 'antd';
import { CredentialNameField } from '../shared/CredentialNameField';
import { TestCredentialButton } from '../shared/TestCredentialButton';
import type { CredentialTypeDef, TestResult } from '../shared/types';
import { AIProviderFields } from './AIProviderFields';

interface AIProviderCredentialFormProps {
  /**
   * The credential type definition
   */
  credentialType: CredentialTypeDef;

  /**
   * Current credential name
   */
  credentialName: string;

  /**
   * Called when credential name changes
   */
  onNameChange: (name: string) => void;

  /**
   * Current values for credential fields
   */
  values: Record<string, any>;

  /**
   * Called when a field value changes
   */
  onFieldChange: (field: string, value: any) => void;

  /**
   * Whether currently testing the credential
   */
  isTesting: boolean;

  /**
   * Called when test button is clicked
   */
  onTest: () => void;

  /**
   * Current test result, if any
   */
  testResult?: TestResult | null;

  /**
   * Whether we're editing an existing credential
   */
  isEditing?: boolean;
}

export const AIProviderCredentialForm = ({
  credentialType,
  credentialName,
  onNameChange,
  values,
  onFieldChange,
  isTesting,
  onTest,
  testResult,
  isEditing,
}: AIProviderCredentialFormProps) => {
  return (
    <div className="space-y-6">
      <Alert type="info" message={credentialType.name} description={credentialType.description} showIcon />

      <CredentialNameField
        value={credentialName}
        onChange={onNameChange}
        placeholder={`e.g., ${credentialType.name} Account`}
        helperText={`Choose a name to identify this ${credentialType.name} connection`}
      />

      <AIProviderFields
        fields={credentialType.fields}
        values={values}
        onChange={onFieldChange}
        isEditing={isEditing}
      />

      <TestCredentialButton
        isTesting={isTesting}
        onTest={onTest}
        testResult={testResult}
        disabled={!credentialName.trim()}
      />
    </div>
  );
};
