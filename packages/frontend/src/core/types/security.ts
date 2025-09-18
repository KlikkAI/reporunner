/**
 * Enterprise Security & Compliance Types
 *
 * Comprehensive security system providing:
 * - Audit logging with tamper detection
 * - SOC2 Type II compliance framework
 * - GDPR/CCPA privacy controls with data lineage
 * - Vulnerability scanning and dependency monitoring
 * - Secrets management with rotation policies
 * - Encryption and data protection
 */

export interface AuditLog {
  id: string;
  timestamp: number;
  userId: string;
  userEmail: string;
  action: AuditAction;
  resource: AuditResource;
  resourceId: string;
  details: AuditDetails;
  ipAddress: string;
  userAgent: string;
  sessionId: string;
  severity: AuditSeverity;
  category: AuditCategory;
  tags: string[];
  hash: string; // For tamper detection
  previousHash?: string; // Chain of custody
  metadata: Record<string, any>;
}

export interface AuditAction {
  type: AuditActionType;
  description: string;
  parameters?: Record<string, any>;
  outcome: 'success' | 'failure' | 'partial';
  errorMessage?: string;
}

export interface AuditResource {
  type: AuditResourceType;
  name: string;
  identifier: string;
  metadata?: Record<string, any>;
}

export interface AuditDetails {
  before?: any;
  after?: any;
  changes?: AuditChange[];
  context?: Record<string, any>;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  complianceFlags: ComplianceFlag[];
}

export interface AuditChange {
  field: string;
  oldValue: any;
  newValue: any;
  changeType: 'added' | 'modified' | 'removed';
}

export interface ComplianceFlag {
  standard: ComplianceStandard;
  requirement: string;
  status: 'compliant' | 'non-compliant' | 'not-applicable';
  evidence?: string;
  remediation?: string;
}

export interface SecurityPolicy {
  id: string;
  name: string;
  description: string;
  type: SecurityPolicyType;
  rules: SecurityRule[];
  enforcement: PolicyEnforcement;
  scope: PolicyScope;
  createdAt: number;
  updatedAt: number;
  enabled: boolean;
  version: string;
}

export interface SecurityRule {
  id: string;
  name: string;
  description: string;
  condition: SecurityCondition;
  action: SecurityAction;
  priority: number;
  enabled: boolean;
}

export interface SecurityCondition {
  type: 'ip_whitelist' | 'time_based' | 'user_role' | 'resource_access' | 'data_classification' | 'custom';
  parameters: Record<string, any>;
  operator: 'and' | 'or' | 'not';
  children?: SecurityCondition[];
}

export interface SecurityAction {
  type: 'allow' | 'deny' | 'log' | 'alert' | 'encrypt' | 'quarantine' | 'custom';
  parameters: Record<string, any>;
  notification?: NotificationConfig;
}

export interface PolicyEnforcement {
  mode: 'enforce' | 'audit' | 'disabled';
  failureAction: 'block' | 'log' | 'alert';
  retryAttempts: number;
  timeout: number;
}

export interface PolicyScope {
  resources: string[];
  users: string[];
  environments: string[];
  timeframes?: TimeFrame[];
}

export interface TimeFrame {
  start: string; // Cron expression
  end: string; // Cron expression
  timezone: string;
}

export interface VulnerabilityScan {
  id: string;
  scanType: VulnerabilityScanType;
  target: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startedAt: number;
  completedAt?: number;
  findings: VulnerabilityFinding[];
  summary: VulnerabilitySummary;
  metadata: Record<string, any>;
}

export interface VulnerabilityFinding {
  id: string;
  severity: VulnerabilitySeverity;
  title: string;
  description: string;
  cve?: string;
  cvss?: number;
  package: string;
  version: string;
  fixedVersion?: string;
  path: string;
  references: string[];
  remediation: string;
  status: 'open' | 'fixed' | 'ignored' | 'false-positive';
  createdAt: number;
  updatedAt: number;
}

export interface VulnerabilitySummary {
  total: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  info: number;
  fixed: number;
  ignored: number;
}

