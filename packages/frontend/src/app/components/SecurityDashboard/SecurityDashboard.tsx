/**
 * Security Dashboard Component
 *
 * Comprehensive security monitoring interface providing:
 * - Real-time security metrics and alerts
 * - Audit log visualization and filtering
 * - Vulnerability scan results and management
 * - Security incident tracking and response
 * - Compliance reporting and monitoring
 * - Secrets management and rotation
 */

import React, { useState, useCallback, useEffect } from "react";
import {
  Card,
  Button,
  Space,
  Typography,
  Table,
  Input,
  Select,
  Modal,
  Form,
  Tag,
  Badge,
  Tooltip,
  Alert,
  Tabs,
  Statistic,
  Timeline,
  DatePicker,
  Row,
  Col,
} from "antd";
import {
  BugOutlined,
  AlertOutlined,
  CheckCircleOutlined,
  EyeOutlined,
  SettingOutlined,
  ReloadOutlined,
  DownloadOutlined,
  KeyOutlined,
  SecurityScanOutlined,
  AuditOutlined,
} from "@ant-design/icons";
import { cn } from "@/design-system/utils";
import { enterpriseSecurityService } from "@/core/services/enterpriseSecurityService";
import type {
  AuditLog,
  SecurityMetrics,
  SecurityIncident,
  VulnerabilityScan,
  ComplianceReport,
  SecretManager,
  AuditSeverity,
  AuditCategory,
} from "@/core/types/security";

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

interface SecurityDashboardProps {
  className?: string;
}

