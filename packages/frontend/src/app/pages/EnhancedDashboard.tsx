/**
 * Enhanced Dashboard Page
 * Integrates all Phase C improvements: Analytics, Onboarding, Accessibility, and Performance
 * Phase C: Polish & User Experience - Modern, intuitive dashboard
 */

import {
  AppstoreOutlined,
  BarChartOutlined,
  BulbOutlined,
  DashboardOutlined,
  PlayCircleOutlined,
  PlusOutlined,
  QuestionCircleOutlined,
  RocketOutlined,
  SettingOutlined,
  TeamOutlined,
  TrophyOutlined,
} from '@ant-design/icons';
import {
  Alert,
  Avatar,
  Button,
  Card,
  Col,
  FloatButton,
  List,
  Row,
  Space,
  Statistic,
  Tabs,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import dayjs from 'dayjs';
import type React from 'react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useScreenReaderAnnouncements } from '../components/Accessibility';
import { AnalyticsDashboard } from '../components/Analytics';
import { useResponsive } from '../components/Layout';
import { OnboardingProgress, OnboardingTour, useOnboarding } from '../components/Onboarding';
import { useCachedFetch, usePerformanceMonitor } from '../utils/performance';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;

interface DashboardData {
  quickStats: {
    totalWorkflows: number;
    activeWorkflows: number;
    totalExecutions: number;
    successRate: number;
  };
  recentActivity: Array<{
    id: string;
    type: 'workflow_created' | 'workflow_executed' | 'plugin_installed' | 'optimization_applied';
    title: string;
    description: string;
    timestamp: string;
    status: 'success' | 'warning' | 'error';
  }>;
  recommendations: Array<{
    id: string;
    type: 'optimization' | 'plugin' | 'tutorial' | 'feature';
    title: string;
    description: string;
    action: string;
    priority: 'high' | 'medium' | 'low';
  }>;
  quickActions: Array<{
    id: string;
    title: string;
    description: string;
    icon: React.ReactNode;
    action: () => void;
    color: string;
  }>;
}

export const EnhancedDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [timeRange, setTimeRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().subtract(7, 'days'),
    dayjs(),
  ]);

  // Hooks
  const navigate = useNavigate();
  const { isMobile } = useResponsive();
  // useAccessibility hook available if needed
  const { announceNavigation, announceSuccess } = useScreenReaderAnnouncements();
  const {
    isOnboardingOpen,
    completedSteps,
    userType,
    completeOnboarding,
    resumeOnboarding,
    closeOnboarding,
  } = useOnboarding();
  const performanceMonitor = usePerformanceMonitor('dashboard-load');

  // Fetch dashboard data with caching
  const {
    data: dashboardData,
    loading,
    error,
    refetch,
  } = useCachedFetch<DashboardData>(
    '/api/dashboard/overview',
    {},
    5 * 60 * 1000 // 5 minutes cache
  );

  // Performance monitoring
  useEffect(() => {
    performanceMonitor.start();
    announceNavigation('Dashboard');

    return () => {
      performanceMonitor.end();
    };
  }, [announceNavigation, performanceMonitor.end, performanceMonitor.start]);

  // Mock data for demonstration
  const mockDashboardData: DashboardData = {
    quickStats: {
      totalWorkflows: 24,
      activeWorkflows: 18,
      totalExecutions: 1247,
      successRate: 94.2,
    },
    recentActivity: [
      {
        id: '1',
        type: 'workflow_executed',
        title: 'Daily Report Generation',
        description: 'Completed successfully in 2.3s',
        timestamp: '2 minutes ago',
        status: 'success',
      },
      {
        id: '2',
        type: 'optimization_applied',
        title: 'Performance Optimization',
        description: 'Applied caching to Email Campaign workflow',
        timestamp: '15 minutes ago',
        status: 'success',
      },
      {
        id: '3',
        type: 'plugin_installed',
        title: 'Slack Integration',
        description: 'New plugin installed from marketplace',
        timestamp: '1 hour ago',
        status: 'success',
      },
      {
        id: '4',
        type: 'workflow_created',
        title: 'Customer Onboarding',
        description: 'New workflow created from template',
        timestamp: '3 hours ago',
        status: 'success',
      },
    ],
    recommendations: [
      {
        id: '1',
        type: 'optimization',
        title: 'Optimize Data Processing Workflow',
        description: 'Your workflow could be 35% faster with caching',
        action: 'Apply Optimization',
        priority: 'high',
      },
      {
        id: '2',
        type: 'plugin',
        title: 'Try the New AI Assistant Plugin',
        description: 'Automate complex tasks with AI-powered assistance',
        action: 'Install Plugin',
        priority: 'medium',
      },
      {
        id: '3',
        type: 'tutorial',
        title: 'Learn Advanced Workflow Patterns',
        description: 'Master conditional logic and error handling',
        action: 'Start Tutorial',
        priority: 'low',
      },
    ],
    quickActions: [
      {
        id: '1',
        title: 'Create Workflow',
        description: 'Start building a new automation',
        icon: <PlusOutlined />,
        action: () => navigate('/app/workflow'),
        color: '#1890ff',
      },
      {
        id: '2',
        title: 'Browse Marketplace',
        description: 'Discover new plugins and integrations',
        icon: <AppstoreOutlined />,
        action: () => {},
        color: '#52c41a',
      },
      {
        id: '3',
        title: 'View Analytics',
        description: 'Analyze your workflow performance',
        icon: <BarChartOutlined />,
        action: () => setActiveTab('analytics'),
        color: '#722ed1',
      },
      {
        id: '4',
        title: 'Manage Team',
        description: 'Invite team members and manage permissions',
        icon: <TeamOutlined />,
        action: () => {},
        color: '#fa8c16',
      },
    ],
  };

  const data = dashboardData || mockDashboardData;

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'workflow_created':
        return <PlusOutlined />;
      case 'workflow_executed':
        return <PlayCircleOutlined />;
      case 'plugin_installed':
        return <AppstoreOutlined />;
      case 'optimization_applied':
        return <RocketOutlined />;
      default:
        return <DashboardOutlined />;
    }
  };

  const getActivityColor = (status: string) => {
    switch (status) {
      case 'success':
        return '#52c41a';
      case 'warning':
        return '#faad14';
      case 'error':
        return '#ff4d4f';
      default:
        return '#1890ff';
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

  const handleRecommendationAction = (recommendation: any) => {
    announceSuccess(`${recommendation.action} initiated`);
  };

  const renderOverviewTab = () => (
    <div>
      {/* Welcome Section */}
      <Card
        style={{
          marginBottom: 24,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          border: 'none',
        }}
      >
        <div style={{ color: 'white' }}>
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <div>
              <Title level={2} style={{ color: 'white', margin: 0 }}>
                Welcome back! 👋
              </Title>
              <Paragraph style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '16px', margin: 0 }}>
                Your workflows have processed {data.quickStats.totalExecutions.toLocaleString()}{' '}
                executions with a {data.quickStats.successRate}% success rate.
              </Paragraph>
            </div>

            {completedSteps.length < 6 && (
              <Alert
                message="Complete your onboarding to unlock all features"
                description={`${completedSteps.length}/6 steps completed`}
                type="info"
                showIcon
                action={
                  <Button size="small" onClick={resumeOnboarding}>
                    Resume Tour
                  </Button>
                }
                style={{ background: 'rgba(255, 255, 255, 0.1)', border: 'none' }}
              />
            )}
          </Space>
        </div>
      </Card>

      {/* Quick Stats */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Workflows"
              value={data.quickStats.totalWorkflows}
              prefix={<DashboardOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Active Workflows"
              value={data.quickStats.activeWorkflows}
              prefix={<PlayCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Executions"
              value={data.quickStats.totalExecutions}
              prefix={<RocketOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Success Rate"
              value={data.quickStats.successRate}
              suffix="%"
              prefix={<TrophyOutlined />}
              valueStyle={{ color: data.quickStats.successRate > 95 ? '#52c41a' : '#faad14' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Quick Actions */}
      <Card title="Quick Actions" style={{ marginBottom: 24 }}>
        <Row gutter={[16, 16]}>
          {data.quickActions.map((action) => (
            <Col key={action.id} xs={24} sm={12} md={6}>
              <Card
                hoverable
                onClick={action.action}
                style={{ textAlign: 'center', cursor: 'pointer' }}
                bodyStyle={{ padding: '20px' }}
              >
                <Space direction="vertical" size="middle">
                  <Avatar size={48} icon={action.icon} style={{ backgroundColor: action.color }} />
                  <div>
                    <Text strong>{action.title}</Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      {action.description}
                    </Text>
                  </div>
                </Space>
              </Card>
            </Col>
          ))}
        </Row>
      </Card>

      <Row gutter={[16, 16]}>
        {/* Recent Activity */}
        <Col xs={24} lg={12}>
          <Card title="Recent Activity" extra={<Button type="link">View All</Button>}>
            <List
              dataSource={data.recentActivity}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={
                      <Avatar
                        icon={getActivityIcon(item.type)}
                        style={{ backgroundColor: getActivityColor(item.status) }}
                      />
                    }
                    title={item.title}
                    description={
                      <Space>
                        <Text type="secondary">{item.description}</Text>
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                          {item.timestamp}
                        </Text>
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>

        {/* Recommendations */}
        <Col xs={24} lg={12}>
          <Card title="Recommendations" extra={<BulbOutlined />}>
            <List
              dataSource={data.recommendations}
              renderItem={(item) => (
                <List.Item
                  actions={[
                    <Button
                      key="action"
                      type="primary"
                      size="small"
                      onClick={() => handleRecommendationAction(item)}
                    >
                      {item.action}
                    </Button>,
                  ]}
                >
                  <List.Item.Meta
                    title={
                      <Space>
                        {item.title}
                        <Tag color={getPriorityColor(item.priority)}>
                          {item.priority.toUpperCase()}
                        </Tag>
                      </Space>
                    }
                    description={item.description}
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );

  if (loading) {
    return (
      <div style={{ padding: 24 }}>
        <Card loading style={{ minHeight: 400 }} />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 24 }}>
        <Alert
          message="Failed to load dashboard"
          description="Please try refreshing the page or contact support if the issue persists."
          type="error"
          showIcon
          action={
            <Button size="small" onClick={() => refetch()}>
              Retry
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div style={{ padding: isMobile ? 16 : 24 }}>
      {/* Header */}
      <div
        style={{
          marginBottom: 24,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div>
          <Title level={2} style={{ margin: 0 }}>
            Dashboard
          </Title>
          <Text type="secondary">Monitor your workflows and system performance</Text>
        </div>

        <Space wrap>
          <Tooltip title="Accessibility Settings">
            <Button icon={<SettingOutlined />} />
          </Tooltip>
          <Button type="primary" icon={<PlusOutlined />}>
            {isMobile ? 'New' : 'New Workflow'}
          </Button>
        </Space>
      </div>

      {/* Main Content */}
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        size={(isMobile ? 'small' : 'default') as any}
      >
        <TabPane tab="Overview" key="overview">
          {renderOverviewTab()}
        </TabPane>

        <TabPane tab="Analytics" key="analytics">
          <AnalyticsDashboard timeRange={timeRange} onTimeRangeChange={setTimeRange} />
        </TabPane>
      </Tabs>

      {/* Onboarding Tour */}
      <OnboardingTour
        open={isOnboardingOpen}
        onClose={closeOnboarding}
        onComplete={completeOnboarding}
        userType={userType}
      />

      {/* Onboarding Progress Indicator */}
      <OnboardingProgress
        completedSteps={completedSteps}
        totalSteps={6}
        onResume={resumeOnboarding}
      />

      {/* Mobile Floating Actions */}
      {isMobile && (
        <FloatButton.Group
          trigger="click"
          type="primary"
          style={{ right: 24, bottom: 24 }}
          icon={<PlusOutlined />}
          tooltip="Quick Actions"
        >
          <FloatButton icon={<AppstoreOutlined />} tooltip="New Workflow" onClick={() => {}} />
          <FloatButton
            icon={<QuestionCircleOutlined />}
            tooltip="Help"
            onClick={resumeOnboarding}
          />
        </FloatButton.Group>
      )}
    </div>
  );
};
