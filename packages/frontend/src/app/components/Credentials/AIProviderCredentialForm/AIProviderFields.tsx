import { Input } from 'antd';
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
        <div key={field.name} className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            {field.name}
            {field.required && !isEditing && <span className="text-red-500">*</span>}
          </label>
          <Input
            type={field.type === 'password' ? 'password' : 'text'}
            value={values[field.name] || ''}
            onChange={(e) => onChange(field.name, e.target.value)}
            placeholder={
              field.type === 'password' && isEditing && !values[field.name]
                ? '••••••••••• (hidden - enter new value to update)'
                : field.placeholder
            }
            className="w-full"
          />
          {field.description && (
            <p className="text-sm text-gray-500">{field.description}</p>
          )}
        </div>
      ))}
    </div>
  );
};
