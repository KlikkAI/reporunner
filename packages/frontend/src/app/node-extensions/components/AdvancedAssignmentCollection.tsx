/**
 * Advanced Assignment Collection Component - n8n EditFields Exact Match
 * Sophisticated field assignment interface with drag & drop, auto-type detection,
 * bulk operations, and comprehensive expression support
 */

import {
  AppstoreAddOutlined,
  CheckCircleOutlined,
  ClearOutlined,
  CodeOutlined,
  DeleteOutlined,
  DragOutlined,
  EyeOutlined,
  InfoCircleOutlined,
  PlusOutlined,
  SettingOutlined,
  ThunderboltOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Alert,
  Badge,
  Button,
  Card,
  Col,
  Collapse,
  Dropdown,
  Empty,
  Input,
  Menu,
  Modal,
  Progress,
  Row,
  Select,
  Space,
  Switch,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import type React from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ExpressionUtils } from '../../../core/utils/expressionEvaluator';
import {
  AdvancedTypeValidator,
  AssignmentValidator,
  TypeInferenceEngine,
} from '../../../core/utils/typeValidation';

const { Text, Title } = Typography;
const { Option } = Select;
const { Panel } = Collapse;

// Enhanced Assignment Interface
interface IAdvancedAssignment {
  id: string;
  name: string;
  type: 'stringValue' | 'numberValue' | 'booleanValue' | 'arrayValue' | 'objectValue' | 'dateValue';
  value: any;
  expression?: boolean;
  validation?: {
    valid: boolean;
    error?: string;
    warnings?: string[];
  };
  inferredType?: string;
  description?: string;
}

interface AdvancedAssignmentCollectionProps {
  assignments: IAdvancedAssignment[];
  onChange: (assignments: IAdvancedAssignment[]) => void;
  inputData?: any[];
  disabled?: boolean;

  // Advanced options
  autoDetectTypes?: boolean;
  allowedTypes?: string[];
  showTypeSelector?: boolean;
  enableBulkOperations?: boolean;
  enableExpressionEditor?: boolean;
  enableValidation?: boolean;

  // Context for expression evaluation
  expressionContext?: any;

  // Callbacks
  onAssignmentTest?: (assignment: IAdvancedAssignment) => void;
  onBulkTest?: () => void;
}