export interface SecretManager {
  id: string;
  name: string;
  type: SecretType;
  encryptedData: string;
  encryptionKey: string;
  keyVersion: number;
  rotationPolicy: RotationPolicy;
  accessPolicy: AccessPolicy;
  metadata: SecretMetadata;
  createdAt: number;
  updatedAt: number;
  lastAccessedAt?: number;
  expiresAt?: number;
  accessCount: number;
}

export interface RotationPolicy {
  enabled: boolean;
  interval: number; // milliseconds
  method: 'automatic' | 'manual' | 'scheduled';
  schedule?: string; // Cron expression
  notificationDays: number; // Days before expiration
  autoRotation: boolean;
}

export interface AccessPolicy {
  users: string[];
  roles: string[];
  applications: string[];
  ipWhitelist: string[];
  timeRestrictions: TimeRestriction[];
  maxAccessCount?: number;
  accessCount: number;
}

export interface TimeRestriction {
  days: number[]; // 0-6 (Sunday-Saturday)
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  timezone: string;
}

export interface SecretMetadata {
  description: string;
  tags: string[];
  classification: DataClassification;
  owner: string;
  environment: string;
  application: string;
  compliance: ComplianceRequirement[];
  accessCount?: number; // Optional access count for tracking usage
}

export interface DataClassification {
  level: 'public' | 'internal' | 'confidential' | 'restricted';
  categories: string[];
  retentionPeriod: number; // milliseconds
  encryptionRequired: boolean;
  accessLoggingRequired: boolean;
}

export interface ComplianceRequirement {
  standard: ComplianceStandard;
  requirement: string;
  status: 'compliant' | 'non-compliant' | 'not-applicable';
  evidence: string;
  lastAudit: number;
}

export interface EncryptionService {
  algorithm: EncryptionAlgorithm;
  keySize: number;
  mode: EncryptionMode;
  padding: EncryptionPadding;
  keyManagement: KeyManagementConfig;
}

export interface KeyManagementConfig {
  provider: 'aws-kms' | 'azure-keyvault' | 'google-kms' | 'local' | 'custom';
  keyId: string;
  region?: string;
  rotationEnabled: boolean;
  rotationInterval: number;
  backupEnabled: boolean;
}

export interface SecurityIncident {
  id: string;
  title: string;
  description: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  category: IncidentCategory;
  source: IncidentSource;
  affectedResources: string[];
  timeline: IncidentEvent[];
  assignee?: string;
  createdAt: number;
  updatedAt: number;
  resolvedAt?: number;
  metadata: Record<string, any>;
}

export interface IncidentEvent {
  id: string;
  timestamp: number;
  type: IncidentEventType;
  description: string;
  actor: string;
  details: Record<string, any>;
}

export interface SecurityMetrics {
  totalIncidents: number;
  openIncidents: number;
  resolvedIncidents: number;
  averageResolutionTime: number;
  criticalIncidents: number;
  securityScore: number;
  complianceScore: number;
  lastScanDate: number;
  vulnerabilitiesFound: number;
  secretsRotated: number;
  auditLogsGenerated: number;
}

export interface ComplianceReport {
  id: string;
  standard: ComplianceStandard;
  version: string;
  status: 'in-progress' | 'completed' | 'failed';
  scope: string[];
  findings: ComplianceFinding[];
  score: number;
  generatedAt: number;
  generatedBy: string;
  validUntil: number;
  metadata: Record<string, any>;
}

export interface ComplianceFinding {
  id: string;
  requirement: string;
  description: string;
  status: 'compliant' | 'non-compliant' | 'not-applicable';
  evidence: string[];
  remediation?: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  category: string;
}

// Enums
export type AuditActionType = 
  | 'create' | 'read' | 'update' | 'delete'
  | 'login' | 'logout' | 'failed_login'
  | 'permission_granted' | 'permission_revoked'
  | 'workflow_executed' | 'workflow_failed'
  | 'credential_created' | 'credential_updated' | 'credential_deleted'
  | 'user_invited' | 'user_activated' | 'user_suspended'
  | 'api_key_created' | 'api_key_revoked'
  | 'data_exported' | 'data_imported'
  | 'configuration_changed' | 'security_policy_updated'
  | 'security_event';

