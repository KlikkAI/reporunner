import { randomBytes } from 'node:crypto';
import { EventEmitter } from 'node:events';
import fs from 'node:fs';
import path from 'node:path';
import { promisify } from 'node:util';

// const writeFile = promisify(fs.writeFile); // Removed unused function
const appendFile = promisify(fs.appendFile);
const mkdir = promisify(fs.mkdir);

export enum AuditEventType {
  // Authentication events
  LOGIN_SUCCESS = 'LOGIN_SUCCESS',
  LOGIN_FAILED = 'LOGIN_FAILED',
  LOGOUT = 'LOGOUT',
  TOKEN_REFRESH = 'TOKEN_REFRESH',
  TOKEN_REVOKED = 'TOKEN_REVOKED',
  PASSWORD_RESET = 'PASSWORD_RESET',
  PASSWORD_CHANGED = 'PASSWORD_CHANGED',
  MFA_ENABLED = 'MFA_ENABLED',
  MFA_DISABLED = 'MFA_DISABLED',

  // Authorization events
  ACCESS_GRANTED = 'ACCESS_GRANTED',
  ACCESS_DENIED = 'ACCESS_DENIED',
  PERMISSION_CHANGED = 'PERMISSION_CHANGED',
  ROLE_CHANGED = 'ROLE_CHANGED',

  // Data events
  DATA_CREATE = 'DATA_CREATE',
  DATA_READ = 'DATA_READ',
  DATA_UPDATE = 'DATA_UPDATE',
  DATA_DELETE = 'DATA_DELETE',
  DATA_EXPORT = 'DATA_EXPORT',
  DATA_IMPORT = 'DATA_IMPORT',

  // System events
  CONFIG_CHANGED = 'CONFIG_CHANGED',
  SERVICE_START = 'SERVICE_START',
  SERVICE_STOP = 'SERVICE_STOP',
  ERROR_OCCURRED = 'ERROR_OCCURRED',
  SECURITY_ALERT = 'SECURITY_ALERT',

  // Workflow events
  WORKFLOW_CREATED = 'WORKFLOW_CREATED',
  WORKFLOW_UPDATED = 'WORKFLOW_UPDATED',
  WORKFLOW_DELETED = 'WORKFLOW_DELETED',
  WORKFLOW_EXECUTED = 'WORKFLOW_EXECUTED',
  WORKFLOW_FAILED = 'WORKFLOW_FAILED',

  // API events
  API_KEY_CREATED = 'API_KEY_CREATED',
  API_KEY_REVOKED = 'API_KEY_REVOKED',
  API_RATE_LIMIT = 'API_RATE_LIMIT',

  // File events
  FILE_UPLOADED = 'FILE_UPLOADED',
  FILE_DOWNLOADED = 'FILE_DOWNLOADED',
  FILE_DELETED = 'FILE_DELETED',
  FILE_SHARED = 'FILE_SHARED',

  // User management
  USER_CREATED = 'USER_CREATED',
  USER_UPDATED = 'USER_UPDATED',
  USER_DELETED = 'USER_DELETED',
  USER_SUSPENDED = 'USER_SUSPENDED',
  USER_ACTIVATED = 'USER_ACTIVATED',
}

export enum AuditSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export interface AuditEvent {
  id: string;
  timestamp: Date;
  type: AuditEventType;
  severity: AuditSeverity;
  userId?: string;
  userEmail?: string;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
  resource?: string;
  resourceId?: string;
  action: string;
  result: 'SUCCESS' | 'FAILURE';
  details?: any;
  metadata?: Record<string, any>;
  hash?: string;
  previousHash?: string;
}

export interface AuditLoggerConfig {
  enabled?: boolean;
  logLevel?: AuditSeverity;
  storageType?: 'file' | 'database' | 'both';
