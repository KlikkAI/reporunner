import { useForm } from './hooks/useForm';
import { useRBACStore } from './hooks/useRBACStore';
import { useState } from './hooks/useState';
import { useEffect } from './hooks/useEffect';
import {
  AuditOutlined,
  CheckOutlined,
  ClockCircleOutlined,
  GlobalOutlined,
  SecurityScanOutlined,
  SettingOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import {
  Alert,
  Button,
  Card,
  Divider,
  Form,
  Input,
  InputNumber,
  Modal,
  message,
  Select,
  Space,
  Switch,
  Table,
  Tabs,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import type React from 'react';
import { useEffect, useState } from 'react';
import type {
  Organization,
  OrganizationMember,
  OrganizationSettings,
} from '@/core/services/rbacService';
import { useRBACStore } from '@/core/stores/rbacStore';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Option } = Select;

interface OrganizationSettingsProps {
  organization: Organization;
}

export const OrganizationSettingsComponent: React.FC<OrganizationSettingsProps> = ({
  organization,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [inviteModalVisible, setInviteModalVisible] = useState(false);
  const [inviteForm] = Form.useForm();

  const {
    updateOrganization,
    inviteUser,
    removeUser,
    updateUserRole,
    canManageOrganization,
    canManageUsers,
    isLoading,
    error,
  } = useRBACStore();

  useEffect(() => {
    form.setFieldsValue({
      name: organization.name,
      description: organization.description,
      domain: organization.domain,
      ...organization.settings,
    });
  }, [organization, form]);

  const handleSaveSettings = async (values: any) => {
    setLoading(true);
    try {
      const settings: OrganizationSettings = {
        allowPublicWorkflows: values.allowPublicWorkflows,
        requireApprovalForExecution: values.requireApprovalForExecution,
        maxWorkflowsPerUser: values.maxWorkflowsPerUser,
        maxExecutionsPerMonth: values.maxExecutionsPerMonth,
        enableAuditLogging: values.enableAuditLogging,
        enableSSOIntegration: values.enableSSOIntegration,
        allowedDomains: values.allowedDomains
          ?.split(',')
          .map((d: string) => d.trim())
          .filter(Boolean),
        sessionTimeout: values.sessionTimeout,
        passwordPolicy: {
          minLength: values.passwordMinLength,
          requireUppercase: values.passwordRequireUppercase,
          requireLowercase: values.passwordRequireLowercase,
          requireNumbers: values.passwordRequireNumbers,
          requireSymbols: values.passwordRequireSymbols,
          preventReuse: values.passwordPreventReuse,
          maxAge: values.passwordMaxAge,
        },
      };

      await updateOrganization(organization.id, {
        name: values.name,
        description: values.description,
        domain: values.domain,
        settings,
      });

      message.success('Organization settings updated successfully');
    } catch (error: any) {
      message.error(error.message || 'Failed to update organization settings');
    } finally {
      setLoading(false);
    }
  };

  const handleInviteUser = async (values: any) => {
    try {
      await inviteUser(organization.id, values.email, values.role);
      message.success(`Invitation sent to ${values.email}`);
      setInviteModalVisible(false);
      inviteForm.resetFields();
    } catch (error: any) {
      message.error(error.message || 'Failed to send invitation');
    }
  };

  const handleRemoveUser = async (userId: string, userName: string) => {
    Modal.confirm({
      title: 'Remove User',
      content: `Are you sure you want to remove ${userName} from this organization?`,
      okText: 'Remove',
      okType: 'danger',
      onOk: async () => {
        try {
          await removeUser(organization.id, userId);
          message.success('User removed successfully');
        } catch (error: any) {
          message.error(error.message || 'Failed to remove user');
        }
      },
    });
  };

  const handleUpdateUserRole = async (userId: string, newRole: OrganizationMember['role']) => {
    try {
      await updateUserRole(organization.id, userId, newRole);
      message.success('User role updated successfully');
    } catch (error: any) {
      message.error(error.message || 'Failed to update user role');
    }
  };

  const memberColumns = [
    {
      title: 'User',
      dataIndex: 'userId',
      key: 'userId',
      render: (userId: string) => (
        <div>
          <Text strong>{userId}</Text>
          <br />
          <Text type="secondary">user@example.com</Text>
        </div>
      ),
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      render: (role: OrganizationMember['role'], record: OrganizationMember) => (
        <Select
          value={role}
          onChange={(newRole) => handleUpdateUserRole(record.userId, newRole)}
          disabled={!canManageUsers() || record.role === 'owner'}
          style={{ width: 120 }}
        >
          <Option value="owner">Owner</Option>
          <Option value="admin">Admin</Option>
          <Option value="member">Member</Option>
          <Option value="viewer">Viewer</Option>
        </Select>
      ),
    },
    {
      title: 'Joined',
      dataIndex: 'joinedAt',
      key: 'joinedAt',
      render: (date: Date) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: unknown, record: OrganizationMember) => (
        <Space>
          {canManageUsers() && record.role !== 'owner' && (
            <Button
              type="link"
              danger
              size="small"
              onClick={() => handleRemoveUser(record.userId, record.userId)}
            >
              Remove
            </Button>
          )}
        </Space>
      ),
    },
  ];

  const tabs = [
    {
      key: 'general',
      label: (
        <span>
          <SettingOutlined />
          General
        </span>
      ),
      children: (
        <Card>
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSaveSettings}
            disabled={!canManageOrganization()}
          >
            <Form.Item
              name="name"
              label="Organization Name"
              rules={[{ required: true, message: 'Please enter organization name' }]}
            >
              <Input placeholder="Enter organization name" />
            </Form.Item>

            <Form.Item name="description" label="Description">
              <TextArea rows={3} placeholder="Enter organization description" />
            </Form.Item>

            <Form.Item name="domain" label="Domain">
              <Input placeholder="company.com" addonBefore="@" />
            </Form.Item>

            <Divider>Workflow Settings</Divider>

            <Form.Item
              name="allowPublicWorkflows"
              label="Allow Public Workflows"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>

            <Form.Item
              name="requireApprovalForExecution"
              label="Require Approval for Execution"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>

            <Form.Item name="maxWorkflowsPerUser" label="Max Workflows per User">
              <InputNumber min={1} max={1000} style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item name="maxExecutionsPerMonth" label="Max Executions per Month">
              <InputNumber min={100} max={1000000} style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item>
              <Space>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading || isLoading}
                  disabled={!canManageOrganization()}
                >
                  Save Settings
                </Button>
                <Button type="link" onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}>
                  {showAdvancedSettings ? 'Hide' : 'Show'} Advanced Settings
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Card>
      ),
    },
    {
      key: 'security',
      label: (
        <span>
          <SecurityScanOutlined />
          Security
        </span>
      ),
      children: (
        <Card>
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSaveSettings}
            disabled={!canManageOrganization()}
          >
            <Alert
              message="Security Settings"
              description="Configure security policies and access controls for your organization."
              type="info"
              showIcon
              style={{ marginBottom: 24 }}
            />

            <Form.Item
              name="enableAuditLogging"
              label="Enable Audit Logging"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>

            <Form.Item
              name="enableSSOIntegration"
              label="Enable SSO Integration"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>

            <Form.Item name="allowedDomains" label="Allowed Domains">
              <Input
                placeholder="domain1.com, domain2.com"
                addonAfter={
                  <Tooltip title="Comma-separated list of allowed email domains">
                    <GlobalOutlined />
                  </Tooltip>
                }
              />
            </Form.Item>

            <Form.Item name="sessionTimeout" label="Session Timeout (minutes)">
              <InputNumber
                min={5}
                max={1440}
                style={{ width: '100%' }}
                addonAfter={<ClockCircleOutlined />}
              />
            </Form.Item>

            <Divider>Password Policy</Divider>

            <Form.Item name="passwordMinLength" label="Minimum Length">
              <InputNumber min={6} max={32} style={{ width: '100%' }} />
            </Form.Item>

            <Space direction="vertical" style={{ width: '100%' }}>
              <Form.Item
                name="passwordRequireUppercase"
                label="Require Uppercase Letters"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>

              <Form.Item
                name="passwordRequireLowercase"
                label="Require Lowercase Letters"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>

              <Form.Item
                name="passwordRequireNumbers"
                label="Require Numbers"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>

              <Form.Item
                name="passwordRequireSymbols"
                label="Require Symbols"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
            </Space>

            <Form.Item
              name="passwordPreventReuse"
              label="Prevent Password Reuse (last N passwords)"
            >
              <InputNumber min={0} max={10} style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item name="passwordMaxAge" label="Password Expiry (days)">
              <InputNumber min={30} max={365} style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading || isLoading}
                disabled={!canManageOrganization()}
                icon={<CheckOutlined />}
              >
                Update Security Settings
              </Button>
            </Form.Item>
          </Form>
        </Card>
      ),
    },
    {
      key: 'members',
      label: (
        <span>
          <TeamOutlined />
          Members ({organization.members.length})
        </span>
      ),
      children: (
        <Card>
          <div style={{ marginBottom: 16 }}>
            <Space>
              <Button
                type="primary"
                onClick={() => setInviteModalVisible(true)}
                disabled={!canManageUsers()}
                icon={<TeamOutlined />}
              >
                Invite User
              </Button>
              <Text type="secondary">Manage organization members and their roles</Text>
            </Space>
          </div>

          <Table
            dataSource={organization.members}
            columns={memberColumns}
            rowKey="userId"
            pagination={{ pageSize: 10 }}
            loading={isLoading}
          />
        </Card>
      ),
    },
    {
      key: 'audit',
      label: (
        <span>
          <AuditOutlined />
          Audit & Compliance
        </span>
      ),
      children: (
        <Card>
          <Alert
            message="Audit & Compliance"
            description="Track all actions performed within your organization for security and compliance purposes."
            type="info"
            showIcon
            style={{ marginBottom: 24 }}
          />

          <Space direction="vertical" style={{ width: '100%' }} size="large">
            <Card size="small" title="Data Retention">
              <Paragraph>
                Audit logs are retained for 90 days. Execution logs are retained for 30 days.
                Contact support for longer retention periods.
              </Paragraph>
            </Card>

            <Card size="small" title="Compliance Standards">
              <Space wrap>
                <Tag color="green">SOC 2 Type II</Tag>
                <Tag color="blue">GDPR Compliant</Tag>
                <Tag color="purple">ISO 27001</Tag>
                <Tag color="orange">HIPAA Ready</Tag>
              </Space>
            </Card>

            <Card size="small" title="Data Export">
              <Space>
                <Button>Export Audit Logs</Button>
                <Button>Export User Data</Button>
                <Button>Export Workflow Data</Button>
              </Space>
            </Card>
          </Space>
        </Card>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={2}>
          <SettingOutlined /> Organization Settings
        </Title>
        <Text type="secondary">
          Manage your organization's settings, security policies, and members
        </Text>
      </div>

      {error && (
        <Alert
          message="Error"
          description={error}
          type="error"
          closable
          style={{ marginBottom: 16 }}
        />
      )}

      <Tabs items={tabs} />

      {/* Invite User Modal */}
      <Modal
        title="Invite User"
        open={inviteModalVisible}
        onCancel={() => setInviteModalVisible(false)}
        footer={null}
        width={500}
      >
        <Form form={inviteForm} layout="vertical" onFinish={handleInviteUser}>
          <Form.Item
            name="email"
            label="Email Address"
            rules={[
              { required: true, message: 'Please enter email address' },
              { type: 'email', message: 'Please enter a valid email address' },
            ]}
          >
            <Input placeholder="user@example.com" />
          </Form.Item>

          <Form.Item
            name="role"
            label="Role"
            rules={[{ required: true, message: 'Please select a role' }]}
            initialValue="member"
          >
            <Select>
              <Option value="admin">Admin</Option>
              <Option value="member">Member</Option>
              <Option value="viewer">Viewer</Option>
            </Select>
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={isLoading}>
                Send Invitation
              </Button>
              <Button onClick={() => setInviteModalVisible(false)}>Cancel</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};