const SecurityDashboard: React.FC<SecurityDashboardProps> = ({ className }) => {
  const [activeTab, setActiveTab] = useState("overview");
  const [metrics, setMetrics] = useState<SecurityMetrics | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [incidents, setIncidents] = useState<SecurityIncident[]>([]);
  const [vulnerabilityScans, setVulnerabilityScans] = useState<
    VulnerabilityScan[]
  >([]);
  const [complianceReports, setComplianceReports] = useState<
    ComplianceReport[]
  >([]);
  const [secrets, setSecrets] = useState<SecretManager[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIncident, setSelectedIncident] =
    useState<SecurityIncident | null>(null);
  const [isIncidentModalOpen, setIsIncidentModalOpen] = useState(false);
  const [isScanModalOpen, setIsScanModalOpen] = useState(false);
  const [isSecretModalOpen, setIsSecretModalOpen] = useState(false);
  const [filters, setFilters] = useState({
    severity: "all" as AuditSeverity | "all",
    category: "all" as AuditCategory | "all",
    startDate: null as any,
    endDate: null as any,
  });

  // Load data on component mount
  useEffect(() => {
    loadSecurityData();
  }, []);

  const loadSecurityData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [
        metricsData,
        auditLogsData,
        incidentsData,
        scansData,
        reportsData,
        secretsData,
      ] = await Promise.all([
        enterpriseSecurityService.getSecurityMetrics(),
        enterpriseSecurityService.getAuditLogs({ limit: 100 }),
        Promise.resolve([]), // getSecurityIncidents - method doesn't exist yet
        enterpriseSecurityService.getVulnerabilityScans(),
        Promise.resolve([]), // getComplianceReports - method doesn't exist yet
        Promise.resolve([]), // getSecrets - method doesn't exist yet
      ]);

      setMetrics(metricsData);
      setAuditLogs(auditLogsData);
      setIncidents(incidentsData as SecurityIncident[]);
      setVulnerabilityScans(scansData);
      setComplianceReports(reportsData as ComplianceReport[]);
      setSecrets(secretsData as SecretManager[]);
    } catch (error) {
      console.error("Failed to load security data:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "red";
      case "high":
        return "orange";
      case "medium":
        return "yellow";
      case "low":
        return "green";
      case "info":
        return "blue";
      default:
        return "default";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "red";
      case "investigating":
        return "orange";
      case "contained":
        return "blue";
      case "resolved":
        return "green";
      case "closed":
        return "gray";
      default:
        return "default";
    }
  };

  const filteredAuditLogs = auditLogs.filter((log) => {
    if (filters.severity !== "all" && log.severity !== filters.severity)
      return false;
    if (filters.category !== "all" && log.category !== filters.category)
      return false;
    if (filters.startDate && log.timestamp < filters.startDate.valueOf())
      return false;
    if (filters.endDate && log.timestamp > filters.endDate.valueOf())
      return false;
    return true;
  });

  const auditLogColumns = [
    {
      title: "Timestamp",
      key: "timestamp",
      render: (_record: AuditLog) => (
        <div className="text-gray-400 text-xs">
          {new Date(_record.timestamp).toLocaleString()}
        </div>
      ),
      sorter: (a: AuditLog, b: AuditLog) => a.timestamp - b.timestamp,
    },
    {
      title: "User",
      key: "user",
      render: (_record: AuditLog) => (
        <div>
          <div className="text-white text-sm">{_record.userEmail}</div>
          <div className="text-gray-400 text-xs">{_record.userId}</div>
        </div>
      ),
    },
    {
      title: "Action",
      key: "action",
      render: (_record: AuditLog) => (
        <div>
          <div className="text-white text-sm">{_record.action.description}</div>
          <Tag color={getSeverityColor(_record.severity)}>
            {_record.action.type}
          </Tag>
        </div>
      ),
    },
    {
      title: "Resource",
      key: "resource",
      render: (_record: AuditLog) => (
        <div>
          <div className="text-white text-sm">{_record.resource.name}</div>
          <div className="text-gray-400 text-xs">{_record.resource.type}</div>
        </div>
      ),
    },
    {
      title: "Severity",
      key: "severity",
      render: (_record: AuditLog) => (
        <Tag color={getSeverityColor(_record.severity)}>{_record.severity}</Tag>
      ),
    },
    {
      title: "IP Address",
      key: "ipAddress",
      render: (_record: AuditLog) => (
        <div className="text-gray-400 text-xs font-mono">
          {_record.ipAddress}
        </div>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_record: AuditLog) => (
        <Space size="small">
          <Tooltip title="View Details">
            <Button
              type="text"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => {
                // Show audit log details
              }}
              className="text-blue-400 hover:text-blue-300"
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  const incidentColumns = [
    {
      title: "Title",
      key: "title",
      render: (record: SecurityIncident) => (
        <div>
          <div className="text-white font-medium">{record.title}</div>
          <div className="text-gray-400 text-xs">{record.description}</div>
        </div>
      ),
    },
    {
      title: "Severity",
      key: "severity",
      render: (record: SecurityIncident) => (
        <Tag color={getSeverityColor(record.severity)}>{record.severity}</Tag>
      ),
    },
    {
      title: "Status",
      key: "status",
      render: (record: SecurityIncident) => (
        <Tag color={getStatusColor(record.status)}>{record.status}</Tag>
      ),
    },
    {
      title: "Category",
      key: "category",
      render: (record: SecurityIncident) => (
        <div className="text-gray-400 text-xs capitalize">
          {record.category.replace("_", " ")}
        </div>
      ),
    },
    {
      title: "Created",
      key: "createdAt",
      render: (record: SecurityIncident) => (
        <div className="text-gray-400 text-xs">
          {new Date(record.createdAt).toLocaleDateString()}
        </div>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (record: SecurityIncident) => (
        <Space size="small">
          <Tooltip title="View Details">
            <Button
              type="text"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => {
                setSelectedIncident(record);
                setIsIncidentModalOpen(true);
              }}
              className="text-blue-400 hover:text-blue-300"
            />
          </Tooltip>
          <Tooltip title="Update Status">
            <Button
              type="text"
              size="small"
              icon={<SettingOutlined />}
              onClick={() => {
                // Update incident status
              }}
              className="text-green-400 hover:text-green-300"
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  const renderOverviewTab = () => (
    <div className="space-y-6">
      {/* Security Metrics */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <Card size="small" className="bg-gray-800 border-gray-600">
            <Statistic
              title="Security Score"
              value={metrics?.securityScore || 0}
              suffix="/100"
              valueStyle={{ color: "#22c55e" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card size="small" className="bg-gray-800 border-gray-600">
            <Statistic
              title="Open Incidents"
              value={metrics?.openIncidents || 0}
              valueStyle={{ color: "#ef4444" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card size="small" className="bg-gray-800 border-gray-600">
            <Statistic
              title="Critical Incidents"
              value={metrics?.criticalIncidents || 0}
              valueStyle={{ color: "#dc2626" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card size="small" className="bg-gray-800 border-gray-600">
            <Statistic
              title="Compliance Score"
              value={metrics?.complianceScore || 0}
              suffix="/100"
              valueStyle={{ color: "#3b82f6" }}
            />
          </Card>
        </Col>
      </Row>

      {/* Recent Security Events */}
      <Card size="small" className="bg-gray-800 border-gray-600">
        <div className="flex items-center justify-between mb-4">
          <Title level={5} className="text-white mb-0">
            Recent Security Events
          </Title>
          <Button
            type="text"
            size="small"
            icon={<ReloadOutlined />}
            onClick={loadSecurityData}
            className="text-gray-400 hover:text-gray-300"
          />
        </div>

        <Timeline
          items={auditLogs.slice(0, 5).map((log) => ({
            color: getSeverityColor(log.severity),
            children: (
              <div className="space-y-1">
                <div className="text-white text-sm">
                  {log.action.description}
                </div>
                <div className="text-gray-400 text-xs">
                  {log.userEmail} • {new Date(log.timestamp).toLocaleString()}
                </div>
                <div className="flex items-center gap-2">
                  <Tag color={getSeverityColor(log.severity)}>
                    {log.severity}
                  </Tag>
                  <Tag>{log.category}</Tag>
                </div>
              </div>
            ),
          }))}
        />
      </Card>

      {/* Security Alerts */}
      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Card size="small" className="bg-gray-800 border-gray-600">
            <Title level={5} className="text-white mb-3">
              Security Alerts
            </Title>
            <div className="space-y-3">
              {incidents.slice(0, 3).map((incident) => (
                <Alert
                  key={incident.id}
                  message={incident.title}
                  description={incident.description}
                  type={incident.severity === "critical" ? "error" : "warning"}
                  showIcon
                  className="bg-red-900 border-red-600"
                />
              ))}
            </div>
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card size="small" className="bg-gray-800 border-gray-600">
            <Title level={5} className="text-white mb-3">
              Vulnerability Summary
            </Title>
            <div className="space-y-3">
              {vulnerabilityScans.slice(0, 3).map((scan) => (
                <div
                  key={scan.id}
                  className="flex items-center justify-between p-2 bg-gray-700 rounded"
                >
                  <div>
                    <div className="text-white text-sm">{scan.target}</div>
                    <div className="text-gray-400 text-xs">{scan.scanType}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-white text-sm">
                      {scan.summary.total}
                    </div>
                    <div className="text-gray-400 text-xs">findings</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );

  const renderAuditLogsTab = () => (
    <div className="space-y-4">
      <Card size="small" className="bg-gray-800 border-gray-600">
        <div className="flex items-center justify-between mb-4">
          <Title level={5} className="text-white mb-0">
            Audit Logs
          </Title>
          <Space>
            <Select
              value={filters.severity}
              onChange={(value) => setFilters({ ...filters, severity: value })}
              className="w-32"
            >
              <Option value="all">All Severity</Option>
              <Option value="critical">Critical</Option>
              <Option value="error">Error</Option>
              <Option value="warning">Warning</Option>
              <Option value="info">Info</Option>
            </Select>
            <Select
              value={filters.category}
              onChange={(value) => setFilters({ ...filters, category: value })}
              className="w-40"
            >
              <Option value="all">All Categories</Option>
              <Option value="authentication">Authentication</Option>
              <Option value="authorization">Authorization</Option>
              <Option value="data_access">Data Access</Option>
              <Option value="security_event">Security Event</Option>
            </Select>
            <RangePicker
              value={[filters.startDate, filters.endDate]}
              onChange={(dates) =>
                setFilters({
                  ...filters,
                  startDate: dates?.[0],
                  endDate: dates?.[1],
                })
              }
              className="w-64"
            />
            <Button
              type="primary"
              icon={<DownloadOutlined />}
              onClick={() => {
                // Export audit logs
              }}
            >
              Export
            </Button>
          </Space>
        </div>

        <Table
          columns={auditLogColumns}
          dataSource={filteredAuditLogs}
          loading={isLoading}
          pagination={{ pageSize: 20 }}
          size="small"
          className="bg-transparent"
          rowKey="id"
          scroll={{ x: "max-content" }}
        />
      </Card>
    </div>
  );

  const renderIncidentsTab = () => (
    <div className="space-y-4">
      <Card size="small" className="bg-gray-800 border-gray-600">
        <div className="flex items-center justify-between mb-4">
          <Title level={5} className="text-white mb-0">
            Security Incidents
          </Title>
          <Button
            type="primary"
            icon={<AlertOutlined />}
            onClick={() => setIsIncidentModalOpen(true)}
          >
            Create Incident
          </Button>
        </div>

        <Table
          columns={incidentColumns}
          dataSource={incidents}
          loading={isLoading}
          pagination={{ pageSize: 10 }}
          size="small"
          className="bg-transparent"
          rowKey="id"
        />
      </Card>
    </div>
  );

  const renderVulnerabilitiesTab = () => (
    <div className="space-y-4">
      <Card size="small" className="bg-gray-800 border-gray-600">
        <div className="flex items-center justify-between mb-4">
          <Title level={5} className="text-white mb-0">
            Vulnerability Scans
          </Title>
          <Button
            type="primary"
            icon={<SecurityScanOutlined />}
            onClick={() => setIsScanModalOpen(true)}
          >
            Start Scan
          </Button>
        </div>

        <div className="space-y-3">
          {vulnerabilityScans.map((scan) => (
            <Card
              key={scan.id}
              size="small"
              className="bg-gray-700 border-gray-600"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-white font-medium">{scan.target}</div>
                  <div className="text-gray-400 text-xs">{scan.scanType}</div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <div className="text-white text-lg font-bold">
                      {scan.summary.total}
                    </div>
                    <div className="text-gray-400 text-xs">Total</div>
                  </div>
                  <div className="text-center">
                    <div className="text-red-400 text-lg font-bold">
                      {scan.summary.critical}
                    </div>
                    <div className="text-gray-400 text-xs">Critical</div>
                  </div>
                  <div className="text-center">
                    <div className="text-orange-400 text-lg font-bold">
                      {scan.summary.high}
                    </div>
                    <div className="text-gray-400 text-xs">High</div>
                  </div>
                  <Tag color={scan.status === "completed" ? "green" : "orange"}>
                    {scan.status}
                  </Tag>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </Card>
    </div>
  );

  const renderComplianceTab = () => (
    <div className="space-y-4">
      <Card size="small" className="bg-gray-800 border-gray-600">
        <div className="flex items-center justify-between mb-4">
          <Title level={5} className="text-white mb-0">
            Compliance Reports
          </Title>
          <Button
            type="primary"
            icon={<AuditOutlined />}
            onClick={() => {
              // Generate compliance report
            }}
          >
            Generate Report
          </Button>
        </div>

        <div className="space-y-3">
          {complianceReports.map((report) => (
            <Card
              key={report.id}
              size="small"
              className="bg-gray-700 border-gray-600"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-white font-medium">
                    {report.standard} Compliance Report
                  </div>
                  <div className="text-gray-400 text-xs">
                    Generated:{" "}
                    {new Date(report.generatedAt).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <div className="text-white text-lg font-bold">
                      {report.score}
                    </div>
                    <div className="text-gray-400 text-xs">Score</div>
                  </div>
                  <div className="text-center">
                    <div className="text-white text-lg font-bold">
                      {report.findings.length}
                    </div>
                    <div className="text-gray-400 text-xs">Findings</div>
                  </div>
                  <Tag
                    color={report.status === "completed" ? "green" : "orange"}
                  >
                    {report.status}
                  </Tag>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </Card>
    </div>
  );

  const renderSecretsTab = () => (
    <div className="space-y-4">
      <Card size="small" className="bg-gray-800 border-gray-600">
        <div className="flex items-center justify-between mb-4">
          <Title level={5} className="text-white mb-0">
            Secrets Management
          </Title>
          <Button
            type="primary"
            icon={<KeyOutlined />}
            onClick={() => setIsSecretModalOpen(true)}
          >
            Create Secret
          </Button>
        </div>

        <div className="space-y-3">
          {secrets.map((secret) => (
            <Card
              key={secret.id}
              size="small"
              className="bg-gray-700 border-gray-600"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-white font-medium">{secret.name}</div>
                  <div className="text-gray-400 text-xs">{secret.type}</div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <div className="text-white text-lg font-bold">
                      {secret.metadata?.accessCount || 0}
                    </div>
                    <div className="text-gray-400 text-xs">Access Count</div>
                  </div>
                  <div className="text-center">
                    <div className="text-white text-lg font-bold">
                      {secret.keyVersion}
                    </div>
                    <div className="text-gray-400 text-xs">Key Version</div>
                  </div>
                  <Space>
                    <Tooltip title="Rotate Secret">
                      <Button
                        type="text"
                        size="small"
                        icon={<ReloadOutlined />}
                        className="text-blue-400 hover:text-blue-300"
                      />
                    </Tooltip>
                    <Tooltip title="View Details">
                      <Button
                        type="text"
                        size="small"
                        icon={<EyeOutlined />}
                        className="text-green-400 hover:text-green-300"
                      />
                    </Tooltip>
                  </Space>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </Card>
    </div>
  );

  return (
    <div className={cn("h-full bg-gray-900", className)}>
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center gap-2 mb-2">
          <CheckCircleOutlined className="text-green-400 text-lg" />
          <Title level={4} className="text-white mb-0">
            Security Dashboard
          </Title>
        </div>
        <Text className="text-gray-400 text-sm">
          Enterprise security monitoring and compliance management
        </Text>
      </div>

      <div className="p-4">
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          className="security-dashboard-tabs"
          items={[
            {
              key: "overview",
              label: (
                <span>
                  <CheckCircleOutlined className="mr-1" />
                  Overview
                </span>
              ),
              children: renderOverviewTab(),
            },
            {
              key: "audit",
              label: (
                <span>
                  <AuditOutlined className="mr-1" />
                  Audit Logs
                  <Badge
                    count={auditLogs.length}
                    size="small"
                    className="ml-2"
                  />
                </span>
              ),
              children: renderAuditLogsTab(),
            },
            {
              key: "incidents",
              label: (
                <span>
                  <AlertOutlined className="mr-1" />
                  Incidents
                  <Badge
                    count={incidents.filter((i) => i.status === "open").length}
                    size="small"
                    className="ml-2"
                  />
                </span>
              ),
              children: renderIncidentsTab(),
            },
            {
              key: "vulnerabilities",
              label: (
                <span>
                  <BugOutlined className="mr-1" />
                  Vulnerabilities
                  <Badge
                    count={vulnerabilityScans.length}
                    size="small"
                    className="ml-2"
                  />
                </span>
              ),
              children: renderVulnerabilitiesTab(),
            },
            {
              key: "compliance",
              label: (
                <span>
                  <CheckCircleOutlined className="mr-1" />
                  Compliance
                  <Badge
                    count={complianceReports.length}
                    size="small"
                    className="ml-2"
                  />
                </span>
              ),
              children: renderComplianceTab(),
            },
            {
              key: "secrets",
              label: (
                <span>
                  <KeyOutlined className="mr-1" />
                  Secrets
                  <Badge count={secrets.length} size="small" className="ml-2" />
                </span>
              ),
              children: renderSecretsTab(),
            },
          ]}
        />
      </div>

      {/* Incident Details Modal */}
      <Modal
        title="Security Incident Details"
        open={isIncidentModalOpen}
        onCancel={() => setIsIncidentModalOpen(false)}
        footer={null}
        width={800}
      >
        {selectedIncident && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Text className="text-gray-400">Title</Text>
                <div className="text-white font-medium">
                  {selectedIncident.title}
                </div>
              </div>
              <div>
                <Text className="text-gray-400">Severity</Text>
                <div>
                  <Tag color={getSeverityColor(selectedIncident.severity)}>
                    {selectedIncident.severity}
                  </Tag>
                </div>
              </div>
              <div>
                <Text className="text-gray-400">Status</Text>
                <div>
                  <Tag color={getStatusColor(selectedIncident.status)}>
                    {selectedIncident.status}
                  </Tag>
                </div>
              </div>
              <div>
                <Text className="text-gray-400">Category</Text>
                <div className="text-white">{selectedIncident.category}</div>
              </div>
            </div>

            <div>
              <Text className="text-gray-400">Description</Text>
              <div className="text-white">{selectedIncident.description}</div>
            </div>

            <div>
              <Text className="text-gray-400">Timeline</Text>
              <Timeline
                items={selectedIncident.timeline.map((event) => ({
                  color: "blue",
                  children: (
                    <div className="space-y-1">
                      <div className="text-white text-sm">
                        {event.description}
                      </div>
                      <div className="text-gray-400 text-xs">
                        {new Date(event.timestamp).toLocaleString()} •{" "}
                        {event.actor}
                      </div>
                    </div>
                  ),
                }))}
              />
            </div>
          </div>
        )}
      </Modal>

      {/* Start Vulnerability Scan Modal */}
      <Modal
        title="Start Vulnerability Scan"
        open={isScanModalOpen}
        onCancel={() => setIsScanModalOpen(false)}
        onOk={() => setIsScanModalOpen(false)}
        width={500}
      >
        <Form layout="vertical">
          <Form.Item label="Scan Type" required>
            <Select placeholder="Select scan type">
              <Option value="dependency">Dependency Scan</Option>
              <Option value="container">Container Scan</Option>
              <Option value="infrastructure">Infrastructure Scan</Option>
              <Option value="code">Code Scan</Option>
            </Select>
          </Form.Item>
          <Form.Item label="Target" required>
            <Input placeholder="Enter target (URL, path, etc.)" />
          </Form.Item>
          <Form.Item label="Options">
            <Input.TextArea
              placeholder="Additional scan options (JSON)"
              rows={3}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* Create Secret Modal */}
      <Modal
        title="Create Secret"
        open={isSecretModalOpen}
        onCancel={() => setIsSecretModalOpen(false)}
        onOk={() => setIsSecretModalOpen(false)}
        width={600}
      >
        <Form layout="vertical">
          <Form.Item label="Name" required>
            <Input placeholder="Secret name" />
          </Form.Item>
          <Form.Item label="Type" required>
            <Select placeholder="Select secret type">
              <Option value="api_key">API Key</Option>
              <Option value="password">Password</Option>
              <Option value="certificate">Certificate</Option>
              <Option value="token">Token</Option>
              <Option value="database_credential">Database Credential</Option>
            </Select>
          </Form.Item>
          <Form.Item label="Value" required>
            <Input.TextArea placeholder="Secret value" rows={3} />
          </Form.Item>
          <Form.Item label="Description">
            <Input.TextArea placeholder="Secret description" rows={2} />
          </Form.Item>
          <Form.Item label="Classification">
            <Select placeholder="Select data classification">
              <Option value="public">Public</Option>
              <Option value="internal">Internal</Option>
              <Option value="confidential">Confidential</Option>
              <Option value="restricted">Restricted</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default SecurityDashboard;
