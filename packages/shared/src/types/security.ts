/**
 * Shared Security Types and Constants
 * Centralized security-related types, enums, and validation schemas
 */


// ============================================================================
// ENUMS AND CONSTANTS
// ============================================================================

export const THREAT_TYPES = [
  'brute_force',
  'suspicious_activity',
  'data_breach',
  'privilege_escalation',
  'malware',
  'phishing'
] as const;

export const SEVERITY_LEVELS = [
  'low',
  'medium',
  'high',
  'critical'
] as const;

export const THREAT_STATUSES = [
  'open',
  'investigating',
  'resolved',
  'false_positive'
] as const;

export const EVIDENCE_TYPES = [
  'log_entry',
  'network_traffic',
  'file_access',
  'api_call',
  'user_behavior'
] as const;

export const SCAN_TYPES = [
  'dependency',
  'code',
  'infrastructure',
  'configuration'
] as const;

export const SCAN_STATUSES = [
  'pending',
  'running',
  'completed',
  'failed'
] as const;

export const VULNERABILITY_STATUSES = [
  'open',
  'fixed',
  'accepted_risk',
  'false_positive'
] as const;

export const ALERT_TYPES = [
  'threat_detected',
  'vulnerability_found',
  'compliance_violation',
  'policy_breach'
] as const;

export const COMPLIANCE_STATUSES = [
  'compliant',
  'non_compliant',
  'partial',
  'not_applicable'
] as const;

export const AUDIT_SEVERITIES = [
  'info',
  'warning',
  'error',
  'critical'
] as const;

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export type ThreatType = typeof THREAT_TYPES[number];
export type SeverityLevel = typeof SEVERITY_LEVELS[number];
export type ThreatStatus = typeof THREAT_STATUSES[number];
export type EvidenceType = typeof EVIDENCE_TYPES[number];
export type ScanType = typeof SCAN_TYPES[number];
export type ScanStatus = typeof SCAN_STATUSES[number];
export type VulnerabilityStatus = typeof VULNERABILITY_STATUSES[number];
export type AlertType = typeof ALERT_TYPES[number];
export type ComplianceStatus = typeof COMPLIANCE_STATUSES[number];
export type AuditSeverity = typeof AUDIT_SEVERITIES[number];

// ============================================================================
// CORE INTERFACES
// ============================================================================

export interface AuditEvent {
  id: string;
  timestamp: Date;
  userId?: string;
  organizationId?: string;
  action: string;
  category: string;
  resource: string;
  message: string;
  severity: AuditSeverity;
  metadata: Record<string, any>;
  riskScore?: number;
}

export interface SecurityEvidence {
  type: EvidenceType;
  timestamp: Date;
  source: string;
  data: Record<string, any>;
  severity: AuditSeverity;
}