// Individual Assignment Item Component
const AdvancedAssignmentItem: React.FC<{
  assignment: IAdvancedAssignment;
  index: number;
  onUpdate: (id: string, updates: Partial<IAdvancedAssignment>) => void;
  onDelete: (id: string) => void;
  onTest?: (assignment: IAdvancedAssignment) => void;
  disabled?: boolean;
  autoDetectTypes?: boolean;
  allowedTypes?: string[];
  showTypeSelector?: boolean;
  enableExpressionEditor?: boolean;
  enableValidation?: boolean;
  expressionContext?: any;
}> = ({
  assignment,
  index,
  onUpdate,
  onDelete,
  onTest,
  disabled,
  autoDetectTypes = true,
  allowedTypes = [
    'stringValue',
    'numberValue',
    'booleanValue',
    'arrayValue',
    'objectValue',
    'dateValue',
  ],
  showTypeSelector = true,
  enableExpressionEditor = true,
  enableValidation = true,
  expressionContext,
}) => {
  const [localExpanded, setLocalExpanded] = useState(false);
  const [validationStatus, setValidationStatus] = useState<
    'idle' | 'validating' | 'valid' | 'invalid'
  >('idle');
  const [showExpressionHelp, setShowExpressionHelp] = useState(false);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: assignment.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // Auto-detect type when value changes
  useEffect(() => {
    if (autoDetectTypes && assignment.value && assignment.value !== '') {
      const inferredType = TypeInferenceEngine.inferType(assignment.value);
      if (inferredType !== assignment.type) {
        onUpdate(assignment.id, {
          inferredType,
          type: inferredType as
            | 'stringValue'
            | 'numberValue'
            | 'booleanValue'
            | 'arrayValue'
            | 'objectValue'
            | 'dateValue', // Auto-apply inferred type
        });
      }
    }
  }, [assignment.value, autoDetectTypes, assignment.id, assignment.type, onUpdate]);

  // Validate assignment
  useEffect(() => {
    if (enableValidation && assignment.name && assignment.value !== '') {
      setValidationStatus('validating');

      const validator = new AssignmentValidator({
        ignoreConversionErrors: true,
        strictMode: false,
      });
      const result = validator.validateAssignment(assignment, expressionContext);

      setValidationStatus(result.valid ? 'valid' : 'invalid');
      onUpdate(assignment.id, {
        validation: {
          valid: result.valid,
          error: result.error,
          warnings: result.warnings,
        },
      });
    }
  }, [assignment, enableValidation, expressionContext, onUpdate]);

  const handleFieldChange = useCallback(
    (field: keyof IAdvancedAssignment, value: any) => {
      onUpdate(assignment.id, { [field]: value });
    },
    [assignment.id, onUpdate]
  );

  const handleTypeChange = useCallback(
    (newType: string) => {
      // Auto-convert value to match new type if possible
      try {
        const validator = new AdvancedTypeValidator({
          ignoreConversionErrors: true,
          strictMode: false,
        });
        const convertedValue = validator.convertToType(assignment.value, newType);
        onUpdate(assignment.id, {
          type: newType as any,
          value: convertedValue,
        });
      } catch {
        onUpdate(assignment.id, { type: newType as any });
      }
    },
    [assignment.id, assignment.value, onUpdate]
  );

  const isExpression = ExpressionUtils.hasExpressions(assignment.value);

  const renderValueInput = () => {
    const commonProps = {
      value: assignment.value,
      onChange: (e: any) =>
        handleFieldChange('value', typeof e === 'object' ? e.target?.value || e : e),
      disabled,
      placeholder: getPlaceholderForType(assignment.type),
    };

    switch (assignment.type) {
      case 'stringValue':
        return (
          <Space.Compact style={{ width: '100%' }}>
            <Input
              {...commonProps}
              addonBefore={
                isExpression ? <ThunderboltOutlined style={{ color: '#1890ff' }} /> : null
              }
            />
            {enableExpressionEditor && (
              <Button
                icon={<CodeOutlined />}
                onClick={() => setShowExpressionHelp(true)}
                title="Expression Help"
                type="text"
              />
            )}
          </Space.Compact>
        );

      case 'numberValue':
        return (
          <Input
            {...commonProps}
            type="number"
            addonBefore={isExpression ? <ThunderboltOutlined style={{ color: '#1890ff' }} /> : null}
          />
        );

      case 'booleanValue':
        return (
          <Select
            value={assignment.value}
            onChange={(value) => handleFieldChange('value', value)}
            disabled={disabled}
            style={{ width: '100%' }}
          >
            <Option value={true}>True</Option>
            <Option value={false}>False</Option>
            {isExpression && (
              <Option value={assignment.value}>Expression: {assignment.value}</Option>
            )}
          </Select>
        );

      case 'arrayValue':
        return (
          <Input.TextArea
            {...commonProps}
            rows={3}
            placeholder='["item1", "item2"] or {{ $json.arrayField }}'
          />
        );

      case 'objectValue':
        return (
          <Input.TextArea
            {...commonProps}
            rows={3}
            placeholder='{"key": "value"} or {{ $json.objectField }}'
          />
        );

      case 'dateValue':
        return (
          <Input
            {...commonProps}
            placeholder="2024-01-01 or {{ $json.dateField }}"
            addonBefore={<span>📅</span>}
          />
        );

      default:
        return <Input {...commonProps} />;
    }
  };

  const getValidationIcon = () => {
    switch (validationStatus) {
      case 'validating':
        return <Progress type="circle" size={16} percent={50} showInfo={false} />;
      case 'valid':
        return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
      case 'invalid':
        return <WarningOutlined style={{ color: '#ff4d4f' }} />;
      default:
        return null;
    }
  };

  return (
    <>
      <Card
        ref={setNodeRef}
        style={style}
        size="small"
        className={`assignment-item ${isDragging ? 'dragging' : ''}`}
        bodyStyle={{ padding: '16px' }}
        extra={
          <Space>
            {enableValidation && getValidationIcon()}
            <Dropdown
              overlay={
                <Menu>
                  <Menu.Item
                    key="test"
                    icon={<EyeOutlined />}
                    onClick={() => onTest?.(assignment)}
                    disabled={!(assignment.name && assignment.value)}
                  >
                    Test Assignment
                  </Menu.Item>
                  <Menu.Item
                    key="expand"
                    icon={<SettingOutlined />}
                    onClick={() => setLocalExpanded(!localExpanded)}
                  >
                    {localExpanded ? 'Collapse' : 'Advanced Options'}
                  </Menu.Item>
                  <Menu.Divider />
                  <Menu.Item
                    key="delete"
                    icon={<DeleteOutlined />}
                    onClick={() => onDelete(assignment.id)}
                    danger
                  >
                    Delete
                  </Menu.Item>
                </Menu>
              }
            >
              <Button type="text" size="small" icon={<SettingOutlined />} />
            </Dropdown>
          </Space>
        }
      >
        {/* Header with drag handle and assignment info */}
        <div style={{ marginBottom: '12px' }}>
          <Row align="middle" justify="space-between">
            <Col>
              <Space align="center">
                <div {...attributes} {...listeners} style={{ cursor: 'grab', color: '#8c8c8c' }}>
                  <DragOutlined />
                </div>
                <Badge count={index + 1} size="small" style={{ backgroundColor: '#1890ff' }}>
                  <Text strong style={{ fontSize: '13px' }}>
                    Assignment
                  </Text>
                </Badge>
                {assignment.inferredType && assignment.inferredType !== assignment.type && (
                  <Tag color="blue">Auto: {assignment.inferredType.replace('Value', '')}</Tag>
                )}
                {isExpression && (
                  <Tag color="purple">
                    <ThunderboltOutlined /> Expression
                  </Tag>
                )}
              </Space>
            </Col>
          </Row>
        </div>

        {/* Main fields */}
        <Space direction="vertical" style={{ width: '100%' }} size="small">
          {/* Field Name with smart suggestions */}
          <div>
            <Text
              type="secondary"
              style={{
                fontSize: '11px',
                marginBottom: '4px',
                display: 'block',
              }}
            >
              Field Name
              <Tooltip title="Use dot notation for nested objects (e.g., user.profile.name)">
                <InfoCircleOutlined style={{ marginLeft: '4px', fontSize: '10px' }} />
              </Tooltip>
            </Text>
            <Input
              placeholder="e.g. user.name, address.city, items[0].value"
              value={assignment.name}
              onChange={(e) => handleFieldChange('name', e.target.value)}
              disabled={disabled}
            />
          </div>

          {/* Field Type with auto-detection */}
          {showTypeSelector && (
            <div>
              <Text
                type="secondary"
                style={{
                  fontSize: '11px',
                  marginBottom: '4px',
                  display: 'block',
                }}
              >
                Field Type
                {autoDetectTypes && <Tag style={{ marginLeft: '8px' }}>Auto-detect</Tag>}
              </Text>
              <Select
                value={assignment.type}
                onChange={handleTypeChange}
                style={{ width: '100%' }}
                disabled={disabled}
              >
                {allowedTypes.map((type) => (
                  <Option key={type} value={type}>
                    <Space>
                      {getTypeIcon(type)}
                      {formatTypeName(type)}
                    </Space>
                  </Option>
                ))}
              </Select>
            </div>
          )}

          {/* Field Value with type-specific input */}
          <div>
            <Text
              type="secondary"
              style={{
                fontSize: '11px',
                marginBottom: '4px',
                display: 'block',
              }}
            >
              Value
              {isExpression && (
                <Space style={{ marginLeft: '8px' }}>
                  <Tag color="purple">Expression Mode</Tag>
                </Space>
              )}
            </Text>
            {renderValueInput()}
          </div>

          {/* Validation feedback */}
          {assignment.validation && !assignment.validation.valid && (
            <Alert message={assignment.validation.error} type="error" showIcon />
          )}

          {assignment.validation?.warnings && assignment.validation.warnings.length > 0 && (
            <Alert
              message={`Warnings: ${assignment.validation.warnings.join(', ')}`}
              type="warning"
              showIcon
            />
          )}

          {/* Advanced options (collapsible) */}
          {localExpanded && (
            <Collapse size="small" ghost>
              <Panel header="Advanced Options" key="advanced">
                <Space direction="vertical" style={{ width: '100%' }} size="small">
                  <div>
                    <Text type="secondary" style={{ fontSize: '11px' }}>
                      Description
                    </Text>
                    <Input
                      placeholder="Optional description for this assignment"
                      value={assignment.description || ''}
                      onChange={(e) => handleFieldChange('description', e.target.value)}
                      disabled={disabled}
                    />
                  </div>

                  <div>
                    <Switch
                      size="small"
                      checked={assignment.expression}
                      onChange={(checked) => handleFieldChange('expression', checked)}
                      disabled={disabled}
                    />
                    <Text style={{ marginLeft: '8px', fontSize: '12px' }}>
                      Force Expression Mode
                    </Text>
                  </div>
                </Space>
              </Panel>
            </Collapse>
          )}
        </Space>
      </Card>

      {/* Expression Help Modal */}
      <Modal
        title="Expression Help"
        open={showExpressionHelp}
        onCancel={() => setShowExpressionHelp(false)}
        footer={null}
        width={700}
      >
        <ExpressionHelpContent context={expressionContext} />
      </Modal>
    </>
  );
};

