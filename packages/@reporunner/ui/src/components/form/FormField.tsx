import React from 'react';
import { FormLabel } from './FormLabel';
import { FormInput } from './FormInput';
import { cn } from '../../utils/styles';

export interface FormFieldProps extends React.ComponentProps<typeof FormInput> {
  /**
   * Label text for the field
   */
  label?: React.ReactNode;
  
  /**
   * Whether the field is required
   */
  required?: boolean;
}

export const FormField = ({
  label,
  required,
  id,
  className,
  ...props
}: FormFieldProps) => {
  return (
    <div className={cn("space-y-1", className)}>
      {label && (
        <FormLabel
          htmlFor={id}
          required={required}
        >
          {label}
        </FormLabel>
      )}
      <FormInput
        id={id}
        required={required}
        {...props}
      />
    </div>
  );
};