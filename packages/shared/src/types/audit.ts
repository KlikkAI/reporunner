/**
 * Shared Audit Types and Constants
 * Centralized audit-related types, enums, and validation schemas
 */

import { z } from 'zod';

// ============================================================================
// ENUMS AND CONSTANTS
// ============================================================================

export const AUDIT_ACTIONS = [
  'create',
  'read',
  'update',
  'delete',
  'login',
  'logout',
  'login_failed',
  'password_change',
  'role_assigned',
  'role_removed',
  'permission_granted',
  'permission_revoked',
  'export',
  'import',
  'backup',
  'restore',
] as const;

export const AUDIT_CATEGORIES = [
  'authentication',
  'authorization',
  'data',
  'system',
  'security',
  'compliance',
  'workflow',
  'integration',
] as const;

export const AUDIT_SEVERITIES = ['info', 'warning', 'error', 'critical'] as const;

export const REPORT_FORMATS = ['json', 'csv', 'pdf', 'xlsx'] as const;

export const COMPLIANCE_FRAMEWORKS = ['soc2', 'gdpr', 'hipaa', 'pci_dss', 'iso27001'] as const;

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export type AuditAction = (typeof AUDIT_ACTIONS)[number];
export type AuditCategory = (typeof AUDIT_CATEGORIES)[number];
export type AuditSeverity = (typeof AUDIT_SEVERITIES)[number];
export type ReportFormat = (typeof REPORT_FORMATS)[number];
export type ComplianceFramework = (typeof COMPLIANCE_FRAMEWORKS)[number];

// ============================================================================
// CORE INTERFACES
// ============================================================================

export interface AuditEvent {
  id: string;
  timestamp: Date;
  userId?: string;
  organizationId?: string;
  action: AuditAction;
  category: AuditCategory;
  resource: string;
  resourceId?: string;
  message: string;
  severity: AuditSeverity;
  metadata: Record<string, any>;
  riskScore?: number;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
}

export interface AuditEventFilter {
  startDate?: Date;
  endDate?: Date;
  userId?: string;
  organizationId?: string;
  action?: AuditAction;
  category?: AuditCategory;
  severity?: AuditSeverity;
  resource?: string;
  riskScoreMin?: number;
  riskScoreMax?: number;
}

export interface ComplianceReport {
  id: string;
  framework: ComplianceFramework;
  generatedAt: Date;
  generatedBy: string;
  organizationId?: string;
  startDate: Date;
  endDate: Date;
  summary: {
    totalEvents: number;
    criticalEvents: number;
    complianceScore: number;
    violations: number;
  };
  sections: ComplianceSection[];
  recommendations: string[];
  metadata: Record<string, any>;
}

export interface ComplianceSection {
  id: string;
  title: string;
  requirement: string;
  status: 'compliant' | 'non_compliant' | 'partial';
  events: AuditEvent[];
  evidence: string[];
  notes?: string;
}

export interface AuditExport {
  id: string;
  requestedAt: Date;
  requestedBy: string;
  organizationId?: string;
  format: ReportFormat;
  filter: AuditEventFilter;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  completedAt?: Date;
  downloadUrl?: string;
  expiresAt?: Date;
  eventCount?: number;
  fileSize?: number;
  error?: string;
}

// ============================================================================
// API TRANSFER OBJECTS (DTOs)
// ============================================================================

export interface AuditEventDTO extends Omit<AuditEvent, 'timestamp'> {
  timestamp: string;
}

export interface AuditEventFilterDTO extends Omit<AuditEventFilter, 'startDate' | 'endDate'> {
  startDate?: string;
  endDate?: string;
}

export interface ComplianceReportDTO
  extends Omit<ComplianceReport, 'generatedAt' | 'startDate' | 'endDate' | 'sections'> {
  generatedAt: string;
  startDate: string;
  endDate: string;
  sections: ComplianceSectionDTO[];
}

export interface ComplianceSectionDTO extends Omit<ComplianceSection, 'events'> {
  events: AuditEventDTO[];
}

export interface AuditExportDTO
  extends Omit<AuditExport, 'requestedAt' | 'completedAt' | 'expiresAt' | 'filter'> {
  requestedAt: string;
  completedAt?: string;
  expiresAt?: string;
  filter: AuditEventFilterDTO;
}

// ============================================================================
// ZOD VALIDATION SCHEMAS
// ============================================================================

export const AuditActionSchema = z.enum(AUDIT_ACTIONS);
export const AuditCategorySchema = z.enum(AUDIT_CATEGORIES);
export const AuditSeveritySchema = z.enum(AUDIT_SEVERITIES);
export const ReportFormatSchema = z.enum(REPORT_FORMATS);
export const ComplianceFrameworkSchema = z.enum(COMPLIANCE_FRAMEWORKS);

export const AuditEventFilterSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  userId: z.string().optional(),
  organizationId: z.string().optional(),
  action: AuditActionSchema.optional(),
  category: AuditCategorySchema.optional(),
  severity: AuditSeveritySchema.optional(),
  resource: z.string().optional(),
  riskScoreMin: z.number().min(0).max(100).optional(),
  riskScoreMax: z.number().min(0).max(100).optional(),
});

