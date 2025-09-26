import { forwardRef } from 'react';
import { BaseFieldProps, PolymorphicComponentProps } from '../../types/component';
import { getBaseClasses, getFieldWrapperClasses, getFieldLabelClasses, getFieldHelperTextClasses } from '../../utils/styles';

/**
 * Form field component props
 */
export interface FormFieldProps extends BaseFieldProps {
  /**
   * Field type
   */
  type?: 'text' | 'password' | 'email' | 'number' | 'tel' | 'url' | 'search';

  /**
   * Render the field as a textarea
   */
  multiline?: boolean;

  /**
   * Number of textarea rows
   */
  rows?: number;

  /**
   * Start adornment (icon/text before input)
   */
  startAdornment?: React.ReactNode;

  /**
   * End adornment (icon/text after input)
   */
  endAdornment?: React.ReactNode;
}

/**
 * Form field component that handles different types of inputs
 */
export const FormField = forwardRef<
  HTMLInputElement | HTMLTextAreaElement,
  PolymorphicComponentProps<'input', FormFieldProps>
>(({
  as: Component = 'input',
  className,
  type = 'text',
  name,
  label,
  helperText,
  errorMessage,
  required,
  disabled,
  readOnly,
  placeholder,
  multiline,
  rows = 3,
  startAdornment,
  endAdornment,
  error,
  size,
  color,
  variant = 'outlined',
  ...props
}, ref) => {
  const wrapperClasses = getFieldWrapperClasses({
    error: !!error || !!errorMessage,
    disabled
  });
  
  const labelClasses = getFieldLabelClasses({
    required,
    error: !!error || !!errorMessage
  });
  
  const helperClasses = getFieldHelperTextClasses({
    error: !!error || !!errorMessage
  });
  
  const inputClasses = getBaseClasses({
    size,
    color,
    variant,
    disabled,
    error: !!error || !!errorMessage
  });
  
  const InputComponent = multiline ? 'textarea' : Component;
  
  return (
    <div className={wrapperClasses}>
      {label && (
        <label htmlFor={name} className={labelClasses}>
          {label}
        </label>
      )}
      
      <div className="relative">
        {startAdornment && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2">
            {startAdornment}
          </div>
        )}
        
        <InputComponent
          ref={ref as any}
          id={name}
          name={name}
          type={type}
          disabled={disabled}
          readOnly={readOnly}
          required={required}
          placeholder={placeholder}
          rows={multiline ? rows : undefined}
          className={cn(
            inputClasses,
            'w-full bg-white',
            startAdornment && 'pl-10',
            endAdornment && 'pr-10',
            className
          )}
          {...props}
        />
        
        {endAdornment && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {endAdornment}
          </div>
        )}
      </div>
      
      {(helperText || errorMessage) && (
        <p className={helperClasses}>
          {errorMessage || helperText}
        </p>
      )}
    </div>
  );
});