export type AuditResourceType = 
  | 'workflow' | 'execution' | 'credential' | 'user' | 'project'
  | 'organization' | 'integration' | 'api_key' | 'session'
  | 'audit_log' | 'security_policy' | 'compliance_report';

export type AuditSeverity = 'info' | 'warning' | 'error' | 'critical';

export type AuditCategory = 
  | 'authentication' | 'authorization' | 'data_access' | 'data_modification'
  | 'system_configuration' | 'security_event' | 'compliance' | 'administrative';

export type ComplianceStandard = 
  | 'SOC2' | 'GDPR' | 'CCPA' | 'HIPAA' | 'PCI-DSS' | 'ISO27001' | 'NIST';

export type SecurityPolicyType = 
  | 'access_control' | 'data_protection' | 'encryption' | 'network_security'
  | 'incident_response' | 'compliance' | 'audit' | 'retention';

export type VulnerabilityScanType = 
  | 'dependency' | 'container' | 'infrastructure' | 'code' | 'configuration';

export type VulnerabilitySeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';

export type SecretType = 
  | 'api_key' | 'password' | 'certificate' | 'token' | 'database_credential'
  | 'ssh_key' | 'encryption_key' | 'oauth_token';

export type EncryptionAlgorithm = 'AES' | 'RSA' | 'ECDSA' | 'ChaCha20' | 'Blowfish';

export type EncryptionMode = 'CBC' | 'GCM' | 'CTR' | 'CFB' | 'OFB';

export type EncryptionPadding = 'PKCS7' | 'PKCS1' | 'OAEP' | 'None';

export type IncidentSeverity = 'low' | 'medium' | 'high' | 'critical';

export type IncidentStatus = 'open' | 'investigating' | 'contained' | 'resolved' | 'closed';

export type IncidentCategory = 
  | 'malware' | 'data_breach' | 'unauthorized_access' | 'insider_threat'
  | 'system_compromise' | 'phishing' | 'ddos' | 'vulnerability_exploit';

export type IncidentSource = 'automated' | 'user_report' | 'security_tool' | 'audit' | 'external';

export type IncidentEventType = 
  | 'detected' | 'investigated' | 'contained' | 'escalated' | 'resolved' | 'closed';

export interface NotificationConfig {
  channels: ('email' | 'slack' | 'webhook' | 'sms')[];
  recipients: string[];
  template: string;
  conditions: NotificationCondition[];
}

export interface NotificationCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than';
  value: any;
}

// Factory functions
export const createAuditLog = (data: Partial<AuditLog>): AuditLog => ({
  id: `audit_${Date.now()}`,
  timestamp: Date.now(),
  userId: '',
  userEmail: '',
  action: {
    type: 'read',
    description: '',
    outcome: 'success',
  },
  resource: {
    type: 'workflow',
    name: '',
    identifier: '',
  },
  resourceId: '',
  details: {
    riskLevel: 'low',
    complianceFlags: [],
  },
  ipAddress: '127.0.0.1',
  userAgent: navigator.userAgent,
  sessionId: '',
  severity: 'info',
  category: 'data_access',
  tags: [],
  hash: '',
  metadata: {},
  ...data,
});

export const createSecurityPolicy = (data: Partial<SecurityPolicy>): SecurityPolicy => ({
  id: `policy_${Date.now()}`,
  name: '',
  description: '',
  type: 'access_control',
  rules: [],
  enforcement: {
    mode: 'enforce',
    failureAction: 'block',
    retryAttempts: 3,
    timeout: 30000,
  },
  scope: {
    resources: [],
    users: [],
    environments: [],
  },
  createdAt: Date.now(),
  updatedAt: Date.now(),
  enabled: true,
  version: '1.0.0',
  ...data,
});

