/**
 * Conditional Workflow Branching Panel
 *
 * Advanced conditional logic builder with visual branch creation,
 * dynamic routing, expression builder, and complex condition handling.
 */

import {
  BranchesOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  CodeOutlined,
  DeleteOutlined,
  EditOutlined,
  PlayCircleOutlined,
  PlusOutlined,
  QuestionCircleOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import {
  Alert,
  Button,
  Card,
  Col,
  Divider,
  Form,
  Input,
  InputNumber,
  List,
  Modal,
  message,
  Radio,
  Row,
  Select,
  Space,
  Switch,
  Tabs,
  Tag,
  Tree,
  Typography,
} from 'antd';
import type React from 'react';
import { useEffect, useState } from 'react';
import type { WorkflowNodeInstance } from '@/core/nodes/types';
import { useLeanWorkflowStore } from '@/core/stores/leanWorkflowStore';
import { colors } from '@/design-system/tokens';
import { cn } from '@/design-system/utils';

const { TabPane } = Tabs;
const { Option } = Select;
const { TextArea } = Input;
const { Text } = Typography;

interface ConditionalBranchingPanelProps {
  workflowId: string;
  visible: boolean;
  onClose: () => void;
  onAddBranch: (branchConfig: BranchConfiguration) => void;
}

export interface BranchConfiguration {
  id: string;
  name: string;
  description?: string;
  sourceNodeId: string;
  conditions: BranchCondition[];
  logicalOperator: 'AND' | 'OR';
  defaultBranch: boolean;
  priority: number;
  targetNodes: string[];
  metadata: Record<string, any>;
}

export interface BranchCondition {
  id: string;
  field: string;
  operator: ComparisonOperator;
  value: any;
  dataType: 'string' | 'number' | 'boolean' | 'date' | 'array' | 'object';
  negate?: boolean;
  caseSensitive?: boolean;
}

type ComparisonOperator =
  | 'equals'
  | 'not_equals'
  | 'greater_than'
  | 'less_than'
  | 'greater_equal'
  | 'less_equal'
  | 'contains'
  | 'starts_with'
  | 'ends_with'
  | 'regex'
  | 'in_array'
  | 'is_empty'
  | 'is_not_empty'
  | 'exists'
  | 'not_exists';

export const ConditionalBranchingPanel: React.FC<ConditionalBranchingPanelProps> = ({
  workflowId: _workflowId,
  visible,
  onClose,
  onAddBranch,
}) => {
  const { activeWorkflow } = useLeanWorkflowStore();
  const nodes = activeWorkflow?.nodes || [];
  const edges = activeWorkflow?.edges || [];
  const [branches, setBranches] = useState<BranchConfiguration[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<BranchConfiguration | null>(null);
  const [activeTab, setActiveTab] = useState('builder');
  const [form] = Form.useForm();
  const [conditionForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [editingBranch, setEditingBranch] = useState<string | null>(null);
  const [testModalVisible, setTestModalVisible] = useState(false);

  useEffect(() => {
    if (visible) {
      loadExistingBranches();
    }
  }, [visible, loadExistingBranches]);

  const loadExistingBranches = () => {
    // Extract conditional branches from existing workflow
    const conditionNodes = nodes.filter(
      (node: any) =>
        node.parameters?.type === 'condition' ||
        node.parameters?.integrationData?.id === 'condition' ||
        node.type === 'condition'
    );

    const extractedBranches: BranchConfiguration[] = conditionNodes.map((node: any) => ({
      id: node.id,
      name: node.parameters?.name || node.name || `Branch from ${node.id}`,
      description: node.parameters?.description || '',
      sourceNodeId: node.id,
      conditions: extractConditionsFromNode(node),
      logicalOperator: 'AND',
      defaultBranch: false,
      priority: 1,
      targetNodes: getTargetNodes(node.id),
      metadata: {},
    }));

    setBranches(extractedBranches);
  };

  const extractConditionsFromNode = (node: WorkflowNodeInstance): BranchCondition[] => {
    const properties = node.parameters?.properties || node.parameters || {};
    const conditions: BranchCondition[] = [];

    // Extract conditions from node properties
    if (properties.condition) {
      // Simple condition
      conditions.push({
        id: `condition_${Date.now()}`,
        field: properties.field || 'data',
        operator: properties.operator || 'equals',
        value: properties.value,
        dataType: properties.dataType || 'string',
        negate: properties.negate,
        caseSensitive: properties.caseSensitive !== false,
      });
    } else if (properties.conditions) {
      // Multiple conditions
      properties.conditions.forEach((cond: any, index: number) => {
        conditions.push({
          id: `condition_${Date.now()}_${index}`,
          field: cond.field,
          operator: cond.operator,
          value: cond.value,
          dataType: cond.dataType || 'string',
          negate: cond.negate,
          caseSensitive: cond.caseSensitive !== false,
        });
      });
    }

    return conditions;
  };

  const getTargetNodes = (sourceNodeId: string): string[] => {
    return edges
      .filter((edge: any) => edge.source === sourceNodeId)
      .map((edge: any) => edge.target);
  };

  const handleCreateBranch = async (values: any) => {
    setLoading(true);
    try {
      const branchConfig: BranchConfiguration = {
        id: editingBranch || `branch_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        name: values.name,
        description: values.description,
        sourceNodeId: values.sourceNodeId,
        conditions: values.conditions || [],
        logicalOperator: values.logicalOperator || 'AND',
        defaultBranch: values.defaultBranch,
        priority: values.priority || 1,
        targetNodes: values.targetNodes || [],
        metadata: {
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      };

      if (editingBranch) {
        setBranches((prev) => prev.map((b) => (b.id === editingBranch ? branchConfig : b)));
        message.success('Branch updated successfully');
      } else {
        setBranches((prev) => [...prev, branchConfig]);
        message.success('Branch created successfully');
      }

      onAddBranch(branchConfig);
      form.resetFields();
      setEditingBranch(null);
    } catch (_error) {
      message.error('Failed to create branch');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCondition = (values: any) => {
    const condition: BranchCondition = {
      id: `condition_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      field: values.field,
      operator: values.operator,
      value: values.value,
      dataType: values.dataType,
      negate: values.negate,
      caseSensitive: values.caseSensitive !== false,
    };

    const currentConditions = form.getFieldValue('conditions') || [];
    form.setFieldsValue({ conditions: [...currentConditions, condition] });
    conditionForm.resetFields();
  };

  const handleRemoveCondition = (conditionId: string) => {
    const currentConditions = form.getFieldValue('conditions') || [];
    const updatedConditions = currentConditions.filter(
      (c: BranchCondition) => c.id !== conditionId
    );
    form.setFieldsValue({ conditions: updatedConditions });
  };

  const handleTestBranch = async (branch: BranchConfiguration, testData: any) => {
    try {
      const result = evaluateBranchConditions(branch, testData);
      message.success(`Branch evaluation result: ${result ? 'TRUE' : 'FALSE'}`);
      return result;
    } catch (_error) {
      message.error('Branch test failed');
      return false;
    }
  };

  const evaluateBranchConditions = (branch: BranchConfiguration, data: any): boolean => {
    if (branch.conditions.length === 0) {
      return true;
    }

    const results = branch.conditions.map((condition) => evaluateCondition(condition, data));

    return branch.logicalOperator === 'AND' ? results.every(Boolean) : results.some(Boolean);
  };

  const evaluateCondition = (condition: BranchCondition, data: any): boolean => {
    const fieldValue = getNestedValue(data, condition.field);
    let result = false;

    switch (condition.operator) {
      case 'equals':
        result = fieldValue === condition.value;
        break;
      case 'not_equals':
        result = fieldValue !== condition.value;
        break;
      case 'greater_than':
        result = Number(fieldValue) > Number(condition.value);
        break;
      case 'less_than':
        result = Number(fieldValue) < Number(condition.value);
        break;
      case 'greater_equal':
        result = Number(fieldValue) >= Number(condition.value);
        break;
      case 'less_equal':
        result = Number(fieldValue) <= Number(condition.value);
        break;
      case 'contains': {
        const searchValue = condition.caseSensitive
          ? condition.value
          : condition.value.toLowerCase();
        const searchIn = condition.caseSensitive
          ? String(fieldValue)
          : String(fieldValue).toLowerCase();
        result = searchIn.includes(searchValue);
        break;
      }
      case 'starts_with':
        result = String(fieldValue).startsWith(String(condition.value));
        break;
      case 'ends_with':
        result = String(fieldValue).endsWith(String(condition.value));
        break;
      case 'regex':
        result = new RegExp(condition.value).test(String(fieldValue));
        break;
      case 'in_array':
        result = Array.isArray(condition.value) && condition.value.includes(fieldValue);
        break;
      case 'is_empty':
        result =
          !fieldValue ||
          fieldValue === '' ||
          (Array.isArray(fieldValue) && fieldValue.length === 0);
        break;
      case 'is_not_empty':
        result =
          !!fieldValue &&
          fieldValue !== '' &&
          (!Array.isArray(fieldValue) || fieldValue.length > 0);
        break;
      case 'exists':
        result = fieldValue !== undefined && fieldValue !== null;
        break;
      case 'not_exists':
        result = fieldValue === undefined || fieldValue === null;
        break;
      default:
        result = false;
    }

    return condition.negate ? !result : result;
  };

  const getNestedValue = (obj: any, path: string): any => {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  };

  const renderBranchBuilder = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card title="Branch Configuration" size="small">
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreateBranch}
          initialValues={{
            logicalOperator: 'AND',
            defaultBranch: false,
            priority: 1,
            conditions: [],
          }}
        >
          <Form.Item
            name="name"
            label="Branch Name"
            rules={[{ required: true, message: 'Please enter a branch name' }]}
          >
            <Input placeholder="Success path" />
          </Form.Item>

          <Form.Item name="description" label="Description">
            <TextArea placeholder="Handles successful API responses" rows={2} />
          </Form.Item>

          <Form.Item
            name="sourceNodeId"
            label="Source Node"
            rules={[{ required: true, message: 'Please select a source node' }]}
          >
            <Select placeholder="Select node to branch from">
              {nodes.map((node: any) => (
                <Option key={node.id} value={node.id}>
                  {node.parameters?.name || node.name || node.id}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="logicalOperator" label="Condition Logic">
            <Radio.Group>
              <Radio value="AND">ALL conditions must be true (AND)</Radio>
              <Radio value="OR">ANY condition must be true (OR)</Radio>
            </Radio.Group>
          </Form.Item>

          <Divider>Conditions</Divider>

          <Form.Item dependencies={['conditions']} noStyle>
            {({ getFieldValue }) => {
              const conditions: BranchCondition[] = getFieldValue('conditions') || [];
              return (
                <div className="space-y-2">
                  {conditions.map((condition) => (
                    <Card key={condition.id} size="small" className="border-l-4 border-l-blue-500">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <Space direction="vertical" size="small">
                            <Text strong>{condition.field}</Text>
                            <Tag color="blue">{condition.operator}</Tag>
                            <Text code>{JSON.stringify(condition.value)}</Text>
                            {condition.negate && <Tag color="orange">NEGATED</Tag>}
                          </Space>
                        </div>
                        <Button
                          type="link"
                          danger
                          icon={<DeleteOutlined />}
                          onClick={() => handleRemoveCondition(condition.id)}
                        />
                      </div>
                    </Card>
                  ))}
                  {conditions.length === 0 && (
                    <Alert
                      message="No conditions defined"
                      description="Add conditions to control when this branch should be taken"
                      type="info"
                      showIcon
                    />
                  )}
                </div>
              );
            }}
          </Form.Item>

          <Card title="Add Condition" size="small" className="mt-4">
            <Form form={conditionForm} layout="vertical" onFinish={handleAddCondition}>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="field" label="Field Path" rules={[{ required: true }]}>
                    <Input placeholder="data.status" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="dataType" label="Data Type" rules={[{ required: true }]}>
                    <Select>
                      <Option value="string">String</Option>
                      <Option value="number">Number</Option>
                      <Option value="boolean">Boolean</Option>
                      <Option value="date">Date</Option>
                      <Option value="array">Array</Option>
                      <Option value="object">Object</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="operator" label="Operator" rules={[{ required: true }]}>
                    <Select>
                      <Option value="equals">Equals (=)</Option>
                      <Option value="not_equals">Not Equals (≠)</Option>
                      <Option value="greater_than">Greater Than (&gt;)</Option>
                      <Option value="less_than">Less Than (&lt;)</Option>
                      <Option value="greater_equal">Greater Equal (≥)</Option>
                      <Option value="less_equal">Less Equal (≤)</Option>
                      <Option value="contains">Contains</Option>
                      <Option value="starts_with">Starts With</Option>
                      <Option value="ends_with">Ends With</Option>
                      <Option value="regex">Regex Match</Option>
                      <Option value="in_array">In Array</Option>
                      <Option value="is_empty">Is Empty</Option>
                      <Option value="is_not_empty">Is Not Empty</Option>
                      <Option value="exists">Exists</Option>
                      <Option value="not_exists">Not Exists</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="value" label="Value" rules={[{ required: true }]}>
                    <Input placeholder="success" />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="negate" valuePropName="checked">
                    <Switch checkedChildren="Negate" unCheckedChildren="Normal" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="caseSensitive" valuePropName="checked" initialValue={true}>
                    <Switch checkedChildren="Case Sensitive" unCheckedChildren="Ignore Case" />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item>
                <Button type="dashed" htmlType="submit" icon={<PlusOutlined />} block>
                  Add Condition
                </Button>
              </Form.Item>
            </Form>
          </Card>

          <Divider>Advanced Settings</Divider>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="priority" label="Priority">
                <InputNumber min={1} max={10} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="defaultBranch" label="Default Branch" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading}>
                {editingBranch ? 'Update Branch' : 'Create Branch'}
              </Button>
              <Button
                onClick={() => {
                  form.resetFields();
                  setEditingBranch(null);
                }}
              >
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      <Card title="Existing Branches" size="small">
        <List
          dataSource={branches}
          renderItem={(branch) => (
            <List.Item
              actions={[
                <Button
                  type="link"
                  icon={<PlayCircleOutlined />}
                  onClick={() => {
                    setSelectedBranch(branch);
                    setTestModalVisible(true);
                  }}
                >
                  Test
                </Button>,
                <Button
                  type="link"
                  icon={<EditOutlined />}
                  onClick={() => {
                    setEditingBranch(branch.id);
                    form.setFieldsValue(branch);
                  }}
                />,
                <Button
                  type="link"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => {
                    setBranches((prev) => prev.filter((b) => b.id !== branch.id));
                    message.success('Branch deleted');
                  }}
                />,
              ]}
            >
              <List.Item.Meta
                title={
                  <Space>
                    <BranchesOutlined />
                    {branch.name}
                    <Tag color={branch.defaultBranch ? 'gold' : 'blue'}>
                      {branch.logicalOperator}
                    </Tag>
                    {branch.defaultBranch && <Tag color="gold">DEFAULT</Tag>}
                  </Space>
                }
                description={
                  <Space direction="vertical" size="small">
                    {branch.description}
                    <Text type="secondary">
                      {branch.conditions.length} condition(s) • Priority: {branch.priority}
                    </Text>
                    <div>
                      {branch.conditions.map((condition) => (
                        <Tag key={condition.id} color="geekblue" style={{ marginBottom: 4 }}>
                          {condition.field} {condition.operator} {JSON.stringify(condition.value)}
                        </Tag>
                      ))}
                    </div>
                  </Space>
                }
              />
            </List.Item>
          )}
          locale={{ emptyText: 'No branches configured' }}
        />
      </Card>
    </div>
  );

  const renderExpressionBuilder = () => (
    <Card title="JavaScript Expression Builder" size="small">
      <Alert
        message="Advanced Expression Mode"
        description="Write custom JavaScript expressions for complex conditional logic. Use 'data' object to access workflow data."
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />

      <Form layout="vertical">
        <Form.Item label="Expression">
          <TextArea
            rows={10}
            placeholder={`// Example expressions:
return data.status === 'success' && data.count > 10;

// Multi-line logic
if (data.user && data.user.role === 'admin') {
  return data.permissions.includes('write');
}
return false;

// Array operations
return data.items.filter(item => item.active).length > 0;

// Date comparisons
const today = new Date();
const itemDate = new Date(data.createdAt);
return (today.getTime() - itemDate.getTime()) < (24 * 60 * 60 * 1000);`}
            style={{ fontFamily: 'monospace' }}
          />
        </Form.Item>

        <Form.Item>
          <Space>
            <Button type="primary" icon={<PlayCircleOutlined />}>
              Test Expression
            </Button>
            <Button icon={<CodeOutlined />}>Validate Syntax</Button>
            <Button>Save as Template</Button>
          </Space>
        </Form.Item>
      </Form>
    </Card>
  );

  const renderVisualFlowChart = () => {
    const treeData = branches.map((branch) => ({
      title: (
        <Space>
          <BranchesOutlined />
          {branch.name}
          <Tag color={branch.defaultBranch ? 'gold' : 'blue'}>
            {branch.conditions.length} conditions
          </Tag>
        </Space>
      ),
      key: branch.id,
      children: branch.conditions.map((condition) => ({
        title: (
          <Space>
            <QuestionCircleOutlined />
            {condition.field} {condition.operator} {JSON.stringify(condition.value)}
            {condition.negate && <Tag color="orange">NOT</Tag>}
          </Space>
        ),
        key: condition.id,
        icon: condition.negate ? <CloseCircleOutlined /> : <CheckCircleOutlined />,
      })),
    }));

    return (
      <Card title="Branch Flow Visualization" size="small">
        <Tree
          showIcon
          defaultExpandAll
          treeData={treeData}
          style={{ background: colors.gray[50], padding: 16, borderRadius: 8 }}
        />
      </Card>
    );
  };

  return (
    <>
      <Modal
        title={
          <Space>
            <BranchesOutlined />
            Conditional Branching
          </Space>
        }
        open={visible}
        onCancel={onClose}
        width={1400}
        footer={null}
        className={cn('conditional-branching-panel')}
      >
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane
            tab={
              <span>
                <SettingOutlined />
                Branch Builder
              </span>
            }
            key="builder"
          >
            {renderBranchBuilder()}
          </TabPane>

          <TabPane
            tab={
              <span>
                <CodeOutlined />
                Expression Builder
              </span>
            }
            key="expression"
          >
            {renderExpressionBuilder()}
          </TabPane>

          <TabPane
            tab={
              <span>
                <BranchesOutlined />
                Flow Visualization
              </span>
            }
            key="visualization"
          >
            {renderVisualFlowChart()}
          </TabPane>
        </Tabs>
      </Modal>

      <Modal
        title="Test Branch Logic"
        open={testModalVisible}
        onCancel={() => setTestModalVisible(false)}
        onOk={() => {
          if (selectedBranch) {
            const testData = { status: 'success', count: 15 }; // Example test data
            handleTestBranch(selectedBranch, testData);
            setTestModalVisible(false);
          }
        }}
      >
        <Form layout="vertical">
          <Form.Item label="Test Data (JSON)">
            <TextArea
              rows={8}
              placeholder={JSON.stringify(
                {
                  status: 'success',
                  count: 15,
                  user: { role: 'admin' },
                  timestamp: new Date().toISOString(),
                },
                null,
                2
              )}
            />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default ConditionalBranchingPanel;
