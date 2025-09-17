/**
 * Enhanced Property Renderer
 *
 * Provides sophisticated property rendering with:
 * - Real-time validation and feedback
 * - Conditional property display
 * - AI-assisted suggestions
 * - Expression editor support
 * - Advanced form controls
 */

import React, { useState, useCallback, useMemo } from "react";
import {
  Input,
  InputNumber,
  Switch,
  Select,
  DatePicker,
  ColorPicker,
  Button,
  Upload,
  Card,
  Form,
  Alert,
  Tooltip,
  Tag,
} from "antd";
import {
  PlusOutlined,
  UploadOutlined,
  InfoCircleOutlined,
  BulbOutlined,
  ExclamationCircleOutlined,
  CodeOutlined,
  FunctionOutlined,
} from "@ant-design/icons";
import { cn } from "@/design-system/utils";
import type { PropertyFormState, PropertyValue } from "@/core/nodes/types";
import type { EnhancedNodeProperty } from "@/core/utils/enhancedPropertyEvaluator";
import { useEnhancedPropertyEvaluator } from "@/core/utils/enhancedPropertyEvaluator";

const { TextArea } = Input;
const { Option } = Select;

interface EnhancedPropertyRendererProps {
  properties: EnhancedNodeProperty[];
  formState: PropertyFormState;
  onChange: (name: string, value: PropertyValue) => void;
  executionContext?: any;
  disabled?: boolean;
  theme?: "light" | "dark";
  onValidationChange?: (isValid: boolean, errors: Map<string, string>) => void;
}

interface PropertyFieldProps {
  property: EnhancedNodeProperty;
  value: PropertyValue;
  onChange: (value: PropertyValue) => void;
  disabled?: boolean;
  theme?: "light" | "dark";
  error?: string;
  warning?: string;
  suggestion?: string;
  onExpressionToggle?: () => void;
}

const ExpressionEditor: React.FC<{
  value: string;
  onChange: (value: string) => void;
  language?: string;
  placeholder?: string;
}> = ({ value, onChange, language = "javascript", placeholder }) => {
  const [isAdvancedMode, setIsAdvancedMode] = useState(false);

  return (
    <div className="expression-editor">
      <div className="flex items-center gap-2 mb-2">
        <Tag color="blue" icon={<FunctionOutlined />}>
          Expression
        </Tag>
        <Button
          size="small"
          type="text"
          icon={<CodeOutlined />}
          onClick={() => setIsAdvancedMode(!isAdvancedMode)}
        >
          {isAdvancedMode ? "Simple" : "Advanced"}
        </Button>
      </div>

      {isAdvancedMode ? (
        <TextArea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder || `Enter ${language} expression...`}
          className="font-mono"
          rows={4}
        />
      ) : (
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder || "Enter expression..."}
          className="font-mono"
          prefix="="
        />
      )}

      <div className="text-xs text-gray-500 mt-1">
        Use expressions to dynamically calculate values
      </div>
    </div>
  );
};

