import { useCallback } from './hooks/useCallback';
import { useEffect } from './hooks/useEffect';
import { useEnter } from './hooks/useEnter';
import { useLeave } from './hooks/useLeave';
import { useState } from './hooks/useState';
/* eslint-disable @typescript-eslint/no-explicit-any */

import { DeleteOutlined, PlusOutlined, UploadOutlined } from '@ant-design/icons';
import {
  Button,
  Card,
  ColorPicker,
  DatePicker,
  Input,
  InputNumber,
  Select,
  Switch,
  Upload,
} from 'antd';
import type React from 'react';
import { useCallback, useEffect, useState } from 'react';
import type {
  INodeProperty,
  PropertyEvaluationContext,
  PropertyFormState,
  PropertyValue,
} from '@/core';

// Simple property evaluation for INodeProperty (registry system)
const evaluateINodeProperty = (property: INodeProperty, context: PropertyEvaluationContext) => {
  // For registry system, we use simpler logic
  const formState = context.formState || {};
  const displayOptions = property.displayOptions;

  let visible = true;
  const disabled = false;
  const required = property.required || false;

  if (displayOptions?.show) {
    visible = Object.entries(displayOptions.show).every(([key, values]) => {
      const currentValue = formState[key];
      return (
        Array.isArray(values) &&
        currentValue !== undefined &&
        currentValue !== null &&
        values.includes(currentValue as string | number | boolean)
      );
    });
  }

  if (displayOptions?.hide) {
    const shouldHide = Object.entries(displayOptions.hide).some(([key, values]) => {
      const currentValue = formState[key];
      return (
        Array.isArray(values) &&
        currentValue !== undefined &&
        currentValue !== null &&
        values.includes(currentValue as string | number | boolean)
      );
    });
    if (shouldHide) visible = false;
  }

  return { visible, disabled, required };
};

const { TextArea } = Input;
const { Option } = Select;

interface DynamicPropertyRendererProps {
  properties: INodeProperty[];
  formState: PropertyFormState;
  onChange: (name: string, value: PropertyValue) => void;
  context?: Partial<PropertyEvaluationContext>;
  disabled?: boolean;
  theme?: 'light' | 'dark';
}

interface PropertyFieldProps {
  property: INodeProperty;
  value: PropertyValue;
  onChange: (value: PropertyValue) => void;
  context: PropertyEvaluationContext;
  disabled?: boolean;
  theme?: 'light' | 'dark';
}

// Theme-based styling helper
const getThemeStyles = (theme: 'light' | 'dark', hasErrors: boolean = false) => {
  if (theme === 'light') {
    return {
      backgroundColor: '#ffffff',
      borderColor: hasErrors ? '#ff4d4f' : '#d1d5db',
      color: '#1f2937',
      dropdownStyle: {
        backgroundColor: '#ffffff',
        border: '1px solid #d1d5db',
      },
    };
  } else {
    return {
      backgroundColor: '#4b5563',
      borderColor: hasErrors ? '#ff4d4f' : '#6b7280',
      color: '#ffffff',
      dropdownStyle: {
        backgroundColor: '#374151',
        border: '1px solid #6b7280',
      },
    };
  }
};

