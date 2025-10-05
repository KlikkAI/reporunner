
import { z } from 'zod';
import type { AuditSeverity } from './audit';
import { AuditSeveritySchema } from './audit';

// ============================================================================
// SECURITY ENUMS AND CONSTANTS
// ============================================================================

export const THREAT_TYPES = [
  'brute_force',
  'suspicious_activity',
  'data_breach',
  'privilege_escalation',
  'malware',
  'phishing'
] as const;

export const SEVERITY_LEVELS = ['low', 'medium', 'high', 'critical'] as const;
export const THREAT_STATUSES = ['open', 'investigating', 'resolved', 'false_positive'] as const;
export const EVIDENCE_TYPES = ['log', 'file', 'network', 'system', 'user_action'] as const;
export const SCAN_TYPES = ['vulnerability', 'malware', 'compliance', 'penetration'] as const;
export const SCAN_STATUSES = ['pending', 'running', 'completed', 'failed', 'cancelled'] as const;
export const VULNERABILITY_STATUSES = ['open', 'acknowledged', 'fixed', 'accepted_risk'] as const;
export const ALERT_TYPES = ['security_breach', 'suspicious_login', 'data_access', 'system_anomaly'] as const;
export const COMPLIANCE_STATUSES = ['compliant', 'non_compliant', 'partial', 'not_assessed'] as const;


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


// ============================================================================
// CORE INTERFACES
// ============================================================================

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
  status: ThreatStatus;
  title: string;
  description: string;
  detectedAt: Date;
  resolvedAt?: Date;
  userId?: string;
  organizationId?: string;
  sourceIp?: string;
  userAgent?: string;
  resolution?: string;
  assignedTo?: string;
  evidence: SecurityEvidence[];
  riskScore: number;
  affectedResources: string[];
}

export interface VulnerabilityFinding {
  id: string;
  severity: SeverityLevel;
  title: string;
  description: string;
  category: string;
  cve?: string;
  cvss?: number;
  location: string;
  recommendation: string;
  references: string[];
  status: VulnerabilityStatus;
}