export interface SecurityThreat {
  id: string;
  type: ThreatType;
  severity: SeverityLevel;
  title: string;
  description: string;
  detectedAt: Date;
  userId?: string;
  organizationId?: string;
  sourceIp?: string;
  userAgent?: string;
  status: ThreatStatus;
  assignedTo?: string;
  resolvedAt?: Date;
  resolution?: string;
  evidence: SecurityEvidence[];
  riskScore: number;
  affectedResources: string[];
}\n\nexport interface VulnerabilityFinding {\n  id: string;\n  severity: SeverityLevel;\n  title: string;\n  description: string;\n  category: string;\n  cve?: string;\n  cvss?: number;\n  location: string;\n  recommendation: string;\n  references: string[];\n  status: VulnerabilityStatus;\n}\n\nexport interface VulnerabilityScan {\n  id: string;\n  type: ScanType;\n  status: ScanStatus;\n  startedAt: Date;\n  completedAt?: Date;\n  findings: VulnerabilityFinding[];\n  summary: {\n    total: number;\n    critical: number;\n    high: number;\n    medium: number;\n    low: number;\n  };\n  metadata: Record<string, any>;\n}\n\nexport interface SecurityMetrics {\n  threatLevel: SeverityLevel;\n  activeThreats: number;\n  resolvedThreats: number;\n  vulnerabilities: {\n    total: number;\n    critical: number;\n    high: number;\n    medium: number;\n    low: number;\n  };\n  securityScore: number; // 0-100\n  complianceScore: number; // 0-100\n  lastScanDate?: Date;\n  trends: {\n    threatsLastWeek: number;\n    vulnerabilitiesLastWeek: number;\n    securityIncidents: number;\n  };\n}\n\nexport interface SecurityAlert {\n  id: string;\n  type: AlertType;\n  severity: SeverityLevel;\n  title: string;\n  message: string;\n  timestamp: Date;\n  userId?: string;\n  organizationId?: string;\n  metadata: Record<string, any>;\n  acknowledged: boolean;\n  acknowledgedBy?: string;\n  acknowledgedAt?: Date;\n}\n\nexport interface ComplianceRequirement {\n  id: string;\n  title: string;\n  description: string;\n  category: string;\n  mandatory: boolean;\n  status: ComplianceStatus;\n  evidence?: string[];\n  lastChecked?: Date;\n  notes?: string;\n}\n\nexport interface ComplianceFramework {\n  id: string;\n  name: string;\n  version: string;\n  requirements: ComplianceRequirement[];\n  status: ComplianceStatus;\n  lastAssessment?: Date;\n  score: number; // 0-100\n}\n\n// ============================================================================\n// API TRANSFER OBJECTS (DTOs)\n// ============================================================================\n\n// Frontend-compatible versions with string dates\nexport interface SecurityThreatDTO extends Omit<SecurityThreat, 'detectedAt' | 'resolvedAt' | 'evidence'> {\n  detectedAt: string;\n  resolvedAt?: string;\n  evidence: SecurityEvidenceDTO[];\n}\n\nexport interface SecurityEvidenceDTO extends Omit<SecurityEvidence, 'timestamp'> {\n  timestamp: string;\n}\n\nexport interface VulnerabilityScanDTO extends Omit<VulnerabilityScan, 'startedAt' | 'completedAt'> {\n  startedAt: string;\n  completedAt?: string;\n}\n\nexport interface SecurityMetricsDTO extends Omit<SecurityMetrics, 'lastScanDate'> {\n  lastScanDate?: string;\n}\n\nexport interface SecurityAlertDTO extends Omit<SecurityAlert, 'timestamp' | 'acknowledgedAt'> {\n  timestamp: string;\n  acknowledgedAt?: string;\n}\n\nexport interface ComplianceFrameworkDTO extends Omit<ComplianceFramework, 'lastAssessment' | 'requirements'> {\n  lastAssessment?: string;\n  requirements: ComplianceRequirementDTO[];\n}\n\nexport interface ComplianceRequirementDTO extends Omit<ComplianceRequirement, 'lastChecked'> {\n  lastChecked?: string;\n}\n\n// ============================================================================\n// ZOD VALIDATION SCHEMAS\n// ============================================================================\n\n// Base schemas for reuse\nexport const ThreatTypeSchema = z.enum(THREAT_TYPES);\nexport const SeverityLevelSchema = z.enum(SEVERITY_LEVELS);\nexport const ThreatStatusSchema = z.enum(THREAT_STATUSES);\nexport const EvidenceTypeSchema = z.enum(EVIDENCE_TYPES);\nexport const ScanTypeSchema = z.enum(SCAN_TYPES);\nexport const ScanStatusSchema = z.enum(SCAN_STATUSES);\nexport const VulnerabilityStatusSchema = z.enum(VULNERABILITY_STATUSES);\nexport const AlertTypeSchema = z.enum(ALERT_TYPES);\nexport const ComplianceStatusSchema = z.enum(COMPLIANCE_STATUSES);\nexport const AuditSeveritySchema = z.enum(AUDIT_SEVERITIES);\n\n// Evidence schema\nexport const SecurityEvidenceSchema = z.object({\n  type: EvidenceTypeSchema,\n  timestamp: z.string().datetime(),\n  source: z.string(),\n  data: z.record(z.any()),\n  severity: AuditSeveritySchema\n});\n\n// Threat schemas\nexport const CreateThreatSchema = z.object({\n  type: ThreatTypeSchema,\n  severity: SeverityLevelSchema,\n  title: z.string().min(1).max(200),\n  description: z.string().min(1).max(1000),\n  userId: z.string().optional(),\n  organizationId: z.string().optional(),\n  sourceIp: z.string().ip().optional(),\n  userAgent: z.string().optional(),\n  evidence: z.array(SecurityEvidenceSchema),\n  riskScore: z.number().min(0).max(100),\n  affectedResources: z.array(z.string())\n});\n\nexport const UpdateThreatStatusSchema = z.object({\n  status: ThreatStatusSchema,\n  resolution: z.string().optional(),\n  assignedTo: z.string().optional()\n});\n\n// Vulnerability scan schemas\nexport const StartVulnerabilityScanSchema = z.object({\n  type: ScanTypeSchema,\n  metadata: z.record(z.any()).optional()\n});\n\n// Alert schemas\nexport const AcknowledgeAlertSchema = z.object({\n  acknowledgedBy: z.string().min(1)\n});\n\n// Query parameter schemas\nexport const ThreatQuerySchema = z.object({\n  status: ThreatStatusSchema.optional()\n});\n\nexport const ScanQuerySchema = z.object({\n  type: ScanTypeSchema.optional()\n});\n\nexport const AlertQuerySchema = z.object({\n  acknowledged: z.boolean().optional()\n});\n\n// ============================================================================\n// UTILITY FUNCTIONS\n// ============================================================================\n\n/**\n * Convert backend Date objects to frontend string format\n */\nexport function toSecurityThreatDTO(threat: SecurityThreat): SecurityThreatDTO {\n  return {\n    ...threat,\n    detectedAt: threat.detectedAt.toISOString(),\n    resolvedAt: threat.resolvedAt?.toISOString(),\n    evidence: threat.evidence.map(toSecurityEvidenceDTO)\n  };\n}\n\nexport function toSecurityEvidenceDTO(evidence: SecurityEvidence): SecurityEvidenceDTO {\n  return {\n    ...evidence,\n    timestamp: evidence.timestamp.toISOString()\n  };\n}\n\nexport function toVulnerabilityScanDTO(scan: VulnerabilityScan): VulnerabilityScanDTO {\n  return {\n    ...scan,\n    startedAt: scan.startedAt.toISOString(),\n    completedAt: scan.completedAt?.toISOString()\n  };\n}\n\nexport function toSecurityMetricsDTO(metrics: SecurityMetrics): SecurityMetricsDTO {\n  return {\n    ...metrics,\n    lastScanDate: metrics.lastScanDate?.toISOString()\n  };\n}\n\nexport function toSecurityAlertDTO(alert: SecurityAlert): SecurityAlertDTO {\n  return {\n    ...alert,\n    timestamp: alert.timestamp.toISOString(),\n    acknowledgedAt: alert.acknowledgedAt?.toISOString()\n  };\n}\n\nexport function toComplianceFrameworkDTO(framework: ComplianceFramework): ComplianceFrameworkDTO {\n  return {\n    ...framework,\n    lastAssessment: framework.lastAssessment?.toISOString(),\n    requirements: framework.requirements.map(req => ({\n      ...req,\n      lastChecked: req.lastChecked?.toISOString()\n    }))\n  };\n}\n\n/**\n * Convert frontend string dates to backend Date objects\n */\nexport function fromSecurityThreatDTO(threatDTO: SecurityThreatDTO): SecurityThreat {\n  return {\n    ...threatDTO,\n    detectedAt: new Date(threatDTO.detectedAt),\n    resolvedAt: threatDTO.resolvedAt ? new Date(threatDTO.resolvedAt) : undefined,\n    evidence: threatDTO.evidence.map(fromSecurityEvidenceDTO)\n  };\n}\n\nexport function fromSecurityEvidenceDTO(evidenceDTO: SecurityEvidenceDTO): SecurityEvidence {\n  return {\n    ...evidenceDTO,\n    timestamp: new Date(evidenceDTO.timestamp)\n  };\n}\n\n/**\n * Get severity level numeric value for sorting/comparison\n */\nexport function getSeverityValue(severity: SeverityLevel): number {\n  const values = { low: 1, medium: 2, high: 3, critical: 4 };\n  return values[severity];\n}\n\n/**\n * Get threat type display name\n */\nexport function getThreatTypeDisplayName(type: ThreatType): string {\n  const names = {\n    brute_force: 'Brute Force Attack',\n    suspicious_activity: 'Suspicious Activity',\n    data_breach: 'Data Breach',\n    privilege_escalation: 'Privilege Escalation',\n    malware: 'Malware Detection',\n    phishing: 'Phishing Attempt'\n  };\n  return names[type];\n}\n\n/**\n * Get severity level color for UI\n */\nexport function getSeverityColor(severity: SeverityLevel): string {\n  const colors = {\n    low: '#10B981',      // green\n    medium: '#F59E0B',   // yellow\n    high: '#EF4444',     // red\n    critical: '#7C2D12'  // dark red\n  };\n  return colors[severity];\n}\n\n/**\n * Calculate overall security score based on threats and vulnerabilities\n */\nexport function calculateSecurityScore(\n  threats: SecurityThreat[],\n  vulnerabilities: { critical: number; high: number; medium: number; low: number }\n): number {\n  let score = 100;\n  \n  // Deduct points for active threats\n  const activeThreats = threats.filter(t => t.status === 'open' || t.status === 'investigating');\n  activeThreats.forEach(threat => {\n    const severityPenalty = { low: 5, medium: 10, high: 20, critical: 30 };\n    score -= severityPenalty[threat.severity];\n  });\n  \n  // Deduct points for vulnerabilities\n  score -= vulnerabilities.critical * 20;\n  score -= vulnerabilities.high * 10;\n  score -= vulnerabilities.medium * 5;\n  score -= vulnerabilities.low * 1;\n  \n  return Math.max(0, Math.min(100, score));\n}"
