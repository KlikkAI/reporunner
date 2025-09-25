import { useState } from './hooks/useState';
import { useEffect } from './hooks/useEffect';
import {
  AlertOutlined,
  AuditOutlined,
  CheckCircleOutlined,
  DownloadOutlined,
  ExportOutlined,
  EyeOutlined,
  FilterOutlined,
  GlobalOutlined,
  ReloadOutlined,
  SecurityScanOutlined,
  UserOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import {
  Alert,
  Button,
  Card,
  Col,
  DatePicker,
  Descriptions,
  Input,
  Modal,
  Row,
  Select,
  Space,
  Statistic,
  Table,
  Tag,
  Typography,
} from 'antd';
import type React from 'react';
import { useEffect, useState } from 'react';
import {
  type AuditEvent,
  type AuditFilter,
  auditService,
  type ComplianceReport,
  type SecurityAlert,
} from '@/core/services/auditService';

const { RangePicker } = DatePicker;
const { Option } = Select;
const { Search } = Input;
const { Title, Text } = Typography;

export const AuditDashboard: React.FC = () => {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<AuditEvent[]>([]);
  const [securityAlerts, setSecurityAlerts] = useState<SecurityAlert[]>([]);
  const [complianceReports, setComplianceReports] = useState<ComplianceReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<AuditEvent | null>(null);
  const [filter, setFilter] = useState<AuditFilter>({});
  const [exportModalVisible, setExportModalVisible] = useState(false);

  // Filter states
  const [dateRange, setDateRange] = useState<[any, any] | null>(null);
  const [selectedUser, setSelectedUser] = useState<string>();
  const [selectedAction, setSelectedAction] = useState<string>();
  const [selectedResource, setSelectedResource] = useState<string>();
  const [selectedSeverity, setSelectedSeverity] = useState<string>();
  const [selectedCategory, setSelectedCategory] = useState<string>();
  const [searchTerm, setSearchTerm] = useState<string>('');

  useEffect(() => {
    loadAuditData();
  }, [loadAuditData]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const loadAuditData = async () => {
    setLoading(true);
    try {
      // In a real app, these would be API calls
      const mockEvents: AuditEvent[] = [
        {
          id: '1',
          timestamp: new Date(Date.now() - 3600000),
          userId: 'user1',
          userName: 'John Doe',
          action: 'login',
          resource: 'authentication',
          details: { success: true },
          ipAddress: '192.168.1.100',
          userAgent: 'Mozilla/5.0...',
          organizationId: 'org1',
          severity: 'low',
          category: 'authentication',
          result: 'success',
        },
        {
          id: '2',
          timestamp: new Date(Date.now() - 7200000),
          userId: 'user2',
          userName: 'Jane Smith',
          action: 'execute',
          resource: 'workflow',
          resourceId: 'wf123',
          details: { workflowName: 'Data Pipeline', executionId: 'exec456' },
          ipAddress: '192.168.1.101',
          userAgent: 'Mozilla/5.0...',
          organizationId: 'org1',
          severity: 'medium',
          category: 'workflow',
          result: 'success',
        },
        {
          id: '3',
          timestamp: new Date(Date.now() - 10800000),
          userId: 'user3',
          userName: 'Bob Wilson',
          action: 'delete',
          resource: 'workflow',
          resourceId: 'wf789',
          details: { workflowName: 'Legacy Process' },
          ipAddress: '192.168.1.102',
          userAgent: 'Mozilla/5.0...',
          organizationId: 'org1',
          severity: 'high',
          category: 'workflow',
          result: 'success',
        },
        {
          id: '4',
          timestamp: new Date(Date.now() - 14400000),
          userId: 'user1',
          userName: 'John Doe',
          action: 'login',
          resource: 'authentication',
          details: { success: false },
          ipAddress: '192.168.1.100',
          userAgent: 'Mozilla/5.0...',
          organizationId: 'org1',
          severity: 'medium',
          category: 'authentication',
          result: 'failure',
        },
      ];

      const mockAlerts: SecurityAlert[] = [
        {
          id: 'alert1',
          type: 'failed_login_attempts',
          severity: 'high',
          title: 'Multiple Failed Login Attempts',
          description: 'User john.doe@example.com has 5 failed login attempts in the last hour',
          triggeredAt: new Date(Date.now() - 1800000),
          userId: 'user1',
          organizationId: 'org1',
          events: [mockEvents[3]],
          status: 'open',
        },
      ];

      setEvents(mockEvents);
      setSecurityAlerts(mockAlerts);
    } catch (_error) {
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = async () => {
    const newFilter: AuditFilter = {
      ...filter,
      startDate: dateRange?.[0]?.toDate(),
      endDate: dateRange?.[1]?.toDate(),
      userId: selectedUser,
      action: selectedAction,
      resource: selectedResource,
      severity: selectedSeverity as any,
      category: selectedCategory as any,
      searchTerm,
    };

    try {
      const filtered = await auditService.getEvents(newFilter, 1000, 0);
      setFilteredEvents(
        filtered.length > 0
          ? filtered
          : events.filter((event) => {
              if (newFilter.startDate && event.timestamp < newFilter.startDate) return false;
              if (newFilter.endDate && event.timestamp > newFilter.endDate) return false;
              if (newFilter.userId && event.userId !== newFilter.userId) return false;
              if (newFilter.action && !event.action.includes(newFilter.action)) return false;
              if (newFilter.resource && event.resource !== newFilter.resource) return false;
              if (newFilter.severity && event.severity !== newFilter.severity) return false;
              if (newFilter.category && event.category !== newFilter.category) return false;
              if (newFilter.searchTerm) {
                const searchLower = newFilter.searchTerm.toLowerCase();
                const matchesSearch =
                  event.action.toLowerCase().includes(searchLower) ||
                  event.resource.toLowerCase().includes(searchLower) ||
                  event.userName.toLowerCase().includes(searchLower) ||
                  JSON.stringify(event.details).toLowerCase().includes(searchLower);
                if (!matchesSearch) return false;
              }
              return true;
            })
      );
    } catch (_error) {
      setFilteredEvents(events);
    }
  };

  const clearFilters = () => {
    setDateRange(null);
    setSelectedUser(undefined);
    setSelectedAction(undefined);
    setSelectedResource(undefined);
    setSelectedSeverity(undefined);
    setSelectedCategory(undefined);
    setSearchTerm('');
    setFilter({});
  };

  const exportData = async (format: 'json' | 'csv') => {
    try {
      const startDate = dateRange?.[0]?.toDate() || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const endDate = dateRange?.[1]?.toDate() || new Date();

      const data = await auditService.exportAuditData('org1', startDate, endDate, format);

      const blob = new Blob([data], {
        type: format === 'json' ? 'application/json' : 'text/csv',
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-log-${startDate.toISOString().split('T')[0]}-${endDate.toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setExportModalVisible(false);
    } catch (_error) {}
  };

  const generateComplianceReport = async () => {
    try {
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Last 30 days
      const endDate = new Date();

      const report = await auditService.generateComplianceReport(
        'org1',
        startDate,
        endDate,
        'current-user'
      );
      setComplianceReports([...complianceReports, report]);

      Modal.info({
        title: 'Compliance Report Generated',
        content: `Report "${report.name}" has been generated successfully. Status: ${report.status}`,
        width: 600,
      });
    } catch (_error) {}
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'red';
      case 'high':
        return 'orange';
      case 'medium':
        return 'gold';
      case 'low':
        return 'green';
      default:
        return 'default';
    }
  };

  const getResultColor = (result: string) => {
    switch (result) {
      case 'success':
        return 'green';
      case 'failure':
        return 'red';
      case 'error':
        return 'orange';
      default:
        return 'default';
    }
  };

  const columns = [
    {
      title: 'Timestamp',
      dataIndex: 'timestamp',
      key: 'timestamp',
      width: 180,
      render: (timestamp: Date) => (
        <div>
          <div>{timestamp.toLocaleDateString()}</div>
          <Text type="secondary">{timestamp.toLocaleTimeString()}</Text>
        </div>
      ),
      sorter: (a: AuditEvent, b: AuditEvent) => b.timestamp.getTime() - a.timestamp.getTime(),
      defaultSortOrder: 'descend' as const,
    },
    {
      title: 'User',
      dataIndex: 'userName',
      key: 'userName',
      width: 150,
      render: (userName: string, record: AuditEvent) => (
        <div>
          <UserOutlined /> {userName}
          <br />
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {record.ipAddress}
          </Text>
        </div>
      ),
    },
    {
      title: 'Action',
      dataIndex: 'action',
      key: 'action',
      width: 120,
      render: (action: string) => <Tag color="blue">{action}</Tag>,
    },
    {
      title: 'Resource',
      dataIndex: 'resource',
      key: 'resource',
      width: 120,
      render: (resource: string, record: AuditEvent) => (
        <div>
          <Tag color="purple">{resource}</Tag>
          {record.resourceId && (
            <div>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                ID: {record.resourceId}
              </Text>
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Result',
      dataIndex: 'result',
      key: 'result',
      width: 100,
      render: (result: string) => <Tag color={getResultColor(result)}>{result}</Tag>,
    },
    {
      title: 'Severity',
      dataIndex: 'severity',
      key: 'severity',
      width: 100,
      render: (severity: string) => <Tag color={getSeverityColor(severity)}>{severity}</Tag>,
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      width: 120,
      render: (category: string) => <Tag>{category}</Tag>,
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 100,
      render: (_: unknown, record: AuditEvent) => (
        <Button type="link" icon={<EyeOutlined />} onClick={() => setSelectedEvent(record)}>
          View
        </Button>
      ),
    },
  ];

  const uniqueUsers = Array.from(new Set(events.map((e) => e.userName)));
  const uniqueActions = Array.from(new Set(events.map((e) => e.action)));
  const uniqueResources = Array.from(new Set(events.map((e) => e.resource)));

  const securityMetrics = {
    totalEvents: filteredEvents.length,
    securityEvents: filteredEvents.filter(
      (e) =>
        e.category === 'authentication' ||
        e.category === 'authorization' ||
        e.severity === 'high' ||
        e.severity === 'critical'
    ).length,
    failedLogins: filteredEvents.filter((e) => e.action === 'login' && e.result === 'failure')
      .length,
    criticalEvents: filteredEvents.filter((e) => e.severity === 'critical').length,
  };

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: 24 }}>
        <Title level={2}>
          <AuditOutlined /> Audit & Security Dashboard
        </Title>
        <Text type="secondary">Monitor security events, audit trails, and compliance status</Text>
      </div>

      {/* Security Metrics */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Events"
              value={securityMetrics.totalEvents}
              prefix={<AuditOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Security Events"
              value={securityMetrics.securityEvents}
              prefix={<SecurityScanOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Failed Logins"
              value={securityMetrics.failedLogins}
              prefix={<WarningOutlined />}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Critical Events"
              value={securityMetrics.criticalEvents}
              prefix={<AlertOutlined />}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Security Alerts */}
      {securityAlerts.length > 0 && (
        <Card
          title={
            <span>
              <AlertOutlined /> Active Security Alerts
            </span>
          }
          style={{ marginBottom: 24 }}
        >
          {securityAlerts.map((alert) => (
            <Alert
              key={alert.id}
              message={alert.title}
              description={alert.description}
              type={
                alert.severity === 'critical'
                  ? 'error'
                  : alert.severity === 'high'
                    ? 'warning'
                    : 'info'
              }
              showIcon
              style={{ marginBottom: 8 }}
              action={
                <Button size="small" type="link">
                  Investigate
                </Button>
              }
            />
          ))}
        </Card>
      )}

      {/* Filters */}
      <Card
        title={
          <span>
            <FilterOutlined /> Filters & Search
          </span>
        }
        style={{ marginBottom: 24 }}
        extra={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={loadAuditData} loading={loading}>
              Refresh
            </Button>
            <Button icon={<ExportOutlined />} onClick={() => setExportModalVisible(true)}>
              Export
            </Button>
            <Button icon={<CheckCircleOutlined />} onClick={generateComplianceReport}>
              Generate Report
            </Button>
          </Space>
        }
      >
        <Space wrap style={{ marginBottom: 16 }}>
          <RangePicker
            value={dateRange}
            onChange={setDateRange}
            showTime
            format="YYYY-MM-DD HH:mm"
            placeholder={['Start Date', 'End Date']}
          />

          <Select
            placeholder="Select User"
            value={selectedUser}
            onChange={setSelectedUser}
            allowClear
            style={{ width: 150 }}
          >
            {uniqueUsers.map((user) => (
              <Option key={user} value={user}>
                {user}
              </Option>
            ))}
          </Select>

          <Select
            placeholder="Select Action"
            value={selectedAction}
            onChange={setSelectedAction}
            allowClear
            style={{ width: 150 }}
          >
            {uniqueActions.map((action) => (
              <Option key={action} value={action}>
                {action}
              </Option>
            ))}
          </Select>

          <Select
            placeholder="Select Resource"
            value={selectedResource}
            onChange={setSelectedResource}
            allowClear
            style={{ width: 150 }}
          >
            {uniqueResources.map((resource) => (
              <Option key={resource} value={resource}>
                {resource}
              </Option>
            ))}
          </Select>

          <Select
            placeholder="Severity"
            value={selectedSeverity}
            onChange={setSelectedSeverity}
            allowClear
            style={{ width: 120 }}
          >
            <Option value="low">Low</Option>
            <Option value="medium">Medium</Option>
            <Option value="high">High</Option>
            <Option value="critical">Critical</Option>
          </Select>

          <Select
            placeholder="Category"
            value={selectedCategory}
            onChange={setSelectedCategory}
            allowClear
            style={{ width: 150 }}
          >
            <Option value="authentication">Authentication</Option>
            <Option value="authorization">Authorization</Option>
            <Option value="workflow">Workflow</Option>
            <Option value="credential">Credential</Option>
            <Option value="organization">Organization</Option>
            <Option value="user_management">User Management</Option>
          </Select>

          <Button onClick={clearFilters}>Clear Filters</Button>
        </Space>

        <Search
          placeholder="Search events..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ width: 300 }}
        />
      </Card>

      {/* Audit Events Table */}
      <Card
        title={
          <span>
            <AuditOutlined /> Audit Events ({filteredEvents.length})
          </span>
        }
      >
        <Table
          dataSource={filteredEvents}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 50,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} events`,
          }}
          scroll={{ x: 1200 }}
        />
      </Card>

      {/* Event Details Modal */}
      <Modal
        title="Event Details"
        open={!!selectedEvent}
        onCancel={() => setSelectedEvent(null)}
        footer={null}
        width={800}
      >
        {selectedEvent && (
          <Descriptions column={2} bordered>
            <Descriptions.Item label="Timestamp">
              {selectedEvent.timestamp.toLocaleString()}
            </Descriptions.Item>
            <Descriptions.Item label="User">
              {selectedEvent.userName} ({selectedEvent.userId})
            </Descriptions.Item>
            <Descriptions.Item label="Action">
              <Tag color="blue">{selectedEvent.action}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Resource">
              <Tag color="purple">{selectedEvent.resource}</Tag>
              {selectedEvent.resourceId && ` (${selectedEvent.resourceId})`}
            </Descriptions.Item>
            <Descriptions.Item label="Result">
              <Tag color={getResultColor(selectedEvent.result)}>{selectedEvent.result}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Severity">
              <Tag color={getSeverityColor(selectedEvent.severity)}>{selectedEvent.severity}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Category">
              <Tag>{selectedEvent.category}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="IP Address">
              <GlobalOutlined /> {selectedEvent.ipAddress}
            </Descriptions.Item>
            <Descriptions.Item label="Organization" span={2}>
              {selectedEvent.organizationId || 'N/A'}
            </Descriptions.Item>
            <Descriptions.Item label="Details" span={2}>
              <pre
                style={{
                  fontSize: '12px',
                  background: '#f5f5f5',
                  padding: '8px',
                  borderRadius: '4px',
                }}
              >
                {JSON.stringify(selectedEvent.details, null, 2)}
              </pre>
            </Descriptions.Item>
            <Descriptions.Item label="User Agent" span={2}>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                {selectedEvent.userAgent}
              </Text>
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>

      {/* Export Modal */}
      <Modal
        title="Export Audit Data"
        open={exportModalVisible}
        onCancel={() => setExportModalVisible(false)}
        footer={null}
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <Text>Select export format:</Text>
          <Space>
            <Button icon={<DownloadOutlined />} onClick={() => exportData('json')} type="primary">
              Export as JSON
            </Button>
            <Button icon={<DownloadOutlined />} onClick={() => exportData('csv')}>
              Export as CSV
            </Button>
          </Space>
          <Text type="secondary">
            Export will include all events within the selected date range.
          </Text>
        </Space>
      </Modal>
    </div>
  );
};