export interface VulnerabilityScan {
  id: string;
  type: ScanType;
  status: ScanStatus;
  startedAt: Date;
  completedAt?: Date;
  findings: VulnerabilityFinding[];
  summary: {
    total: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  metadata: Record<string, any>;
}

export interface SecurityMetrics {
  threatLevel: SeverityLevel;
  activeThreats: number;
  resolvedThreats: number;
  vulnerabilities: {
    total: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  securityScore: number; // 0-100
  complianceScore: number; // 0-100
  lastScanDate?: Date;
  trends: {
    threatsLastWeek: number;
    vulnerabilitiesLastWeek: number;
    securityIncidents: number;
  };
}

export interface SecurityAlert {
  id: string;
  type: AlertType;
  severity: SeverityLevel;
  title: string;
  message: string;
  timestamp: Date;
  userId?: string;
  organizationId?: string;
  metadata: Record<string, any>;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
}

export interface ComplianceRequirement {
  id: string;
  title: string;
  description: string;
  category: string;
  mandatory: boolean;
  status: ComplianceStatus;
  evidence?: string[];
  lastChecked?: Date;
  notes?: string;
}

export interface SecurityComplianceFramework {
  id: string;
  name: string;
  version: string;
  requirements: ComplianceRequirement[];
  status: ComplianceStatus;
  lastAssessment?: Date;
  score: number; // 0-100
}

// ============================================================================
// API TRANSFER OBJECTS (DTOs)
// ============================================================================

// Frontend-compatible versions with string dates
export interface SecurityThreatDTO extends Omit<SecurityThreat, 'detectedAt' | 'resolvedAt' | 'evidence'> {
  detectedAt: string;
  resolvedAt?: string;
  evidence: SecurityEvidenceDTO[];
}

export interface SecurityEvidenceDTO extends Omit<SecurityEvidence, 'timestamp'> {
  timestamp: string;
}

export interface VulnerabilityScanDTO extends Omit<VulnerabilityScan, 'startedAt' | 'completedAt'> {
  startedAt: string;
  completedAt?: string;
}

export interface SecurityMetricsDTO extends Omit<SecurityMetrics, 'lastScanDate'> {
  lastScanDate?: string;
}

export interface SecurityAlertDTO extends Omit<SecurityAlert, 'timestamp' | 'acknowledgedAt'> {
  timestamp: string;
  acknowledgedAt?: string;
}

export interface SecurityComplianceFrameworkDTO extends Omit<SecurityComplianceFramework, 'lastAssessment' | 'requirements'> {
  lastAssessment?: string;
  requirements: ComplianceRequirementDTO[];
}

export interface ComplianceRequirementDTO extends Omit<ComplianceRequirement, 'lastChecked'> {
  lastChecked?: string;
}

// ============================================================================
// ZOD VALIDATION SCHEMAS
// ============================================================================

// Base schemas for reuse
export const ThreatTypeSchema = z.enum(THREAT_TYPES);
export const SeverityLevelSchema = z.enum(SEVERITY_LEVELS);
export const ThreatStatusSchema = z.enum(THREAT_STATUSES);
export const EvidenceTypeSchema = z.enum(EVIDENCE_TYPES);
export const ScanTypeSchema = z.enum(SCAN_TYPES);
export const ScanStatusSchema = z.enum(SCAN_STATUSES);
export const VulnerabilityStatusSchema = z.enum(VULNERABILITY_STATUSES);
export const AlertTypeSchema = z.enum(ALERT_TYPES);
export const ComplianceStatusSchema = z.enum(COMPLIANCE_STATUSES);


// Evidence schema
export const SecurityEvidenceSchema = z.object({
  type: EvidenceTypeSchema,
  timestamp: z.string().datetime(),
  source: z.string(),
  data: z.record(z.string(), z.any()),
  severity: AuditSeveritySchema
});

// Threat schemas
export const CreateThreatSchema = z.object({
  type: ThreatTypeSchema,
  severity: SeverityLevelSchema,
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(1000),
  userId: z.string().optional(),
  organizationId: z.string().optional(),
  sourceIp: z.string().optional(),
  userAgent: z.string().optional(),
  evidence: z.array(SecurityEvidenceSchema),
  riskScore: z.number().min(0).max(100),
  affectedResources: z.array(z.string())
});

export const UpdateThreatStatusSchema = z.object({
  status: ThreatStatusSchema,
  resolution: z.string().optional(),
  assignedTo: z.string().optional()
});

// Vulnerability scan schemas
export const StartVulnerabilityScanSchema = z.object({
  type: ScanTypeSchema,
  metadata: z.record(z.string(), z.any()).optional()
});

// Alert schemas
export const AcknowledgeAlertSchema = z.object({
  acknowledgedBy: z.string().min(1)
});

// Query parameter schemas
export const ThreatQuerySchema = z.object({
  status: ThreatStatusSchema.optional()
});

export const ScanQuerySchema = z.object({
  type: ScanTypeSchema.optional()
});

export const AlertQuerySchema = z.object({
  acknowledged: z.boolean().optional()
});

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Convert backend Date objects to frontend string format
 */
export function toSecurityThreatDTO(threat: SecurityThreat): SecurityThreatDTO {
  return {
    ...threat,
    detectedAt: threat.detectedAt.toISOString(),
    resolvedAt: threat.resolvedAt?.toISOString(),
    evidence: threat.evidence.map(toSecurityEvidenceDTO)
  };
}

export function toSecurityEvidenceDTO(evidence: SecurityEvidence): SecurityEvidenceDTO {
  return {
    ...evidence,
    timestamp: evidence.timestamp.toISOString()
  };
}

export function toVulnerabilityScanDTO(scan: VulnerabilityScan): VulnerabilityScanDTO {
  return {
    ...scan,
    startedAt: scan.startedAt.toISOString(),
    completedAt: scan.completedAt?.toISOString()
  };
}

export function toSecurityMetricsDTO(metrics: SecurityMetrics): SecurityMetricsDTO {
  return {
    ...metrics,
    lastScanDate: metrics.lastScanDate?.toISOString()
  };
}

export function toSecurityAlertDTO(alert: SecurityAlert): SecurityAlertDTO {
  return {
    ...alert,
    timestamp: alert.timestamp.toISOString(),
    acknowledgedAt: alert.acknowledgedAt?.toISOString()
  };
}

export function toSecurityComplianceFrameworkDTO(framework: SecurityComplianceFramework): SecurityComplianceFrameworkDTO {
  return {
    ...framework,
    lastAssessment: framework.lastAssessment?.toISOString(),
    requirements: framework.requirements.map(req => ({
      ...req,
      lastChecked: req.lastChecked?.toISOString()
    }))
  };
}

/**
 * Convert frontend string dates to backend Date objects
 */
export function fromSecurityThreatDTO(threatDTO: SecurityThreatDTO): SecurityThreat {
  return {
    ...threatDTO,
    detectedAt: new Date(threatDTO.detectedAt),
    resolvedAt: threatDTO.resolvedAt ? new Date(threatDTO.resolvedAt) : undefined,
    evidence: threatDTO.evidence.map(fromSecurityEvidenceDTO)
  };
}

export function fromSecurityEvidenceDTO(evidenceDTO: SecurityEvidenceDTO): SecurityEvidence {
  return {
    ...evidenceDTO,
    timestamp: new Date(evidenceDTO.timestamp)
  };
}

/**
 * Get severity level numeric value for sorting/comparison
 */
export function getSeverityValue(severity: SeverityLevel): number {
  const values = { low: 1, medium: 2, high: 3, critical: 4 };
  return values[severity];
}

/**
 * Get threat type display name
 */
export function getThreatTypeDisplayName(type: ThreatType): string {
  const names = {
    brute_force: 'Brute Force Attack',
    suspicious_activity: 'Suspicious Activity',
    data_breach: 'Data Breach',
    privilege_escalation: 'Privilege Escalation',
    malware: 'Malware Detection',
    phishing: 'Phishing Attempt'
  };
  return names[type];
}

/**
 * Get severity level color for UI
 */
export function getSeverityColor(severity: SeverityLevel): string {
  const colors = {
    low: '#10B981',      // green
    medium: '#F59E0B',   // yellow
    high: '#EF4444',     // red
    critical: '#7C2D12'  // dark red
  };
  return colors[severity];
}

/**
 * Calculate overall security score based on threats and vulnerabilities
 */
export function calculateSecurityScore(
  threats: SecurityThreat[],
  vulnerabilities: { critical: number; high: number; medium: number; low: number }
): number {
  let score = 100;

  // Deduct points for active threats
  const activeThreats = threats.filter(t => t.status === 'open' || t.status === 'investigating');
  activeThreats.forEach(threat => {
    const severityPenalty = { low: 5, medium: 10, high: 20, critical: 30 };
    score -= severityPenalty[threat.severity];
  });

  // Deduct points for vulnerabilities
  score -= vulnerabilities.critical * 20;
  score -= vulnerabilities.high * 10;
  score -= vulnerabilities.medium * 5;
  score -= vulnerabilities.low * 1;

  return Math.max(0, Math.min(100, score));
}