const PropertyField: React.FC<PropertyFieldProps> = ({
  property,
  value,
  onChange,
  context,
  disabled = false,
  theme = 'dark',
}) => {
  const evaluation = evaluateINodeProperty(property, context);

  if (!evaluation.visible) {
    return null;
  }

  const hasErrors = false; // Simplified validation for registry system
  const isDisabled = disabled || evaluation.disabled;
  const themeStyles = getThemeStyles(theme, hasErrors);

  const commonProps = {
    placeholder: property.placeholder,
    disabled: isDisabled,
    style: {
      backgroundColor: themeStyles.backgroundColor,
      borderColor: themeStyles.borderColor,
      color: themeStyles.color,
      ...(hasErrors ? { borderColor: '#ff4d4f' } : {}),
    },
  };

  // Helper function to get credential icons
  const getCredentialIcon = (type: string) => {
    switch (type) {
      case 'openaiApi':
        return '🤖';
      case 'anthropicApi':
        return '🧠';
      case 'googleAiApi':
        return '🔷';
      case 'azureOpenAiApi':
        return '☁️';
      case 'awsBedrockApi':
        return '🟠';
      case 'gmailOAuth2':
        return '📧';
      case 'postgres':
        return '🐘';
      case 'mysql':
        return '🐬';
      default:
        return '🔑';
    }
  };

  const renderBasicField = () => {
    switch (property.type) {
      case 'string':
        return (
          <Input
            {...commonProps}
            value={(value as string) || ''}
            onChange={(e) => onChange(e.target.value)}
          />
        );

      case 'text':
        return (
          <TextArea
            {...commonProps}
            value={(value as string) || ''}
            onChange={(e) => onChange(e.target.value)}
            rows={property.rows || 4}
            autoSize={{ minRows: property.rows || 4, maxRows: 10 }}
          />
        );

      case 'number':
        return (
          <InputNumber
            {...commonProps}
            value={value as number}
            onChange={(val) => onChange(val)}
            min={property.min}
            max={property.max}
            step={property.step || 1}
            style={{
              width: '100%',
              backgroundColor: '#4b5563', // Darker gray-600
              borderColor: hasErrors ? '#ff4d4f' : '#6b7280', // Lighter border
              color: '#ffffff', // Pure white text
            }}
          />
        );

      case 'boolean':
        return (
          <Switch checked={(value as boolean) || false} onChange={onChange} disabled={isDisabled} />
        );

      case 'select':
        return (
          <Select
            {...commonProps}
            value={value as string}
            onChange={onChange}
            style={{
              width: '100%',
              backgroundColor: '#4b5563', // Darker gray-600
              borderColor: hasErrors ? '#ff4d4f' : '#6b7280', // Lighter border
              color: '#ffffff', // Pure white text
            }}
            dropdownStyle={{
              backgroundColor: '#374151', // Dark dropdown background
              border: '1px solid #6b7280', // Lighter border
            }}
            dropdownClassName="custom-dark-dropdown"
          >
            {property.options?.map((option: any) => (
              <Option
                key={String(option.value)}
                value={option.value}
                style={{
                  backgroundColor: '#374151', // Dark option background
                  color: '#ffffff', // White text
                }}
              >
                {option.name}
              </Option>
            ))}
          </Select>
        );

      case 'multiSelect':
      case 'multiOptions':
        return (
          <Select
            {...commonProps}
            mode="multiple"
            value={(value as string[]) || []}
            onChange={onChange}
            className="ant-select-multiple"
            style={{
              width: '100%',
              backgroundColor: '#4b5563', // Darker gray-600
              borderColor: hasErrors ? '#ff4d4f' : '#6b7280', // Lighter border
              color: '#ffffff', // Pure white text
            }}
            dropdownStyle={{
              backgroundColor: '#374151', // Dark dropdown background
              border: '1px solid #6b7280', // Lighter border
            }}
            dropdownClassName="custom-dark-dropdown"
            tagRender={(props) => {
              const { label, closable, onClose } = props;
              return (
                <span
                  style={{
                    backgroundColor: '#1f2937',
                    border: '1px solid #4b5563',
                    color: '#ffffff',
                    borderRadius: '4px',
                    padding: '2px 8px',
                    margin: '2px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    fontSize: '12px',
                  }}
                >
                  {label}
                  {closable && (
                    <span
                      onClick={onClose}
                      style={{
                        marginLeft: '4px',
                        cursor: 'pointer',
                        color: '#9ca3af',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = '#ffffff')}
                      onMouseLeave={(e) => (e.currentTarget.style.color = '#9ca3af')}
                    >
                      ×
                    </span>
                  )}
                </span>
              );
            }}
          >
            {property.options?.map((option: any) => (
              <Option
                key={String(option.value)}
                value={option.value}
                style={{
                  backgroundColor: '#374151', // Dark option background
                  color: '#ffffff', // White text
                }}
              >
                {option.name}
              </Option>
            ))}
          </Select>
        );

      case 'credentialsSelect': {
        // Get available credentials from context (registry system)
        const credentialTypes = property.credentialTypes || [];
        const availableCredentials =
          context.credentials?.filter(
            (cred: any) => credentialTypes.length === 0 || credentialTypes.includes(cred.type)
          ) || [];

        // Debug logging for credential filtering
        if (property.name === 'credential' && credentialTypes.includes('gmailOAuth2')) {
        }

        return (
          <Select
            {...commonProps}
            value={value as string}
            onChange={(selectedValue) => {
              onChange(selectedValue);

              // Sync with the other credential field
              if (context.onCredentialChange) {
                context.onCredentialChange(selectedValue);
              }

              // Trigger auto-population if a credential is selected
              if (selectedValue && context.onCredentialSelect) {
                const selectedCredential = availableCredentials.find(
                  (cred: any) => cred.id === selectedValue
                );
                if (selectedCredential) {
                  context.onCredentialSelect(selectedCredential);
                }
              }
            }}
            placeholder="Select a credential..."
            style={{
              width: '100%',
              backgroundColor: '#4b5563', // Darker gray-600
              borderColor: hasErrors ? '#ff4d4f' : '#6b7280', // Lighter border
              color: '#ffffff', // Pure white text
            }}
            dropdownStyle={{
              backgroundColor: '#374151', // Dark dropdown background
              border: '1px solid #6b7280', // Lighter border
            }}
            dropdownClassName="custom-dark-dropdown"
            dropdownRender={(menu) => (
              <div>
                {menu}
                {credentialTypes.length > 0 && (
                  <div
                    style={{
                      padding: '8px',
                      borderTop: '1px solid #6b7280',
                      backgroundColor: '#374151',
                    }}
                  >
                    <Button
                      type="text"
                      size="small"
                      onClick={() => {
                        // Trigger credential creation modal
                        if (context.onCreateCredential) {
                          context.onCreateCredential(credentialTypes[0]);
                        } else {
                        }
                      }}
                      style={{
                        color: '#3b82f6',
                        padding: '2px 8px',
                        height: 'auto',
                      }}
                    >
                      + Create New Credential
                    </Button>
                  </div>
                )}
              </div>
            )}
          >
            <Option value="" style={{ backgroundColor: '#374151', color: '#ffffff' }}>
              No credential selected
            </Option>
            {availableCredentials.map((credential: any) => {
              const credTypeDef = context.credentialTypes?.find(
                (ct: any) => ct.name === credential.type
              );
              const icon =
                credTypeDef?.icon && typeof credTypeDef.icon === 'string'
                  ? credTypeDef.icon
                  : getCredentialIcon(credential.type);
              const displayName =
                credential.name || `${credTypeDef?.displayName || credential.type} Credential`;

              return (
                <Option
                  key={credential.id}
                  value={credential.id}
                  style={{ backgroundColor: '#374151', color: '#ffffff' }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <span style={{ fontSize: '14px' }}>{icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 500 }}>{displayName}</div>
                      <div style={{ fontSize: '11px', color: '#9ca3af' }}>
                        {credential.testedAt
                          ? credential.isValid
                            ? '✓ Tested'
                            : '⚠ Test failed'
                          : 'Not tested'}
                        {credential.updatedAt && (
                          <span style={{ marginLeft: '8px' }}>
                            {new Date(credential.updatedAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (context.onEditCredential) {
                            context.onEditCredential(credential);
                          }
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#6b7280',
                          cursor: 'pointer',
                          fontSize: '12px',
                          padding: '2px',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = '#3b82f6')}
                        onMouseLeave={(e) => (e.currentTarget.style.color = '#6b7280')}
                        title="Edit credential"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (context.onDeleteCredential && confirm(`Delete "${displayName}"?`)) {
                            context.onDeleteCredential(credential);
                          }
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#6b7280',
                          cursor: 'pointer',
                          fontSize: '12px',
                          padding: '2px',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = '#ef4444')}
                        onMouseLeave={(e) => (e.currentTarget.style.color = '#6b7280')}
                        title="Delete credential"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </Option>
              );
            })}
          </Select>
        );
      }

      case 'dateTime':
        return (
          <DatePicker
            {...commonProps}
            showTime
            value={value ? new Date(value as string) : null}
            onChange={(date) => onChange(date?.toISOString() || null)}
            style={{
              width: '100%',
              backgroundColor: '#4b5563', // Darker gray-600
              borderColor: hasErrors ? '#ff4d4f' : '#6b7280', // Lighter border
              color: '#ffffff', // Pure white text
            }}
          />
        );

      case 'color':
        return (
          <ColorPicker
            value={(value as string) || '#000000'}
            onChange={(color) => onChange(color.toHexString())}
            disabled={isDisabled}
          />
        );

      case 'json':
        return (
          <TextArea
            {...commonProps}
            value={(value as string) || '{}'}
            onChange={(e) => onChange(e.target.value)}
            rows={6}
            placeholder="Enter valid JSON..."
          />
        );

      case 'file':
        return (
          <Upload
            {...commonProps}
            onChange={(info) => {
              if (info.file.status === 'done') {
                onChange(info.file.response?.url || info.file.name);
              }
            }}
          >
            <Button icon={<UploadOutlined />} disabled={isDisabled}>
              Upload File
            </Button>
          </Upload>
        );

      default:
        return (
          <Input
            {...commonProps}
            value={(value as string) || ''}
            onChange={(e) => onChange(e.target.value)}
          />
        );
    }
  };

  const renderCollectionField = () => {
    const collectionValue = (value as any[]) || [];
    const isMultiple = property.typeOptions?.multipleValues;

    if (!isMultiple) {
      // Single collection item
      const itemValue = collectionValue[0] || {};
      return (
        <Card
          size="small"
          style={{
            marginBottom: 8,
            backgroundColor: themeStyles.backgroundColor,
            borderColor: themeStyles.borderColor,
            color: themeStyles.color,
          }}
        >
          {property.values?.map((valueProperty: any) => (
            <PropertyField
              key={valueProperty.name}
              property={valueProperty as INodeProperty}
              value={itemValue[valueProperty.name]}
              onChange={(newValue) => {
                const newItem = {
                  ...itemValue,
                  [valueProperty.name]: newValue,
                };
                onChange([newItem]);
              }}
              context={context}
              disabled={isDisabled}
              theme={theme}
            />
          ))}
        </Card>
      );
    }

    // Multiple collection items
    return (
      <div>
        {collectionValue.map((item, index) => (
          <Card
            key={index}
            size="small"
            style={{
              marginBottom: 8,
              backgroundColor: themeStyles.backgroundColor,
              borderColor: themeStyles.borderColor,
              color: themeStyles.color,
            }}
            extra={
              <Button
                type="text"
                danger
                size="small"
                icon={<DeleteOutlined />}
                onClick={() => {
                  const newValue = collectionValue.filter((_, i) => i !== index);
                  onChange(newValue);
                }}
                disabled={isDisabled}
              />
            }
          >
            {property.values?.map((valueProperty: any) => (
              <PropertyField
                key={`${index}-${valueProperty.name}`}
                property={valueProperty as INodeProperty}
                value={item[valueProperty.name]}
                onChange={(newValue) => {
                  const newItems = [...collectionValue];
                  newItems[index] = {
                    ...newItems[index],
                    [valueProperty.name]: newValue,
                  };
                  onChange(newItems);
                }}
                context={context}
                disabled={isDisabled}
                theme={theme}
              />
            ))}
          </Card>
        ))}

        <Button
          type="dashed"
          icon={<PlusOutlined />}
          onClick={() => {
            const defaultItem: Record<string, any> = {};
            property.values?.forEach((valueProperty: any) => {
              defaultItem[valueProperty.name] =
                valueProperty.default !== undefined ? valueProperty.default : '';
            });
            onChange([...collectionValue, defaultItem]);
          }}
          disabled={isDisabled}
          block
          style={{
            backgroundColor: '#4b5563', // Darker background
            borderColor: '#6b7280', // Lighter border
            color: '#ffffff', // Pure white text
          }}
        >
          {property.typeOptions?.multipleValueButtonText || `Add ${property.displayName}`}
        </Button>
      </div>
    );
  };

  const renderField = () => {
    if (property.type === 'collection' || property.type === 'fixedCollection') {
      return renderCollectionField();
    }
    return renderBasicField();
  };

  return (
    <div className="mb-4">
      {/* Custom label for dark theme */}
      <label className="block text-sm font-medium text-gray-100 mb-2">
        {property.displayName}
        {evaluation.required && <span className="text-red-400 ml-1">*</span>}
      </label>

      {/* Form field */}
      {renderField()}

      {/* Description */}
      {property.description && (
        <div className="text-xs text-gray-300 mt-1">{property.description}</div>
      )}

      {/* Error messages */}
      {hasErrors && (
        <div className="mt-1">
          <div className="text-xs text-red-300">Validation error occurred</div>
        </div>
      )}
    </div>
  );
};

