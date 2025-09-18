/**
 * Advanced Trigger Management Panel
 *
 * Comprehensive trigger configuration interface for webhooks, API polling,
 * file monitoring, email triggers, and event-driven workflow execution.
 */

import React, { useState, useEffect } from "react";
import {
  Button,
  Card,
  Form,
  Input,
  Switch,
  Select,
  InputNumber,
  Tabs,
  Tag,
  Divider,
  Space,
  Modal,
  message,
  Progress,
  Statistic,
  List,
  Badge,
  Typography,
  Alert,
  Collapse,
  Table,
} from "antd";
import {
  ThunderboltOutlined,
  GlobalOutlined,
  MailOutlined,
  FileTextOutlined,
  DatabaseOutlined,
  ApiOutlined,
  CalendarOutlined,
  SettingOutlined,
  PlayCircleOutlined,
  DeleteOutlined,
  EditOutlined,
  CopyOutlined,
  EyeOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import { cn } from "@/design-system/utils";
import { colors, } from "@/design-system/tokens";
import {
  advancedTriggerSystem,
  type TriggerConfiguration,
  type TriggerEvent,
  type TriggerMetrics,
} from "@/core/services/advancedTriggerSystem";

const { TabPane } = Tabs;
const { Option } = Select;
const { TextArea } = Input;
const { Text, Paragraph } = Typography;
const { Panel } = Collapse;

interface TriggerPanelProps {
  workflowId: string;
  visible: boolean;
  onClose: () => void;
}

export const TriggerPanel: React.FC<TriggerPanelProps> = ({
  workflowId,
  visible,
  onClose,
}) => {
  const [triggers, setTriggers] = useState<TriggerConfiguration[]>([]);
  const [recentEvents, setRecentEvents] = useState<TriggerEvent[]>([]);
  const [selectedTrigger, setSelectedTrigger] =
    useState<TriggerConfiguration | null>(null);
  const [metrics, setMetrics] = useState<TriggerMetrics | null>(null);
  const [activeTab, setActiveTab] = useState("triggers");
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [editingTrigger, setEditingTrigger] = useState<string | null>(null);
  const [testModalVisible, setTestModalVisible] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState("");

  useEffect(() => {
    if (visible) {
      loadTriggers();
      loadRecentEvents();
    }
  }, [visible, workflowId]);

  useEffect(() => {
    if (selectedTrigger) {
      loadMetrics(selectedTrigger.id);
    }
  }, [selectedTrigger]);

  const loadTriggers = () => {
    const allTriggers = advancedTriggerSystem.getAllTriggers();
    const workflowTriggers = allTriggers.filter(
      (t) => t.workflowId === workflowId,
    );
    setTriggers(workflowTriggers);
  };

  const loadRecentEvents = () => {
    const allTriggers = advancedTriggerSystem.getAllTriggers();
    const workflowTriggers = allTriggers.filter(
      (t) => t.workflowId === workflowId,
    );

    const events: TriggerEvent[] = [];
    workflowTriggers.forEach((trigger) => {
      const triggerEvents = advancedTriggerSystem.getRecentEvents(
        trigger.id,
        50,
      );
      events.push(...triggerEvents);
    });

    // Sort by timestamp descending
    events.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );
    setRecentEvents(events.slice(0, 100));
  };

  const loadMetrics = (triggerId: string) => {
    try {
      const triggerMetrics = advancedTriggerSystem.getTriggerMetrics(triggerId);
      setMetrics(triggerMetrics);
    } catch (error) {
      console.error("Failed to load metrics:", error);
    }
  };

  const handleCreateTrigger = async (values: any) => {
    setLoading(true);
    try {
      const triggerConfig = {
        workflowId,
        name: values.name,
        description: values.description,
        enabled: values.enabled ?? true,
        triggerType: values.triggerType,
        configuration: buildTriggerConfiguration(values),
        filters: values.filters || [],
        transformations: values.transformations || [],
        authentication: values.authentication,
        rateLimit: {
          enabled: values.rateLimitEnabled ?? false,
          maxTriggersPerMinute: values.maxTriggersPerMinute ?? 60,
          maxTriggersPerHour: values.maxTriggersPerHour ?? 1000,
          maxTriggersPerDay: values.maxTriggersPerDay ?? 10000,
          burstLimit: values.burstLimit ?? 10,
        },
        retryPolicy: {
          enabled: values.retryEnabled ?? false,
          maxAttempts: values.maxAttempts ?? 3,
          backoffMs: values.backoffMs ?? 1000,
          exponentialBackoff: values.exponentialBackoff ?? true,
        },
        security: {
          allowedIPs:
            values.allowedIPs?.split(",").map((ip: string) => ip.trim()) ?? [],
          blockedIPs:
            values.blockedIPs?.split(",").map((ip: string) => ip.trim()) ?? [],
          requireHttps: values.requireHttps ?? true,
          validateSignature: values.validateSignature ?? false,
          maxPayloadSize: values.maxPayloadSize ?? 1048576, // 1MB
        },
        metadata: {},
      };

      const created = advancedTriggerSystem.createTrigger(triggerConfig);

      if (created.triggerType === "webhook") {
        const config = created.configuration as any;
        setWebhookUrl(config.endpoint);
      }

      message.success("Trigger created successfully");
      loadTriggers();
      form.resetFields();
      setEditingTrigger(null);
    } catch (error) {
      message.error("Failed to create trigger");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const buildTriggerConfiguration = (values: any) => {
    switch (values.triggerType) {
      case "webhook":
        return {
          endpoint: "", // Auto-generated
          methods: values.methods || ["POST"],
          contentTypes: values.contentTypes
            ?.split(",")
            .map((t: string) => t.trim()) || ["application/json"],
          headers: parseKeyValuePairs(values.headers),
          responseTemplate: values.responseTemplate,
          secretKey: values.secretKey,
        };
      case "http_request":
        return {
          url: values.url,
          method: values.method || "GET",
          headers: parseKeyValuePairs(values.headers),
          body: values.body,
          pollIntervalMs: values.pollIntervalMs || 300000,
          changeDetection: values.changeDetection || "hash",
        };
      case "email":
        return {
          provider: values.provider || "gmail",
          mailbox: values.mailbox || "INBOX",
          filters: {
            from: values.fromEmails?.split(",").map((e: string) => e.trim()),
            subject: values.subjectFilter,
            body: values.bodyFilter,
            hasAttachment: values.hasAttachment,
          },
          markAsRead: values.markAsRead ?? false,
          moveToFolder: values.moveToFolder,
        };
      case "file_change":
        return {
          path: values.path,
          recursive: values.recursive ?? true,
          events: values.events || ["created", "modified"],
          patterns: values.patterns
            ?.split(",")
            .map((p: string) => p.trim()) || ["*"],
          ignorePatterns:
            values.ignorePatterns?.split(",").map((p: string) => p.trim()) ||
            [],
          debounceMs: values.debounceMs || 1000,
        };
      case "database_change":
        return {
          connectionString: values.connectionString,
          database: values.database,
          table: values.table,
          operation: values.operation || "any",
          columns: values.columns?.split(",").map((c: string) => c.trim()),
          conditions: parseKeyValuePairs(values.conditions),
          pollIntervalMs: values.pollIntervalMs || 60000,
        };
      case "api_poll":
        return {
          url: values.url,
          method: values.method || "GET",
          headers: parseKeyValuePairs(values.headers),
          body: values.body,
          pollIntervalMs: values.pollIntervalMs || 300000,
          responseField: values.responseField,
          changeThreshold: values.changeThreshold,
        };
      default:
        return {};
    }
  };

  const parseKeyValuePairs = (input: string): Record<string, string> => {
    if (!input) return {};

    const pairs: Record<string, string> = {};
    input.split("\n").forEach((line) => {
      const [key, ...valueParts] = line.split(":");
      if (key && valueParts.length > 0) {
        pairs[key.trim()] = valueParts.join(":").trim();
      }
    });
    return pairs;
  };

  const handleToggleTrigger = (triggerId: string, enabled: boolean) => {
    try {
      advancedTriggerSystem.toggleTrigger(triggerId, enabled);
      message.success(`Trigger ${enabled ? "enabled" : "disabled"}`);
      loadTriggers();
    } catch (error) {
      message.error("Failed to toggle trigger");
    }
  };

  const handleDeleteTrigger = (triggerId: string) => {
    try {
      advancedTriggerSystem.deleteTrigger(triggerId);
      message.success("Trigger deleted");
      loadTriggers();
      if (selectedTrigger?.id === triggerId) {
        setSelectedTrigger(null);
        setMetrics(null);
      }
    } catch (error) {
      message.error("Failed to delete trigger");
    }
  };

  const handleTestTrigger = async (triggerId: string, testData?: any) => {
    try {
      const event = await advancedTriggerSystem.testTrigger(
        triggerId,
        testData,
      );
      message.success("Trigger test completed");
      loadRecentEvents();
      setTestModalVisible(false);
    } catch (error) {
      message.error("Trigger test failed");
    }
  };

  const renderTriggerForm = () => (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleCreateTrigger}
      initialValues={{
        enabled: true,
        triggerType: "webhook",
        rateLimitEnabled: false,
        retryEnabled: false,
        requireHttps: true,
      }}
    >
      <Form.Item
        name="name"
        label="Trigger Name"
        rules={[{ required: true, message: "Please enter a name" }]}
      >
        <Input placeholder="API webhook trigger" />
      </Form.Item>

      <Form.Item name="description" label="Description">
        <TextArea placeholder="Receives webhooks from external API" rows={2} />
      </Form.Item>

      <Form.Item name="enabled" label="Enabled" valuePropName="checked">
        <Switch />
      </Form.Item>

      <Form.Item name="triggerType" label="Trigger Type">
        <Select onChange={() => form.resetFields(["configuration"])}>
          <Option value="webhook">
            <Space>
              <GlobalOutlined />
              Webhook
            </Space>
          </Option>
          <Option value="http_request">
            <Space>
              <ApiOutlined />
              HTTP Request
            </Space>
          </Option>
          <Option value="email">
            <Space>
              <MailOutlined />
              Email
            </Space>
          </Option>
          <Option value="file_change">
            <Space>
              <FileTextOutlined />
              File Change
            </Space>
          </Option>
          <Option value="database_change">
            <Space>
              <DatabaseOutlined />
              Database Change
            </Space>
          </Option>
          <Option value="api_poll">
            <Space>
              <ApiOutlined />
              API Polling
            </Space>
          </Option>
        </Select>
      </Form.Item>

      <Form.Item dependencies={["triggerType"]} noStyle>
        {({ getFieldValue }) => {
          const triggerType = getFieldValue("triggerType");
          return renderTriggerTypeFields(triggerType);
        }}
      </Form.Item>

      <Collapse ghost>
        <Panel header="Advanced Configuration" key="advanced">
          {renderAdvancedFields()}
        </Panel>
      </Collapse>

      <Form.Item>
        <Space>
          <Button type="primary" htmlType="submit" loading={loading}>
            {editingTrigger ? "Update Trigger" : "Create Trigger"}
          </Button>
          <Button
            onClick={() => {
              form.resetFields();
              setEditingTrigger(null);
            }}
          >
            Cancel
          </Button>
        </Space>
      </Form.Item>
    </Form>
  );

  const renderTriggerTypeFields = (triggerType: string) => {
    switch (triggerType) {
      case "webhook":
        return (
          <>
            <Form.Item name="methods" label="HTTP Methods">
              <Select mode="multiple" placeholder="Select methods">
                <Option value="GET">GET</Option>
                <Option value="POST">POST</Option>
                <Option value="PUT">PUT</Option>
                <Option value="DELETE">DELETE</Option>
                <Option value="PATCH">PATCH</Option>
              </Select>
            </Form.Item>
            <Form.Item
              name="contentTypes"
              label="Content Types (comma-separated)"
            >
              <Input placeholder="application/json, application/xml" />
            </Form.Item>
            <Form.Item name="secretKey" label="Secret Key (optional)">
              <Input.Password placeholder="For webhook signature validation" />
            </Form.Item>
          </>
        );
      case "http_request":
        return (
          <>
            <Form.Item name="url" label="URL" rules={[{ required: true }]}>
              <Input placeholder="https://api.example.com/status" />
            </Form.Item>
            <Form.Item name="method" label="HTTP Method">
              <Select>
                <Option value="GET">GET</Option>
                <Option value="POST">POST</Option>
                <Option value="PUT">PUT</Option>
                <Option value="DELETE">DELETE</Option>
              </Select>
            </Form.Item>
            <Form.Item name="pollIntervalMs" label="Poll Interval (ms)">
              <InputNumber min={10000} placeholder="300000" />
            </Form.Item>
            <Form.Item name="changeDetection" label="Change Detection">
              <Select>
                <Option value="hash">Content Hash</Option>
                <Option value="content">Full Content</Option>
                <Option value="headers">Headers</Option>
                <Option value="size">Content Size</Option>
              </Select>
            </Form.Item>
          </>
        );
      case "email":
        return (
          <>
            <Form.Item name="provider" label="Email Provider">
              <Select>
                <Option value="gmail">Gmail</Option>
                <Option value="outlook">Outlook</Option>
                <Option value="imap">IMAP</Option>
                <Option value="exchange">Exchange</Option>
              </Select>
            </Form.Item>
            <Form.Item name="mailbox" label="Mailbox">
              <Input placeholder="INBOX" />
            </Form.Item>
            <Form.Item name="fromEmails" label="From Emails (comma-separated)">
              <Input placeholder="user@example.com, alerts@service.com" />
            </Form.Item>
            <Form.Item name="subjectFilter" label="Subject Filter">
              <Input placeholder="Alert: " />
            </Form.Item>
          </>
        );
      case "file_change":
        return (
          <>
            <Form.Item
              name="path"
              label="Path to Monitor"
              rules={[{ required: true }]}
            >
              <Input placeholder="/data/uploads" />
            </Form.Item>
            <Form.Item
              name="recursive"
              label="Recursive"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
            <Form.Item name="events" label="File Events">
              <Select mode="multiple" placeholder="Select events">
                <Option value="created">Created</Option>
                <Option value="modified">Modified</Option>
                <Option value="deleted">Deleted</Option>
                <Option value="moved">Moved</Option>
              </Select>
            </Form.Item>
            <Form.Item name="patterns" label="File Patterns (comma-separated)">
              <Input placeholder="*.pdf, *.docx" />
            </Form.Item>
          </>
        );
      case "database_change":
        return (
          <>
            <Form.Item
              name="connectionString"
              label="Connection String"
              rules={[{ required: true }]}
            >
              <Input.Password placeholder="mongodb://localhost:27017/mydb" />
            </Form.Item>
            <Form.Item name="database" label="Database">
              <Input placeholder="myapp" />
            </Form.Item>
            <Form.Item name="table" label="Table/Collection">
              <Input placeholder="users" />
            </Form.Item>
            <Form.Item name="operation" label="Operation">
              <Select>
                <Option value="insert">Insert</Option>
                <Option value="update">Update</Option>
                <Option value="delete">Delete</Option>
                <Option value="any">Any</Option>
              </Select>
            </Form.Item>
          </>
        );
      case "api_poll":
        return (
          <>
            <Form.Item name="url" label="API URL" rules={[{ required: true }]}>
              <Input placeholder="https://api.example.com/data" />
            </Form.Item>
            <Form.Item name="pollIntervalMs" label="Poll Interval (ms)">
              <InputNumber min={10000} placeholder="300000" />
            </Form.Item>
            <Form.Item name="responseField" label="Response Field to Monitor">
              <Input placeholder="data.status" />
            </Form.Item>
            <Form.Item
              name="changeThreshold"
              label="Change Threshold (for numbers)"
            >
              <InputNumber min={0} step={0.1} />
            </Form.Item>
          </>
        );
      default:
        return null;
    }
  };

  const renderAdvancedFields = () => (
    <Space direction="vertical" size="middle" style={{ width: "100%" }}>
      <Divider>Rate Limiting</Divider>
      <Form.Item
        name="rateLimitEnabled"
        label="Enable Rate Limiting"
        valuePropName="checked"
      >
        <Switch />
      </Form.Item>
      <Form.Item dependencies={["rateLimitEnabled"]} noStyle>
        {({ getFieldValue }) => {
          if (!getFieldValue("rateLimitEnabled")) return null;
          return (
            <div className="grid grid-cols-2 gap-4">
              <Form.Item name="maxTriggersPerMinute" label="Max/Minute">
                <InputNumber min={1} />
              </Form.Item>
              <Form.Item name="maxTriggersPerHour" label="Max/Hour">
                <InputNumber min={1} />
              </Form.Item>
            </div>
          );
        }}
      </Form.Item>

      <Divider>Security</Divider>
      <Form.Item
        name="requireHttps"
        label="Require HTTPS"
        valuePropName="checked"
      >
        <Switch />
      </Form.Item>
      <Form.Item name="allowedIPs" label="Allowed IPs (comma-separated)">
        <Input placeholder="192.168.1.1, 10.0.0.0/8" />
      </Form.Item>
      <Form.Item name="maxPayloadSize" label="Max Payload Size (bytes)">
        <InputNumber min={1024} placeholder="1048576" />
      </Form.Item>

      <Divider>Headers</Divider>
      <Form.Item name="headers" label="Custom Headers (key:value per line)">
        <TextArea
          placeholder="Authorization: Bearer token&#10;Content-Type: application/json"
          rows={3}
        />
      </Form.Item>
    </Space>
  );

  const renderTriggersList = () => (
    <List
      dataSource={triggers}
      renderItem={(trigger) => (
        <List.Item
          actions={[
            <Switch
              checked={trigger.enabled}
              onChange={(checked) => handleToggleTrigger(trigger.id, checked)}
              checkedChildren="ON"
              unCheckedChildren="OFF"
            />,
            <Button
              type="link"
              icon={<PlayCircleOutlined />}
              onClick={() => {
                setSelectedTrigger(trigger);
                setTestModalVisible(true);
              }}
            >
              Test
            </Button>,
            trigger.triggerType === "webhook" && (
              <Button
                type="link"
                icon={<CopyOutlined />}
                onClick={() => {
                  const config = trigger.configuration as any;
                  navigator.clipboard.writeText(config.endpoint);
                  message.success("Webhook URL copied");
                }}
              >
                Copy URL
              </Button>
            ),
            <Button
              type="link"
              icon={<EditOutlined />}
              onClick={() => {
                setEditingTrigger(trigger.id);
                // Populate form with existing values
                form.setFieldsValue({
                  name: trigger.name,
                  description: trigger.description,
                  enabled: trigger.enabled,
                  triggerType: trigger.triggerType,
                });
              }}
            />,
            <Button
              type="link"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDeleteTrigger(trigger.id)}
            />,
          ].filter(Boolean)}
        >
          <List.Item.Meta
            title={
              <Space>
                {getTriggerIcon(trigger.triggerType)}
                {trigger.name}
                <Tag color={trigger.enabled ? "green" : "default"}>
                  {trigger.triggerType}
                </Tag>
                <Badge
                  count={trigger.triggerCount}
                  style={{ backgroundColor: colors.primary[500] }}
                />
              </Space>
            }
            description={
              <Space direction="vertical" size="small">
                {trigger.description}
                <Space>
                  <Badge status={trigger.enabled ? "success" : "default"} />
                  {trigger.enabled ? "Active" : "Inactive"}
                  {trigger.lastTriggered && (
                    <span style={{ color: colors.gray[500] }}>
                      Last: {new Date(trigger.lastTriggered).toLocaleString()}
                    </span>
                  )}
                </Space>
                {trigger.triggerType === "webhook" && (
                  <Text code style={{ fontSize: "12px" }}>
                    {(trigger.configuration as any).endpoint}
                  </Text>
                )}
              </Space>
            }
          />
        </List.Item>
      )}
      locale={{ emptyText: "No triggers configured" }}
    />
  );

  const renderEventsList = () => (
    <Table
      dataSource={recentEvents}
      size="small"
      pagination={{ pageSize: 20 }}
      columns={[
        {
          title: "Time",
          dataIndex: "timestamp",
          key: "timestamp",
          width: 150,
          render: (timestamp) => new Date(timestamp).toLocaleString(),
        },
        {
          title: "Trigger",
          dataIndex: "triggerId",
          key: "triggerId",
          width: 200,
          render: (triggerId) => {
            const trigger = triggers.find((t) => t.id === triggerId);
            return trigger ? trigger.name : triggerId;
          },
        },
        {
          title: "Status",
          dataIndex: "status",
          key: "status",
          width: 100,
          render: (status) => (
            <Tag color={getEventStatusColor(status)}>{status}</Tag>
          ),
        },
        {
          title: "Processing Time",
          dataIndex: "processingTimeMs",
          key: "processingTimeMs",
          width: 120,
          render: (time) => `${time.toFixed(2)}ms`,
        },
        {
          title: "Source",
          dataIndex: ["metadata", "source"],
          key: "source",
          width: 120,
        },
        {
          title: "Actions",
          key: "actions",
          width: 100,
          render: (_, event) => (
            <Button
              type="link"
              icon={<EyeOutlined />}
              onClick={() => {
                Modal.info({
                  title: "Event Details",
                  content: (
                    <div>
                      <Paragraph>
                        <Text strong>ID:</Text> {event.id}
                      </Paragraph>
                      <Paragraph>
                        <Text strong>Raw Data:</Text>
                        <pre
                          style={{
                            marginTop: 8,
                            background: colors.gray[50],
                            padding: 12,
                            borderRadius: 4,
                          }}
                        >
                          {JSON.stringify(event.rawData, null, 2)}
                        </pre>
                      </Paragraph>
                      {event.error && (
                        <Paragraph>
                          <Text strong>Error:</Text>
                          <pre
                            style={{
                              marginTop: 8,
                              background: colors.red[50],
                              padding: 12,
                              borderRadius: 4,
                              color: colors.red[600],
                            }}
                          >
                            {event.error}
                          </pre>
                        </Paragraph>
                      )}
                    </div>
                  ),
                  width: 600,
                });
              }}
            />
          ),
        },
      ]}
    />
  );

  const renderMetrics = () => {
    if (!metrics) return <div>Select a trigger to view metrics</div>;

    return (
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        <div className="grid grid-cols-2 gap-4">
          <Statistic title="Total Events" value={metrics.totalEvents} />
          <Statistic
            title="Processed Events"
            value={metrics.processedEvents}
            valueStyle={{ color: colors.success[600] }}
          />
          <Statistic
            title="Error Rate"
            value={metrics.errorRate}
            precision={1}
            suffix="%"
            valueStyle={{
              color:
                metrics.errorRate > 5 ? colors.error[600] : colors.success[600],
            }}
          />
          <Statistic
            title="Avg Processing Time"
            value={metrics.averageProcessingTime}
            precision={2}
            suffix="ms"
          />
        </div>

        {metrics.topSources.length > 0 && (
          <Card title="Top Sources" size="small">
            <List
              dataSource={metrics.topSources}
              renderItem={(source) => (
                <List.Item>
                  <List.Item.Meta
                    title={source.source}
                    description={`${source.count} events`}
                  />
                  <Progress
                    percent={(source.count / metrics.totalEvents) * 100}
                    size="small"
                    style={{ width: 100 }}
                  />
                </List.Item>
              )}
            />
          </Card>
        )}
      </Space>
    );
  };

  const getTriggerIcon = (triggerType: string) => {
    const iconMap = {
      webhook: <GlobalOutlined />,
      http_request: <ApiOutlined />,
      email: <MailOutlined />,
      file_change: <FileTextOutlined />,
      database_change: <DatabaseOutlined />,
      api_poll: <ApiOutlined />,
      calendar_event: <CalendarOutlined />,
    };
    return iconMap[triggerType as keyof typeof iconMap] || <SettingOutlined />;
  };

  const getEventStatusColor = (status: string) => {
    switch (status) {
      case "processed":
        return "green";
      case "failed":
        return "red";
      case "filtered":
        return "orange";
      case "rate_limited":
        return "purple";
      default:
        return "default";
    }
  };

  return (
    <>
      <Modal
        title={
          <Space>
            <ThunderboltOutlined />
            Advanced Triggers
          </Space>
        }
        open={visible}
        onCancel={onClose}
        width={1200}
        footer={null}
        className={cn("trigger-management-panel")}
      >
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane
            tab={
              <span>
                <SettingOutlined />
                Triggers ({triggers.length})
              </span>
            }
            key="triggers"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card title="Create Trigger" size="small">
                {renderTriggerForm()}
                {webhookUrl && (
                  <Alert
                    message="Webhook URL"
                    description={
                      <Space direction="vertical" size="small">
                        <Text code>{webhookUrl}</Text>
                        <Button
                          size="small"
                          icon={<CopyOutlined />}
                          onClick={() => {
                            navigator.clipboard.writeText(webhookUrl);
                            message.success("URL copied");
                          }}
                        >
                          Copy URL
                        </Button>
                      </Space>
                    }
                    type="success"
                    style={{ marginTop: 16 }}
                  />
                )}
              </Card>
              <Card title="Active Triggers" size="small">
                {renderTriggersList()}
              </Card>
            </div>
          </TabPane>

          <TabPane
            tab={
              <span>
                <CheckCircleOutlined />
                Events
              </span>
            }
            key="events"
          >
            {renderEventsList()}
          </TabPane>

          <TabPane
            tab={
              <span>
                <div>📊</div>
                Metrics
              </span>
            }
            key="metrics"
          >
            <div className="mb-4">
              <Select
                placeholder="Select a trigger to view metrics"
                value={selectedTrigger?.id}
                onChange={(triggerId) => {
                  const trigger = triggers.find((t) => t.id === triggerId);
                  setSelectedTrigger(trigger || null);
                }}
                style={{ width: 300 }}
              >
                {triggers.map((trigger) => (
                  <Option key={trigger.id} value={trigger.id}>
                    {trigger.name}
                  </Option>
                ))}
              </Select>
            </div>
            {renderMetrics()}
          </TabPane>
        </Tabs>
      </Modal>

      <Modal
        title="Test Trigger"
        open={testModalVisible}
        onCancel={() => setTestModalVisible(false)}
        onOk={() => {
          if (selectedTrigger) {
            handleTestTrigger(selectedTrigger.id);
          }
        }}
      >
        <Form layout="vertical">
          <Form.Item label="Test Data (JSON)">
            <TextArea
              rows={8}
              placeholder={JSON.stringify(
                { test: true, timestamp: new Date().toISOString() },
                null,
                2,
              )}
            />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};
