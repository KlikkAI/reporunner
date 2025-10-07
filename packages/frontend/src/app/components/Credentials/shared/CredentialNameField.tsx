import { Input } from 'antd';

interface CredentialNameFieldProps {
  /**
   * Current value of the credential name
   */
  value: string;

  /**
   * Called when credential name changes
   */
  onChange: (value: string) => void;

  /**
   * Optional placeholder text
   */
  placeholder?: string;

  /**
   * Optional helper text
   */
  helperText?: string;
}

export const CredentialNameField = ({
  value,
  onChange,
  placeholder = 'e.g., Personal Account',
  helperText = 'Choose a name to identify this credential',
}: CredentialNameFieldProps) => {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        Credential Name <span className="text-red-500">*</span>
      </label>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full"
      />
      {helperText && <p className="text-sm text-gray-500">{helperText}</p>}
    </div>
  );
};
