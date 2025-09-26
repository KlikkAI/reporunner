import React from 'react';
import { FormField } from '@reporunner/ui/components/form';

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
  placeholder = "e.g., Personal Account",
  helperText = "Choose a name to identify this credential"
}: CredentialNameFieldProps) => {
  return (
    <FormField
      label="Credential Name"
      required
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      helperText={helperText}
    />
  );
};