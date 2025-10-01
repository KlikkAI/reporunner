/**
 * Workflow Scheduling Panel
 *
 * Provides comprehensive workflow scheduling interface with cron expressions,
 * interval scheduling, conditional execution, and advanced configuration options.
 */

import {
  BarChartOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  DeleteOutlined,
  EditOutlined,
  InfoCircleOutlined,
  PauseCircleOutlined,
  PlayCircleOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import {
  Badge,
  Button,
  Card,
  DatePicker,
  Divider,
  Form,
  Input,
  InputNumber,
  List,
  Modal,
  message,
  Select,
  Space,
  Statistic,
  Switch,
  Tabs,
  Tag,
  Tooltip,
} from 'antd';
import type React from 'react';
import { useEffect, useState } from 'react';
import {
  type ScheduleAnalytics,
  type ScheduleConfiguration,
  type ScheduledExecution,
  workflowScheduler,
} from '@/core/services/workflowScheduler';
import { colors } from '@/design-system/tokens';
import { cn } from '@/design-system/utils';

const { TabPane } = Tabs;
const { Option } = Select;
const { TextArea } = Input;

interface SchedulingPanelProps {
  workflowId: string;
  visible: boolean;
  onClose: () => void;
}

export const SchedulingPanel: React.FC<SchedulingPanelProps> = ({
  workflowId,
  visible,
  onClose,
}) => {
  const [schedules, setSchedules] = useState<ScheduleConfiguration[]>([]);
  const [activeExecutions, setActiveExecutions] = useState<ScheduledExecution[]>([]);
  const [selectedSchedule, setSelectedSchedule] = useState<ScheduleConfiguration | null>(null);
  const [analytics, setAnalytics] = useState<ScheduleAnalytics | null>(null);
  const [activeTab, setActiveTab] = useState('schedules');
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      loadSchedules();
      loadActiveExecutions();
    }
  }, [visible, loadActiveExecutions, loadSchedules]);

  useEffect(() => {
    if (selectedSchedule) {
      loadAnalytics(selectedSchedule.id);
    }
  }, [selectedSchedule, loadAnalytics]);

  const loadSchedules = () => {
    const allSchedules = workflowScheduler.getAllSchedules();
    const workflowSchedules = allSchedules.filter((s) => s.workflowId === workflowId);
    setSchedules(workflowSchedules);
  };

  const loadActiveExecutions = () => {
    const allExecutions = workflowScheduler.getActiveExecutions();
    const workflowExecutions = allExecutions.filter((e) => e.workflowId === workflowId);
    setActiveExecutions(workflowExecutions);
  };

  const loadAnalytics = async (scheduleId: string) => {
    try {
      const analytics = await workflowScheduler.getScheduleAnalytics(scheduleId);
      setAnalytics(analytics);
    } catch (_error) {}
  };

  const handleCreateSchedule = async (values: any) => {
    setLoading(true);
    try {
      const scheduleConfig = {
        workflowId,
        name: values.name,
        description: values.description,
        enabled: values.enabled ?? true,
        scheduleType: values.scheduleType,
        configuration: buildScheduleConfiguration(values),
        timezone: values.timezone || 'UTC',
        retryPolicy: {
          enabled: values.retryEnabled ?? false,
          maxAttempts: values.maxAttempts ?? 3,
          backoffStrategy: values.backoffStrategy ?? 'exponential',
          initialDelayMs: values.initialDelay ?? 1000,
          maxDelayMs: values.maxDelay ?? 300000,
          retryConditions: values.retryConditions?.split(',').map((c: string) => c.trim()) ?? [],
        },
        concurrency: {
          maxConcurrent: values.maxConcurrent ?? 1,
          queueStrategy: values.queueStrategy ?? 'fifo',
          skipIfRunning: values.skipIfRunning ?? false,
          timeout: values.timeout ?? 3600000,
        },
        conditions: [],
        notifications: {
          onSuccess: [],
          onFailure: [],
          onSkip: [],
          onRetry: [],
        },
        metadata: {},
      };

      workflowScheduler.createSchedule(scheduleConfig);
      message.success('Schedule created successfully');
      loadSchedules();
      form.resetFields();
      setEditingSchedule(null);
    } catch (_error) {
      message.error('Failed to create schedule');
    } finally {
      setLoading(false);
    }
  };

  const buildScheduleConfiguration = (values: any) => {
    switch (values.scheduleType) {
      case 'cron':
        return {
          expression: values.cronExpression,
          description: values.cronDescription,
        };
      case 'interval':
        return {
          intervalMs: values.intervalMs,
          maxExecutions: values.maxExecutions,
          startTime: values.startTime?.toISOString(),
          endTime: values.endTime?.toISOString(),
        };
      case 'once':
        return {
          executeAt: values.executeAt?.toISOString(),
          delay: values.delay,
        };
      case 'event-driven':
        return {
          eventType: values.eventType,
          eventSource: values.eventSource,
          filters: [],
          debounceMs: values.debounceMs,
          maxEventsPerWindow: values.maxEventsPerWindow,
        };
      case 'conditional':
        return {
          condition: values.condition,
          checkIntervalMs: values.checkIntervalMs,
          maxChecks: values.maxChecks,
          dependencies: values.dependencies?.split(',').map((d: string) => d.trim()) ?? [],
        };
      default:
        return {
          eventType: '',
          eventSource: '',
          filters: [],
          debounceMs: 0,
          maxEventsPerWindow: 0,
        };
    }
  };

  const handleToggleSchedule = async (scheduleId: string, enabled: boolean) => {
    try {
      workflowScheduler.toggleSchedule(scheduleId, enabled);
      message.success(`Schedule ${enabled ? 'enabled' : 'disabled'}`);
      loadSchedules();
    } catch (_error) {
      message.error('Failed to toggle schedule');
    }
  };

  const handleDeleteSchedule = async (scheduleId: string) => {
    try {
      workflowScheduler.deleteSchedule(scheduleId);
      message.success('Schedule deleted');
      loadSchedules();
      if (selectedSchedule?.id === scheduleId) {
        setSelectedSchedule(null);
        setAnalytics(null);
      }
    } catch (_error) {
      message.error('Failed to delete schedule');
    }
  };

  const handleTriggerSchedule = async (scheduleId: string) => {
    try {
      await workflowScheduler.triggerSchedule(scheduleId, true);
      message.success('Schedule triggered successfully');
      loadActiveExecutions();
    } catch (_error) {
      message.error('Failed to trigger schedule');
    }
  };

  const handleCancelExecution = (executionId: string) => {
    try {
      workflowScheduler.cancelExecution(executionId);
      message.success('Execution cancelled');
      loadActiveExecutions();
    } catch (_error) {
      message.error('Failed to cancel execution');
    }
  };

  const renderScheduleForm = () => (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleCreateSchedule}
      initialValues={{
        enabled: true,
        scheduleType: 'cron',
        timezone: 'UTC',
        retryEnabled: false,
        maxAttempts: 3,
        backoffStrategy: 'exponential',
        maxConcurrent: 1,
        queueStrategy: 'fifo',
        skipIfRunning: false,
      }}
    >
      <Form.Item
        name="name"
        label="Schedule Name"
        rules={[{ required: true, message: 'Please enter a name' }]}
      >
        <Input placeholder="Daily data sync" />
      </Form.Item>

      <Form.Item name="description" label="Description">
        <TextArea placeholder="Optional description of what this schedule does" rows={2} />
      </Form.Item>

      <Form.Item name="enabled" label="Enabled" valuePropName="checked">
        <Switch />
      </Form.Item>

      <Form.Item name="scheduleType" label="Schedule Type">
        <Select onChange={() => form.resetFields(['configuration'])}>
          <Option value="cron">Cron Expression</Option>
          <Option value="interval">Fixed Interval</Option>
          <Option value="once">One Time</Option>
          <Option value="event-driven">Event Driven</Option>
          <Option value="conditional">Conditional</Option>
        </Select>
      </Form.Item>

      <Form.Item dependencies={['scheduleType']} noStyle>
        {({ getFieldValue }) => {
          const scheduleType = getFieldValue('scheduleType');
          return renderScheduleTypeFields(scheduleType);
        }}
      </Form.Item>

      <Divider>Advanced Settings</Divider>

      <Form.Item name="timezone" label="Timezone">
        <Select showSearch>
          <Option value="UTC">UTC</Option>
          <Option value="America/New_York">America/New_York</Option>
          <Option value="America/Los_Angeles">America/Los_Angeles</Option>
          <Option value="Europe/London">Europe/London</Option>
          <Option value="Asia/Tokyo">Asia/Tokyo</Option>
        </Select>
      </Form.Item>

      <Form.Item name="maxConcurrent" label="Max Concurrent Executions">
        <InputNumber min={1} max={10} />
      </Form.Item>

      <Form.Item name="queueStrategy" label="Queue Strategy">
        <Select>
          <Option value="fifo">First In, First Out</Option>
          <Option value="lifo">Last In, First Out</Option>
          <Option value="priority">Priority Based</Option>
        </Select>
      </Form.Item>

      <Form.Item name="skipIfRunning" label="Skip If Already Running" valuePropName="checked">
        <Switch />
      </Form.Item>

      <Divider>Retry Policy</Divider>

      <Form.Item name="retryEnabled" label="Enable Retries" valuePropName="checked">
        <Switch />
      </Form.Item>

      <Form.Item dependencies={['retryEnabled']} noStyle>
        {({ getFieldValue }) => {
          if (!getFieldValue('retryEnabled')) {
            return null;
          }
          return (
            <>
              <Form.Item name="maxAttempts" label="Max Retry Attempts">
                <InputNumber min={1} max={10} />
              </Form.Item>
              <Form.Item name="backoffStrategy" label="Backoff Strategy">
                <Select>
                  <Option value="linear">Linear</Option>
                  <Option value="exponential">Exponential</Option>
                  <Option value="fixed">Fixed</Option>
                </Select>
              </Form.Item>
              <Form.Item name="initialDelay" label="Initial Delay (ms)">
                <InputNumber min={100} />
              </Form.Item>
            </>
          );
        }}
      </Form.Item>

      <Form.Item>
        <Space>
          <Button type="primary" htmlType="submit" loading={loading}>
            {editingSchedule ? 'Update Schedule' : 'Create Schedule'}
          </Button>
          <Button
            onClick={() => {
              form.resetFields();
              setEditingSchedule(null);
            }}
          >
            Cancel
          </Button>
        </Space>
      </Form.Item>
    </Form>
  );

  const renderScheduleTypeFields = (scheduleType: string) => {
    switch (scheduleType) {
      case 'cron':
        return (
          <>
            <Form.Item
              name="cronExpression"
              label={
                <Space>
                  Cron Expression
                  <Tooltip title="Format: second minute hour day month weekday">
                    <InfoCircleOutlined />
                  </Tooltip>
                </Space>
              }
              rules={[{ required: true, message: 'Please enter a cron expression' }]}
            >
              <Input placeholder="0 0 9 * * *" />
            </Form.Item>
            <Form.Item name="cronDescription" label="Description">
              <Input placeholder="Every day at 9:00 AM" />
            </Form.Item>
          </>
        );
      case 'interval':
        return (
          <>
            <Form.Item name="intervalMs" label="Interval (milliseconds)">
              <InputNumber min={1000} placeholder="300000" />
            </Form.Item>
            <Form.Item name="maxExecutions" label="Max Executions (optional)">
              <InputNumber min={1} />
            </Form.Item>
          </>
        );
      case 'once':
        return (
          <Form.Item name="executeAt" label="Execute At">
            <DatePicker showTime />
          </Form.Item>
        );
      case 'event-driven':
        return (
          <>
            <Form.Item name="eventType" label="Event Type">
              <Input placeholder="webhook" />
            </Form.Item>
            <Form.Item name="eventSource" label="Event Source">
              <Input placeholder="api.example.com" />
            </Form.Item>
          </>
        );
      case 'conditional':
        return (
          <>
            <Form.Item name="condition" label="JavaScript Condition">
              <TextArea placeholder="return data.status === 'ready'" rows={3} />
            </Form.Item>
            <Form.Item name="checkIntervalMs" label="Check Interval (ms)">
              <InputNumber min={1000} placeholder="60000" />
            </Form.Item>
          </>
        );
      default:
        return null;
    }
  };

  const renderSchedulesList = () => (
    <List
      dataSource={schedules}
      renderItem={(schedule) => (
        <List.Item
          actions={[
            <Switch
              checked={schedule.enabled}
              onChange={(checked) => handleToggleSchedule(schedule.id, checked)}
              checkedChildren="ON"
              unCheckedChildren="OFF"
            />,
            <Button
              type="link"
              icon={<PlayCircleOutlined />}
              onClick={() => handleTriggerSchedule(schedule.id)}
              disabled={!schedule.enabled}
            >
              Trigger
            </Button>,
            <Button
              type="link"
              icon={<EditOutlined />}
              onClick={() => {
                setEditingSchedule(schedule.id);
                form.setFieldsValue({
                  name: schedule.name,
                  description: schedule.description,
                  enabled: schedule.enabled,
                  scheduleType: schedule.scheduleType,
                  // Add other fields based on schedule type
                });
              }}
            />,
            <Button
              type="link"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDeleteSchedule(schedule.id)}
            />,
          ]}
        >
          <List.Item.Meta
            title={
              <Space>
                {schedule.name}
                <Tag color={schedule.enabled ? 'green' : 'default'}>{schedule.scheduleType}</Tag>
                {schedule.nextExecution && (
                  <Tag color="blue">Next: {new Date(schedule.nextExecution).toLocaleString()}</Tag>
                )}
              </Space>
            }
            description={
              <Space direction="vertical" size="small">
                {schedule.description}
                <Space>
                  <Badge status={schedule.enabled ? 'success' : 'default'} />
                  {schedule.enabled ? 'Active' : 'Inactive'}
                  {schedule.lastExecuted && (
                    <span style={{ color: colors.gray[500] }}>
                      Last: {new Date(schedule.lastExecuted).toLocaleString()}
                    </span>
                  )}
                </Space>
              </Space>
            }
          />
        </List.Item>
      )}
      locale={{ emptyText: 'No schedules configured' }}
    />
  );

  const renderExecutionsList = () => (
    <List
      dataSource={activeExecutions}
      renderItem={(execution) => (
        <List.Item
          actions={[
            execution.status === 'running' && (
              <Button
                type="link"
                danger
                icon={<PauseCircleOutlined />}
                onClick={() => handleCancelExecution(execution.id)}
              >
                Cancel
              </Button>
            ),
          ].filter(Boolean)}
        >
          <List.Item.Meta
            title={
              <Space>
                Execution {execution.id.split('_')[1]}
                <Tag color={getExecutionStatusColor(execution.status)}>{execution.status}</Tag>
              </Space>
            }
            description={
              <Space direction="vertical" size="small">
                <div>Scheduled: {new Date(execution.scheduledAt).toLocaleString()}</div>
                {execution.startedAt && (
                  <div>Started: {new Date(execution.startedAt).toLocaleString()}</div>
                )}
                {execution.duration && (
                  <div>Duration: {(execution.duration / 1000).toFixed(2)}s</div>
                )}
                {execution.error && (
                  <div style={{ color: colors.error[500] }}>Error: {execution.error}</div>
                )}
              </Space>
            }
          />
        </List.Item>
      )}
      locale={{ emptyText: 'No active executions' }}
    />
  );

  const renderAnalytics = () => {
    if (!analytics) {
      return <div>Select a schedule to view analytics</div>;
    }

    return (
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <div className="grid grid-cols-2 gap-4">
          <Statistic
            title="Success Rate"
            value={analytics.successRate}
            precision={1}
            suffix="%"
            valueStyle={{
              color: analytics.successRate > 90 ? colors.success[600] : colors.warning[600],
            }}
          />
          <Statistic title="Total Executions" value={analytics.totalExecutions} />
          <Statistic
            title="Average Duration"
            value={analytics.averageDuration / 1000}
            precision={2}
            suffix="s"
          />
          <Statistic
            title="Failed Executions"
            value={analytics.failedExecutions}
            valueStyle={{
              color: analytics.failedExecutions > 0 ? colors.error[600] : colors.success[600],
            }}
          />
        </div>

        {analytics.recommendations.length > 0 && (
          <Card title="Recommendations" size="small">
            <List
              dataSource={analytics.recommendations}
              renderItem={(rec) => (
                <List.Item>
                  <List.Item.Meta
                    title={
                      <Space>
                        {rec.description}
                        <Tag
                          color={
                            rec.priority === 'high'
                              ? 'red'
                              : rec.priority === 'medium'
                                ? 'orange'
                                : 'green'
                          }
                        >
                          {rec.priority}
                        </Tag>
                      </Space>
                    }
                    description={
                      <Space direction="vertical" size="small">
                        <div>
                          <strong>Implementation:</strong> {rec.implementation}
                        </div>
                        <div>
                          <strong>Impact:</strong> {rec.estimatedImpact}
                        </div>
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        )}
      </Space>
    );
  };

  const getExecutionStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return 'blue';
      case 'completed':
        return 'green';
      case 'failed':
        return 'red';
      case 'cancelled':
        return 'orange';
      case 'skipped':
        return 'default';
      default:
        return 'default';
    }
  };

  return (
    <Modal
      title={
        <Space>
          <ClockCircleOutlined />
          Workflow Scheduling
        </Space>
      }
      open={visible}
      onCancel={onClose}
      width={1000}
      footer={null}
      className={cn('workflow-scheduling-panel')}
    >
      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane
          tab={
            <span>
              <CalendarOutlined />
              Schedules ({schedules.length})
            </span>
          }
          key="schedules"
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card title="Create Schedule" size="small">
              {renderScheduleForm()}
            </Card>
            <Card title="Active Schedules" size="small">
              {renderSchedulesList()}
            </Card>
          </div>
        </TabPane>

        <TabPane
          tab={
            <span>
              <ThunderboltOutlined />
              Executions ({activeExecutions.length})
            </span>
          }
          key="executions"
        >
          {renderExecutionsList()}
        </TabPane>

        <TabPane
          tab={
            <span>
              <BarChartOutlined />
              Analytics
            </span>
          }
          key="analytics"
        >
          <div className="mb-4">
            <Select
              placeholder="Select a schedule to view analytics"
              value={selectedSchedule?.id}
              onChange={(scheduleId) => {
                const schedule = schedules.find((s) => s.id === scheduleId);
                setSelectedSchedule(schedule || null);
              }}
              style={{ width: 300 }}
            >
              {schedules.map((schedule) => (
                <Option key={schedule.id} value={schedule.id}>
                  {schedule.name}
                </Option>
              ))}
            </Select>
          </div>
          {renderAnalytics()}
        </TabPane>
      </Tabs>
    </Modal>
  );
};

export default SchedulingPanel;
