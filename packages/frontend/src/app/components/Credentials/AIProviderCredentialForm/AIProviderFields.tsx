import { FormField } from '@reporunner/ui/components/form';
import type { CredentialTypeField } from '../shared/types';

interface AIProviderFieldsProps {
  /**
   * List of fields to render
   */
  fields: CredentialTypeField[];

  /**
   * Current values for the fields
   */
  values: Record<string, any>;

  /**
   * Called when a field value changes
   */
  onChange: (field: string, value: any) => void;

  /**
   * Whether we're editing an existing credential
   */
  isEditing?: boolean;
}

export const AIProviderFields = ({
  fields,
  values,
  onChange,
  isEditing,
}: AIProviderFieldsProps) => {
  return (
    <div className="space-y-4">
      {fields.map((field) => (
        <FormField
          key={field.name}
          label={field.name}
          type={field.type === 'password' ? 'password' : 'text'}
          value={values[field.name] || ''}
          onChange={(e) => onChange(field.name, e.target.value)}
          required={field.required && !isEditing}
          placeholder={
            field.type === 'password' && isEditing && !values[field.name]
              ? '••••••••••• (hidden - enter new value to update)'
              : field.placeholder
          }
          helperText={field.description}
        />
      ))}
    </div>
  );
};
