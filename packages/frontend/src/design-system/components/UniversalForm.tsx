/**
 * Universal Form Component
 *
 * Implements the PropertyRendererFactory pattern to create forms
 * from configuration objects, eliminating form duplication across
 * the codebase.
 *
 * Targets: 20+ page components with duplicate form patterns
 */

import { Logger } from '@reporunner/core';
import { Alert, Button, Spin } from 'antd';
import type React from 'react';
import { useCallback, useMemo, useState } from 'react';
import type { PropertyContext, PropertyRendererConfig } from '../factories/PropertyRendererFactory';
import { PropertyRendererFactory } from '../factories/PropertyRendererFactory';
import { cn } from '../utils';

const logger = new Logger('UniversalForm');

export interface UniversalFormProps {
  properties: PropertyRendererConfig[];
  initialValues?: Record<string, any>;
  onSubmit?: (values: Record<string, any>) => void | Promise<void>;
  onCancel?: () => void;
  layout?: 'vertical' | 'horizontal' | 'grid';
  submitText?: string;
  cancelText?: string;
  showCancel?: boolean;
  className?: string;
  loading?: boolean;
  disabled?: boolean;
  validateOnChange?: boolean;
  showErrors?: 'inline' | 'summary' | 'both';
}

/**
 * Universal Form Component
 */
export const UniversalForm: React.FC<UniversalFormProps> = ({
  properties,
  initialValues = {},
  onSubmit,
  onCancel,
  layout = 'vertical',
  submitText = 'Submit',
  cancelText = 'Cancel',
  showCancel = false,
  className,
  loading = false,
  disabled = false,
  validateOnChange: _validateOnChange = true,
  showErrors = 'inline',
}) => {
  const [formData, setFormData] = useState(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const setFieldValue = useCallback(
    (name: string, value: any) => {
      setFormData((prev) => ({ ...prev, [name]: value }));

      // Clear error when field is updated
      if (errors[name]) {
        setErrors((prev) => ({ ...prev, [name]: '' }));
      }
    },
    [errors]
  );

  const setFieldError = useCallback((name: string, error: string) => {
    setErrors((prev) => ({ ...prev, [name]: error }));
  }, []);

  const validateField = useCallback(
    async (name: string) => {
      const property = properties.find((p) => p.id === name);
      if (!property?.validation) {
        return;
      }

      const value = formData[name];
      let error = '';

      // Run validation rules
      if (property.validation.rules) {
        for (const rule of property.validation.rules) {
          switch (rule.type) {
            case 'required':
              if (property.required && (!value || (typeof value === 'string' && !value.trim()))) {
                error = rule.message || 'This field is required';
              }
              break;
            case 'min':
              if (value && value.length < rule.value) {
                error = rule.message || `Must be at least ${rule.value} characters`;
              }
              break;
            case 'max':
              if (value && value.length > rule.value) {
                error = rule.message || `Must be at most ${rule.value} characters`;
              }
              break;
            case 'pattern':
              if (value && !new RegExp(rule.value).test(value)) {
                error = rule.message || 'Invalid format';
              }
              break;
            case 'custom':
              if (property.validation.customValidator) {
                error = (await property.validation.customValidator(value)) || '';
              }
              break;
          }
          if (error) {
            break;
          }
        }
      }

      setFieldError(name, error);
      setTouched((prev) => ({ ...prev, [name]: true }));
      return error;
    },
    [formData, properties, setFieldError]
  );

  const context: PropertyContext = useMemo(
    () => ({
      formData,
      errors,
      touched,
      isSubmitting: isSubmitting || loading,
      setFieldValue,
      setFieldError,
      validateField: async (name: string) => {
        await validateField(name);
      },
    }),
    [formData, errors, touched, isSubmitting, loading, setFieldValue, setFieldError, validateField]
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (disabled || isSubmitting || loading) {
        return;
      }

      setIsSubmitting(true);

      try {
        // Validate all fields
        const validationPromises = properties.map((p) => validateField(p.id));
        const validationErrors = await Promise.all(validationPromises);

        // Check if there are any errors
        const hasErrors =
          validationErrors.some((error) => error) || Object.values(errors).some((error) => error);

        if (!hasErrors && onSubmit) {
          await onSubmit(formData);
        }
      } catch (error) {
        logger.error('Form submission error', { error, formData });
      } finally {
        setIsSubmitting(false);
      }
    },
    [disabled, isSubmitting, loading, properties, validateField, errors, formData, onSubmit]
  );

  const renderedProperties = useMemo(() => {
    return properties
      .map((property) => PropertyRendererFactory.createRenderer(property, context))
      .filter(Boolean);
  }, [properties, context]);

  const errorSummary = useMemo(() => {
    const errorEntries = Object.entries(errors).filter(([_, error]) => error);
    if (errorEntries.length === 0) {
      return null;
    }

    return (
      <Alert
        type="error"
        message="Please fix the following errors:"
        description={
          <ul className="list-disc list-inside space-y-1">
            {errorEntries.map(([field, error]) => (
              <li key={field}>{error}</li>
            ))}
          </ul>
        }
        className="mb-6"
      />
    );
  }, [errors]);

  const layoutClasses = useMemo(() => {
    switch (layout) {
      case 'horizontal':
        return 'space-y-4';
      case 'grid':
        return 'grid grid-cols-1 md:grid-cols-2 gap-4';
      default:
        return 'space-y-6';
    }
  }, [layout]);

  return (
    <Spin spinning={loading}>
      <form onSubmit={handleSubmit} className={cn('universal-form', `layout-${layout}`, className)}>
        {/* Error Summary */}
        {(showErrors === 'summary' || showErrors === 'both') && errorSummary}

        {/* Form Fields */}
        <div className={layoutClasses}>{renderedProperties}</div>

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
          {showCancel && (
            <Button type="default" onClick={onCancel} disabled={isSubmitting || loading}>
              {cancelText}
            </Button>
          )}
          <Button
            type="primary"
            htmlType="submit"
            loading={isSubmitting}
            disabled={disabled || loading}
          >
            {submitText}
          </Button>
        </div>
      </form>
    </Spin>
  );
};

