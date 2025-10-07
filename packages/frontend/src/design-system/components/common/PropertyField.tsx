/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * PropertyField Component
 * Dynamic form field renderer for node properties with advanced features
 */

import {
  EyeInvisibleOutlined,
  EyeOutlined,
  InfoCircleOutlined,
  MinusOutlined,
  PlusOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import {
  Badge,
  Button,
  Card,
  ColorPicker,
  DatePicker,
  Input,
  InputNumber,
  Select,
  Switch,
  Tooltip,
  Upload,
} from 'antd';
import type React from 'react';
import { useEffect, useState } from 'react';
import type { NodeTheme } from '@/app/node-extensions/types';
import type { INodeProperty } from '@/core/nodes/types';
import { useNodeTheme } from '../../themes';

const { Option } = Select;
const { TextArea } = Input;

interface PropertyFieldProps {
  property: INodeProperty;
  value: any;
  onChange: (value: any) => void;
  disabled?: boolean;
  theme?: NodeTheme;
  context?: Record<string, any>;
  errors?: string[];
}

const PropertyField: React.FC<PropertyFieldProps> = ({
  property,
  value,
  onChange,
  disabled = false,
  theme: propTheme,

  errors = [],
}) => {
  const { theme: contextTheme } = useNodeTheme();
  const theme = propTheme || contextTheme;
  const [internalValue, setInternalValue] = useState(value);
  const [showPassword, setShowPassword] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    setInternalValue(value);
  }, [value]);

  const handleChange = (newValue: any) => {
    setInternalValue(newValue);

    // Validate the new value
    const error = validateValue(newValue);
    setValidationError(error);

    // Only call onChange if validation passes
    if (!error) {
      onChange(newValue);
    }
  };

  const validateValue = (val: any): string | null => {
    if (property.required && (val === undefined || val === null || val === '')) {
      return `${property.displayName} is required`;
    }

    if (property.type === 'string' || property.type === 'text') {
      if (property.typeOptions?.minValue && val.length < property.typeOptions.minValue) {
        return `${property.displayName} must be at least ${property.typeOptions.minValue} characters`;
      }
      if (property.typeOptions?.maxValue && val.length > property.typeOptions.maxValue) {
        return `${property.displayName} must be no more than ${property.typeOptions.maxValue} characters`;
      }
    }

    if (property.type === 'number') {
      if (property.min !== undefined && val < property.min) {
        return `${property.displayName} must be at least ${property.min}`;
      }
      if (property.max !== undefined && val > property.max) {
        return `${property.displayName} must be no more than ${property.max}`;
      }
    }

    return null;
  };

  const renderLabel = () => {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          marginBottom: '4px',
          color: theme.colors.text,
          fontSize: theme.typography.fontSize.sm,
          fontWeight: theme.typography.fontWeight.medium,
        }}
      >
        <span>
          {property.displayName}
          {property.required && (
            <span style={{ color: theme.colors.error, marginLeft: '2px' }}>*</span>
          )}
        </span>

        {property.description && (
          <Tooltip title={property.description} placement="top">
            <InfoCircleOutlined
              style={{
                fontSize: '12px',
                color: theme.colors.textSecondary,
                cursor: 'help',
              }}
            />
          </Tooltip>
        )}

        {property.hint && (
          <Badge
            count="?"
            size="small"
            style={{
              backgroundColor: theme.colors.info,
              fontSize: '10px',
            }}
            title={property.hint}
          />
        )}
      </div>
    );
  };

  const renderError = () => {
    const allErrors = [...errors];
    if (validationError) {
      allErrors.push(validationError);
    }

    if (allErrors.length === 0) {
      return null;
    }

    return (
      <div
        style={{
          marginTop: '4px',
          fontSize: theme.typography.fontSize.xs,
          color: theme.colors.error,
        }}
      >
        {allErrors.map((error, index) => (
          <div key={index}>{error}</div>
        ))}
      </div>
    );
  };

  const renderField = () => {
    const commonProps = {
      disabled,
      style: { width: '100%' },
      placeholder: property.placeholder,
    };

    switch (property.type) {
      case 'string':
        if (property.typeOptions?.password) {
          return (
            <Input
              {...commonProps}
              type={showPassword ? 'text' : 'password'}
              value={internalValue || property.default || ''}
              onChange={(e) => handleChange(e.target.value)}
              suffix={
                <Button
                  type="text"
                  size="small"
                  icon={showPassword ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                  onClick={() => setShowPassword(!showPassword)}
                />
              }
            />
          );
        }
        return (
          <Input
            {...commonProps}
            value={internalValue || property.default || ''}
            onChange={(e) => handleChange(e.target.value)}
          />
        );

      case 'text':
        return (
          <TextArea
            {...commonProps}
            rows={property.rows || property.typeOptions?.rows || 4}
            value={internalValue || property.default || ''}
            onChange={(e) => handleChange(e.target.value)}
          />
        );

      case 'number':
        return (
          <InputNumber
            {...commonProps}
            min={property.min}
            max={property.max}
            step={property.step}
            precision={property.typeOptions?.numberPrecision}
            value={internalValue || property.default || 0}
            onChange={handleChange}
          />
        );

      case 'boolean':
        return (
          <Switch
            disabled={disabled}
            checked={internalValue !== undefined ? internalValue : property.default}
            onChange={handleChange}
          />
        );

      case 'select':
      case 'options':
        return (
          <Select
            {...commonProps}
            value={internalValue || property.default}
            onChange={handleChange}
            showSearch
            filterOption={(input, option) =>
              (option?.children as unknown as string)?.toLowerCase().includes(input.toLowerCase())
            }
          >
            {property.options?.map((option) => (
              <Option key={String(option.value)} value={option.value}>
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
            value={internalValue || property.default || []}
            onChange={handleChange}
            showSearch
            filterOption={(input, option) =>
              (option?.children as unknown as string)?.toLowerCase().includes(input.toLowerCase())
            }
          >
            {property.options?.map((option) => (
              <Option key={String(option.value)} value={option.value}>
                {option.name}
              </Option>
            ))}
          </Select>
        );

      case 'dateTime':
        return (
          <DatePicker {...commonProps} showTime value={internalValue} onChange={handleChange} />
        );

      case 'color':
        return (
          <ColorPicker
            value={internalValue || property.default || '#1890ff'}
            onChange={(color) => handleChange(color.toHexString())}
            disabled={disabled}
            showText
          />
        );

      case 'file':
        return (
          <Upload
            disabled={disabled}
            beforeUpload={() => false} // Prevent auto upload
            onChange={(info) => handleChange(info.fileList)}
            fileList={internalValue || []}
          >
            <Button icon={<UploadOutlined />}>{property.placeholder || 'Upload File'}</Button>
          </Upload>
        );

      case 'json':
        return (
          <TextArea
            {...commonProps}
            rows={6}
            value={
              typeof internalValue === 'object'
                ? JSON.stringify(internalValue, null, 2)
                : internalValue || property.default || '{}'
            }
            onChange={(e) => {
              try {
                const parsed = JSON.parse(e.target.value);
                handleChange(parsed);
              } catch {
                // Keep the raw value for partial JSON
                handleChange(e.target.value);
              }
            }}
            placeholder="Enter valid JSON"
          />
        );

      case 'collection':
        return renderCollectionField();

      case 'fixedCollection':
        return renderFixedCollectionField();

      case 'credentialsSelect':
        return renderCredentialsSelect();

      default:
        return (
          <Input
            {...commonProps}
            value={internalValue || property.default || ''}
            onChange={(e) => handleChange(e.target.value)}
          />
        );
    }
  };

  const renderCollectionField = () => {
    const items = internalValue || [];

    return (
      <Card size="small" style={{ backgroundColor: theme.colors.background }}>
        {items.map((item: any, index: number) => (
          <Card
            key={index}
            size="small"
            style={{
              marginBottom: '8px',
              borderColor: theme.colors.border,
            }}
            extra={
              <Button
                type="text"
                danger
                size="small"
                icon={<MinusOutlined />}
                onClick={() => {
                  const newItems = items.filter((_: any, i: number) => i !== index);
                  handleChange(newItems);
                }}
              />
            }
          >
            {property.values?.map((subProperty) => (
              <PropertyField
                key={subProperty.name}
                property={subProperty}
                value={item[subProperty.name]}
                onChange={(subValue) => {
                  const newItems = [...items];
                  newItems[index] = {
                    ...newItems[index],
                    [subProperty.name]: subValue,
                  };
                  handleChange(newItems);
                }}
                theme={theme}
                disabled={disabled}
              />
            ))}
          </Card>
        ))}

        <Button
          type="dashed"
          block
          icon={<PlusOutlined />}
          onClick={() => {
            const newItem: Record<string, any> = {};
            property.values?.forEach((subProperty) => {
              newItem[subProperty.name] = subProperty.default;
            });
            handleChange([...items, newItem]);
          }}
        >
          Add Item
        </Button>
      </Card>
    );
  };

  const renderFixedCollectionField = () => {
    // Similar to collection but with fixed structure
    return renderCollectionField();
  };

  const renderCredentialsSelect = () => {
    // Mock credentials for now - would be populated from credential store
    const mockCredentials = [
      { value: 'cred1', name: 'Gmail OAuth2' },
      { value: 'cred2', name: 'OpenAI API Key' },
      { value: 'cred3', name: 'Slack Bot Token' },
    ];

    return (
      <Select
        placeholder="Select credentials"
        value={internalValue}
        onChange={handleChange}
        disabled={disabled}
        style={{ width: '100%' }}
      >
        {mockCredentials.map((cred) => (
          <Option key={String(cred.value)} value={cred.value}>
            {cred.name}
          </Option>
        ))}
      </Select>
    );
  };

  return (
    <div style={{ marginBottom: theme.spacing.md }}>
      {renderLabel()}
      {renderField()}
      {renderError()}
    </div>
  );
};

export default PropertyField;
