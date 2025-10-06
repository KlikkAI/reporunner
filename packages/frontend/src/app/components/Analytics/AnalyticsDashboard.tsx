/**
 * Enhanced Analytics Dashboard
 * Provides comprehensive workflow analytics and insights
 * Phase C: Polish & User Experience - Enhanced dashboard and analytics
 */

import {
  BarChartOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  DashboardOutlined,
  LineChartOutlined,
  PieChartOutlined,
  RocketOutlined,
  TrendingDownOutlined,
  TrendingUpOutlined,
} from '@ant-design/icons';
import {
  Alert,
  Button,
  Card,
  Col,
  DatePicker,
  Progress,
  Row,
  Select,
  Space,
  Spin,
  Statistic,
  Table,
  Tabs,
  Tag,
  Toolhy,
} from 'antd';
import dayjs from 'dayjs';
import type React from 'react';
import { useEffect, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from 'recharts';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { TabPane } = Tabs;
const { Option } = Select;

interface AnalyticsData {
  overview: {
    totalWorkflows: number;
    totalExecutions: number;
    successRate: number;
    avgExecutionTime: number;
    activeUsers: number;
    trendsData: Array<{
      date: string;
      executions: number;
      successRate: number;
      avgTime: number;
    }>;
  };
  performance: {
    slowestWorkflows: Array<{
      id: string;
      name: string;
      avgTime: number;
      executions: number;
      trend: 'up' | 'down' | 'stable';
    }>;
    errorPatterns: Array<{
      type: string;
      count: number;
      percentage: number;
    }>;
    resourceUsage: Array<{
      date: string;
      cpu: number;
      memory: number;
      network: number;
    }>;
  };
  workflows: {
    mostUsed: Array<{
      id: string;
      name: string;
      executions: number;
      successRate: number;
      category: string;
    }>;
    recentActivity: Array<{
      id: string;
      name: string;
      status: 'success' | 'error' | 'running';
      timestamp: string;
      duration: number;
    }>;
  };
  optimization: {
    suggestions: Array<{
      workflowId: string;
      workflowName: string;
      type: 'performance' | 'reliability' | 'cost';
      priority: 'high' | 'medium' | 'low';
      potentialImprovement: number;
    }>;
    implementedOptimizations: number;
    totalSavings: {
      time: number;
      cost: number;
    };
  };
}

interface AnalyticsDashboardProps {
  timeRange?: [dayjs.Dayjs, dayjs.Dayjs];
  onTimeRangeChange?: (range: [dayjs.Dayjs, dayjs.Dayjs]) => void;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  timeRange = [dayjs().subtract(7, 'days'), dayjs()],
  onTimeRangeChange,
}) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [selectedMetric, setSelectedMetric] = useState<string>('executions');
  const [activeTab, setActiveTab] = useState('overview');

  // Mock data - in production, this would come from API
  useEffect(() => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setData({
        overview: {
          totalWorkflows: 45,
          totalExecutions: 12847,
          successRate: 94.2,
          avgExecutionTime: 2.3,
          activeUsers: 23,
          trendsData: Array.from({ length: 7 }, (_, i) => ({
            date: dayjs()
              .subtract(6 - i, 'days')
              .format('MMM DD'),
            executions: Math.floor(Math.random() * 500) + 1500,
            successRate: Math.random() * 10 + 90,
            avgTime: Math.random() * 2 + 1.5,
          })),
        },
        performance: {
          slowestWorkflows: [
            {
              id: '1',
              name: 'Data Processing Pipeline',
              avgTime: 45.2,
              executions: 234,
              trend: 'up',
            },
            {
              id: '2',
              name: 'Email Campaign Automation',
              avgTime: 32.1,
              executions: 567,
              trend: 'down',
            },
            {
              id: '3',
              name: 'Customer Onboarding',
              avgTime: 28.7,
              executions: 123,
              trend: 'stable',
            },
          ],
          errorPatterns: [
            { type: 'Network Timeout', count: 45, percentage: 35 },
            { type: 'API Rate Limit', count: 32, percentage: 25 },
            { type: 'Data Validation', count: 28, percentage: 22 },
            { type: 'Authentication', count: 23, percentage: 18 },
          ],
          resourceUsage: Array.from({ length: 24 }, (_, i) => ({
            date: `${i}:00`,
            cpu: Math.random() * 40 + 30,
            memory: Math.random() * 30 + 40,
            network: Math.random() * 20 + 10,
          })),
        },
        workflows: {
          mostUsed: [
            {
              id: '1',
              name: 'Daily Report Generation',
              executions: 1234,
              successRate: 98.5,
              category: 'Reporting',
            },
            {
              id: '2',
              name: 'User Registration Flow',
              executions: 987,
              successRate: 96.2,
              category: 'User Management',
            },
            {
              id: '3',
              name: 'Inventory Sync',
              executions: 756,
              successRate: 94.8,
              category: 'Integration',
            },
          ],
          recentActivity: [
            {
              id: '1',
              name: 'Daily Report Generation',
              status: 'success',
              timestamp: '2 minutes ago',
              duration: 1.2,
            },
            {
              id: '2',
              name: 'Email Newsletter',
              status: 'running',
              timestamp: '5 minutes ago',
              duration: 0,
            },
            {
              id: '3',
              name: 'Data Backup',
              status: 'error',
              timestamp: '12 minutes ago',
              duration: 0.8,
            },
          ],
        },
        optimization: {
          suggestions: [
            {
              workflowId: '1',
              workflowName: 'Data Processing',
              type: 'performance',
              priority: 'high',
              potentialImprovement: 35,
            },
            {
              workflowId: '2',
              workflowName: 'Email Campaign',
              type: 'cost',
              priority: 'medium',
              potentialImprovement: 22,
            },
            {
              workflowId: '3',
              workflowName: 'User Onboarding',
              type: 'reliability',
              priority: 'high',
              potentialImprovement: 18,
            },
          ],
          implementedOptimizations: 12,
          totalSavings: {
            time: 145.6,
            cost: 2340,
          },
        },
      });
      setLoading(false);
    }, 1000);
  }, [timeRange]);

  const getStatusColor = (status: string) => {
    switch (status) {
      cess':
        return 'green';
      case 'error':
        return 'red';
      case 'running':
        return 'blue';
      default:
        return 'default';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUpOutlined style={{ color: '#f5222d' }} />;
      case 'down':
        return <TrendingDownOutlined style={{ color: '#52c41a' }} />;
      default:
        return <ClockCircleOutlined style={{ color: '#faad14' }} />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'red';
      case 'medium':
        return 'orange';
      case 'low':
        return 'green';
      default:
        return 'default';
    }
  };

  const renderOverviewTab = () => (
    <div>
      {/* Key Metrics */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Workflows"
              value={data?.overview.totalWorkflows}
              prefix={<DashboardOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Executions"
              value={data?.overview.totalExecutions}
              prefix={<RocketOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Success Rate"
              value={data?.overview.successRate}
              suffix="%"
              prefix={<CheckCircleOutlined />}
              valueStyle={{
                color:
                  data?.overview.successRate && data.overview.successRate > 95
                    ? '#52c41a'
                    : '#faad14',
              }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Avg Execution Time"
              value={data?.overview.avgExecutionTime}
              suffix="s"
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Trends Chart */}
      <Card title="Execution Trends" style={{ marginBottom: 24 }}>
        <div style={{ marginBottom: 16 }}>
          <Select value={selectedMetric} onChange={setSelectedMetric} style={{ width: 200 }}>
            <Option value="executions">Executions</Option>
            <Option value="successRate">Success Rate</Option>
            <Option value="avgTime">Average Time</Option>
          </Select>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data?.overview.trendsData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <RechartsTooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey={selectedMetric}
              stroke="#1890ff"
              strokeWidth={2}
              dot={{ fill: '#1890ff' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* Recent Activity */}
      <Card title="Recent Activity">
        <Table
          dataSource={data?.workflows.recentActivity}
          pagination={false}
          size="small"
          columns={[
            {
              title: 'Workflow',
              dataIndex: 'name',
              key: 'name',
            },
            {
              title: 'Status',
              dataIndex: 'status',
              key: 'status',
              render: (status: string) => (
                <Tag color={getStatusColor(status)}>{status.toUpperCase()}</Tag>
              ),
            },
            {
              title: 'Duration',
              dataIndex: 'duration',
              key: 'duration',
              render: (duration: number) => (duration > 0 ? `${duration}s` : '-'),
            },
            {
              title: 'Time',
              dataIndex: 'timestamp',
              key: 'timestamp',
            },
          ]}
        />
      </Card>
    </div>
  );

  const renderPerformanceTab = () => (
    <div>
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {/* Slowest Workflows */}
        <Col xs={24} lg={12}>
          <Card title="Slowest Workflows" extra={<BarChartOutlined />}>
            <Table
              dataSource={data?.performance.slowestWorkflows}
              pagination={false}
              size="small"
              columns={[
                {
                  title: 'Workflow',
                  dataIndex: 'name',
                  key: 'name',
                  ellipsis: true,
                },
                {
                  title: 'Avg Time',
                  dataIndex: 'avgTime',
                  key: 'avgTime',
                  render: (time: number) => `${time}s`,
                  sorter: (a, b) => a.avgTime - b.avgTime,
                },
                {
                  title: 'Trend',
                  dataIndex: 'trend',
                  key: 'trend',
                  render: (trend: string) => getTrendIcon(trend),
                },
              ]}
            />
          </Card>
        </Col>

        {/* Error Patterns */}
        <Col xs={24} lg={12}>
          <Card title="Error Patterns" extra={<PieChartOutlined />}>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={data?.performance.errorPatterns}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                  label={({ type, percentage }) => `${type}: ${percentage}%`}
                >
                  {data?.performance.errorPatterns.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={['#ff4d4f', '#faad14', '#1890ff', '#52c41a'][index % 4]}
                    />_entry
                  ))}
                </Pie>
                <RechartsTooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      {/* Resource Usage */}
      <Card title="Resource Usage (24h)" extra={<LineChartOutlined />}>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={data?.performance.resourceUsage}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <RechartsTooltip />
            <Legend />
            <Area
              type="monotone"
              dataKey="cpu"
              stackId="1"
              stroke="#ff4d4f"
              fill="#ff4d4f"
              fillOpacity={0.6}
            />
            <Area
              type="monotone"
              dataKey="memory"
              stackId="1"
              stroke="#1890ff"
              fill="#1890ff"
              fillOpacity={0.6}
            />
            <Area
              type="monotone"
              dataKey="network"
              stackId="1"
              stroke="#52c41a"
              fill="#52c41a"
              fillOpacity={0.6}
            />
          </AreaChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );

  const renderOptimizationTab = () => (
    <div>
      {/* Optimization Summary */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Optimizations Applied"
              value={data?.optimization.implementedOptimizations}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Time Saved"
              value={data?.optimization.totalSavings.time}
              suffix="hours"
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Cost Saved"
              value={data?.optimization.totalSavings.cost}
              prefix="$"
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Optimization Suggestions */}
      <Card title="Optimization Suggestions">
        <Table
          dataSource={data?.optimization.suggestions}
          pagination={false}
          columns={[
            {
              title: 'Workflow',
              dataIndex: 'workflowName',
              key: 'workflowName',
            },
            {
              title: 'Type',
              dataIndex: 'type',
              key: 'type',
              render: (type: string) => (
                <Tag color={type === 'performance' ? 'blue' : type === 'cost' ? 'green' : 'orange'}>
                  {type.toUpperCase()}
                </Tag>
              ),
            },
            {
              title: 'Priority',
              dataIndex: 'priority',
              key: 'priority',
              render: (priority: string) => (
                <Tag color={getPriorityColor(priority)}>{priority.toUpperCase()}</Tag>
              ),
            },
            {
              title: 'Potential Improvement',
              dataIndex: 'potentialImprovement',
              key: 'potentialImprovement',
              render: (improvement: number) => (
                <Progress
                  percent={improvement}
                  size="small"
                  status={improvement > 30 ? 'success' : improvement > 15 ? 'normal' : 'exception'}
                />
              ),
            },
            {
              title: 'Action',
              key: 'action',
              render: (_, record) => (
                <Button type="primary" size="small">
                  Apply
                </Button>
              ),_record
            },
          ]}
        />
      </Card>
    </div>
  );

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 50 }}>
        <Spin size="large" />
        <div style={{ marginTop: 16 }}>
          <Text>Loading analytics data...</Text>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      {/* Header */}
      <div
        style={{
          marginBottom: 24,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div>
          <Title level={2} style={{ margin: 0 }}>
            Analytics Dashboard
          </Title>
          <Text type="secondary">
            Comprehensive insights into your workflow performance and optimization opportunities
          </Text>
        </div>
        <Space>
          <RangePicker
            value={timeRange}
            onChange={(dates) => dates && onTimeRangeChange?.(dates as [dayjs.Dayjs, dayjs.Dayjs])}
          />
          <Button type="primary">Export Report</Button>
        </Space>
      </div>

      {/* AI Insights Alert */}
      <Alert
        message="AI Optimization Insights"
        description="Based on your workflow patterns, we've identified 3 high-priority optimization opportunities that could improve performance by up to 35%."
        type="info"
        showIcon
        action={
          <Button size="small" type="primary">
            View Suggestions
          </Button>
        }
        style={{ marginBottom: 24 }}
      />

      {/* Main Content */}
      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane tab="Overview" key="overview">
          {renderOverviewTab()}
        </TabPane>
        <TabPane tab="Performance" key="performance">
          {renderPerformanceTab()}
        </TabPane>
        <TabPane tab="Optimization" key="optimization">
          {renderOptimizationTab()}
        </TabPane>
      </Tabs>
    </div>
  );
};
