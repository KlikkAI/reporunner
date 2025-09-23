/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from 'react';

// Old ConditionNode replaced with registry-based system
// import { CONDITION_NODE_CONFIG } from './NodeTypes/ConditionNode'

interface ConditionRule {
  id: string;
  field: string;
  operator: string;
  value: any;
  valueType: 'fixed' | 'expression';
  outputName: string;
  enabled: boolean;
}

interface ConditionBuilderProps {
  rules: ConditionRule[];
  onChange: (rules: ConditionRule[]) => void;
  availableFields: Array<{
    name: string;
    type: string;
    example?: any;
    path: string;
  }>;
  inputData?: any[];
  onTestRule?: (ruleId: string, result: any) => void;
  availableOutputs?: Array<{
    id: string;
    label: string;
  }>;
}

const OPERATORS = {
  string: [
    { value: 'equals', label: 'equals', symbol: '==', example: '"urgent"' },
    {
      value: 'not_equals',
      label: 'does not equal',
      symbol: '!=',
      example: '"spam"',
    },
    {
      value: 'contains',
      label: 'contains',
      symbol: '∋',
      example: '"important"',
    },
    {
      value: 'not_contains',
      label: 'does not contain',
      symbol: '∌',
      example: '"test"',
    },
    {
      value: 'starts_with',
      label: 'starts with',
      symbol: '⤷',
      example: '"Re:"',
    },
    { value: 'ends_with', label: 'ends with', symbol: '↘', example: '.com' },
    { value: 'is_empty', label: 'is empty', symbol: '∅', example: '' },
    { value: 'is_not_empty', label: 'is not empty', symbol: '≠∅', example: '' },
    {
      value: 'regex',
      label: 'matches regex',
      symbol: 'regex',
      example: 'regex_pattern',
    },
    { value: 'is_true', label: 'is true', symbol: '✓', example: 'true' },
    { value: 'is_false', label: 'is false', symbol: '✗', example: 'false' },
    { value: 'greater', label: 'greater than', symbol: '>', example: '50' },
    {
      value: 'greater_equal',
      label: 'greater than or equal',
      symbol: '>=',
      example: '10',
    },
    { value: 'less', label: 'less than', symbol: '<', example: '100' },
    {
      value: 'less_equal',
      label: 'less than or equal',
      symbol: '<=',
      example: '500',
    },
    { value: 'between', label: 'between', symbol: '⟷', example: '10,100' },
    { value: 'is_null', label: 'is null', symbol: '∅', example: 'null' },
  ],
  number: [
    { value: 'equals', label: 'equals', symbol: '==', example: '100' },
    {
      value: 'not_equals',
      label: 'does not equal',
      symbol: '!=',
      example: '0',
    },
    { value: 'greater', label: 'greater than', symbol: '>', example: '50' },
    {
      value: 'greater_equal',
      label: 'greater than or equal',
      symbol: '>=',
      example: '10',
    },
    { value: 'less', label: 'less than', symbol: '<', example: '100' },
    {
      value: 'less_equal',
      label: 'less than or equal',
      symbol: '<=',
      example: '500',
    },
    { value: 'between', label: 'between', symbol: '⟷', example: '10,100' },
    { value: 'is_null', label: 'is null', symbol: '∅', example: '' },
    { value: 'is_empty', label: 'is empty', symbol: '∅', example: '' },
    { value: 'is_not_empty', label: 'is not empty', symbol: '≠∅', example: '' },
  ],
  boolean: [
    { value: 'equals', label: 'equals', symbol: '==', example: 'true' },
    {
      value: 'not_equals',
      label: 'does not equal',
      symbol: '!=',
      example: 'false',
    },
    { value: 'is_true', label: 'is true', symbol: '✓', example: 'true' },
    { value: 'is_false', label: 'is false', symbol: '✗', example: 'false' },
    { value: 'is_null', label: 'is null', symbol: '∅', example: 'null' },
  ],
  array: [
    { value: 'contains', label: 'contains', symbol: '∋', example: '"item"' },
    {
      value: 'not_contains',
      label: 'does not contain',
      symbol: '∌',
      example: '"spam"',
    },
    {
      value: 'length_equals',
      label: 'length equals',
      symbol: '#=',
      example: '5',
    },
    {
      value: 'length_greater',
      label: 'length greater than',
      symbol: '#>',
      example: '0',
    },
    { value: 'is_empty', label: 'is empty', symbol: '[]', example: '' },
    {
      value: 'is_not_empty',
      label: 'is not empty',
      symbol: '[…]',
      example: '',
    },
    {
      value: 'equals',
      label: 'equals',
      symbol: '==',
      example: '["item1", "item2"]',
    },
    {
      value: 'not_equals',
      label: 'does not equal',
      symbol: '!=',
      example: '["other"]',
    },
  ],
};

