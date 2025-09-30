/**
 * Enhanced Assignment Collection Component for Transform Node
 * Provides drag & drop reordering and bulk operations similar to n8n's EditFields
 */

import {
  AppstoreAddOutlined,
  ClearOutlined,
  DeleteOutlined,
  DragOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import {
  closestCenter,
  DndContext,
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
import { Button, Card, Input, Select, Space, Switch, Tooltip, Typography } from 'antd';
import type React from 'react';
import { useCallback, useMemo } from 'react';

const { Text, Title } = Typography;
const { Option } = Select;

interface FieldAssignment {
  id: string;
  name: string;
  type: 'stringValue' | 'numberValue' | 'booleanValue' | 'arrayValue' | 'objectValue';
  value: any;
}

interface TransformAssignmentCollectionProps {
  assignments: FieldAssignment[];
  onChange: (assignments: FieldAssignment[]) => void;
  inputData?: any[]; // Sample input data for "Add All Fields" functionality
  disabled?: boolean;
}

// Sortable Assignment Item Component
const SortableAssignmentItem: React.FC<{
  assignment: FieldAssignment;
  onUpdate: (id: string, updates: Partial<FieldAssignment>) => void;
  onDelete: (id: string) => void;
  disabled?: boolean;
}> = ({ assignment, onUpdate, onDelete, disabled }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: assignment.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleFieldChange = useCallback(
    (field: keyof FieldAssignment, value: any) => {
      onUpdate(assignment.id, { [field]: value });
    },
    [assignment.id, onUpdate]
  );

  const renderValueInput = () => {
    switch (assignment.type) {
      case 'stringValue':
        return (
          <Input
            placeholder="String value (supports expressions)"
            value={assignment.value || ''}
            onChange={(e) => handleFieldChange('value', e.target.value)}
            disabled={disabled}
          />
        );
      case 'numberValue':
        return (
          <Input
            type="number"
            placeholder="Numeric value"
            value={assignment.value ?? ''}
            onChange={(e) => handleFieldChange('value', Number(e.target.value) || 0)}
            disabled={disabled}
          />
        );
      case 'booleanValue':
        return (
          <Switch
            checked={assignment.value ?? false}
            onChange={(value) => handleFieldChange('value', value)}
            disabled={disabled}
          />
        );
      case 'arrayValue':
        return (
          <Input.TextArea
            placeholder='["item1", "item2"] or JSON array'
            value={
              typeof assignment.value === 'string'
                ? assignment.value
                : JSON.stringify(assignment.value || [])
            }
            onChange={(e) => handleFieldChange('value', e.target.value)}
            rows={2}
            disabled={disabled}
          />
        );
      case 'objectValue':
        return (
          <Input.TextArea
            placeholder='{"key": "value"} or JSON object'
            value={
              typeof assignment.value === 'string'
                ? assignment.value
                : JSON.stringify(assignment.value || {})
            }
            onChange={(e) => handleFieldChange('value', e.target.value)}
            rows={2}
            disabled={disabled}
          />
        );
      default:
        return (
          <Input
            placeholder="Value"
            value={assignment.value || ''}
            onChange={(e) => handleFieldChange('value', e.target.value)}
            disabled={disabled}
          />
        );
    }
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      size="small"
      className={`assignment-item ${isDragging ? 'dragging' : ''}`}
      bodyStyle={{ padding: '12px' }}
    >
      <Space direction="vertical" style={{ width: '100%' }} size="small">
        {/* Header with drag handle and delete button */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div {...attributes} {...listeners} style={{ cursor: 'grab', color: '#8c8c8c' }}>
              <DragOutlined />
            </div>
            <Text strong style={{ fontSize: '12px' }}>
              Assignment {assignment.id.slice(-3)}
            </Text>
          </div>
          <Button
            type="text"
            size="small"
            icon={<DeleteOutlined />}
            onClick={() => onDelete(assignment.id)}
            disabled={disabled}
            danger
            style={{ minWidth: 'auto', padding: '4px' }}
          />
        </div>

        {/* Field Name */}
        <div>
          <Text
            type="secondary"
            style={{ fontSize: '11px', marginBottom: '4px', display: 'block' }}
          >
            Field Name
          </Text>
          <Input
            placeholder="e.g. user.name or address.city"
            value={assignment.name}
            onChange={(e) => handleFieldChange('name', e.target.value)}
            size="small"
            disabled={disabled}
          />
        </div>

        {/* Field Type */}
        <div>
          <Text
            type="secondary"
            style={{ fontSize: '11px', marginBottom: '4px', display: 'block' }}
          >
            Field Type
          </Text>
          <Select
            value={assignment.type}
            onChange={(value) => handleFieldChange('type', value)}
            size="small"
            style={{ width: '100%' }}
            disabled={disabled}
          >
            <Option value="stringValue">String</Option>
            <Option value="numberValue">Number</Option>
            <Option value="booleanValue">Boolean</Option>
            <Option value="arrayValue">Array</Option>
            <Option value="objectValue">Object</Option>
          </Select>
        </div>

        {/* Field Value */}
        <div>
          <Text
            type="secondary"
            style={{ fontSize: '11px', marginBottom: '4px', display: 'block' }}
          >
            Value
          </Text>
          {renderValueInput()}
        </div>
      </Space>
    </Card>
  );
};

// Main Transform Assignment Collection Component
const TransformAssignmentCollection: React.FC<TransformAssignmentCollectionProps> = ({
  assignments,
  onChange,
  inputData,
  disabled,
}) => {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Generate unique ID for new assignments
  const generateId = useCallback(() => {
    return `assignment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  // Add new assignment
  const handleAddAssignment = useCallback(() => {
    const newAssignment: FieldAssignment = {
      id: generateId(),
      name: '',
      type: 'stringValue',
      value: '',
    };
    onChange([...assignments, newAssignment]);
  }, [assignments, generateId, onChange]);

  // Update assignment
  const handleUpdateAssignment = useCallback(
    (id: string, updates: Partial<FieldAssignment>) => {
      const updatedAssignments = assignments.map((assignment) =>
        assignment.id === id ? { ...assignment, ...updates } : assignment
      );
      onChange(updatedAssignments);
    },
    [assignments, onChange]
  );

  // Delete assignment
  const handleDeleteAssignment = useCallback(
    (id: string) => {
      const filteredAssignments = assignments.filter((assignment) => assignment.id !== id);
      onChange(filteredAssignments);
    },
    [assignments, onChange]
  );

  // Clear all assignments
  const handleClearAll = useCallback(() => {
    onChange([]);
  }, [onChange]);

  // Add all fields from input data
  const handleAddAllFields = useCallback(() => {
    if (!inputData?.length) {
      return;
    }

    // Get all unique field names from input data
    const fieldNames = new Set<string>();
    inputData.forEach((item) => {
      if (item.json && typeof item.json === 'object') {
        Object.keys(item.json).forEach((key) => fieldNames.add(key));
      }
    });

    // Create assignments for each field with auto-detected type
    const newAssignments = Array.from(fieldNames).map((fieldName) => {
      // Auto-detect type from first occurrence
      let detectedType: FieldAssignment['type'] = 'stringValue';
      for (const item of inputData) {
        if (item.json && item.json[fieldName] !== undefined) {
          const value = item.json[fieldName];
          if (typeof value === 'number') {
            detectedType = 'numberValue';
          } else if (typeof value === 'boolean') {
            detectedType = 'booleanValue';
          } else if (Array.isArray(value)) {
            detectedType = 'arrayValue';
          } else if (typeof value === 'object' && value !== null) {
            detectedType = 'objectValue';
          }
          break;
        }
      }

      return {
        id: generateId(),
        name: fieldName,
        type: detectedType,
        value: '', // Start with empty value for user to configure
      };
    });

    // Merge with existing assignments (avoid duplicates)
    const existingNames = new Set(assignments.map((a) => a.name));
    const filteredNewAssignments = newAssignments.filter((a) => !existingNames.has(a.name));

    onChange([...assignments, ...filteredNewAssignments]);
  }, [inputData, assignments, generateId, onChange]);

  // Handle drag and drop reordering
  const handleDragEnd = useCallback(
    (event: any) => {
      const { active, over } = event;

      if (active.id !== over?.id) {
        const oldIndex = assignments.findIndex((item) => item.id === active.id);
        const newIndex = assignments.findIndex((item) => item.id === over.id);
        const reorderedAssignments = arrayMove(assignments, oldIndex, newIndex);
        onChange(reorderedAssignments);
      }
    },
    [assignments, onChange]
  );

  // Memoize assignment items for performance
  const assignmentItems = useMemo(() => {
    return assignments.map((assignment) => (
      <SortableAssignmentItem
        key={assignment.id}
        assignment={assignment}
        onUpdate={handleUpdateAssignment}
        onDelete={handleDeleteAssignment}
        disabled={disabled}
      />
    ));
  }, [assignments, handleUpdateAssignment, handleDeleteAssignment, disabled]);

  return (
    <div className="transform-assignment-collection">
      <style>{`
        .transform-assignment-collection {
          max-width: 100%;
        }
        .assignment-item.dragging {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }
        .bulk-operations {
          margin-bottom: 16px;
          padding: 12px;
          background: #fafafa;
          border-radius: 6px;
          border: 1px solid #d9d9d9;
        }
      `}</style>

      {/* Header and Bulk Operations */}
      <div className="bulk-operations">
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '8px',
          }}
        >
          <Title level={5} style={{ margin: 0 }}>
            Field Assignments ({assignments.length})
          </Title>
          <Space size="small">
            {inputData && inputData.length > 0 && (
              <Tooltip title="Add all fields from input data">
                <Button
                  type="dashed"
                  size="small"
                  icon={<AppstoreAddOutlined />}
                  onClick={handleAddAllFields}
                  disabled={disabled}
                >
                  Add All
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
                  Clear
                </Button>
              </Tooltip>
            )}
          </Space>
        </div>

        <Text type="secondary" style={{ fontSize: '12px' }}>
          Configure field assignments with type validation. Drag to reorder.
        </Text>
      </div>

      {/* Assignment Items with Drag & Drop */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext
          items={assignments.map((a) => a.id)}
          strategy={verticalListSortingStrategy}
        >
          <Space direction="vertical" style={{ width: '100%' }} size="small">
            {assignmentItems}
          </Space>
        </SortableContext>
      </DndContext>

      {/* Add Assignment Button */}
      <div style={{ marginTop: assignments.length > 0 ? '16px' : '0' }}>
        <Button
          type="dashed"
          onClick={handleAddAssignment}
          icon={<PlusOutlined />}
          style={{ width: '100%' }}
          disabled={disabled}
        >
          Add Assignment
        </Button>
      </div>

      {/* Empty State */}
      {assignments.length === 0 && (
        <div
          style={{
            textAlign: 'center',
            padding: '24px',
            color: '#8c8c8c',
            backgroundColor: '#fafafa',
            borderRadius: '6px',
            border: '1px dashed #d9d9d9',
            marginTop: '8px',
          }}
        >
          <Text type="secondary">No field assignments configured</Text>
          <br />
          <Text type="secondary" style={{ fontSize: '12px' }}>
            Click "Add Assignment" or "Add All" to get started
          </Text>
        </div>
      )}
    </div>
  );
};

export default TransformAssignmentCollection;