export const createVulnerabilityScan = (data: Partial<VulnerabilityScan>): VulnerabilityScan => ({
  id: `scan_${Date.now()}`,
  scanType: 'dependency',
  target: '',
  status: 'pending',
  startedAt: Date.now(),
  findings: [],
  summary: {
    total: 0,
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    info: 0,
    fixed: 0,
    ignored: 0,
  },
  metadata: {},
  ...data,
});

export const createSecretManager = (data: Partial<SecretManager>): SecretManager => ({
  id: `secret_${Date.now()}`,
  name: '',
  type: 'api_key',
  encryptedData: '',
  encryptionKey: '',
  keyVersion: 1,
  rotationPolicy: {
    enabled: false,
    interval: 90 * 24 * 60 * 60 * 1000, // 90 days
    method: 'manual',
    notificationDays: 7,
    autoRotation: false,
  },
  accessPolicy: {
    users: [],
    roles: [],
    applications: [],
    ipWhitelist: [],
    timeRestrictions: [],
    accessCount: 0,
  },
  metadata: {
    description: '',
    tags: [],
    classification: {
      level: 'internal',
      categories: [],
      retentionPeriod: 365 * 24 * 60 * 60 * 1000, // 1 year
      encryptionRequired: true,
      accessLoggingRequired: true,
    },
    owner: '',
    environment: 'production',
    application: '',
    compliance: [],
  },
  createdAt: Date.now(),
  updatedAt: Date.now(),
  ...data,
});

export const createSecurityIncident = (data: Partial<SecurityIncident>): SecurityIncident => ({
  id: `incident_${Date.now()}`,
  title: '',
  description: '',
  severity: 'medium',
  status: 'open',
  category: 'unauthorized_access',
  source: 'automated',
  affectedResources: [],
  timeline: [],
  createdAt: Date.now(),
  updatedAt: Date.now(),
  metadata: {},
  ...data,
});

// Utility functions
export const calculateAuditHash = (log: Omit<AuditLog, 'hash' | 'previousHash'>): string => {
  const data = JSON.stringify({
    id: log.id,
    timestamp: log.timestamp,
    userId: log.userId,
    action: log.action,
    resource: log.resource,
    details: log.details,
  });
  // In production, use proper cryptographic hash
  return btoa(data).substring(0, 32);
};

export const isCompliant = (finding: ComplianceFinding): boolean => {
  return finding.status === 'compliant';
};

export const getRiskScore = (findings: ComplianceFinding[]): number => {
  const weights = { critical: 4, high: 3, medium: 2, low: 1 };
  const totalWeight = findings.reduce((sum, finding) => {
    return sum + (weights[finding.riskLevel] || 0);
  }, 0);
  const maxWeight = findings.length * 4;
  return maxWeight > 0 ? Math.round((totalWeight / maxWeight) * 100) : 100;
};

export const shouldRotateSecret = (secret: SecretManager): boolean => {
  if (!secret.rotationPolicy.enabled) return false;
  
  const now = Date.now();
  const lastRotation = secret.updatedAt;
  const interval = secret.rotationPolicy.interval;
  
  return (now - lastRotation) >= interval;
};

export const isAccessAllowed = (secret: SecretManager, userId: string, ipAddress: string): boolean => {
  const policy = secret.accessPolicy;
  
  // Check user access
  if (policy.users.length > 0 && !policy.users.includes(userId)) {
    return false;
  }
  
  // Check IP whitelist
  if (policy.ipWhitelist.length > 0 && !policy.ipWhitelist.includes(ipAddress)) {
    return false;
  }
  
  // Check access count limit
  if (policy.maxAccessCount && policy.accessCount >= policy.maxAccessCount) {
    return false;
  }
  
  // Check time restrictions
  const now = new Date();
  const currentDay = now.getDay();
  const currentTime = now.toTimeString().substring(0, 5);
  
  const hasTimeRestriction = policy.timeRestrictions.some(restriction => {
    return restriction.days.includes(currentDay) &&
           currentTime >= restriction.startTime &&
           currentTime <= restriction.endTime;
  });
  
  if (policy.timeRestrictions.length > 0 && !hasTimeRestriction) {
    return false;
  }
  
  return true;
};