const ConditionBuilder: React.FC<ConditionBuilderProps> = ({
  rules,
  onChange,
  availableFields,
  onTestRule,
}) => {
  // State for test results
  const [testResults, setTestResults] = useState<Record<string, any>>({});

  // Initialize with default rules based on CONDITION_NODE_CONFIG.defaultOutputs
  // This syncs the parameters tab with the visual handles from the centralized configuration
  useEffect(() => {
    if (rules.length === 0) {
      // Generate default rules from the centralized condition node configuration
      const baseTimestamp = Date.now();
      const defaultRules: ConditionRule[] = [].map((output: any, index: number) => ({
        id: `rule-${baseTimestamp + index * 100}`, // Ensure unique IDs with more spacing
        field: '',
        operator: 'equals',
        value: '',
        valueType: 'fixed' as const,
        outputName: output.id, // Use 'true', 'false' from centralized config
        enabled: true,
      }));

      onChange(defaultRules);
    }
  }, [rules.length, onChange]);

  const addRule = () => {
    // Generate a meaningful default name for the new handle
    const handleSuggestions = [
      'true',
      'false',
      'urgent',
      'important',
      'spam',
      'approved',
      'rejected',
      'high_priority',
    ];
    const usedNames = rules.map((rule) => rule.outputName);
    const defaultName =
      handleSuggestions.find((name) => !usedNames.includes(name)) || `handle_${rules.length + 1}`;

    const newRule: ConditionRule = {
      id: `rule-${Date.now()}`,
      field: '',
      operator: 'equals',
      value: '',
      valueType: 'fixed',
      outputName: defaultName,
      enabled: true,
    };
    const updatedRules = [...rules, newRule];
    onChange(updatedRules);
  };

  const updateRule = (ruleId: string, updates: Partial<ConditionRule>) => {
    const updatedRules = rules.map((rule) => (rule.id === ruleId ? { ...rule, ...updates } : rule));
    onChange(updatedRules);
  };

  const deleteRule = (ruleId: string) => {
    // Users can delete any rule/handle they want
    const updatedRules = rules.filter((rule) => rule.id !== ruleId);
    onChange(updatedRules);
  };

  const moveRule = (dragIndex: number, dropIndex: number) => {
    const newRules = [...rules];
    const draggedItem = newRules[dragIndex];
    newRules.splice(dragIndex, 1);
    newRules.splice(dropIndex, 0, draggedItem);
    onChange(newRules);
  };

  const testRule = (rule: ConditionRule) => {
    if (!onTestRule) return;

    // The actual test is performed on the backend.
    // We just need to trigger the onTestRule function and store results.
    const testResult = { success: true, result: true }; // Mock result for now
    setTestResults((prev) => ({ ...prev, [rule.id]: testResult }));
    onTestRule(rule.id, testResult);
  };

  // JSON parsing cache to avoid repeated parsing

  const getOperatorsForField = (fieldPath: string) => {
    const field = availableFields.find((f) => f.path === fieldPath);
    if (!field) return OPERATORS.string;

    switch (field.type) {
      case 'number':
        return OPERATORS.number;
      case 'boolean':
        return OPERATORS.boolean;
      case 'array':
        return OPERATORS.array;
      default:
        return OPERATORS.string;
    }
  };

  return (
    <div className="condition-builder space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-100 flex items-center space-x-2">
            <span>⚖️</span>
            <span>Condition Rules</span>
          </h3>
          <p className="text-sm text-gray-400">
            Define conditions to route data through different paths
          </p>
        </div>
        <button
          onClick={(e) => {
            e.preventDefault();
            addRule();
          }}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center space-x-2"
        >
          <span>+</span>
          <span>Add Rule</span>
        </button>
      </div>

      {/* Rules List */}
      <div className="space-y-3">
        {rules.map((rule, index) => (
          <ConditionRuleCard
            key={rule.id}
            rule={rule}
            index={index}
            availableFields={availableFields}
            operators={getOperatorsForField(rule.field)}
            testResult={testResults[rule.id]}
            onUpdate={(updates) => updateRule(rule.id, updates)}
            onDelete={() => deleteRule(rule.id)}
            onTest={() => testRule(rule)}
            onMove={moveRule}
          />
        ))}
      </div>

      {/* Summary */}
      {rules.length > 0 && (
        <div className="bg-blue-900/20 border border-blue-600/30 rounded-lg p-3">
          <div className="flex items-center space-x-2 text-sm text-blue-200">
            <span>📊</span>
            <span>
              {rules.filter((r) => r.enabled).length} active rule
              {rules.filter((r) => r.enabled).length !== 1 ? 's' : ''}
              with {rules.filter((r) => r.enabled).length} possible outputs
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

// Individual condition rule card component
const ConditionRuleCard: React.FC<{
  rule: ConditionRule;
  index: number;
  availableFields: Array<{
    name: string;
    type: string;
    example?: any;
    path: string;
  }>;
  operators: Array<{
    value: string;
    label: string;
    symbol: string;
    example: string;
  }>;
  testResult?: any;
  onUpdate: (updates: Partial<ConditionRule>) => void;
  onDelete: () => void;
  onTest: () => void;
  onMove: (dragIndex: number, dropIndex: number) => void;
}> = ({ rule, index, availableFields, operators, testResult, onUpdate, onDelete, onTest }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [localOutputName, setLocalOutputName] = useState(rule.outputName);

  // Sync local state with prop changes
  React.useEffect(() => {
    setLocalOutputName(rule.outputName);
  }, [rule.outputName]);

  const selectedOperator = operators.find((op) => op.value === rule.operator) || operators[0];
  const selectedField = availableFields.find((f) => f.path === rule.field);
  const needsValue = !['is_empty', 'is_not_empty', 'is_null', 'is_true', 'is_false'].includes(
    rule.operator
  );

  // Ensure operator is valid for current field type - reset if not available
  React.useEffect(() => {
    if (rule.operator && !operators.find((op) => op.value === rule.operator)) {
      onUpdate({ operator: operators[0]?.value || 'equals' });
    }
  }, [rule.operator, operators, onUpdate]);

  return (
    <div
      className={`bg-gray-800 rounded-lg border-2 transition-all ${
        rule.enabled ? 'border-gray-600' : 'border-gray-700 opacity-60'
      }`}
    >
      {/* Header */}
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button className="text-gray-400 hover:text-gray-300 cursor-grab" title="Drag to reorder">
            ⋮⋮
          </button>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center space-x-2 text-gray-200 hover:text-white"
          >
            <span className={`transform transition-transform ${isExpanded ? 'rotate-90' : ''}`}>
              ▶
            </span>
            <span className="font-medium">
              Rule {index + 1}: {rule.field || 'Choose field'} {selectedOperator?.symbol}{' '}
              {rule.value || '?'}
            </span>
          </button>

          {testResult && (
            <div className="flex items-center space-x-2">
              <div
                className={`px-2 py-1 rounded text-xs ${
                  testResult.data?.result?.data?.conditionMet
                    ? 'bg-green-800 text-green-200'
                    : 'bg-red-800 text-red-200'
                }`}
              >
                {testResult.data?.result?.data?.conditionMet ? 'Success' : 'Failed'}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={rule.enabled}
              onChange={(e) => onUpdate({ enabled: e.target.checked })}
              className="w-4 h-4 text-blue-600 rounded"
            />
            <span className="text-sm text-gray-300">Enabled</span>
          </label>

          <button
            onClick={onTest}
            disabled={!rule.field || !rule.operator}
            className="px-3 py-1 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded text-sm transition-colors"
            title="Test this rule against input data"
          >
            🧪 Test
          </button>

          <button
            onClick={onDelete}
            className="p-1 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded"
            title="Delete rule and remove handle"
          >
            🗑️
          </button>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-gray-700 p-4 space-y-4">
          {/* Condition Configuration */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Smart Field Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Field Path
                <span className="ml-1 text-xs text-blue-400">(supports dot notation)</span>
              </label>
              <SmartFieldSelector
                value={rule.field}
                onChange={(value) => onUpdate({ field: value })}
                availableFields={availableFields}
              />
            </div>

            {/* Operator Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Operator</label>
              <select
                aria-label="operator selection"
                value={
                  operators.find((op) => op.value === rule.operator)
                    ? rule.operator
                    : operators[0]?.value || 'equals'
                }
                onChange={(e) => onUpdate({ operator: e.target.value })}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-gray-100 focus:border-blue-500"
              >
                {operators.map((op) => (
                  <option key={op.value} value={op.value}>
                    {op.symbol} {op.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Enhanced Value Input */}
            {needsValue && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Value
                  <span className="ml-1 text-xs text-green-400">(auto-detects type)</span>
                </label>
                <SmartValueInput
                  value={rule.value}
                  onChange={(value) => onUpdate({ value })}
                  valueType={rule.valueType}
                  onValueTypeChange={(valueType) => onUpdate({ valueType })}
                  operator={rule.operator}
                  fieldType={selectedField?.type || 'string'}
                  placeholder={selectedOperator?.example || 'Enter custom value...'}
                />
                <button
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="mt-2 px-3 py-1 bg-gray-600 hover:bg-gray-500 rounded text-gray-200 text-sm flex items-center space-x-1"
                  title="Advanced options"
                >
                  <span>⚙️</span>
                  <span>Advanced</span>
                </button>
              </div>
            )}
          </div>

          {/* Output Configuration */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Output Handle
                <span className="ml-1 text-xs text-green-400">(select existing or create new)</span>
              </label>

              {/* All handle names are now editable by users */}
              <div className="space-y-2">
                <input
                  type="text"
                  value={localOutputName}
                  onChange={(e) => {
                    const newValue = e.target.value;
                    setLocalOutputName(newValue);
                    onUpdate({ outputName: newValue });
                  }}
                  placeholder="e.g. true, false, urgent, spam, important"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-gray-100 placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  autoComplete="off"
                />

                {/* Quick suggestions for handle names */}
                <div className="flex flex-wrap gap-1">
                  {[
                    'true',
                    'false',
                    'urgent',
                    'spam',
                    'important',
                    'approved',
                    'rejected',
                    'high_priority',
                  ].map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => {
                        setLocalOutputName(suggestion);
                        onUpdate({ outputName: suggestion });
                      }}
                      className="px-2 py-1 text-xs bg-gray-600 hover:bg-gray-500 text-gray-300 rounded transition-colors"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-1 text-xs text-gray-400">
                💡 This routes data to the selected output handle when condition matches
              </div>
            </div>
          </div>

          {/* Test Results */}
          {testResult && (
            <div className="bg-gray-750 rounded p-3 border border-gray-600">
              <div className="text-sm font-medium text-gray-200 mb-2">Test Results:</div>
              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-xs">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      testResult.data?.result?.data?.conditionMet ? 'bg-green-400' : 'bg-red-400'
                    }`}
                  ></span>
                  <span className="text-gray-300">{testResult.data?.result?.data?.message}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Smart Value Input Component with type detection and flexible parsing
const SmartValueInput: React.FC<{
  value: any;
  onChange: (value: any) => void;
  valueType: 'fixed' | 'expression';
  onValueTypeChange: (type: 'fixed' | 'expression') => void;
  operator: string;
  fieldType?: string;
  placeholder: string;
}> = ({ value, onChange, valueType, onValueTypeChange, operator, fieldType, placeholder }) => {
  const [inputValue, setInputValue] = useState(String(value || ''));
  const [detectedType, setDetectedType] = useState<string>('string');

  // Update input when external value changes
  useEffect(() => {
    setInputValue(String(value || ''));
  }, [value]);

  // Detect value type from input
  const detectValueType = (input: string): { type: string; parsedValue: any } => {
    const trimmed = input.trim();

    // Empty/null values
    if (!trimmed) return { type: 'string', parsedValue: '' };

    // Boolean values
    if (trimmed.toLowerCase() === 'true') return { type: 'boolean', parsedValue: true };
    if (trimmed.toLowerCase() === 'false') return { type: 'boolean', parsedValue: false };
    if (trimmed.toLowerCase() === 'null') return { type: 'null', parsedValue: null };

    // Number values - using safer regex pattern
    const integerPattern = /^-?\d+$/;
    const floatPattern = /^-?\d*\.\d+$/;
    if (integerPattern.test(trimmed)) return { type: 'number', parsedValue: parseInt(trimmed, 10) };
    if (floatPattern.test(trimmed)) return { type: 'number', parsedValue: parseFloat(trimmed) };

    // JSON values
    if (
      (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
      (trimmed.startsWith('[') && trimmed.endsWith(']'))
    ) {
      try {
        const parsed = JSON.parse(trimmed);
        return {
          type: Array.isArray(parsed) ? 'array' : 'object',
          parsedValue: parsed,
        };
      } catch {
        return { type: 'string', parsedValue: trimmed };
      }
    }

    // Quoted strings (remove quotes for storage)
    if (
      (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
      (trimmed.startsWith("'") && trimmed.endsWith("'"))
    ) {
      return { type: 'string', parsedValue: trimmed.slice(1, -1) };
    }

    // Regex patterns
    if (trimmed.startsWith('/') && trimmed.includes('/')) {
      return { type: 'regex', parsedValue: trimmed };
    }

    // Default to string
    return { type: 'string', parsedValue: trimmed };
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);

    const { type, parsedValue } = detectValueType(newValue);
    setDetectedType(type);
    onChange(parsedValue);
  };

  const handleValueTypeToggle = () => {
    const newType = valueType === 'fixed' ? 'expression' : 'fixed';
    onValueTypeChange(newType);
  };

  const getTypeColor = (type: string): string => {
    switch (type) {
      case 'string':
        return 'text-green-400';
      case 'number':
        return 'text-yellow-400';
      case 'boolean':
        return 'text-purple-400';
      case 'array':
        return 'text-blue-400';
      case 'object':
        return 'text-cyan-400';
      case 'regex':
        return 'text-red-400';
      case 'null':
        return 'text-gray-400';
      default:
        return 'text-gray-400';
    }
  };

  const getPlaceholderExamples = (): string[] => {
    // Boolean-specific operators
    if (['is_true', 'is_false'].includes(operator)) {
      return []; // These operators don't need values
    }

    // For boolean fields, prioritize boolean values
    if (fieldType === 'boolean') {
      switch (operator) {
        case 'equals':
        case 'not_equals':
          return ['true', 'false', 'null'];
        default:
          return ['true', 'false'];
      }
    }

    // Default behavior for other types
    switch (operator) {
      case 'equals':
      case 'not_equals':
        return ['"urgent"', '42', 'true', 'false'];
      case 'contains':
      case 'not_contains':
        return ['"important"', '"@company.com"'];
      case 'starts_with':
        return ['"Re:"', '"[URGENT]"'];
      case 'ends_with':
        return ['".pdf"', '"@gmail.com"'];
      case 'greater':
      case 'less':
        return ['100', '3.14', '0'];
      case 'regex':
        return ['regex_urgent_pattern', 'regex_date_pattern'];
      default:
        return ['"custom value"', '42', 'true'];
    }
  };

  return (
    <div className="space-y-2">
      {/* Main input with type detection */}
      <div className="relative">
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          placeholder={placeholder}
          className="w-full px-3 py-2 pr-20 bg-gray-700 border border-gray-600 rounded text-gray-100 placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />

        {/* Type indicator and toggle */}
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
          <span
            className={`text-xs px-1.5 py-0.5 rounded font-mono ${getTypeColor(detectedType)} bg-gray-600`}
          >
            {detectedType}
          </span>
          <button
            type="button"
            onClick={handleValueTypeToggle}
            className={`text-xs px-1.5 py-0.5 rounded transition-colors ${
              valueType === 'expression'
                ? 'bg-purple-600 text-purple-100'
                : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
            }`}
            title={
              valueType === 'expression' ? 'Using expression mode' : 'Switch to expression mode'
            }
          >
            {valueType === 'expression' ? 'fx' : 'fx'}
          </button>
        </div>
      </div>

      {/* Type hints and examples */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex flex-wrap gap-1">
          {getPlaceholderExamples().map((example, index) => (
            <button
              key={index}
              type="button"
              onClick={() => {
                setInputValue(example);
                const { type, parsedValue } = detectValueType(example);
                setDetectedType(type);
                onChange(parsedValue);
              }}
              className="px-2 py-0.5 bg-gray-600 hover:bg-gray-500 rounded text-gray-300 transition-colors"
            >
              {example}
            </button>
          ))}
        </div>

        {valueType === 'expression' && (
          <div className="text-purple-400">{'Expression mode - use {{ }} for dynamic values'}</div>
        )}
      </div>

      {/* Value type explanation */}
      <div className="text-xs text-gray-500">
        <div className="flex items-center space-x-2">
          <span>💡</span>
          <span>
            {detectedType === 'string' && 'Text value - wrap in quotes for exact matching'}
            {detectedType === 'number' && 'Numeric value - for mathematical comparisons'}
            {detectedType === 'boolean' &&
              (fieldType === 'boolean'
                ? 'Boolean field - use true/false values'
                : 'Boolean value - true or false')}
            {detectedType === 'array' && 'Array value - JSON format'}
            {detectedType === 'object' && 'Object value - JSON format'}
            {detectedType === 'regex' && 'Regular expression pattern'}
            {detectedType === 'null' && 'Null value'}
          </span>
        </div>
      </div>
    </div>
  );
};

// Smart Field Selector Component with autocomplete and manual entry
const SmartFieldSelector: React.FC<{
  value: string;
  onChange: (value: string) => void;
  availableFields: Array<{
    name: string;
    type: string;
    example?: any;
    path: string;
    depth?: number;
    parentType?: string;
    nodeSource?: string;
    isVirtual?: boolean;
  }>;
}> = ({ value, onChange, availableFields }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const [filteredFields, setFilteredFields] = useState(availableFields);

  // Update input when external value changes
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Filter fields based on input
  useEffect(() => {
    if (!inputValue) {
      setFilteredFields(availableFields);
    } else {
      const filtered = availableFields.filter(
        (field) =>
          field.path.toLowerCase().includes(inputValue.toLowerCase()) ||
          field.name.toLowerCase().includes(inputValue.toLowerCase())
      );
      setFilteredFields(filtered);
    }
  }, [inputValue, availableFields]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    onChange(newValue);
    setIsDropdownOpen(true);
  };

  const handleFieldSelect = (field: any) => {
    setInputValue(field.path);
    onChange(field.path);
    setIsDropdownOpen(false);
  };

  const handleInputFocus = () => {
    setIsDropdownOpen(true);
  };

  const handleInputBlur = () => {
    // Delay closing to allow field selection
    setTimeout(() => setIsDropdownOpen(false), 200);
  };

  // Get field info for the current value
  const selectedField = availableFields.find((f) => f.path === value);

  return (
    <div className="relative">
      {/* Input with dropdown toggle */}
      <div className="relative">
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          placeholder="Type field path (e.g., user.email) or select below"
          className="w-full px-3 py-2 pr-10 bg-gray-700 border border-gray-600 rounded text-gray-100 placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />
        <button
          type="button"
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
        >
          <span className={`transform transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}>
            ▼
          </span>
        </button>
      </div>

      {/* Selected field info */}
      {selectedField && (
        <div className="mt-2 p-2 bg-blue-900/20 border border-blue-600/30 rounded text-xs">
          <div className="flex items-center space-x-2">
            <span className="text-blue-400 font-medium">{selectedField.type}</span>
            {selectedField.nodeSource && (
              <span className="text-gray-400">from {selectedField.nodeSource}</span>
            )}
          </div>
          {selectedField.example !== undefined && (
            <div className="mt-1 text-gray-300">
              Example:{' '}
              <code className="bg-gray-700 px-1 rounded">
                {typeof selectedField.example === 'string' && selectedField.example.length > 50
                  ? `${selectedField.example.substring(0, 50)}...`
                  : JSON.stringify(selectedField.example)}
              </code>
            </div>
          )}
        </div>
      )}

      {/* Dropdown with field suggestions */}
      {isDropdownOpen && filteredFields.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-gray-700 border border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          <div className="p-2 text-xs text-gray-400 border-b border-gray-600">
            {filteredFields.length} field
            {filteredFields.length !== 1 ? 's' : ''} available
          </div>

          {filteredFields.map((field, index) => (
            <button
              key={`${field.path}-${index}`}
              type="button"
              onClick={() => handleFieldSelect(field)}
              className="w-full px-3 py-2 text-left hover:bg-gray-600 transition-colors focus:bg-gray-600 focus:outline-none"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-gray-100 truncate">{field.path}</div>
                  <div className="text-xs text-gray-400 flex items-center space-x-2">
                    <span
                      className={`px-1.5 py-0.5 rounded text-xs ${
                        field.type === 'json-string'
                          ? 'bg-purple-600 text-purple-200'
                          : field.isVirtual
                            ? 'bg-blue-600 text-blue-200'
                            : 'bg-gray-600'
                      }`}
                    >
                      {field.type === 'json-string'
                        ? 'JSON'
                        : field.isVirtual
                          ? `${field.type} (parsed)`
                          : field.type}
                    </span>
                    {field.isVirtual && <span className="text-blue-400 text-xs">📋 Virtual</span>}
                    {field.nodeSource && <span>from {field.nodeSource}</span>}
                  </div>
                </div>
                {field.depth && field.depth > 0 && (
                  <div className="ml-2 text-xs flex items-center">
                    <span
                      className={
                        field.parentType === 'json-string' ? 'text-purple-400' : 'text-gray-400'
                      }
                    >
                      {field.parentType === 'json-string' && field.isVirtual ? '🔗' : ''}
                      {'└'.repeat(Math.min(field.depth || 0, 3))}
                    </span>
                  </div>
                )}
              </div>
              {field.example !== undefined && (
                <div className="mt-1 text-xs text-gray-500 truncate">
                  {typeof field.example === 'string' && field.example.length > 60
                    ? `${field.example.substring(0, 60)}...`
                    : JSON.stringify(field.example)}
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {/* No fields message */}
      {isDropdownOpen && filteredFields.length === 0 && inputValue && (
        <div className="absolute z-50 w-full mt-1 bg-gray-700 border border-gray-600 rounded-lg shadow-lg p-4 text-center">
          <div className="text-sm text-gray-400">No matching fields found</div>
          <div className="text-xs text-gray-500 mt-1">
            You can still use custom paths like "user.profile.email"
          </div>
        </div>
      )}
    </div>
  );
};

// Note: Condition evaluation is now handled by the backend
// The utility functions are implemented within the component scope

export default ConditionBuilder;