export const GenerateReportSchema = z.object({
  framework: ComplianceFrameworkSchema,
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  organizationId: z.string().optional(),
});

export const ExportAuditSchema = z.object({
  format: ReportFormatSchema,
  filter: AuditEventFilterSchema,
});

export const LogAuditEventSchema = z.object({
  action: AuditActionSchema,
  category: AuditCategorySchema,
  resource: z.string().min(1),
  resourceId: z.string().optional(),
  message: z.string().min(1).max(500),
  severity: AuditSeveritySchema,
  metadata: z.record(z.string(), z.any()).optional(),
  riskScore: z.number().min(0).max(100).optional(),
  userId: z.string().optional(),
  organizationId: z.string().optional(),
});

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Convert backend Date objects to frontend string format
 */
export function toAuditEventDTO(event: AuditEvent): AuditEventDTO {
  return {
    ...event,
    timestamp: event.timestamp.toISOString(),
  };
}

export function toAuditEventFilterDTO(filter: AuditEventFilter): AuditEventFilterDTO {
  return {
    ...filter,
    startDate: filter.startDate?.toISOString(),
    endDate: filter.endDate?.toISOString(),
  };
}

export function toComplianceReportDTO(report: ComplianceReport): ComplianceReportDTO {
  return {
    ...report,
    generatedAt: report.generatedAt.toISOString(),
    startDate: report.startDate.toISOString(),
    endDate: report.endDate.toISOString(),
    sections: report.sections.map((section) => ({
      ...section,
      events: section.events.map(toAuditEventDTO),
    })),
  };
}

export function toAuditExportDTO(exportData: AuditExport): AuditExportDTO {
  return {
    ...exportData,
    requestedAt: exportData.requestedAt.toISOString(),
    completedAt: exportData.completedAt?.toISOString(),
    expiresAt: exportData.expiresAt?.toISOString(),
    filter: toAuditEventFilterDTO(exportData.filter),
  };
}

/**
 * Convert frontend string dates to backend Date objects
 */
export function fromAuditEventFilterDTO(filterDTO: AuditEventFilterDTO): AuditEventFilter {
  return {
    ...filterDTO,
    startDate: filterDTO.startDate ? new Date(filterDTO.startDate) : undefined,
    endDate: filterDTO.endDate ? new Date(filterDTO.endDate) : undefined,
  };
}

/**
 * Get audit action display name
 */
export function getAuditActionDisplayName(action: AuditAction): string {
  const names = {
    create: 'Create',
    read: 'Read',
    update: 'Update',
    delete: 'Delete',
    login: 'Login',
    logout: 'Logout',
    login_failed: 'Login Failed',
    password_change: 'Password Change',
    role_assigned: 'Role Assigned',
    role_removed: 'Role Removed',
    permission_granted: 'Permission Granted',
    permission_revoked: 'Permission Revoked',
    export: 'Export',
    import: 'Import',
    backup: 'Backup',
    restore: 'Restore',
  };
  return names[action];
}

/**
 * Get audit category display name
 */
export function getAuditCategoryDisplayName(category: AuditCategory): string {
  const names = {
    authentication: 'Authentication',
    authorization: 'Authorization',
    data: 'Data',
    system: 'System',
    security: 'Security',
    compliance: 'Compliance',
    workflow: 'Workflow',
    integration: 'Integration',
  };
  return names[category];
}

/**
 * Get severity level color for UI
 */
export function getAuditSeverityColor(severity: AuditSeverity): string {
  const colors = {
    info: '#3B82F6', // blue
    warning: '#F59E0B', // yellow
    error: '#EF4444', // red
    critical: '#7C2D12', // dark red
  };
  return colors[severity];
}

/**
 * Calculate compliance score based on audit events
 */
export function calculateComplianceScore(events: AuditEvent[]): number {
  if (events.length === 0) {
    return 100;
  }

  let score = 100;
  const criticalEvents = events.filter((e) => e.severity === 'critical').length;
  const errorEvents = events.filter((e) => e.severity === 'error').length;
  const warningEvents = events.filter((e) => e.severity === 'warning').length;

  // Deduct points based on severity
  score -= criticalEvents * 20;
  score -= errorEvents * 10;
  score -= warningEvents * 5;

  return Math.max(0, Math.min(100, score));
}

/**
 * Check if audit event indicates a compliance violation
 */
export function isComplianceViolation(event: AuditEvent): boolean {
  const violationActions: AuditAction[] = ['login_failed', 'permission_revoked', 'role_removed'];
  const violationCategories: AuditCategory[] = ['security', 'compliance'];

  return (
    event.severity === 'critical' ||
    (event.severity === 'error' && violationCategories.includes(event.category)) ||
    violationActions.includes(event.action) ||
    (event.riskScore !== undefined && event.riskScore > 80)
  );
}
