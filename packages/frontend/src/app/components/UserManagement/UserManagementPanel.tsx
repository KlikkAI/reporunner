/**
 * User Management Panel
 *
 * Comprehensive user management interface providing:
 * - User listing and search
 * - Role assignment and permissions
 * - User invitation system
 * - MFA management
 * - API key management
 * - SSO configuration
 */

import {
  CheckCircleOutlined,
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  KeyOutlined,
  LockOutlined,
  MailOutlined,
  MoreOutlined,
  SettingOutlined,
  TeamOutlined,
  UnlockOutlined,
  UserAddOutlined,
  UserOutlined,
} from '@ant-design/icons';
import {
  Avatar,
  Badge,
  Button,
  Card,
  Dropdown,
  Form,
  Input,
  List,
  Modal,
  Select,
  Space,
  Statistic,
  Switch,
  Table,
  Tabs,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import type React from 'react';
import { useCallback, useEffect, useState } from 'react';
// import { advancedAuthService } from "@/core/services/advancedAuthService";
import type {
  APIKey,
  SSOProvider,
  User,
  UserInvitation,
  UserRole,
} from '@/core/types/frontend-auth';
import { cn } from '@/design-system/utils';

const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;

interface UserManagementPanelProps {
  className?: string;
}

const UserManagementPanel: React.FC<UserManagementPanelProps> = ({ className }) => {
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [apiKeys, setApiKeys] = useState<APIKey[]>([]);
  const [invitations, setInvitations] = useState<UserInvitation[]>([]);
  const [ssoProviders, setSSOProviders] = useState<SSOProvider[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isAPIKeyModalOpen, setIsAPIKeyModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Load data on component mount
  useEffect(() => {
    loadUsers();
    loadRoles();
    loadAPIKeys();
    loadInvitations();
    loadSSOProviders();
  }, [loadAPIKeys, loadInvitations, loadRoles, loadSSOProviders, loadUsers]);

  const loadUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      // Simulate API call - in production, this would fetch from backend
      const mockUsers: User[] = [
        {
          id: 'user_1',
          email: 'admin@reporunner.com',
          name: 'Admin User',
          role: {
            id: 'admin',
            name: 'Administrator',
            description: 'System administration',
            level: 8,
            permissions: [],
            isSystem: true,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          },
          status: 'active',
          createdAt: Date.now(),
          lastLoginAt: Date.now() - 3600000,
          mfaEnabled: true,
          preferences: {
            theme: 'dark',
            language: 'en',
            timezone: 'UTC',
            notifications: {
              email: true,
              push: false,
              inApp: true,
              workflows: true,
              executions: true,
              security: true,
            },
            dashboard: {
              layout: 'grid',
              widgets: ['workflows', 'executions', 'recent'],
              refreshInterval: 30000,
            },
            editor: {
              autoSave: true,
              autoComplete: true,
              syntaxHighlighting: true,
              wordWrap: true,
            },
          },
          permissions: [],
          projects: [],
        },
        {
          id: 'user_2',
          email: 'editor@reporunner.com',
          name: 'Editor User',
          role: {
            id: 'editor',
            name: 'Editor',
            description: 'Create and edit workflows',
            level: 4,
            permissions: [],
            isSystem: false,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          },
          status: 'active',
          createdAt: Date.now() - 86400000,
          lastLoginAt: Date.now() - 7200000,
          mfaEnabled: false,
          preferences: {
            theme: 'light',
            language: 'en',
            timezone: 'UTC',
            notifications: {
              email: true,
              push: false,
              inApp: true,
              workflows: true,
              executions: true,
              security: true,
            },
            dashboard: {
              layout: 'list',
              widgets: ['workflows', 'executions'],
              refreshInterval: 60000,
            },
            editor: {
              autoSave: true,
              autoComplete: true,
              syntaxHighlighting: true,
              wordWrap: false,
            },
          },
          permissions: [],
          projects: [],
        },
        {
          id: 'user_3',
          email: 'viewer@reporunner.com',
          name: 'Viewer User',
          role: {
            id: 'viewer',
            name: 'Viewer',
            description: 'View-only access',
            level: 2,
            permissions: [],
            isSystem: true,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          },
          status: 'pending',
          createdAt: Date.now() - 172800000,
          mfaEnabled: false,
          preferences: {
            theme: 'dark',
            language: 'en',
            timezone: 'UTC',
            notifications: {
              email: false,
              push: false,
              inApp: true,
              workflows: false,
              executions: false,
              security: true,
            },
            dashboard: {
              layout: 'grid',
              widgets: ['workflows'],
              refreshInterval: 300000,
            },
            editor: {
              autoSave: false,
              autoComplete: false,
              syntaxHighlighting: true,
              wordWrap: true,
            },
          },
          permissions: [],
          projects: [],
        },
      ];
      setUsers(mockUsers);
    } catch (_error) {
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadRoles = useCallback(async () => {
    try {
      // Simulate API call
      const mockRoles: UserRole[] = [
        {
          id: 'owner',
          name: 'Owner',
          description: 'Full system access',
          level: 10,
          permissions: [],
          isSystem: true,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
        {
          id: 'admin',
          name: 'Administrator',
          description: 'System administration',
          level: 8,
          permissions: [],
          isSystem: true,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
        {
          id: 'manager',
          name: 'Manager',
          description: 'Project management',
          level: 6,
          permissions: [],
          isSystem: false,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
        {
          id: 'editor',
          name: 'Editor',
          description: 'Create and edit workflows',
          level: 4,
          permissions: [],
          isSystem: false,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
        {
          id: 'viewer',
          name: 'Viewer',
          description: 'View-only access',
          level: 2,
          permissions: [],
          isSystem: true,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ];
      setRoles(mockRoles);
    } catch (_error) {}
  }, []);

  const loadAPIKeys = useCallback(async () => {
    try {
      // Simulate API call
      const mockAPIKeys: APIKey[] = [
        {
          id: 'key_1',
          name: 'Development API Key',
          key: 'rr_dev_1234567890abcdef',
          keyHash: 'hash1',
          permissions: [],
          expiresAt: Date.now() + 365 * 24 * 60 * 60 * 1000,
          lastUsedAt: Date.now() - 3600000,
          createdAt: Date.now() - 86400000,
          createdBy: 'user_1',
          status: 'active',
          metadata: {
            description: 'API key for development environment',
          },
        },
        {
          id: 'key_2',
          name: 'Production API Key',
          key: 'rr_prod_abcdef1234567890',
          keyHash: 'hash2',
          permissions: [],
          expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
          lastUsedAt: Date.now() - 1800000,
          createdAt: Date.now() - 172800000,
          createdBy: 'user_1',
          status: 'active',
          metadata: {
            description: 'API key for production environment',
          },
        },
      ];
      setApiKeys(mockAPIKeys);
    } catch (_error) {}
  }, []);

  const loadInvitations = useCallback(async () => {
    try {
      // Simulate API call
      const mockInvitations: UserInvitation[] = [
        {
          id: 'invite_1',
          email: 'newuser@example.com',
          role: 'editor',
          permissions: [],
          projects: [],
          invitedBy: 'user_1',
          invitedAt: Date.now() - 86400000,
          expiresAt: Date.now() + 6 * 24 * 60 * 60 * 1000,
          status: 'pending',
          token: 'token123',
          message: 'Welcome to Reporunner!',
        },
      ];
      setInvitations(mockInvitations);
    } catch (_error) {}
  }, []);

  const loadSSOProviders = useCallback(async () => {
    try {
      // Simulate API call
      const mockProviders: SSOProvider[] = [
        {
          id: 'google',
          name: 'Google',
          type: 'oauth2',
          enabled: true,
          configuration: {
            issuer: 'https://accounts.google.com',
            clientId: 'google-client-id',
            redirectUri: 'http://localhost:3000/auth/callback/google',
            scopes: ['openid', 'email', 'profile'],
            endpoints: {
              authorization: 'https://accounts.google.com/o/oauth2/v2/auth',
              token: 'https://oauth2.googleapis.com/token',
              userInfo: 'https://www.googleapis.com/oauth2/v2/userinfo',
            },
            attributes: {
              email: 'email',
              name: 'name',
            },
          },
          metadata: {
            logo: 'https://developers.google.com/identity/images/g-logo.png',
            description: 'Sign in with Google',
          },
        },
        {
          id: 'microsoft',
          name: 'Microsoft',
          type: 'oauth2',
          enabled: false,
          configuration: {
            issuer: 'https://login.microsoftonline.com/common',
            clientId: 'microsoft-client-id',
            redirectUri: 'http://localhost:3000/auth/callback/microsoft',
            scopes: ['openid', 'email', 'profile'],
            endpoints: {
              authorization: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
              token: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
              userInfo: 'https://graph.microsoft.com/v1.0/me',
            },
            attributes: {
              email: 'mail',
              name: 'displayName',
            },
          },
          metadata: {
            logo: 'https://img.icons8.com/color/48/000000/microsoft.png',
            description: 'Sign in with Microsoft',
          },
        },
      ];
      setSSOProviders(mockProviders);
    } catch (_error) {}
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'green';
      case 'inactive':
        return 'gray';
      case 'pending':
        return 'orange';
      case 'suspended':
        return 'red';
      default:
        return 'default';
    }
  };

  const getRoleColor = (roleId: string) => {
    switch (roleId) {
      case 'owner':
        return 'red';
      case 'admin':
        return 'purple';
      case 'manager':
        return 'blue';
      case 'editor':
        return 'green';
      case 'viewer':
        return 'gray';
      default:
        return 'default';
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      !searchTerm ||
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole = selectedRole === 'all' || user.role.id === selectedRole;

    return matchesSearch && matchesRole;
  });

  const userColumns = [
    {
      title: 'User',
      key: 'user',
      render: (record: User) => (
        <div className="flex items-center gap-3">
          <Avatar size="small" icon={<UserOutlined />} />
          <div>
            <div className="text-white font-medium">{record.name}</div>
            <div className="text-gray-400 text-xs">{record.email}</div>
          </div>
        </div>
      ),
    },
    {
      title: 'Role',
      key: 'role',
      render: (record: User) => <Tag color={getRoleColor(record.role.id)}>{record.role.name}</Tag>,
    },
    {
      title: 'Status',
      key: 'status',
      render: (record: User) => <Tag color={getStatusColor(record.status)}>{record.status}</Tag>,
    },
    {
      title: 'MFA',
      key: 'mfa',
      render: (record: User) => (
        <Badge
          status={record.mfaEnabled ? 'success' : 'default'}
          text={record.mfaEnabled ? 'Enabled' : 'Disabled'}
        />
      ),
    },
    {
      title: 'Last Login',
      key: 'lastLogin',
      render: (record: User) => (
        <div className="text-gray-400 text-xs">
          {record.lastLoginAt ? new Date(record.lastLoginAt).toLocaleDateString() : 'Never'}
        </div>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (record: User) => (
        <Space size="small">
          <Tooltip title="Edit User">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={() => {
                setSelectedUser(record);
                setIsUserModalOpen(true);
              }}
              className="text-blue-400 hover:text-blue-300"
            />
          </Tooltip>
          <Tooltip title="Manage MFA">
            <Button
              type="text"
              size="small"
              icon={<CheckCircleOutlined />}
              onClick={() => {
                // Handle MFA management
              }}
              className="text-purple-400 hover:text-purple-300"
            />
          </Tooltip>
          <Dropdown
            menu={{
              items: [
                {
                  key: 'suspend',
                  label: record.status === 'active' ? 'Suspend User' : 'Activate User',
                  icon: record.status === 'active' ? <LockOutlined /> : <UnlockOutlined />,
                },
                {
                  key: 'delete',
                  label: 'Delete User',
                  icon: <DeleteOutlined />,
                  danger: true,
                },
              ],
            }}
            trigger={['click']}
          >
            <Button
              type="text"
              size="small"
              icon={<MoreOutlined />}
              className="text-gray-400 hover:text-gray-300"
            />
          </Dropdown>
        </Space>
      ),
    },
  ];

  const apiKeyColumns = [
    {
      title: 'Name',
      key: 'name',
      render: (_record: APIKey) => (
        <div>
          <div className="text-white font-medium">{_record.name}</div>
          <div className="text-gray-400 text-xs">{_record.metadata.description}</div>
        </div>
      ),
    },
    {
      title: 'Key',
      key: 'key',
      render: (_record: APIKey) => (
        <div className="font-mono text-xs text-gray-300">{_record.key.substring(0, 12)}...</div>
      ),
    },
    {
      title: 'Status',
      key: 'status',
      render: (_record: APIKey) => (
        <Tag color={_record.status === 'active' ? 'green' : 'red'}>{_record.status}</Tag>
      ),
    },
    {
      title: 'Expires',
      key: 'expires',
      render: (_record: APIKey) => (
        <div className="text-gray-400 text-xs">
          {_record.expiresAt ? new Date(_record.expiresAt).toLocaleDateString() : 'Never'}
        </div>
      ),
    },
    {
      title: 'Last Used',
      key: 'lastUsed',
      render: (_record: APIKey) => (
        <div className="text-gray-400 text-xs">
          {_record.lastUsedAt ? new Date(_record.lastUsedAt).toLocaleDateString() : 'Never'}
        </div>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_record: APIKey) => (
        <Space size="small">
          <Tooltip title="View Details">
            <Button
              type="text"
              size="small"
              icon={<EyeOutlined />}
              className="text-blue-400 hover:text-blue-300"
            />
          </Tooltip>
          <Tooltip title="Revoke Key">
            <Button
              type="text"
              size="small"
              icon={<DeleteOutlined />}
              className="text-red-400 hover:text-red-300"
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  const renderUserStats = () => (
    <div className="grid grid-cols-4 gap-4 mb-6">
      <Card size="small" className="bg-gray-800 border-gray-600">
        <Statistic title="Total Users" value={users.length} valueStyle={{ color: '#3b82f6' }} />
      </Card>
      <Card size="small" className="bg-gray-800 border-gray-600">
        <Statistic
          title="Active Users"
          value={users.filter((u) => u.status === 'active').length}
          valueStyle={{ color: '#22c55e' }}
        />
      </Card>
      <Card size="small" className="bg-gray-800 border-gray-600">
        <Statistic
          title="Pending Invitations"
          value={invitations.filter((i) => i.status === 'pending').length}
          valueStyle={{ color: '#f59e0b' }}
        />
      </Card>
      <Card size="small" className="bg-gray-800 border-gray-600">
        <Statistic
          title="MFA Enabled"
          value={users.filter((u) => u.mfaEnabled).length}
          valueStyle={{ color: '#8b5cf6' }}
        />
      </Card>
    </div>
  );

  const renderUsersTab = () => (
    <div className="space-y-4">
      {renderUserStats()}

      <Card size="small" className="bg-gray-800 border-gray-600">
        <div className="flex items-center justify-between mb-4">
          <Title level={5} className="text-white mb-0">
            Users
          </Title>
          <Space>
            <Search
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64"
            />
            <Select value={selectedRole} onChange={setSelectedRole} className="w-32">
              <Option value="all">All Roles</Option>
              {roles.map((role) => (
                <Option key={role.id} value={role.id}>
                  {role.name}
                </Option>
              ))}
            </Select>
            <Button
              type="primary"
              icon={<UserAddOutlined />}
              onClick={() => setIsInviteModalOpen(true)}
            >
              Invite User
            </Button>
          </Space>
        </div>

        <Table
          columns={userColumns}
          dataSource={filteredUsers}
          loading={isLoading}
          pagination={{ pageSize: 10 }}
          size="small"
          className="bg-transparent"
          rowKey="id"
        />
      </Card>
    </div>
  );

  const renderAPIKeysTab = () => (
    <div className="space-y-4">
      <Card size="small" className="bg-gray-800 border-gray-600">
        <div className="flex items-center justify-between mb-4">
          <Title level={5} className="text-white mb-0">
            API Keys
          </Title>
          <Button type="primary" icon={<KeyOutlined />} onClick={() => setIsAPIKeyModalOpen(true)}>
            Create API Key
          </Button>
        </div>

        <Table
          columns={apiKeyColumns}
          dataSource={apiKeys}
          pagination={{ pageSize: 10 }}
          size="small"
          className="bg-transparent"
          rowKey="id"
        />
      </Card>
    </div>
  );

  const renderInvitationsTab = () => (
    <div className="space-y-4">
      <Card size="small" className="bg-gray-800 border-gray-600">
        <div className="flex items-center justify-between mb-4">
          <Title level={5} className="text-white mb-0">
            Pending Invitations
          </Title>
          <Button type="primary" icon={<MailOutlined />} onClick={() => setIsInviteModalOpen(true)}>
            Send Invitation
          </Button>
        </div>

        <List
          dataSource={invitations.filter((i) => i.status === 'pending')}
          renderItem={(invitation) => (
            <List.Item
              actions={[
                <Button key="resend" type="text" size="small">
                  Resend
                </Button>,
                <Button key="revoke" type="text" size="small" danger>
                  Revoke
                </Button>,
              ]}
            >
              <List.Item.Meta
                avatar={<Avatar icon={<MailOutlined />} />}
                title={invitation.email}
                description={
                  <div>
                    <div>Role: {invitation.role}</div>
                    <div className="text-gray-400 text-xs">
                      Expires: {new Date(invitation.expiresAt).toLocaleDateString()}
                    </div>
                  </div>
                }
              />
            </List.Item>
          )}
        />
      </Card>
    </div>
  );

  const renderSSOTab = () => (
    <div className="space-y-4">
      <Card size="small" className="bg-gray-800 border-gray-600">
        <Title level={5} className="text-white mb-4">
          SSO Providers
        </Title>

        <div className="space-y-3">
          {ssoProviders.map((provider) => (
            <div
              key={provider.id}
              className="flex items-center justify-between p-3 bg-gray-700 rounded border border-gray-600"
            >
              <div className="flex items-center gap-3">
                <img src={provider.metadata.logo} alt={provider.name} className="w-8 h-8 rounded" />
                <div>
                  <div className="text-white font-medium">{provider.name}</div>
                  <div className="text-gray-400 text-xs">{provider.metadata.description}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={provider.enabled}
                  onChange={(_checked) => {
                    // Handle SSO provider toggle
                  }}
                />
                <Button
                  type="text"
                  size="small"
                  icon={<SettingOutlined />}
                  onClick={() => {
                    // Handle SSO configuration
                  }}
                  className="text-gray-400 hover:text-gray-300"
                />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );

  return (
    <div className={cn('h-full bg-gray-900', className)}>
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center gap-2 mb-2">
          <TeamOutlined className="text-blue-400 text-lg" />
          <Title level={4} className="text-white mb-0">
            User Management
          </Title>
        </div>
        <Text className="text-gray-400 text-sm">
          Manage users, roles, permissions, and authentication
        </Text>
      </div>

      <div className="p-4">
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          className="user-management-tabs"
          items={[
            {
              key: 'users',
              label: (
                <span>
                  <UserOutlined className="mr-1" />
                  Users
                  <Badge count={users.length} size="small" className="ml-2" />
                </span>
              ),
              children: renderUsersTab(),
            },
            {
              key: 'apikeys',
              label: (
                <span>
                  <KeyOutlined className="mr-1" />
                  API Keys
                  <Badge count={apiKeys.length} size="small" className="ml-2" />
                </span>
              ),
              children: renderAPIKeysTab(),
            },
            {
              key: 'invitations',
              label: (
                <span>
                  <MailOutlined className="mr-1" />
                  Invitations
                  <Badge
                    count={invitations.filter((i) => i.status === 'pending').length}
                    size="small"
                    className="ml-2"
                  />
                </span>
              ),
              children: renderInvitationsTab(),
            },
            {
              key: 'sso',
              label: (
                <span>
                  <LockOutlined className="mr-1" />
                  SSO
                  <Badge
                    count={ssoProviders.filter((p) => p.enabled).length}
                    size="small"
                    className="ml-2"
                  />
                </span>
              ),
              children: renderSSOTab(),
            },
          ]}
        />
      </div>

      {/* User Edit Modal */}
      <Modal
        title="Edit User"
        open={isUserModalOpen}
        onCancel={() => setIsUserModalOpen(false)}
        onOk={() => setIsUserModalOpen(false)}
        width={600}
      >
        {selectedUser && (
          <Form layout="vertical">
            <Form.Item label="Name">
              <Input value={selectedUser.name} />
            </Form.Item>
            <Form.Item label="Email">
              <Input value={selectedUser.email} />
            </Form.Item>
            <Form.Item label="Role">
              <Select value={selectedUser.role.id}>
                {roles.map((role) => (
                  <Option key={role.id} value={role.id}>
                    {role.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item label="Status">
              <Select value={selectedUser.status}>
                <Option value="active">Active</Option>
                <Option value="inactive">Inactive</Option>
                <Option value="suspended">Suspended</Option>
              </Select>
            </Form.Item>
          </Form>
        )}
      </Modal>

      {/* Invite User Modal */}
      <Modal
        title="Invite User"
        open={isInviteModalOpen}
        onCancel={() => setIsInviteModalOpen(false)}
        onOk={() => setIsInviteModalOpen(false)}
        width={500}
      >
        <Form layout="vertical">
          <Form.Item label="Email" required>
            <Input placeholder="user@example.com" />
          </Form.Item>
          <Form.Item label="Role" required>
            <Select placeholder="Select role">
              {roles.map((role) => (
                <Option key={role.id} value={role.id}>
                  {role.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item label="Message">
            <Input.TextArea placeholder="Welcome message (optional)" rows={3} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Create API Key Modal */}
      <Modal
        title="Create API Key"
        open={isAPIKeyModalOpen}
        onCancel={() => setIsAPIKeyModalOpen(false)}
        onOk={() => setIsAPIKeyModalOpen(false)}
        width={500}
      >
        <Form layout="vertical">
          <Form.Item label="Name" required>
            <Input placeholder="API Key Name" />
          </Form.Item>
          <Form.Item label="Description">
            <Input.TextArea placeholder="Description (optional)" rows={2} />
          </Form.Item>
          <Form.Item label="Expiration">
            <Select placeholder="Select expiration">
              <Option value="30">30 days</Option>
              <Option value="90">90 days</Option>
              <Option value="365">1 year</Option>
              <Option value="never">Never</Option>
            </Select>
          </Form.Item>
          <Form.Item label="Permissions">
            <Select mode="multiple" placeholder="Select permissions">
              <Option value="read">Read</Option>
              <Option value="write">Write</Option>
              <Option value="execute">Execute</Option>
              <Option value="manage">Manage</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default UserManagementPanel;
