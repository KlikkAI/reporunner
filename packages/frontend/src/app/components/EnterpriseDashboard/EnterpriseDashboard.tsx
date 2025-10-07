import {
  ApiOutlined,
  BugOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  DashboardOutlined,
  DatabaseOutlined,
  ExportOutlined,
  FallOutlined,
  ReloadOutlined,
  RiseOutlined,
  SecurityScanOutlined,
  TeamOutlined,
  ThunderboltOutlined,
  UserOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { Area, Column, Line, Pie } from '@ant-design/plots';
import {
  Alert,
  Avatar,
  Badge,
  Button,
  Card,
  Col,
  DatePicker,
  Progress,
  Row,
  Select,
  Space,
  Statistic,
  Table,
  Tabs,
  Tag,
  Timeline,
  Typography,
} from 'antd';
import type React from 'react';
import { useEffect, useState } from 'react';
import { useRBACStore } from '@/core/stores/rbacStore';

// import { auditService } from "@/core/services/auditService";
// import { securityService } from "@/core/services/securityService";

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

interface DashboardMetrics {
  organizations: {
    total: number;
    active: number;
    growth: number;
  };
  users: {
    total: number;
    active: number;
    newThisMonth: number;
    growth: number;
  };
  workflows: {
    total: number;
    active: number;
    executions: number;
    successRate: number;
  };
  security: {
    threats: number;
    alerts: number;
    complianceScore: number;
    lastIncident?: Date;
  };
  performance: {
    avgExecutionTime: number;
    systemUptime: number;
    errorRate: number;
    throughput: number;
  };
  costs: {
    monthlySpend: number;
    growth: number;
    costPerExecution: number;
  };
}

interface ActivityEvent {
  id: string;
  type: 'user_login' | 'workflow_execution' | 'security_alert' | 'system_event';
  title: string;
  description: string;
  timestamp: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
  user?: string;
  organization?: string;
}

export const EnterpriseDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [activities, setActivities] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<[any, any] | null>(null);
  const [selectedOrganization, setSelectedOrganization] = useState<string>('all');

  const { organizations, canManageOrganization } = useRBACStore();

  useEffect(() => {
    loadDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadDashboardData]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Simulate API calls - in real app these would be actual API endpoints
      const mockMetrics: DashboardMetrics = {
        organizations: {
          total: 25,
          active: 22,
          growth: 8.5,
        },
        users: {
          total: 1247,
          active: 892,
          newThisMonth: 156,
          growth: 12.3,
        },
        workflows: {
          total: 5432,
          active: 3891,
          executions: 125678,
          successRate: 94.7,
        },
        security: {
          threats: 3,
          alerts: 12,
          complianceScore: 92,
          lastIncident: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        },
        performance: {
          avgExecutionTime: 2.3,
          systemUptime: 99.97,
          errorRate: 0.8,
          throughput: 1250,
        },
        costs: {
          monthlySpend: 45678,
          growth: -5.2,
          costPerExecution: 0.036,
        },
      };

      const mockActivities: ActivityEvent[] = [
        {
          id: '1',
          type: 'security_alert',
          title: 'Multiple Failed Login Attempts',
          description: 'User john.doe@acme.com has 5 failed login attempts',
          timestamp: new Date(Date.now() - 30 * 60 * 1000),
          severity: 'high',
          user: 'john.doe@acme.com',
          organization: 'Acme Corp',
        },
        {
          id: '2',
          type: 'workflow_execution',
          title: 'High Volume Data Pipeline Completed',
          description: 'Successfully processed 50,000 records in 4.2 minutes',
          timestamp: new Date(Date.now() - 45 * 60 * 1000),
          severity: 'low',
          user: 'sarah.chen@techcorp.com',
          organization: 'TechCorp',
        },
        {
          id: '3',
          type: 'user_login',
          title: 'Admin Login from New Location',
          description: 'Administrator logged in from Tokyo, Japan',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
          severity: 'medium',
          user: 'admin@enterprise.com',
          organization: 'Enterprise Ltd',
        },
        {
          id: '4',
          type: 'system_event',
          title: 'System Maintenance Completed',
          description: 'Scheduled maintenance window completed successfully',
          timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
          severity: 'low',
        },
      ];

      setMetrics(mockMetrics);
      setActivities(mockActivities);
    } catch (_error) {
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type: ActivityEvent['type']) => {
    switch (type) {
      case 'security_alert':
        return <SecurityScanOutlined />;
      case 'workflow_execution':
        return <ThunderboltOutlined />;
      case 'user_login':
        return <UserOutlined />;
      case 'system_event':
        return <DatabaseOutlined />;
      default:
        return <ClockCircleOutlined />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return '#ff4d4f';
      case 'high':
        return '#fa8c16';
      case 'medium':
        return '#fadb14';
      case 'low':
        return '#52c41a';
      default:
        return '#d9d9d9';
    }
  };

  // Chart data
  const executionTrendData = [
    { date: '2024-01', executions: 8500 },
    { date: '2024-02', executions: 9200 },
    { date: '2024-03', executions: 8800 },
    { date: '2024-04', executions: 10500 },
    { date: '2024-05', executions: 11200 },
    { date: '2024-06', executions: 12800 },
  ];

  const userGrowthData = [
    { month: 'Jan', active: 750, total: 1100 },
    { month: 'Feb', active: 820, total: 1150 },
    { month: 'Mar', active: 780, total: 1180 },
    { month: 'Apr', active: 890, total: 1220 },
    { month: 'May', active: 850, total: 1250 },
    { month: 'Jun', active: 892, total: 1247 },
  ];

  const workflowCategoriesData = [
    { type: 'Data Processing', value: 35 },
    { type: 'Email Automation', value: 25 },
    { type: 'AI/ML Workflows', value: 20 },
    { type: 'Integration', value: 12 },
    { type: 'Other', value: 8 },
  ];

  const performanceData = [
    { time: '00:00', cpu: 45, memory: 62, throughput: 1200 },
    { time: '04:00', cpu: 32, memory: 58, throughput: 800 },
    { time: '08:00', cpu: 78, memory: 75, throughput: 2100 },
    { time: '12:00', cpu: 85, memory: 82, throughput: 2500 },
    { time: '16:00', cpu: 92, memory: 88, throughput: 2800 },
    { time: '20:00', cpu: 67, memory: 71, throughput: 1900 },
  ];

  const topUsersData = [
    {
      name: 'Sarah Chen',
      organization: 'TechCorp',
      executions: 1250,
      successRate: 98.5,
    },
    {
      name: 'Mike Johnson',
      organization: 'DataFlow Inc',
      executions: 980,
      successRate: 96.2,
    },
    {
      name: 'Lisa Wang',
      organization: 'AutoSys',
      executions: 875,
      successRate: 99.1,
    },
    {
      name: 'John Smith',
      organization: 'ProcessPro',
      executions: 820,
      successRate: 94.8,
    },
    {
      name: 'Emma Davis',
      organization: 'FlowTech',
      executions: 765,
      successRate: 97.3,
    },
  ];

  const topOrganizationsData = [
    {
      name: 'TechCorp',
      users: 89,
      workflows: 342,
      executions: 15680,
      growth: 15.2,
    },
    {
      name: 'DataFlow Inc',
      users: 67,
      workflows: 298,
      executions: 12450,
      growth: 8.7,
    },
    {
      name: 'AutoSys',
      users: 54,
      workflows: 234,
      executions: 9870,
      growth: 22.1,
    },
    {
      name: 'ProcessPro',
      users: 43,
      workflows: 187,
      executions: 7890,
      growth: -2.4,
    },
    {
      name: 'FlowTech',
      users: 38,
      workflows: 156,
      executions: 6540,
      growth: 11.8,
    },
  ];

  const tabs = [
    {
      key: 'overview',
      label: (
        <span>
          <DashboardOutlined />
          Overview
        </span>
      ),
      children: (
        <div>
          {/* Key Metrics */}
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col span={6}>
              <Card>
                <Statistic
                  title="Total Organizations"
                  value={metrics?.organizations.total}
                  prefix={<TeamOutlined />}
                  suffix={
                    <span style={{ fontSize: '14px', color: '#52c41a' }}>
                      <RiseOutlined /> {metrics?.organizations.growth}%
                    </span>
                  }
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="Active Users"
                  value={metrics?.users.active}
                  prefix={<UserOutlined />}
                  suffix={
                    <span style={{ fontSize: '14px', color: '#52c41a' }}>
                      <RiseOutlined /> {metrics?.users.growth}%
                    </span>
                  }
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="Workflow Executions"
                  value={metrics?.workflows.executions}
                  prefix={<ThunderboltOutlined />}
                  suffix={
                    <span style={{ fontSize: '14px' }}>
                      {metrics?.workflows.successRate}% success
                    </span>
                  }
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="System Uptime"
                  value={metrics?.performance.systemUptime}
                  precision={2}
                  suffix="%"
                  prefix={<CheckCircleOutlined />}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Card>
            </Col>
          </Row>

          {/* Charts */}
          <Row gutter={[16, 16]}>
            <Col span={12}>
              <Card
                title="Execution Trends"
                extra={
                  <Button icon={<ExportOutlined />} size="small">
                    Export
                  </Button>
                }
              >
                <Line
                  data={executionTrendData}
                  xField="date"
                  yField="executions"
                  height={300}
                  smooth
                  point={{ size: 5, shape: 'circle' }}
                />
              </Card>
            </Col>
            <Col span={12}>
              <Card
                title="User Growth"
                extra={
                  <Button icon={<ExportOutlined />} size="small">
                    Export
                  </Button>
                }
              >
                <Column
                  data={userGrowthData}
                  xField="month"
                  yField="total"
                  height={300}
                  columnStyle={{ fill: '#1890ff' }}
                />
              </Card>
            </Col>
          </Row>
        </div>
      ),
    },
    {
      key: 'performance',
      label: (
        <span>
          <RiseOutlined />
          Performance
        </span>
      ),
      children: (
        <div>
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col span={6}>
              <Card>
                <Statistic
                  title="Avg Execution Time"
                  value={metrics?.performance.avgExecutionTime}
                  precision={1}
                  suffix="s"
                  prefix={<ClockCircleOutlined />}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="Error Rate"
                  value={metrics?.performance.errorRate ?? 0}
                  precision={1}
                  suffix="%"
                  prefix={<BugOutlined />}
                  valueStyle={{
                    color: (metrics?.performance.errorRate ?? 0) > 2 ? '#cf1322' : '#52c41a',
                  }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="Throughput"
                  value={metrics?.performance.throughput}
                  suffix="/hour"
                  prefix={<ApiOutlined />}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="Monthly Spend"
                  value={metrics?.costs.monthlySpend}
                  prefix="$"
                  suffix={
                    <span
                      style={{
                        fontSize: '14px',
                        color: (metrics?.costs.growth ?? 0) < 0 ? '#52c41a' : '#cf1322',
                      }}
                    >
                      {(metrics?.costs.growth ?? 0) < 0 ? <FallOutlined /> : <RiseOutlined />}{' '}
                      {Math.abs(metrics?.costs.growth ?? 0)}%
                    </span>
                  }
                />
              </Card>
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            <Col span={16}>
              <Card
                title="System Performance (24h)"
                extra={
                  <Button icon={<ReloadOutlined />} size="small">
                    Refresh
                  </Button>
                }
              >
                <Area
                  data={performanceData}
                  xField="time"
                  yField="cpu"
                  height={300}
                  // @ts-expect-error Area config shape may differ by version
                  areaStyle={{ fill: 'l(270) 0:#ffffff 0.5:#7ec2f3 1:#1890ff' }}
                />
              </Card>
            </Col>
            <Col span={8}>
              <Card title="Workflow Categories">
                <Pie
                  data={workflowCategoriesData}
                  angleField="value"
                  colorField="type"
                  height={300}
                  radius={0.8}
                  label={{
                    type: 'spider',
                    content: '{name}\n{percentage}',
                  }}
                />
              </Card>
            </Col>
          </Row>
        </div>
      ),
    },
    {
      key: 'security',
      label: (
        <span>
          <SecurityScanOutlined />
          Security
          {metrics?.security && metrics.security.alerts > 0 && (
            <Badge count={metrics.security.alerts} style={{ marginLeft: 8 }} />
          )}
        </span>
      ),
      children: (
        <div>
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col span={6}>
              <Card>
                <Statistic
                  title="Active Threats"
                  value={metrics?.security.threats ?? 0}
                  prefix={<WarningOutlined />}
                  valueStyle={{
                    color: (metrics?.security.threats ?? 0) > 0 ? '#cf1322' : '#52c41a',
                  }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="Security Alerts"
                  value={metrics?.security.alerts ?? 0}
                  prefix={<SecurityScanOutlined />}
                  valueStyle={{
                    color: (metrics?.security.alerts ?? 0) > 5 ? '#fa8c16' : '#52c41a',
                  }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="Compliance Score"
                  value={metrics?.security.complianceScore ?? 0}
                  suffix="%"
                  prefix={<CheckCircleOutlined />}
                  valueStyle={{
                    color: (metrics?.security?.complianceScore ?? 0) >= 90 ? '#52c41a' : '#fa8c16',
                  }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="Last Incident"
                  value={
                    metrics?.security.lastIncident
                      ? Math.floor(
                          (Date.now() - metrics.security.lastIncident.getTime()) /
                            (24 * 60 * 60 * 1000)
                        )
                      : 0
                  }
                  suffix=" days ago"
                  prefix={<ClockCircleOutlined />}
                />
              </Card>
            </Col>
          </Row>

          {(metrics?.security.alerts ?? 0) > 0 && (
            <Alert
              message="Security Alerts Require Attention"
              description={`There are ${metrics?.security.alerts ?? 0} active security alerts that need investigation.`}
              type="warning"
              showIcon
              style={{ marginBottom: 24 }}
              action={
                <Button size="small" type="primary">
                  View All Alerts
                </Button>
              }
            />
          )}

          <Card title="Security Overview">
            <Row gutter={16}>
              <Col span={12}>
                <div style={{ marginBottom: 16 }}>
                  <Text strong>Threat Detection</Text>
                  <Progress percent={85} status="active" strokeColor="#52c41a" />
                </div>
                <div style={{ marginBottom: 16 }}>
                  <Text strong>Access Control</Text>
                  <Progress percent={92} status="active" strokeColor="#1890ff" />
                </div>
                <div style={{ marginBottom: 16 }}>
                  <Text strong>Data Encryption</Text>
                  <Progress percent={98} status="active" strokeColor="#722ed1" />
                </div>
              </Col>
              <Col span={12}>
                <div style={{ marginBottom: 16 }}>
                  <Text strong>Audit Coverage</Text>
                  <Progress percent={94} status="active" strokeColor="#fa8c16" />
                </div>
                <div style={{ marginBottom: 16 }}>
                  <Text strong>Vulnerability Management</Text>
                  <Progress percent={88} status="active" strokeColor="#13c2c2" />
                </div>
                <div style={{ marginBottom: 16 }}>
                  <Text strong>Incident Response</Text>
                  <Progress percent={90} status="active" strokeColor="#eb2f96" />
                </div>
              </Col>
            </Row>
          </Card>
        </div>
      ),
    },
    {
      key: 'organizations',
      label: (
        <span>
          <TeamOutlined />
          Organizations
        </span>
      ),
      children: (
        <div>
          <Card
            title="Top Organizations"
            extra={
              <Space>
                <Button icon={<ExportOutlined />} size="small">
                  Export
                </Button>
                <Button icon={<ReloadOutlined />} size="small">
                  Refresh
                </Button>
              </Space>
            }
          >
            <Table
              dataSource={topOrganizationsData}
              pagination={false}
              columns={[
                {
                  title: 'Organization',
                  dataIndex: 'name',
                  key: 'name',
                  render: (name: string) => (
                    <div>
                      <Avatar size="small" style={{ backgroundColor: '#1890ff', marginRight: 8 }}>
                        {name.charAt(0)}
                      </Avatar>
                      <Text strong>{name}</Text>
                    </div>
                  ),
                },
                {
                  title: 'Users',
                  dataIndex: 'users',
                  key: 'users',
                  render: (users: number) => <Statistic value={users} />,
                },
                {
                  title: 'Workflows',
                  dataIndex: 'workflows',
                  key: 'workflows',
                  render: (workflows: number) => <Statistic value={workflows} />,
                },
                {
                  title: 'Executions',
                  dataIndex: 'executions',
                  key: 'executions',
                  render: (executions: number) => <Statistic value={executions} />,
                },
                {
                  title: 'Growth',
                  dataIndex: 'growth',
                  key: 'growth',
                  render: (growth: number) => (
                    <span style={{ color: growth >= 0 ? '#52c41a' : '#cf1322' }}>
                      {growth >= 0 ? <RiseOutlined /> : <FallOutlined />} {Math.abs(growth)}%
                    </span>
                  ),
                },
              ]}
            />
          </Card>

          <Card title="Top Users" style={{ marginTop: 16 }}>
            <Table
              dataSource={topUsersData}
              pagination={false}
              columns={[
                {
                  title: 'User',
                  dataIndex: 'name',
                  key: 'name',
                  render: (name: string, record: any) => (
                    <div>
                      <Avatar size="small" icon={<UserOutlined />} style={{ marginRight: 8 }} />
                      <div>
                        <Text strong>{name}</Text>
                        <br />
                        <Text type="secondary">{record.organization}</Text>
                      </div>
                    </div>
                  ),
                },
                {
                  title: 'Executions',
                  dataIndex: 'executions',
                  key: 'executions',
                  render: (executions: number) => <Statistic value={executions} />,
                },
                {
                  title: 'Success Rate',
                  dataIndex: 'successRate',
                  key: 'successRate',
                  render: (rate: number) => (
                    <Progress
                      percent={rate}
                      size="small"
                      status={rate >= 95 ? 'success' : rate >= 90 ? 'normal' : 'exception'}
                    />
                  ),
                },
              ]}
            />
          </Card>
        </div>
      ),
    },
    {
      key: 'activity',
      label: (
        <span>
          <ClockCircleOutlined />
          Activity
        </span>
      ),
      children: (
        <div>
          <Card
            title="Recent Activity"
            extra={
              <Space>
                <Select defaultValue="all" style={{ width: 120 }}>
                  <Option value="all">All Events</Option>
                  <Option value="security">Security</Option>
                  <Option value="workflow">Workflows</Option>
                  <Option value="user">Users</Option>
                </Select>
                <Button icon={<ReloadOutlined />} size="small">
                  Refresh
                </Button>
              </Space>
            }
          >
            <Timeline>
              {activities.map((activity) => (
                <Timeline.Item
                  key={activity.id}
                  dot={
                    <Avatar
                      size="small"
                      style={{
                        backgroundColor: getSeverityColor(activity.severity),
                      }}
                      icon={getActivityIcon(activity.type)}
                    />
                  }
                >
                  <div>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <Text strong>{activity.title}</Text>
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        {activity.timestamp.toLocaleTimeString()}
                      </Text>
                    </div>
                    <div style={{ marginTop: 4 }}>
                      <Text>{activity.description}</Text>
                    </div>
                    {(activity.user || activity.organization) && (
                      <div style={{ marginTop: 8 }}>
                        {activity.user && (
                          <Tag icon={<UserOutlined />} color="blue">
                            {activity.user}
                          </Tag>
                        )}
                        {activity.organization && (
                          <Tag icon={<TeamOutlined />} color="green">
                            {activity.organization}
                          </Tag>
                        )}
                        <Tag color={getSeverityColor(activity.severity)}>{activity.severity}</Tag>
                      </div>
                    )}
                  </div>
                </Timeline.Item>
              ))}
            </Timeline>
          </Card>
        </div>
      ),
    },
  ];

  if (!metrics) {
    return <div>Loading...</div>;
  }

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: 24 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <Title level={2}>
              <DashboardOutlined /> Enterprise Dashboard
            </Title>
            <Text type="secondary">
              Comprehensive overview of your organization's automation platform
            </Text>
          </div>
          <Space>
            <RangePicker value={dateRange} onChange={setDateRange} style={{ width: 300 }} />
            {canManageOrganization() && (
              <Select
                value={selectedOrganization}
                onChange={setSelectedOrganization}
                style={{ width: 200 }}
              >
                <Option value="all">All Organizations</Option>
                {organizations.map((org) => (
                  <Option key={org.id} value={org.id}>
                    {org.name}
                  </Option>
                ))}
              </Select>
            )}
            <Button icon={<ReloadOutlined />} onClick={loadDashboardData} loading={loading}>
              Refresh
            </Button>
          </Space>
        </div>
      </div>

      <Tabs items={tabs} />
    </div>
  );
};
