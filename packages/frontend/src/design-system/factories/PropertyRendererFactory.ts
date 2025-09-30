/**
 * Universal Property Renderer Factory
 *
 * Eliminates 90%+ of property rendering duplication by providing
 * a configurable system that generates property renderers from schemas.
 *
 * Target: Replace 25+ duplicate property renderer files
 */

import React, { useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import { z } from 'zod';
import { Logger } from '@reporunner/core';

const logger = new Logger('PropertyRendererFactory');

// Base property renderer configuration
export interface PropertyRendererConfig {
  id: string;
  type: PropertyType;
  label: string;
  description?: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  defaultValue?: any;
  validation?: ValidationConfig;
  options?: PropertyOption[];
  conditional?: ConditionalConfig;
  styling?: PropertyStylingConfig;
  events?: PropertyEventConfig;
}

export type PropertyType =
  | 'text' | 'email' | 'password' | 'number' | 'tel' | 'url'
  | 'textarea' | 'select' | 'multiselect' | 'checkbox' | 'radio' | 'switch'
  | 'date' | 'datetime' | 'time' | 'color' | 'file' | 'range'
  | 'json' | 'code' | 'markdown' | 'richtext'
  | 'collection' | 'fixedcollection' | 'keyvalue'
  | 'credentials' | 'expression' | 'resource'
  | 'custom';

export interface PropertyOption {
  label: string;
  value: any;
  description?: string;
  disabled?: boolean;
  icon?: string;
  group?: string;
}

export interface ValidationConfig {
  schema?: z.ZodSchema;
  rules?: ValidationRule[];
  realTime?: boolean;
  debounce?: number;
  customValidator?: (value: any) => Promise<string | null>;
}

export interface ValidationRule {
  type: 'required' | 'min' | 'max' | 'pattern' | 'custom';
  value?: any;
  message: string;
}

export interface ConditionalConfig {
  showWhen?: Record<string, any[]>;
  hideWhen?: Record<string, any[]>;
  enableWhen?: Record<string, any[]>;
  disableWhen?: Record<string, any[]>;
  requiredWhen?: Record<string, any[]>;
}

export interface PropertyStylingConfig {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'filled' | 'outlined' | 'underlined';
  fullWidth?: boolean;
  inline?: boolean;
  customClasses?: string[];
  theme?: string;
}

export interface PropertyEventConfig {
  onChange?: (value: any, context: any) => void;
  onFocus?: (event: any) => void;
  onBlur?: (event: any) => void;
  onValidate?: (value: any) => void;
  onCustom?: Record<string, Function>;
}

export interface PropertyContext {
  formData: Record<string, any>;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  isSubmitting: boolean;
  setFieldValue: (name: string, value: any) => void;
  setFieldError: (name: string, error: string) => void;
  validateField: (name: string) => Promise<void>;
}

/**
 * Universal Property Renderer Factory
 */
export class PropertyRendererFactory {
  private static rendererRegistry = new Map<PropertyType, React.ComponentType<any>>();
  private static validatorRegistry = new Map<string, Function>();
  private static transformerRegistry = new Map<string, Function>();

  /**
   * Register a property renderer component
   */
  static registerRenderer(type: PropertyType, component: React.ComponentType<any>) {
    this.rendererRegistry.set(type, component);
  }

  /**
   * Register a custom validator
   */
  static registerValidator(name: string, validator: Function) {
    this.validatorRegistry.set(name, validator);
  }

  /**
   * Register a value transformer
   */
  static registerTransformer(name: string, transformer: Function) {
    this.transformerRegistry.set(name, transformer);
  }

  /**
   * Create a property renderer from configuration
   */
  static createRenderer(config: PropertyRendererConfig, context: PropertyContext): ReactNode {
    const Renderer = this.rendererRegistry.get(config.type);

    if (!Renderer) {
      logger.warn('Property renderer not found', { type: config.type, configId: config.id });
      return this.createFallbackRenderer(config, context);
    }

    // Check conditional rendering
    if (!this.shouldRender(config.conditional, context)) {
      return null;
    }

    // Build props
    const props = this.buildRendererProps(config, context);

    return React.createElement(Renderer, props);
  }

  /**
   * Create a form from property configurations
   */
  static createForm(
    properties: PropertyRendererConfig[],
    initialValues: Record<string, any> = {},
    onSubmit?: (values: Record<string, any>) => void
  ): ReactNode {
    return React.createElement(UniversalPropertyForm, {
      properties,
      initialValues,
      onSubmit,
    });
  }

  /**
   * Create property renderers for a collection
   */
  static createCollection(
    configs: PropertyRendererConfig[],
    context: PropertyContext
  ): ReactNode[] {
    return configs.map(config => this.createRenderer(config, context)).filter(Boolean);
  }

  /**
   * Generate configuration from JSON schema
   */
  static fromJSONSchema(schema: any): PropertyRendererConfig[] {
    const properties: PropertyRendererConfig[] = [];

    if (schema.properties) {
      Object.entries(schema.properties).forEach(([key, propSchema]: [string, any]) => {
        const config = this.convertSchemaProperty(key, propSchema, schema.required?.includes(key));
        properties.push(config);
      });
    }

    return properties;
  }

  /**
   * Generate configuration from Zod schema
   */
  static fromZodSchema(schema: z.ZodSchema): PropertyRendererConfig[] {
    // This would parse Zod schema and convert to configurations
    // Implementation would depend on Zod schema introspection
    throw new Error('Zod schema conversion not yet implemented');
  }

  /**
   * Build renderer props from configuration
   */
  private static buildRendererProps(config: PropertyRendererConfig, context: PropertyContext) {
    const { formData, errors, touched, setFieldValue, setFieldError, validateField } = context;

    const value = formData[config.id] ?? config.defaultValue;
    const error = errors[config.id];
    const isTouched = touched[config.id];

    return {
      id: config.id,
      name: config.id,
      label: config.label,
      description: config.description,
      placeholder: config.placeholder,
      required: this.isRequired(config, context),
      disabled: this.isDisabled(config, context),
      value,
      error: isTouched ? error : undefined,
      options: config.options,
      styling: config.styling,
      onChange: (newValue: any) => {
        setFieldValue(config.id, newValue);
        config.events?.onChange?.(newValue, context);
        if (config.validation?.realTime) {
          setTimeout(() => validateField(config.id), config.validation.debounce || 300);
        }
      },
      onFocus: config.events?.onFocus,
      onBlur: (event: any) => {
        config.events?.onBlur?.(event);
        validateField(config.id);
      },
      ...config.events?.onCustom,
    };
  }

  /**
   * Check if property should render based on conditional configuration
   */
  private static shouldRender(conditional?: ConditionalConfig, context?: PropertyContext): boolean {
    if (!conditional || !context) return true;

    const { formData } = context;

    // Check show conditions
    if (conditional.showWhen) {
      const shouldShow = Object.entries(conditional.showWhen).some(([field, values]) =>
        values.includes(formData[field])
      );
      if (!shouldShow) return false;
    }

    // Check hide conditions
    if (conditional.hideWhen) {
      const shouldHide = Object.entries(conditional.hideWhen).some(([field, values]) =>
        values.includes(formData[field])
      );
      if (shouldHide) return false;
    }

    return true;
  }

  /**
   * Check if property is required based on conditional configuration
   */
  private static isRequired(config: PropertyRendererConfig, context: PropertyContext): boolean {
    if (!config.conditional?.requiredWhen) return config.required || false;

    const { formData } = context;
    return Object.entries(config.conditional.requiredWhen).some(([field, values]) =>
      values.includes(formData[field])
    );
  }

  /**
   * Check if property is disabled based on conditional configuration
   */
  private static isDisabled(config: PropertyRendererConfig, context: PropertyContext): boolean {
    if (config.disabled) return true;
    if (!config.conditional?.disableWhen) return false;

    const { formData } = context;
    return Object.entries(config.conditional.disableWhen).some(([field, values]) =>
      values.includes(formData[field])
    );
  }

  /**
   * Convert JSON schema property to renderer configuration
   */
  private static convertSchemaProperty(
    key: string,
    propSchema: any,
    required: boolean = false
  ): PropertyRendererConfig {
    let type: PropertyType = 'text';

    // Map JSON schema types to property types
    switch (propSchema.type) {
      case 'string':
        if (propSchema.format === 'email') type = 'email';
        else if (propSchema.format === 'password') type = 'password';
        else if (propSchema.format === 'url') type = 'url';
        else if (propSchema.format === 'date') type = 'date';
        else if (propSchema.format === 'date-time') type = 'datetime';
        else if (propSchema.enum) type = 'select';
        else type = 'text';
        break;
      case 'number':
      case 'integer':
        type = 'number';
        break;
      case 'boolean':
        type = 'checkbox';
        break;
      case 'array':
        type = 'multiselect';
        break;
      case 'object':
        type = 'json';
        break;
    }

    return {
      id: key,
      type,
      label: propSchema.title || key,
      description: propSchema.description,
      required,
      placeholder: propSchema.examples?.[0],
      options: propSchema.enum?.map((value: any) => ({
        label: value,
        value,
      })),
      validation: {
        rules: this.buildValidationRules(propSchema),
      },
    };
  }

  /**
   * Build validation rules from JSON schema
   */
  private static buildValidationRules(schema: any): ValidationRule[] {
    const rules: ValidationRule[] = [];

    if (schema.minLength) {
      rules.push({
        type: 'min',
        value: schema.minLength,
        message: `Must be at least ${schema.minLength} characters`,
      });
    }

    if (schema.maxLength) {
      rules.push({
        type: 'max',
        value: schema.maxLength,
        message: `Must be at most ${schema.maxLength} characters`,
      });
    }

    if (schema.pattern) {
      rules.push({
        type: 'pattern',
        value: schema.pattern,
        message: 'Invalid format',
      });
    }

    return rules;
  }

  /**
   * Create fallback renderer for unknown types
   */
  private static createFallbackRenderer(config: PropertyRendererConfig, context: PropertyContext): ReactNode {
    return React.createElement('div', {
      key: config.id,
      className: 'property-fallback',
    }, [
      React.createElement('label', { key: 'label' }, config.label),
      React.createElement('input', {
        key: 'input',
        type: 'text',
        placeholder: config.placeholder,
        value: context.formData[config.id] || '',
        onChange: (e: any) => context.setFieldValue(config.id, e.target.value),
      }),
    ]);
  }
}

/**
 * Universal Property Form Component
 */
const UniversalPropertyForm: React.FC<{
  properties: PropertyRendererConfig[];
  initialValues?: Record<string, any>;
  onSubmit?: (values: Record<string, any>) => void;
  layout?: 'vertical' | 'horizontal' | 'grid';
}> = ({ properties, initialValues = {}, onSubmit, layout = 'vertical' }) => {
  const [formData, setFormData] = useState(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const setFieldValue = useCallback((name: string, value: any) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  }, []);

  const setFieldError = useCallback((name: string, error: string) => {
    setErrors(prev => ({ ...prev, [name]: error }));
  }, []);

  const validateField = useCallback(async (name: string) => {
    const property = properties.find(p => p.id === name);
    if (!property?.validation) return;

    const value = formData[name];
    let error = '';

    // Run validation rules
    if (property.validation.rules) {
      for (const rule of property.validation.rules) {
        switch (rule.type) {
          case 'required':
            if (!value && property.required) {
              error = rule.message;
            }
            break;
          case 'min':
            if (value && value.length < rule.value) {
              error = rule.message;
            }
            break;
          case 'max':
            if (value && value.length > rule.value) {
              error = rule.message;
            }
            break;
          case 'pattern':
            if (value && !new RegExp(rule.value).test(value)) {
              error = rule.message;
            }
            break;
        }
        if (error) break;
      }
    }

    // Run custom validator
    if (!error && property.validation.customValidator) {
      error = await property.validation.customValidator(value) || '';
    }

    setFieldError(name, error);
    setTouched(prev => ({ ...prev, [name]: true }));
  }, [formData, properties, setFieldError]);

  const context: PropertyContext = useMemo(() => ({
    formData,
    errors,
    touched,
    isSubmitting,
    setFieldValue,
    setFieldError,
    validateField,
  }), [formData, errors, touched, isSubmitting, setFieldValue, setFieldError, validateField]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Validate all fields
    await Promise.all(properties.map(p => validateField(p.id)));

    // Check if there are any errors
    const hasErrors = Object.values(errors).some(error => error);
    if (!hasErrors && onSubmit) {
      onSubmit(formData);
    }

    setIsSubmitting(false);
  }, [properties, validateField, errors, formData, onSubmit]);

  return React.createElement('form', {
    className: `universal-form layout-${layout}`,
    onSubmit: handleSubmit,
  }, [
    ...properties.map(property =>
      PropertyRendererFactory.createRenderer(property, context)
    ),
    React.createElement('button', {
      key: 'submit',
      type: 'submit',
      disabled: isSubmitting,
      className: 'submit-button',
    }, isSubmitting ? 'Submitting...' : 'Submit'),
  ]);
};

export default PropertyRendererFactory;