// Expression Help Component
const ExpressionHelpContent: React.FC<{ context?: any }> = () => (
  <Space direction="vertical" style={{ width: '100%' }}>
    <Alert
      message="Expression Syntax"
      description="Use {{ }} to wrap expressions. You can access input data and perform operations."
      type="info"
      showIcon
    />

    <Collapse>
      <Panel header="Common Expressions" key="common">
        <ul style={{ paddingLeft: '20px' }}>
          <li>
            <code>{`{{ $json.fieldName }}`}</code> - Access input field
          </li>
          <li>
            <code>{`{{ $json.user.name }}`}</code> - Access nested field
          </li>
          <li>
            <code>{`{{ $json.items[0].value }}`}</code> - Access array element
          </li>
          <li>
            <code>{`{{ $json.price * 1.2 }}`}</code> - Mathematical operations
          </li>
          <li>
            <code>{`{{ $json.status === 'active' ? 'enabled' : 'disabled' }}`}</code> - Conditional
            logic
          </li>
        </ul>
      </Panel>
      <Panel header="Built-in Functions" key="functions">
        <ul style={{ paddingLeft: '20px' }}>
          <li>
            <code>{`{{ now() }}`}</code> - Current date and time
          </li>
          <li>
            <code>{`{{ today() }}`}</code> - Current date (no time)
          </li>
          <li>
            <code>{`{{ upper($json.name) }}`}</code> - Convert to uppercase
          </li>
          <li>
            <code>{`{{ lower($json.name) }}`}</code> - Convert to lowercase
          </li>
          <li>
            <code>{`{{ trim($json.name) }}`}</code> - Remove whitespace
          </li>
        </ul>
      </Panel>
    </Collapse>
  </Space>
);