const DynamicPropertyRenderer: React.FC<DynamicPropertyRendererProps> = ({
  properties,
  formState,
  onChange,
  context = {},
  disabled = false,
  theme = 'dark',
}) => {
  const credentialProp = properties.find((p) => p.name === 'credential');
  if (credentialProp) {
  }

  const [localFormState, setLocalFormState] = useState<PropertyFormState>(formState);

  // Update local state when props change
  useEffect(() => {
    setLocalFormState(formState);
  }, [formState]);

  const evaluationContext: PropertyEvaluationContext = {
    formState: localFormState,
    nodeData: context.nodeData,
    credentials: context.credentials,
    workflow: context.workflow,
  };

  const handleChange = useCallback(
    (name: string, value: PropertyValue) => {
      const newFormState = { ...localFormState, [name]: value };
      setLocalFormState(newFormState);
      onChange(name, value);
    },
    [localFormState, onChange]
  );

  // Group properties if they have grouping information
  const groupedProperties = properties.reduce(
    (groups, property) => {
      const groupName = 'default'; // Can be extended to support property groups
      if (!groups[groupName]) {
        groups[groupName] = [];
      }
      groups[groupName].push(property);
      return groups;
    },
    {} as Record<string, INodeProperty[]>
  );

  return (
    <div className="dynamic-property-renderer">
      {Object.entries(groupedProperties).map(([groupName, groupProperties]) => (
        <div key={groupName}>
          {(groupProperties as INodeProperty[]).map((property: any, index: number) => (
            <PropertyField
              key={`${property.name}-${index}`}
              property={property}
              value={localFormState[property.name]}
              onChange={(value) => handleChange(property.name, value)}
              context={evaluationContext}
              disabled={disabled}
              theme={theme}
            />
          ))}
        </div>
      ))}
    </div>
  );
};

export default DynamicPropertyRenderer;
