/**
 * Analytics Dashboard
 *
 * Comprehensive analytics and performance monitoring dashboard providing
 * insights, bottleneck detection, cost optimization, and predictive analytics.
 * Inspired by DataDog, New Relic, and Grafana dashboards.
 */

import {
  BarChartOutlined,
  BulbOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  DashboardOutlined,
  DollarCircleOutlined,
  ReloadOutlined,
  RiseOutlined,
  RobotOutlined,
  ThunderboltOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import {
  Badge,
  Button,
  Card,
  Col,
  Empty,
  List,
  Modal,
  Row,
  Select,
  Statistic,
  Switch,
  Table,
  Tabs,
  Tag,
} from 'antd';
import type React from 'react';
import { useEffect, useMemo } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from 'recharts';
import type { NodePerformanceStats } from '../../../core/services/analyticsService';
import {
  formatCurrency,
  formatDuration,
  getCostTrend,
  getExecutionSummary,
  getTopBottlenecks,
  useAnalyticsStore,
} from '../../../core/stores/analyticsStore';

const { TabPane } = Tabs;
const { Option } = Select;

interface AnalyticsDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  workflowId?: string;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  isOpen,
  onClose,
  workflowId,
}) => {
  const {
    currentAnalytics,
    isLoading,
    lastUpdated,
    bottlenecks,
    predictiveInsights,
    costOptimization,
    performanceHistory,
    costHistory,
    reliabilityHistory,
    selectedTab,
    analyticsPeriod,
    // showPredictions,  // TODO: Implement predictions UI
    // showCostAnalysis, // TODO: Implement cost analysis UI
    autoRefresh,
    // selectedNodeId,   // TODO: Implement node selection
    setSelectedTab,
    setAnalyticsPeriod,
    toggleAutoRefresh,
    // togglePredictions,  // TODO: Implement predictions toggle
    // toggleCostAnalysis, // TODO: Implement cost analysis toggle
    setSelectedNode,
    loadAnalytics,
    refreshAnalytics,
  } = useAnalyticsStore();

  // Load analytics when modal opens
  useEffect(() => {
    if (isOpen && workflowId && workflowId !== currentAnalytics?.workflowId) {
      loadAnalytics(workflowId);
    }
  }, [isOpen, workflowId, loadAnalytics, currentAnalytics?.workflowId]);

  const executionSummary = useMemo(() => getExecutionSummary(currentAnalytics), [currentAnalytics]);

  const topBottlenecks = useMemo(() => getTopBottlenecks(bottlenecks, 5), [bottlenecks]);

  const costTrend = useMemo(() => getCostTrend(costHistory), [costHistory]);

  // Chart colors
  const chartColors = {
    primary: '#1890ff',
    success: '#52c41a',
    warning: '#faad14',
    danger: '#ff4d4f',
    purple: '#722ed1',
    cyan: '#13c2c2',
  };

  // Overview Tab Component
  const OverviewTab: React.FC = () => (
    <div className="space-y-6">
      {/* Key Metrics */}
      <Row gutter={[16, 16]}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Executions"
              value={executionSummary?.totalExecutions || 0}
              prefix={<ThunderboltOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Success Rate"
              value={executionSummary?.successRate || 0}
              suffix="%"
              precision={1}
              prefix={<CheckCircleOutlined />}
              valueStyle={{
                color: (executionSummary?.successRate || 0) >= 95 ? '#3f8600' : '#cf1322',
              }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Avg Duration"
              value={formatDuration(executionSummary?.avgDuration || 0)}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Efficiency Score"
              value={executionSummary?.efficiency || 0}
              suffix="/100"
              precision={0}
              prefix={<BarChartOutlined />}
              valueStyle={{
                color: (executionSummary?.efficiency || 0) >= 80 ? '#3f8600' : '#faad14',
              }}
            />
          </Card>
        </Col>
      </Row>

      {/* Performance Trend Chart */}
      <Card title="Performance Trends" size="small">
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={performanceHistory}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="timestamp"
              tickFormatter={(value) => new Date(value).toLocaleTimeString()}
            />
            <YAxis />
            <RechartsTooltip
              labelFormatter={(value) => new Date(value).toLocaleString()}
              formatter={(value: number) => [`${value.toFixed(2)}ms`, 'Duration']}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke={chartColors.primary}
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* Alerts and Insights Row */}
      <Row gutter={[16, 16]}>
        {/* Top Bottlenecks */}
        <Col span={12}>
          <Card title="Top Performance Issues" size="small">
            {topBottlenecks.length > 0 ? (
              <List
                size="small"
                dataSource={topBottlenecks}
                renderItem={(bottleneck) => (
                  <List.Item>
                    <List.Item.Meta
                      avatar={
                        <Badge status={bottleneck.severity === 'critical' ? 'error' : 'warning'} />
                      }
                      title={
                        <span>
                          {bottleneck.description}
                          <Tag
                            color={
                              bottleneck.severity === 'critical'
                                ? 'red'
                                : bottleneck.severity === 'high'
                                  ? 'orange'
                                  : 'yellow'
                            }
                            className="ml-2"
                          >
                            {bottleneck.severity}
                          </Tag>
                        </span>
                      }
                      description={
                        <div className="text-sm">
                          <div className="text-gray-600">{bottleneck.impact}</div>
                          <div className="text-blue-600 mt-1">💡 {bottleneck.recommendation}</div>
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            ) : (
              <Empty description="No performance issues detected" />
            )}
          </Card>
        </Col>

        {/* Predictive Insights */}
        <Col span={12}>
          <Card title="AI Predictions" size="small">
            {predictiveInsights.length > 0 ? (
              <List
                size="small"
                dataSource={predictiveInsights}
                renderItem={(insight) => (
                  <List.Item>
                    <List.Item.Meta
                      avatar={<RobotOutlined className="text-blue-500" />}
                      title={
                        <div className="flex items-center">
                          <span>{insight.description}</span>
                          <Tag color="blue" className="ml-2">
                            {Math.round(insight.confidence * 100)}% confidence
                          </Tag>
                        </div>
                      }
                      description={
                        <div className="text-sm">
                          <div className="text-gray-600">Impact: {insight.predictedImpact}</div>
                          <div className="text-green-600 mt-1">Timeframe: {insight.timeframe}</div>
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            ) : (
              <Empty description="No predictions available" />
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );

  // Performance Tab Component
  const PerformanceTab: React.FC = () => (
    <div className="space-y-6">
      {/* Performance Charts Row */}
      <Row gutter={[16, 16]}>
        <Col span={12}>
          <Card title="Execution Performance" size="small">
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={performanceHistory}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="timestamp"
                  tickFormatter={(value) => new Date(value).toLocaleTimeString()}
                />
                <YAxis />
                <RechartsTooltip
                  labelFormatter={(value) => new Date(value).toLocaleString()}
                  formatter={(value: number) => [`${value.toFixed(2)}ms`, 'Performance']}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke={chartColors.primary}
                  fill={chartColors.primary}
                  fillOpacity={0.6}
                />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </Col>

        <Col span={12}>
          <Card title="Reliability Trend" size="small">
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={reliabilityHistory}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="timestamp"
                  tickFormatter={(value) => new Date(value).toLocaleTimeString()}
                />
                <YAxis domain={[0, 100]} />
                <RechartsTooltip
                  labelFormatter={(value) => new Date(value).toLocaleString()}
                  formatter={(value: number) => [`${value.toFixed(1)}%`, 'Success Rate']}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke={chartColors.success}
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      {/* Node Performance Table */}
      <Card title="Node Performance Analysis" size="small">
        <Table
          size="small"
          dataSource={currentAnalytics?.nodePerformance || []}
          rowKey="nodeId"
          pagination={{ pageSize: 10 }}
          columns={[
            {
              title: 'Node',
              dataIndex: 'nodeName',
              key: 'nodeName',
              render: (name: string, record: NodePerformanceStats) => (
                <div>
                  <div className="font-medium">{name}</div>
                  <div className="text-xs text-gray-500">{record.nodeType}</div>
                </div>
              ),
            },
            {
              title: 'Executions',
              dataIndex: 'executionCount',
              key: 'executionCount',
              sorter: (a: NodePerformanceStats, b: NodePerformanceStats) =>
                a.executionCount - b.executionCount,
            },
            {
              title: 'Avg Duration',
              dataIndex: 'averageDuration',
              key: 'averageDuration',
              sorter: (a: NodePerformanceStats, b: NodePerformanceStats) =>
                (a.averageDuration ?? 0) - (b.averageDuration ?? 0),
              render: (duration: number) => formatDuration(duration),
            },
            {
              title: 'Success Rate',
              dataIndex: 'failureRate',
              key: 'failureRate',
              sorter: (a: NodePerformanceStats, b: NodePerformanceStats) =>
                (a.failureRate ?? 0) - (b.failureRate ?? 0),
              render: (failureRate: number) => (
                <span style={{ color: failureRate > 0.1 ? '#ff4d4f' : '#52c41a' }}>
                  {((1 - failureRate) * 100).toFixed(1)}%
                </span>
              ),
            },
            {
              title: 'Trend',
              dataIndex: 'trend',
              key: 'trend',
              render: (trend: string) => (
                <Tag
                  color={trend === 'improving' ? 'green' : trend === 'degrading' ? 'red' : 'blue'}
                >
                  {trend}
                </Tag>
              ),
            },
            {
              title: 'Actions',
              key: 'actions',
              render: (_, record: NodePerformanceStats) => (
                <Button type="link" size="small" onClick={() => setSelectedNode(record.nodeId)}>
                  Analyze
                </Button>
              ),
            },
          ]}
        />
      </Card>
    </div>
  );

  // Cost Tab Component
  const CostTab: React.FC = () => (
    <div className="space-y-6">
      {/* Cost Overview */}
      <Row gutter={[16, 16]}>
        <Col span={8}>
          <Card>
            <Statistic
              title="Current Period Cost"
              value={costOptimization?.currentCost || 0}
              formatter={(value) => formatCurrency(Number(value))}
              prefix={<DollarCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="Potential Savings"
              value={costOptimization?.savings || 0}
              formatter={(value) => formatCurrency(Number(value))}
              prefix={<RiseOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="Cost Trend"
              value={costTrend}
              suffix="%"
              precision={1}
              prefix={<BarChartOutlined />}
              valueStyle={{ color: costTrend > 0 ? '#cf1322' : '#3f8600' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Cost Chart */}
      <Card title="Cost Trends" size="small">
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={costHistory}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="timestamp"
              tickFormatter={(value) => new Date(value).toLocaleTimeString()}
            />
            <YAxis tickFormatter={(value) => formatCurrency(value)} />
            <RechartsTooltip
              labelFormatter={(value) => new Date(value).toLocaleString()}
              formatter={(value: number) => [formatCurrency(value), 'Cost']}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke={chartColors.warning}
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* Cost Optimization Recommendations */}
      {costOptimization && (
        <Card title="Optimization Recommendations" size="small">
          <List
            dataSource={costOptimization.recommendations}
            renderItem={(recommendation) => (
              <List.Item>
                <List.Item.Meta
                  avatar={<DollarCircleOutlined className="text-green-500" />}
                  title={
                    <div className="flex items-center justify-between">
                      <span>{recommendation.description}</span>
                      <Tag color="green">
                        Save {formatCurrency(recommendation.estimatedSavings)}
                      </Tag>
                    </div>
                  }
                  description={
                    <div className="text-sm">
                      <div className="text-gray-600">{recommendation.implementation}</div>
                      <Tag
                        color={
                          recommendation.impact === 'high'
                            ? 'red'
                            : recommendation.impact === 'medium'
                              ? 'orange'
                              : 'blue'
                        }
                        className="mt-1"
                      >
                        {recommendation.impact} impact
                      </Tag>
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        </Card>
      )}
    </div>
  );

  // Insights Tab Component
  const InsightsTab: React.FC = () => (
    <div className="space-y-6">
      {/* Predictive Insights */}
      <Card title="Predictive Analytics" size="small">
        {predictiveInsights.length > 0 ? (
          <List
            dataSource={predictiveInsights}
            renderItem={(insight) => (
              <List.Item>
                <Card size="small" className="w-full">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium flex items-center">
                        <RobotOutlined className="text-blue-500 mr-2" />
                        {insight.type.replace('_', ' ').toUpperCase()}
                      </h4>
                      <Tag color="blue">{Math.round(insight.confidence * 100)}% confidence</Tag>
                    </div>

                    <div className="text-gray-700">{insight.description}</div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="font-medium text-gray-600">Timeframe:</span>
                        <div>{insight.timeframe}</div>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600">Expected Impact:</span>
                        <div>{insight.predictedImpact}</div>
                      </div>
                    </div>

                    {insight.recommendedActions && insight.recommendedActions.length > 0 && (
                      <div>
                        <span className="font-medium text-gray-600">Recommended Actions:</span>
                        <ul className="mt-2 space-y-1">
                          {insight.recommendedActions.map((action: any, index: number) => (
                            <li key={index} className="text-sm text-green-600">
                              • {action}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {insight.basedOn && Array.isArray(insight.basedOn) && (
                      <div className="text-xs text-gray-500">
                        Based on: {insight.basedOn.join(', ')}
                      </div>
                    )}
                  </div>
                </Card>
              </List.Item>
            )}
          />
        ) : (
          <Empty description="No predictive insights available" />
        )}
      </Card>

      {/* Bottleneck Analysis */}
      <Card title="Bottleneck Analysis" size="small">
        {bottlenecks.length > 0 ? (
          <List
            dataSource={bottlenecks}
            renderItem={(bottleneck) => (
              <List.Item>
                <Card size="small" className="w-full">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium flex items-center">
                        <WarningOutlined
                          className={`mr-2 ${
                            bottleneck.severity === 'critical'
                              ? 'text-red-500'
                              : bottleneck.severity === 'high'
                                ? 'text-orange-500'
                                : 'text-yellow-500'
                          }`}
                        />
                        {(bottleneck.type ?? 'unknown').replace('_', ' ').toUpperCase()}
                      </h4>
                      <Tag
                        color={
                          bottleneck.severity === 'critical'
                            ? 'red'
                            : bottleneck.severity === 'high'
                              ? 'orange'
                              : 'yellow'
                        }
                      >
                        {bottleneck.severity}
                      </Tag>
                    </div>

                    <div className="text-gray-700">{bottleneck.description}</div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="font-medium text-gray-600">Impact:</span>
                        <div>{bottleneck.impact}</div>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600">Improvement:</span>
                        <div className="text-green-600">{bottleneck.estimatedImprovement}</div>
                      </div>
                    </div>

                    <div>
                      <span className="font-medium text-gray-600">Recommendation:</span>
                      <div className="text-blue-600 mt-1">💡 {bottleneck.recommendation}</div>
                    </div>
                  </div>
                </Card>
              </List.Item>
            )}
          />
        ) : (
          <Empty description="No bottlenecks detected" />
        )}
      </Card>
    </div>
  );

  // Settings and Controls
  const AnalyticsHeader: React.FC = () => (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center space-x-4">
        <Select value={analyticsPeriod} onChange={setAnalyticsPeriod} style={{ width: 120 }}>
          <Option value={1}>Last 24h</Option>
          <Option value={7}>Last 7 days</Option>
          <Option value={30}>Last 30 days</Option>
          <Option value={90}>Last 90 days</Option>
        </Select>

        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">Auto-refresh:</span>
          <Switch size="small" checked={autoRefresh} onChange={toggleAutoRefresh} />
        </div>
      </div>

      <div className="flex items-center space-x-2">
        {lastUpdated && (
          <span className="text-xs text-gray-500">
            Updated: {new Date(lastUpdated).toLocaleTimeString()}
          </span>
        )}

        <Button
          type="text"
          icon={<ReloadOutlined />}
          onClick={refreshAnalytics}
          loading={isLoading}
        >
          Refresh
        </Button>
      </div>
    </div>
  );

  return (
    <Modal
      title="Workflow Analytics Dashboard"
      open={isOpen}
      onCancel={onClose}
      width={1200}
      footer={null}
      className="analytics-dashboard-modal"
    >
      <AnalyticsHeader />

      <Tabs
        activeKey={selectedTab}
        onChange={(key) => setSelectedTab(key as any)}
        className="analytics-tabs"
      >
        <TabPane
          tab={
            <span>
              <DashboardOutlined />
              Overview
            </span>
          }
          key="overview"
        >
          <OverviewTab />
        </TabPane>

        <TabPane
          tab={
            <span>
              <BarChartOutlined />
              Performance
            </span>
          }
          key="performance"
        >
          <PerformanceTab />
        </TabPane>

        <TabPane
          tab={
            <span>
              <DollarCircleOutlined />
              Costs
            </span>
          }
          key="costs"
        >
          <CostTab />
        </TabPane>

        <TabPane
          tab={
            <span>
              <BulbOutlined />
              Insights
            </span>
          }
          key="insights"
        >
          <InsightsTab />
        </TabPane>
      </Tabs>
    </Modal>
  );
};

export default AnalyticsDashboard;