// Main Advanced Assignment Collection Component
const AdvancedAssignmentCollection: React.FC<AdvancedAssignmentCollectionProps> = ({
  assignments,
  onChange,
  inputData = [],
  disabled = false,
  autoDetectTypes = true,
  allowedTypes = [
    'stringValue',
    'numberValue',
    'booleanValue',
    'arrayValue',
    'objectValue',
    'dateValue',
  ],
  showTypeSelector = true,
  enableBulkOperations = true,
  enableExpressionEditor = true,
  enableValidation = true,
  expressionContext,
  onAssignmentTest,
  onBulkTest,
}) => {
  const [draggedAssignment, setDraggedAssignment] = useState<IAdvancedAssignment | null>(null);
  const [bulkOperationProgress, setBulkOperationProgress] = useState<{
    visible: boolean;
    current: number;
    total: number;
    operation: string;
  } | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const generateId = useCallback(() => {
    return `assignment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  const handleAddAssignment = useCallback(() => {
    const newAssignment: IAdvancedAssignment = {
      id: generateId(),
      name: '',
      type: 'stringValue',
      value: '',
    };
    onChange([...assignments, newAssignment]);
  }, [assignments, generateId, onChange]);

  const handleUpdateAssignment = useCallback(
    (id: string, updates: Partial<IAdvancedAssignment>) => {
      const updatedAssignments = assignments.map((assignment) =>
        assignment.id === id ? { ...assignment, ...updates } : assignment
      );
      onChange(updatedAssignments);
    },
    [assignments, onChange]
  );

  const handleDeleteAssignment = useCallback(
    (id: string) => {
      const filteredAssignments = assignments.filter((assignment) => assignment.id !== id);
      onChange(filteredAssignments);
    },
    [assignments, onChange]
  );

  const handleClearAll = useCallback(() => {
    onChange([]);
  }, [onChange]);

  const handleAddAllFields = useCallback(async () => {
    if (!inputData?.length) {
      return;
    }

    setBulkOperationProgress({
      visible: true,
      current: 0,
      total: 0,
      operation: 'Analyzing input data...',
    });

    try {
      // Get all unique field names from input data
      const fieldNames = new Set<string>();

      for (let i = 0; i < Math.min(inputData.length, 100); i++) {
        // Sample first 100 items
        const item = inputData[i];
        if (item.json && typeof item.json === 'object') {
          extractFieldNames(item.json, '', fieldNames, 3); // Max depth 3
        }

        setBulkOperationProgress({
          visible: true,
          current: i + 1,
          total: Math.min(inputData.length, 100),
          operation: 'Analyzing input data...',
        });

        // Yield control periodically
        if (i % 10 === 0) {
          await new Promise((resolve) => setTimeout(resolve, 0));
        }
      }

      setBulkOperationProgress({
        visible: true,
        current: 0,
        total: fieldNames.size,
        operation: 'Creating assignments...',
      });

      // Create assignments for each field with auto-detected type
      const newAssignments: IAdvancedAssignment[] = [];
      const fieldArray = Array.from(fieldNames);

      for (let i = 0; i < fieldArray.length; i++) {
        const fieldName = fieldArray[i];

        // Auto-detect type from sample data
        let detectedType: string = 'stringValue';
        for (const item of inputData.slice(0, 10)) {
          // Check first 10 items
          if (item.json) {
            const value = getNestedValue(item.json, fieldName);
            if (value !== undefined) {
              detectedType = TypeInferenceEngine.inferType(value);
              break;
            }
          }
        }

        newAssignments.push({
          id: generateId(),
          name: fieldName,
          type: detectedType as any,
          value: `{{ $json.${fieldName} }}`, // Start with expression reference
          inferredType: detectedType,
        });

        setBulkOperationProgress({
          visible: true,
          current: i + 1,
          total: fieldNames.size,
          operation: 'Creating assignments...',
        });

        // Yield control periodically
        if (i % 5 === 0) {
          await new Promise((resolve) => setTimeout(resolve, 0));
        }
      }

      // Merge with existing assignments (avoid duplicates)
      const existingNames = new Set(assignments.map((a) => a.name));
      const filteredNewAssignments = newAssignments.filter((a) => !existingNames.has(a.name));

      onChange([...assignments, ...filteredNewAssignments]);
    } finally {
      setBulkOperationProgress(null);
    }
  }, [inputData, assignments, generateId, onChange]);

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const assignment = assignments.find((a) => a.id === event.active.id);
      setDraggedAssignment(assignment || null);
    },
    [assignments]
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      setDraggedAssignment(null);

      if (active.id !== over?.id) {
        const oldIndex = assignments.findIndex((item) => item.id === active.id);
        const newIndex = assignments.findIndex((item) => item.id === over?.id);
        const reorderedAssignments = arrayMove(assignments, oldIndex, newIndex);
        onChange(reorderedAssignments);
      }
    },
    [assignments, onChange]
  );

  const validAssignments = useMemo(
    () => assignments.filter((a) => a.validation?.valid !== false),
    [assignments]
  );

  const invalidAssignments = useMemo(
    () => assignments.filter((a) => a.validation?.valid === false),
    [assignments]
  );

  return (
    <div className="advanced-assignment-collection">
      <style>{`
        .advanced-assignment-collection {
          max-width: 100%;
        }
        .assignment-item.dragging {
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
          transform: rotate(2deg);
        }
        .bulk-operations {
          margin-bottom: 16px;
          padding: 16px;
          background: linear-gradient(135deg, #f6f8fa 0%, #ffffff 100%);
          border-radius: 8px;
          border: 1px solid #e1e8ed;
        }
      `}</style>

      {/* Enhanced Header with Statistics */}
      <div className="bulk-operations">
        <Row justify="space-between" align="middle" style={{ marginBottom: '12px' }}>
          <Col>
            <Space align="center">
              <Title level={5} style={{ margin: 0 }}>
                Field Assignments
              </Title>
              <Badge count={assignments.length} style={{ backgroundColor: '#1890ff' }} />
              {validAssignments.length > 0 && (
                <Tag color="success">{validAssignments.length} valid</Tag>
              )}
              {invalidAssignments.length > 0 && (
                <Tag color="error">{invalidAssignments.length} errors</Tag>
              )}
            </Space>
          </Col>
          <Col>
            <Space>
              {enableBulkOperations && inputData && inputData.length > 0 && (
                <Tooltip title="Add assignments for all fields found in input data">
                  <Button
                    type="dashed"
                    size="small"
                    icon={<AppstoreAddOutlined />}
                    onClick={handleAddAllFields}
                    disabled={disabled}
                    loading={bulkOperationProgress?.visible}
                  >
                    Add All Fields
                  </Button>
                </Tooltip>
              )}
              {enableBulkOperations && onBulkTest && assignments.length > 0 && (
                <Tooltip title="Test all assignments with current input data">
                  <Button
                    type="dashed"
                    size="small"
                    icon={<EyeOutlined />}
                    onClick={onBulkTest}
                    disabled={disabled || invalidAssignments.length > 0}
                  >
                    Test All
                  </Button>
                </Tooltip>
              )}
              {assignments.length > 0 && (
                <Tooltip title="Clear all assignments">
                  <Button
                    type="dashed"
                    size="small"
                    icon={<ClearOutlined />}
                    onClick={handleClearAll}
                    disabled={disabled}
                    danger
                  >
                    Clear All
                  </Button>
                </Tooltip>
              )}
            </Space>
          </Col>
        </Row>

        <Text type="secondary" style={{ fontSize: '12px' }}>
          Configure field assignments with type validation, expression support, and drag-and-drop
          reordering.
          {enableExpressionEditor && (
            <>
              {' '}
              Use <Tag>{`{{ expression }}`}</Tag> syntax for dynamic values.
            </>
          )}
        </Text>
      </div>

      {/* Bulk Operation Progress */}
      {bulkOperationProgress?.visible && (
        <div style={{ marginBottom: '16px' }}>
          <Progress
            percent={Math.round(
              (bulkOperationProgress.current / bulkOperationProgress.total) * 100
            )}
            status="active"
            format={() => `${bulkOperationProgress.current}/${bulkOperationProgress.total}`}
          />
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {bulkOperationProgress.operation}
          </Text>
        </div>
      )}

      {/* Assignment Items with Drag & Drop */}
      {assignments.length > 0 ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={assignments.map((a) => a.id)}
            strategy={verticalListSortingStrategy}
          >
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              {assignments.map((assignment, index) => (
                <AdvancedAssignmentItem
                  key={assignment.id}
                  assignment={assignment}
                  index={index}
                  onUpdate={handleUpdateAssignment}
                  onDelete={handleDeleteAssignment}
                  onTest={onAssignmentTest}
                  disabled={disabled}
                  autoDetectTypes={autoDetectTypes}
                  allowedTypes={allowedTypes}
                  showTypeSelector={showTypeSelector}
                  enableExpressionEditor={enableExpressionEditor}
                  enableValidation={enableValidation}
                  expressionContext={expressionContext}
                />
              ))}
            </Space>
          </SortableContext>

          <DragOverlay>
            {draggedAssignment && (
              <Card
                size="small"
                style={{
                  opacity: 0.8,
                  transform: 'rotate(5deg)',
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)',
                }}
              >
                <Text strong>{draggedAssignment.name || 'Untitled Assignment'}</Text>
              </Card>
            )}
          </DragOverlay>
        </DndContext>
      ) : (
        <Empty
          description={
            <Space direction="vertical" align="center">
              <Text type="secondary">No field assignments configured</Text>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                Click "Add Assignment" or "Add All Fields" to get started
              </Text>
            </Space>
          }
          style={{
            padding: '40px 20px',
            backgroundColor: '#fafafa',
            borderRadius: '8px',
            border: '1px dashed #d9d9d9',
          }}
        />
      )}

      {/* Add Assignment Button */}
      <div style={{ marginTop: '16px', textAlign: 'center' }}>
        <Button
          type="dashed"
          onClick={handleAddAssignment}
          icon={<PlusOutlined />}
          disabled={disabled}
          size="large"
          style={{ width: '100%' }}
        >
          Add Field Assignment
        </Button>
      </div>
    </div>
  );
};

// Utility functions
function getPlaceholderForType(type: string): string {
  const placeholders: Record<string, string> = {
    stringValue: 'Enter text or {{ expression }}',
    numberValue: 'Enter number or {{ expression }}',
    booleanValue: 'true/false or {{ expression }}',
    arrayValue: '["item1", "item2"] or {{ expression }}',
    objectValue: '{"key": "value"} or {{ expression }}',
    dateValue: '2024-01-01 or {{ expression }}',
  };
  return placeholders[type] || 'Enter value';
}

function getTypeIcon(type: string): React.ReactNode {
  const icons: Record<string, React.ReactNode> = {
    stringValue: '📝',
    numberValue: '🔢',
    booleanValue: '✓',
    arrayValue: '📋',
    objectValue: '📦',
    dateValue: '📅',
  };
  return icons[type] || '📝';
}

function formatTypeName(type: string): string {
  return type.replace('Value', '').charAt(0).toUpperCase() + type.replace('Value', '').slice(1);
}

function extractFieldNames(
  obj: any,
  prefix: string,
  fieldNames: Set<string>,
  maxDepth: number
): void {
  if (maxDepth <= 0) {
    return;
  }

  Object.keys(obj).forEach((key) => {
    const fullPath = prefix ? `${prefix}.${key}` : key;
    fieldNames.add(fullPath);

    // Recursively extract nested field names
    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      extractFieldNames(obj[key], fullPath, fieldNames, maxDepth - 1);
    }
  });
}

function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

export default AdvancedAssignmentCollection;