const PropertyField: React.FC<PropertyFieldProps> = ({
  property,
  value,
  onChange,
  disabled,
  theme = "dark",
  error,
  warning,
  suggestion,
}) => {
  const [isExpressionMode, setIsExpressionMode] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const hasError = !!error;
  const hasWarning = !!warning;
  const hasSuggestion = !!suggestion;

  const getCommonProps = () => ({
    disabled,
    status: hasError ? "error" : hasWarning ? "warning" : undefined,
  });

  const renderExpressionToggle = () => {
    if (!property.expressionSupport) return null;

    return (
      <Button
        size="small"
        type={isExpressionMode ? "primary" : "default"}
        icon={<FunctionOutlined />}
        onClick={() => setIsExpressionMode(!isExpressionMode)}
        title="Toggle expression mode"
      />
    );
  };

  const renderSuggestionButton = () => {
    if (!hasSuggestion) return null;

    return (
      <Tooltip title={suggestion}>
        <Button
          size="small"
          type="text"
          icon={<BulbOutlined />}
          onClick={() => setShowSuggestions(!showSuggestions)}
          className="text-yellow-500"
        />
      </Tooltip>
    );
  };

  const renderFieldAdornment = () => {
    const adornments = [
      renderExpressionToggle(),
      renderSuggestionButton(),
    ].filter(Boolean);

    if (adornments.length === 0) return null;

    return <div className="flex items-center gap-1">{adornments}</div>;
  };

  if (isExpressionMode) {
    return (
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">
            {property.displayName || property.name}
          </span>
          {renderFieldAdornment()}
        </div>
        <ExpressionEditor
          value={typeof value === "string" ? value : ""}
          onChange={onChange}
          language={property.expressionLanguage}
          placeholder={property.placeholder}
        />
      </div>
    );
  }

  const commonFieldProps = {
    ...getCommonProps(),
    placeholder: property.placeholder,
  };

  switch (property.type) {
    case "string":
      return (
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium">
              {property.displayName || property.name}
            </span>
            {renderFieldAdornment()}
          </div>
          <Input
            {...commonFieldProps}
            value={value as string}
            onChange={(e) => onChange(e.target.value)}
            suffix={
              property.description && (
                <Tooltip title={property.description}>
                  <InfoCircleOutlined className="text-gray-400" />
                </Tooltip>
              )
            }
          />
        </div>
      );

    case "text":
      return (
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium">
              {property.displayName || property.name}
            </span>
            {renderFieldAdornment()}
          </div>
          <TextArea
            {...commonFieldProps}
            value={value as string}
            onChange={(e) => onChange(e.target.value)}
            rows={property.rows || 3}
          />
        </div>
      );

    case "number":
      return (
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium">
              {property.displayName || property.name}
            </span>
            {renderFieldAdornment()}
          </div>
          <InputNumber
            {...commonFieldProps}
            value={value as number}
            onChange={(val) => onChange(val)}
            min={property.typeOptions?.minValue}
            max={property.typeOptions?.maxValue}
            step={property.typeOptions?.numberPrecision}
            className="w-full"
          />
        </div>
      );

    case "boolean":
      return (
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">
            {property.displayName || property.name}
          </span>
          <div className="flex items-center gap-2">
            {renderFieldAdornment()}
            <Switch
              {...getCommonProps()}
              checked={value as boolean}
              onChange={onChange}
            />
          </div>
        </div>
      );

    case "options":
      const isMultiple = property.typeOptions?.multipleValues;
      return (
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium">
              {property.displayName || property.name}
            </span>
            {renderFieldAdornment()}
          </div>
          <Select
            {...commonFieldProps}
            value={value}
            onChange={onChange}
            mode={isMultiple ? "multiple" : undefined}
            className="w-full"
            showSearch
            filterOption={(input, option) =>
              (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
            }
          >
            {property.options?.map((option) => (
              <Option key={option.value} value={option.value}>
                {option.name}
              </Option>
            ))}
          </Select>
        </div>
      );

    case "dateTime":
      return (
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium">
              {property.displayName || property.name}
            </span>
            {renderFieldAdornment()}
          </div>
          <DatePicker
            {...commonFieldProps}
            value={value ? new Date(value as string) : null}
            onChange={(date) => onChange(date?.toISOString())}
            className="w-full"
            showTime={property.typeOptions?.alwaysShowDateTime}
          />
        </div>
      );

    case "color":
      return (
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium">
              {property.displayName || property.name}
            </span>
            {renderFieldAdornment()}
          </div>
          <ColorPicker
            value={value as string}
            onChange={(color) => onChange(color.toHexString())}
            showText
            className="w-full"
          />
        </div>
      );

    case "file":
      return (
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium">
              {property.displayName || property.name}
            </span>
            {renderFieldAdornment()}
          </div>
          <Upload
            {...getCommonProps()}
            beforeUpload={() => false}
            onChange={(info) => {
              const file = info.file;
              onChange(file);
            }}
          >
            <Button icon={<UploadOutlined />}>Select File</Button>
          </Upload>
        </div>
      );

    case "collection":
      return (
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">
              {property.displayName || property.name}
            </span>
            {renderFieldAdornment()}
          </div>
          <Card size="small" className="bg-gray-50 dark:bg-gray-800">
            <div className="text-xs text-gray-500 mb-2">
              Collection properties
            </div>
            {/* TODO: Implement nested property rendering */}
            <Button type="dashed" icon={<PlusOutlined />} className="w-full">
              Add Item
            </Button>
          </Card>
        </div>
      );

    case "json":
      return (
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium">
              {property.displayName || property.name}
            </span>
            {renderFieldAdornment()}
          </div>
          <TextArea
            {...commonFieldProps}
            value={
              typeof value === "object"
                ? JSON.stringify(value, null, 2)
                : (value as string)
            }
            onChange={(e) => {
              try {
                const parsed = JSON.parse(e.target.value);
                onChange(parsed);
              } catch {
                onChange(e.target.value);
              }
            }}
            className="font-mono"
            rows={6}
          />
        </div>
      );

    case "credentialsSelect":
      return (
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium">
              {property.displayName || property.name}
            </span>
            {renderFieldAdornment()}
          </div>
          <Select
            {...commonFieldProps}
            value={value}
            onChange={onChange}
            className="w-full"
            placeholder="Select credentials..."
          >
            {/* TODO: Load credentials from store */}
            <Option value="test-credential">Test Credential</Option>
          </Select>
        </div>
      );

    default:
      return (
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium">
              {property.displayName || property.name}
            </span>
            {renderFieldAdornment()}
          </div>
          <Input
            {...commonFieldProps}
            value={value as string}
            onChange={(e) => onChange(e.target.value)}
          />
        </div>
      );
  }
};

export const EnhancedPropertyRenderer: React.FC<
  EnhancedPropertyRendererProps
> = ({
  properties,
  formState,
  onChange,
  executionContext,
  disabled,
  theme = "dark",
  onValidationChange,
}) => {
  const { evaluations, validateAll } = useEnhancedPropertyEvaluator(
    properties,
    formState,
    executionContext,
  );

  // Validate on form state changes
  React.useEffect(() => {
    validateAll().then(({ isValid, errors }) => {
      onValidationChange?.(isValid, errors);
    });
  }, [formState, validateAll, onValidationChange]);

  const visibleProperties = useMemo(() => {
    return properties.filter((property) => {
      const evaluation = evaluations.get(property.name);
      return evaluation?.visible !== false;
    });
  }, [properties, evaluations]);

  const handlePropertyChange = useCallback(
    (name: string, value: PropertyValue) => {
      onChange(name, value);
    },
    [onChange],
  );

  const renderProperty = useCallback(
    (property: EnhancedNodeProperty) => {
      const evaluation = evaluations.get(property.name);
      const currentValue = formState[property.name];

      if (!evaluation?.visible) {
        return null;
      }

      return (
        <div
          key={property.name}
          className={cn(
            "property-field mb-4",
            evaluation.disabled && "opacity-50 pointer-events-none",
          )}
        >
          <PropertyField
            property={property}
            value={currentValue}
            onChange={(value) => handlePropertyChange(property.name, value)}
            disabled={disabled || evaluation.disabled}
            theme={theme}
            error={evaluation.error}
            warning={evaluation.warning}
            suggestion={evaluation.suggestion}
          />

          {/* Validation feedback */}
          {evaluation.error && (
            <Alert
              message={evaluation.error}
              type="error"
              size="small"
              className="mt-1"
              showIcon
            />
          )}

          {evaluation.warning && (
            <Alert
              message={evaluation.warning}
              type="warning"
              size="small"
              className="mt-1"
              showIcon
            />
          )}

          {evaluation.suggestion &&
            !evaluation.error &&
            !evaluation.warning && (
              <Alert
                message={evaluation.suggestion}
                type="info"
                size="small"
                className="mt-1"
                showIcon
                icon={<BulbOutlined />}
              />
            )}

          {property.description && !evaluation.error && !evaluation.warning && (
            <div className="text-xs text-gray-500 mt-1">
              {property.description}
            </div>
          )}
        </div>
      );
    },
    [evaluations, formState, handlePropertyChange, disabled, theme],
  );

  return (
    <div
      className={cn(
        "enhanced-property-renderer",
        theme === "dark" ? "text-white" : "text-gray-900",
      )}
    >
      <Form layout="vertical" className="space-y-4">
        {visibleProperties.map(renderProperty)}
      </Form>
    </div>
  );
};

export default EnhancedPropertyRenderer;