/**
 * Form Builder Hook for easier usage
 */
export const useFormBuilder = (
  properties: PropertyRendererConfig[],
  options?: Partial<UniversalFormProps>
) => {
  const [formData, setFormData] = useState(options?.initialValues || {});
  const [isValid, setIsValid] = useState(true);

  const buildForm = useCallback(
    (overrideProps?: Partial<UniversalFormProps>) => {
      return (
        <UniversalForm
          properties={properties}
          initialValues={formData}
          {...options}
          {...overrideProps}
          onSubmit={(values) => {
            setFormData(values);
            options?.onSubmit?.(values);
            overrideProps?.onSubmit?.(values);
          }}
        />
      );
    },
    [properties, formData, options]
  );

  const updateField = useCallback((name: string, value: any) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  }, []);

  const resetForm = useCallback(() => {
    setFormData(options?.initialValues || {});
  }, [options?.initialValues]);

  const validateForm = useCallback(() => {
    // Basic validation logic
    const requiredFields = properties.filter((p) => p.required);
    const hasAllRequired = requiredFields.every(
      (field) => formData[field.id] && formData[field.id] !== ''
    );
    setIsValid(hasAllRequired);
    return hasAllRequired;
  }, [properties, formData]);

  return {
    formData,
    isValid,
    buildForm,
    updateField,
    resetForm,
    validateForm,
  };
};

/**
 * Quick Form Generators for Common Patterns
 */
export const FormGenerators = {
  /**
   * Generate a simple contact form
   */
  contactForm: (onSubmit?: (values: any) => void): React.ReactElement => {
    const properties: PropertyRendererConfig[] = [
      {
        id: 'name',
        type: 'text',
        label: 'Full Name',
        required: true,
        placeholder: 'Enter your full name',
      },
      {
        id: 'email',
        type: 'email',
        label: 'Email Address',
        required: true,
        placeholder: 'Enter your email',
      },
      {
        id: 'message',
        type: 'textarea',
        label: 'Message',
        required: true,
        placeholder: 'Enter your message',
      },
    ];

    return (
      <UniversalForm
        properties={properties}
        onSubmit={onSubmit}
        submitText="Send Message"
        layout="vertical"
      />
    );
  },

  /**
   * Generate a settings form
   */
  settingsForm: (
    settings: Array<{ key: string; label: string; type: any; value?: any }>,
    onSubmit?: (values: any) => void
  ): React.ReactElement => {
    const properties: PropertyRendererConfig[] = settings.map((setting) => ({
      id: setting.key,
      type: setting.type,
      label: setting.label,
      defaultValue: setting.value,
    }));

    return (
      <UniversalForm
        properties={properties}
        onSubmit={onSubmit}
        submitText="Save Settings"
        showCancel={true}
        layout="vertical"
      />
    );
  },

  /**
   * Generate a credential form
   */
  credentialForm: (
    credentialType: string,
    fields: Array<{ name: string; label: string; type: any; required?: boolean }>,
    onSubmit?: (values: any) => void
  ): React.ReactElement => {
    const properties: PropertyRendererConfig[] = fields.map((field) => ({
      id: field.name,
      type: field.type,
      label: field.label,
      required: field.required,
      placeholder: `Enter ${field.label.toLowerCase()}`,
    }));

    return (
      <UniversalForm
        properties={properties}
        onSubmit={onSubmit}
        submitText={`Save ${credentialType} Credentials`}
        showCancel={true}
        layout="vertical"
      />
    );
  },
};

export default UniversalForm;
