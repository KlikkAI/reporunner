import React, { useState } from 'react';
import { Button, Form, Input, Select, Space, Typography } from 'antd';
import { DatabaseOutlined, PlayCircleOutlined } from '@ant-design/icons';

const { Text } = Typography;
const { Option } = Select;

export interface DatabaseNodeBodyProps {
  nodeId: string;
  data: any;
  onUpdate?: (nodeId: string, data: any) => void;
  onTest?: (nodeId: string) => void;
}

export const DatabaseNodeBody: React.FC<DatabaseNodeBodyProps> = ({
  nodeId,
  data,
  onUpdate,
  onTest
}) => {
  const [form] = Form.useForm();

  const handleFormChange = (changedFields: any, allFields: any) => {
    const formData = form.getFieldsValue();
    onUpdate?.(nodeId, { ...data, ...formData });
  };

  const handleTest = () => {
    onTest?.(nodeId);
  };

  return (
    <div className="database-node-body p-4">
      <div className="flex items-center gap-2 mb-4">
        <DatabaseOutlined className="text-blue-500" />
        <Text strong>Database Operation</Text>
      </div>

      <Form
        form={form}
        layout="vertical"
        initialValues={data}
        onValuesChange={handleFormChange}
        size="small"
      >
        <Form.Item
          label="Operation Type"
          name="operation"
          rules={[{ required: true, message: 'Please select an operation' }]}
        >
          <Select placeholder="Select operation">
            <Option value="find">Find</Option>
            <Option value="findOne">Find One</Option>
            <Option value="insert">Insert</Option>
            <Option value="update">Update</Option>
            <Option value="delete">Delete</Option>
            <Option value="aggregate">Aggregate</Option>
          </Select>
        </Form.Item>

        <Form.Item
          label="Collection/Table"
          name="collection"
          rules={[{ required: true, message: 'Please enter collection name' }]}
        >
          <Input placeholder="e.g., users, products" />
        </Form.Item>

        <Form.Item
          label="Query/Filter"
          name="query"
        >
          <Input.TextArea
            placeholder='{"status": "active"}'
            rows={3}
          />
        </Form.Item>

        <Form.Item
          label="Data (for insert/update)"
          name="data"
        >
          <Input.TextArea
            placeholder='{"name": "John", "email": "john@example.com"}'
            rows={3}
          />
        </Form.Item>

        <Form.Item>
          <Space>
            <Button
              type="primary"
              icon={<PlayCircleOutlined />}
              onClick={handleTest}
              size="small"
            >
              Test Query
            </Button>
          </Space>
        </Form.Item>
      </Form>

      {data?.result && (
        <div className="mt-4 p-3 bg-gray-50 rounded">
          <Text className="text-xs text-gray-600">Query Result:</Text>
          <pre className="text-xs mt-1 overflow-auto max-h-32">
            {JSON.stringify(data.result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default DatabaseNodeBody;