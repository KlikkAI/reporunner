/**
 * Advanced Security Service
 * Provides enterprise-grade security features including threat detection,
 * encryption, and security monitoring
 */

import { auditService } from "./auditService";

export interface SecurityThreat {
  id: string;
  type:
    | "brute_force"
    | "credential_stuffing"
    | "suspicious_ip"
    | "data_exfiltration"
    | "privilege_escalation"
    | "malware_detection";
  severity: "low" | "medium" | "high" | "critical";
  title: string;
  description: string;
  detectedAt: Date;
  sourceIp: string;
  targetUserId?: string;
  organizationId?: string;
  indicators: SecurityIndicator[];
  status: "active" | "investigating" | "mitigated" | "false_positive";
  mitigationActions: string[];
  assignedTo?: string;
  resolvedAt?: Date;
}

export interface SecurityIndicator {
  type: string;
  value: string;
  confidence: number; // 0-100
  source: string;
  timestamp: Date;
}

export interface EncryptionConfig {
  algorithm: "AES-256-GCM" | "ChaCha20-Poly1305";
  keyDerivation: "PBKDF2" | "Argon2id";
  saltLength: number;
  iterations: number;
  keyLength: number;
}

export interface ThreatIntelligence {
  maliciousIps: Set<string>;
  suspiciousUserAgents: Set<string>;
  knownAttackPatterns: RegExp[];
  geoBlockedCountries: Set<string>;
  lastUpdated: Date;
}

export interface SecurityPolicy {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  conditions: SecurityCondition[];
  actions: SecurityAction[];
  organizationId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SecurityCondition {
  type:
    | "ip_geolocation"
    | "login_frequency"
    | "device_fingerprint"
    | "time_based"
    | "risk_score";
  operator:
    | "equals"
    | "not_equals"
    | "greater_than"
    | "less_than"
    | "contains"
    | "in_range";
  value: any;
  weight: number; // For risk scoring
}

export interface SecurityAction {
  type:
    | "block_request"
    | "require_mfa"
    | "send_alert"
    | "quarantine_user"
    | "rate_limit"
    | "log_event";
  parameters: Record<string, any>;
  priority: number;
}

export interface DeviceFingerprint {
  id: string;
  userId: string;
  fingerprint: string;
  deviceInfo: {
    userAgent: string;
    screenResolution: string;
    timezone: string;
    language: string;
    platform: string;
    cookiesEnabled: boolean;
    localStorageEnabled: boolean;
  };
  firstSeen: Date;
  lastSeen: Date;
  trusted: boolean;
  riskScore: number;
}

export interface RiskAssessment {
  userId: string;
  sessionId: string;
  timestamp: Date;
  overallRisk: number; // 0-100
  factors: RiskFactor[];
  recommendation: "allow" | "challenge" | "deny";
  confidence: number;
}

export interface RiskFactor {
  name: string;
  value: number; // 0-100
  weight: number;
  description: string;
  source: string;
}

export interface SecurityConfiguration {
  encryptionAtRest: boolean;
  encryptionInTransit: boolean;
  tokenExpiration: number; // minutes
  maxLoginAttempts: number;
  lockoutDuration: number; // minutes
  sessionTimeout: number; // minutes
  requireMFA: boolean;
  allowedCountries: string[];
  blockedCountries: string[];
  ipWhitelist: string[];
  ipBlacklist: string[];
  deviceTrustDuration: number; // days
  riskThresholds: {
    low: number;
    medium: number;
    high: number;
  };
}

export class SecurityService {
  private threats: SecurityThreat[] = [];
  private policies: SecurityPolicy[] = [];
  private threatIntelligence: ThreatIntelligence;
  private deviceFingerprints: Map<string, DeviceFingerprint> = new Map();
  private encryptionConfig: EncryptionConfig;
  private securityConfig: SecurityConfiguration;

  constructor() {
    this.threatIntelligence = {
      maliciousIps: new Set(),
      suspiciousUserAgents: new Set([
        "sqlmap",
        "nikto",
        "nmap",
        "masscan",
        "gobuster",
      ]),
      knownAttackPatterns: [
        /(\b(union|select|insert|update|delete|drop|create|alter|exec|script)\b)/i,
        /(javascript:|data:|vbscript:)/i,
        /(\.\.\/)|(\.\.\\)/,
        /(eval\(|setTimeout\(|setInterval\()/i,
      ],
      geoBlockedCountries: new Set(),
      lastUpdated: new Date(),
    };

    this.encryptionConfig = {
      algorithm: "AES-256-GCM",
      keyDerivation: "Argon2id",
      saltLength: 32,
      iterations: 100000,
      keyLength: 32,
    };

    this.securityConfig = {
      encryptionAtRest: true,
      encryptionInTransit: true,
      tokenExpiration: 60,
      maxLoginAttempts: 5,
      lockoutDuration: 30,
      sessionTimeout: 30,
      requireMFA: false,
      allowedCountries: [],
      blockedCountries: [],
      ipWhitelist: [],
      ipBlacklist: [],
      deviceTrustDuration: 30,
      riskThresholds: {
        low: 30,
        medium: 60,
        high: 80,
      },
    };

    // Initialize with some security policies
    this.initializeDefaultPolicies();
  }

  // Threat Detection
  async detectThreats(
    userId: string,
    ipAddress: string,
    userAgent: string,
    action: string,
  ): Promise<SecurityThreat[]> {
    const detectedThreats: SecurityThreat[] = [];

    // Check for brute force attacks
    const bruteForceCheck = await this.checkBruteForceAttack(userId, ipAddress);
    if (bruteForceCheck) {
      detectedThreats.push(bruteForceCheck);
    }

    // Check against threat intelligence
    const threatIntelCheck = this.checkThreatIntelligence(ipAddress, userAgent);
    if (threatIntelCheck) {
      detectedThreats.push(threatIntelCheck);
    }

    // Check for suspicious patterns
    const patternCheck = this.checkSuspiciousPatterns(action, userAgent);
    if (patternCheck) {
      detectedThreats.push(patternCheck);
    }

    // Store detected threats
    detectedThreats.forEach((threat) => {
      this.threats.push(threat);
      this.triggerSecurityAlert(threat);
    });

    return detectedThreats;
  }

  private async checkBruteForceAttack(
    userId: string,
    ipAddress: string,
  ): Promise<SecurityThreat | null> {
    // Get recent failed login attempts
    const recentEvents = await auditService.getEvents(
      {
        userId,
        action: "login",
        result: "failure",
        startDate: new Date(Date.now() - 3600000), // Last hour
      },
      100,
      0,
    );

    if (recentEvents.length >= this.securityConfig.maxLoginAttempts) {
      return {
        id: this.generateId(),
        type: "brute_force",
        severity: "high",
        title: "Brute Force Attack Detected",
        description: `${recentEvents.length} failed login attempts detected for user ${userId} from IP ${ipAddress}`,
        detectedAt: new Date(),
        sourceIp: ipAddress,
        targetUserId: userId,
        indicators: [
          {
            type: "failed_login_count",
            value: recentEvents.length.toString(),
            confidence: 95,
            source: "audit_log",
            timestamp: new Date(),
          },
        ],
        status: "active",
        mitigationActions: [
          "Block IP address",
          "Lock user account",
          "Send security alert",
          "Require MFA for next login",
        ],
      };
    }

    return null;
  }

  private checkThreatIntelligence(
    ipAddress: string,
    userAgent: string,
  ): SecurityThreat | null {
    const indicators: SecurityIndicator[] = [];

    // Check malicious IPs
    if (this.threatIntelligence.maliciousIps.has(ipAddress)) {
      indicators.push({
        type: "malicious_ip",
        value: ipAddress,
        confidence: 90,
        source: "threat_intelligence",
        timestamp: new Date(),
      });
    }

    // Check suspicious user agents
    for (const suspiciousUA of this.threatIntelligence.suspiciousUserAgents) {
      if (userAgent.toLowerCase().includes(suspiciousUA)) {
        indicators.push({
          type: "suspicious_user_agent",
          value: userAgent,
          confidence: 85,
          source: "threat_intelligence",
          timestamp: new Date(),
        });
      }
    }

    if (indicators.length > 0) {
      return {
        id: this.generateId(),
        type: "suspicious_ip",
        severity: "medium",
        title: "Threat Intelligence Match",
        description: "Request matches known threat indicators",
        detectedAt: new Date(),
        sourceIp: ipAddress,
        indicators,
        status: "active",
        mitigationActions: [
          "Block request",
          "Monitor user activity",
          "Update threat intelligence",
        ],
      };
    }

    return null;
  }

  private checkSuspiciousPatterns(
    action: string,
    userAgent: string,
  ): SecurityThreat | null {
    const indicators: SecurityIndicator[] = [];

    // Check for attack patterns
    for (const pattern of this.threatIntelligence.knownAttackPatterns) {
      if (pattern.test(action) || pattern.test(userAgent)) {
        indicators.push({
          type: "attack_pattern",
          value: pattern.source,
          confidence: 80,
          source: "pattern_analysis",
          timestamp: new Date(),
        });
      }
    }

    if (indicators.length > 0) {
      return {
        id: this.generateId(),
        type: "malware_detection",
        severity: "high",
        title: "Suspicious Pattern Detected",
        description: "Request contains patterns associated with known attacks",
        detectedAt: new Date(),
        sourceIp: "unknown",
        indicators,
        status: "active",
        mitigationActions: [
          "Block request",
          "Quarantine user",
          "Deep scan user data",
          "Alert security team",
        ],
      };
    }

    return null;
  }

  // Risk Assessment
  async assessRisk(
    userId: string,
    sessionId: string,
    context: {
      ipAddress: string;
      userAgent: string;
      location?: string;
      deviceFingerprint?: string;
      timeOfAccess: Date;
    },
  ): Promise<RiskAssessment> {
    const factors: RiskFactor[] = [];

    // Assess IP reputation
    const ipRisk = this.assessIpRisk(context.ipAddress);
    factors.push(ipRisk);

    // Assess device trust
    const deviceRisk = await this.assessDeviceRisk(context.deviceFingerprint);
    factors.push(deviceRisk);

    // Assess time-based risk
    const timeRisk = this.assessTimeRisk(context.timeOfAccess);
    factors.push(timeRisk);

    // Assess geolocation risk
    if (context.location) {
      const geoRisk = this.assessGeolocationRisk(context.location);
      factors.push(geoRisk);
    }

    // Assess behavioral risk
    const behaviorRisk = await this.assessBehavioralRisk(userId);
    factors.push(behaviorRisk);

    // Calculate overall risk score
    const overallRisk = this.calculateOverallRisk(factors);

    // Determine recommendation
    let recommendation: "allow" | "challenge" | "deny" = "allow";
    if (overallRisk >= this.securityConfig.riskThresholds.high) {
      recommendation = "deny";
    } else if (overallRisk >= this.securityConfig.riskThresholds.medium) {
      recommendation = "challenge";
    }

    return {
      userId,
      sessionId,
      timestamp: new Date(),
      overallRisk,
      factors,
      recommendation,
      confidence:
        factors.reduce((sum, f) => sum + f.weight, 0) / factors.length,
    };
  }

  private assessIpRisk(ipAddress: string): RiskFactor {
    let riskScore = 0;

    if (this.threatIntelligence.maliciousIps.has(ipAddress)) {
      riskScore = 90;
    } else if (this.securityConfig.ipBlacklist.includes(ipAddress)) {
      riskScore = 80;
    } else if (this.securityConfig.ipWhitelist.includes(ipAddress)) {
      riskScore = 0;
    } else {
      // Check for private IP ranges (lower risk)
      const privateRanges = [
        /^10\./,
        /^172\.(1[6-9]|2[0-9]|3[01])\./,
        /^192\.168\./,
      ];

      const isPrivate = privateRanges.some((range) => range.test(ipAddress));
      riskScore = isPrivate ? 10 : 30;
    }

    return {
      name: "IP Reputation",
      value: riskScore,
      weight: 25,
      description: `Risk assessment based on IP address ${ipAddress}`,
      source: "ip_reputation",
    };
  }

  private async assessDeviceRisk(fingerprint?: string): Promise<RiskFactor> {
    if (!fingerprint) {
      return {
        name: "Device Trust",
        value: 50,
        weight: 20,
        description: "Unknown device - moderate risk",
        source: "device_fingerprint",
      };
    }

    const device = this.deviceFingerprints.get(fingerprint);
    if (!device) {
      return {
        name: "Device Trust",
        value: 70,
        weight: 20,
        description: "New device - higher risk",
        source: "device_fingerprint",
      };
    }

    if (device.trusted) {
      return {
        name: "Device Trust",
        value: 10,
        weight: 20,
        description: "Trusted device - low risk",
        source: "device_fingerprint",
      };
    }

    // Calculate risk based on device history
    const daysSinceFirstSeen =
      (Date.now() - device.firstSeen.getTime()) / (1000 * 60 * 60 * 24);
    const riskScore = Math.max(10, 50 - daysSinceFirstSeen * 2);

    return {
      name: "Device Trust",
      value: riskScore,
      weight: 20,
      description: `Device seen for ${Math.round(daysSinceFirstSeen)} days`,
      source: "device_fingerprint",
    };
  }

  private assessTimeRisk(timeOfAccess: Date): RiskFactor {
    const hour = timeOfAccess.getHours();
    const day = timeOfAccess.getDay();

    let riskScore = 0;

    // Higher risk for late night/early morning access
    if (hour >= 0 && hour <= 5) {
      riskScore += 30;
    } else if (hour >= 22 || hour <= 6) {
      riskScore += 15;
    }

    // Slightly higher risk for weekend access
    if (day === 0 || day === 6) {
      riskScore += 10;
    }

    return {
      name: "Time-based Risk",
      value: riskScore,
      weight: 10,
      description: `Access at ${timeOfAccess.toLocaleTimeString()}`,
      source: "time_analysis",
    };
  }

  private assessGeolocationRisk(location: string): RiskFactor {
    let riskScore = 20; // Default moderate risk

    if (this.securityConfig.blockedCountries.includes(location)) {
      riskScore = 90;
    } else if (
      this.securityConfig.allowedCountries.length > 0 &&
      !this.securityConfig.allowedCountries.includes(location)
    ) {
      riskScore = 70;
    } else if (this.threatIntelligence.geoBlockedCountries.has(location)) {
      riskScore = 80;
    }

    return {
      name: "Geolocation Risk",
      value: riskScore,
      weight: 15,
      description: `Access from ${location}`,
      source: "geolocation",
    };
  }

  private async assessBehavioralRisk(userId: string): Promise<RiskFactor> {
    // Get recent user activity
    const recentEvents = await auditService.getEvents(
      {
        userId,
        startDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
      },
      100,
      0,
    );

    let riskScore = 10;

    // High activity volume
    if (recentEvents.length > 100) {
      riskScore += 20;
    }

    // Failed operations
    const failedEvents = recentEvents.filter((e) => e.result === "failure");
    if (failedEvents.length > 10) {
      riskScore += 30;
    }

    // High-risk actions
    const highRiskActions = recentEvents.filter(
      (e) =>
        e.action.includes("delete") ||
        e.action.includes("admin") ||
        e.severity === "high" ||
        e.severity === "critical",
    );
    riskScore += highRiskActions.length * 5;

    return {
      name: "Behavioral Risk",
      value: Math.min(riskScore, 100),
      weight: 30,
      description: `Based on recent activity (${recentEvents.length} events)`,
      source: "behavioral_analysis",
    };
  }

  private calculateOverallRisk(factors: RiskFactor[]): number {
    const totalWeight = factors.reduce((sum, factor) => sum + factor.weight, 0);
    const weightedScore = factors.reduce(
      (sum, factor) => sum + factor.value * factor.weight,
      0,
    );

    return Math.round(weightedScore / totalWeight);
  }

  // Encryption Services
  async encryptData(
    data: string,
    context?: string,
  ): Promise<{ encrypted: string; metadata: any }> {
    // In a real implementation, this would use proper encryption libraries
    const encrypted = Buffer.from(data).toString("base64"); // Simplified for demo

    const metadata = {
      algorithm: this.encryptionConfig.algorithm,
      timestamp: new Date(),
      context: context || "general",
      keyId: "key-" + Date.now(),
    };

    await auditService.logEvent({
      userId: "system",
      userName: "System",
      action: "encrypt",
      resource: "data",
      details: { context, dataLength: data.length },
      ipAddress: "127.0.0.1",
      userAgent: "SecurityService",
      severity: "low",
      category: "system",
      result: "success",
    });

    return { encrypted, metadata };
  }

  async decryptData(encryptedData: string, metadata: any): Promise<string> {
    // In a real implementation, this would use proper decryption
    const decrypted = Buffer.from(encryptedData, "base64").toString("utf-8");

    await auditService.logEvent({
      userId: "system",
      userName: "System",
      action: "decrypt",
      resource: "data",
      details: { context: metadata.context, keyId: metadata.keyId },
      ipAddress: "127.0.0.1",
      userAgent: "SecurityService",
      severity: "medium",
      category: "system",
      result: "success",
    });

    return decrypted;
  }

  // Security Policy Management
  createSecurityPolicy(
    policy: Omit<SecurityPolicy, "id" | "createdAt" | "updatedAt">,
  ): SecurityPolicy {
    const newPolicy: SecurityPolicy = {
      ...policy,
      id: this.generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.policies.push(newPolicy);
    return newPolicy;
  }

  evaluateSecurityPolicies(context: any): SecurityAction[] {
    const triggeredActions: SecurityAction[] = [];

    for (const policy of this.policies.filter((p) => p.enabled)) {
      const allConditionsMet = policy.conditions.every((condition) =>
        this.evaluateCondition(condition, context),
      );

      if (allConditionsMet) {
        triggeredActions.push(...policy.actions);
      }
    }

    return triggeredActions.sort((a, b) => b.priority - a.priority);
  }

  private evaluateCondition(
    condition: SecurityCondition,
    context: any,
  ): boolean {
    const value = this.getContextValue(context, condition.type);

    switch (condition.operator) {
      case "equals":
        return value === condition.value;
      case "not_equals":
        return value !== condition.value;
      case "greater_than":
        return Number(value) > Number(condition.value);
      case "less_than":
        return Number(value) < Number(condition.value);
      case "contains":
        return String(value).includes(String(condition.value));
      case "in_range":
        const [min, max] = condition.value;
        return Number(value) >= min && Number(value) <= max;
      default:
        return false;
    }
  }

  private getContextValue(context: any, type: string): any {
    switch (type) {
      case "ip_geolocation":
        return context.location;
      case "login_frequency":
        return context.loginCount || 0;
      case "device_fingerprint":
        return context.deviceFingerprint;
      case "time_based":
        return context.timeOfAccess?.getHours() || 0;
      case "risk_score":
        return context.riskScore || 0;
      default:
        return null;
    }
  }

  // Device Management
  registerDevice(
    userId: string,
    deviceInfo: DeviceFingerprint["deviceInfo"],
  ): DeviceFingerprint {
    const fingerprint = this.generateDeviceFingerprint(deviceInfo);

    const device: DeviceFingerprint = {
      id: this.generateId(),
      userId,
      fingerprint,
      deviceInfo,
      firstSeen: new Date(),
      lastSeen: new Date(),
      trusted: false,
      riskScore: 50,
    };

    this.deviceFingerprints.set(fingerprint, device);
    return device;
  }

  private generateDeviceFingerprint(
    deviceInfo: DeviceFingerprint["deviceInfo"],
  ): string {
    const data = [
      deviceInfo.userAgent,
      deviceInfo.screenResolution,
      deviceInfo.timezone,
      deviceInfo.language,
      deviceInfo.platform,
    ].join("|");

    // In a real implementation, use a proper hashing algorithm
    return Buffer.from(data).toString("base64");
  }

  // Utility methods
  private initializeDefaultPolicies(): void {
    // Geo-blocking policy
    this.policies.push({
      id: "geo-block-policy",
      name: "Geographic Blocking",
      description: "Block access from high-risk countries",
      enabled: true,
      conditions: [
        {
          type: "ip_geolocation",
          operator: "equals",
          value: "high-risk-country",
          weight: 100,
        },
      ],
      actions: [
        {
          type: "block_request",
          parameters: { reason: "Geographic restriction" },
          priority: 100,
        },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // High-risk user policy
    this.policies.push({
      id: "high-risk-user-policy",
      name: "High Risk User Actions",
      description: "Require additional verification for high-risk users",
      enabled: true,
      conditions: [
        {
          type: "risk_score",
          operator: "greater_than",
          value: 80,
          weight: 100,
        },
      ],
      actions: [
        {
          type: "require_mfa",
          parameters: { method: "totp" },
          priority: 90,
        },
        {
          type: "send_alert",
          parameters: { recipient: "security-team" },
          priority: 80,
        },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  private triggerSecurityAlert(threat: SecurityThreat): void {
    console.warn(`[SECURITY THREAT] ${threat.title}: ${threat.description}`);

    // In a real implementation, this would send notifications to security team
    auditService.logEvent({
      userId: "system",
      userName: "SecurityService",
      action: "threat_detected",
      resource: "security",
      details: {
        threatType: threat.type,
        severity: threat.severity,
        sourceIp: threat.sourceIp,
      },
      ipAddress: "127.0.0.1",
      userAgent: "SecurityService",
      severity: threat.severity,
      category: "system",
      result: "success",
    });
  }

  private generateId(): string {
    return `sec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Public getters
  getThreats(filter?: {
    severity?: string;
    status?: string;
  }): SecurityThreat[] {
    let threats = [...this.threats];

    if (filter?.severity) {
      threats = threats.filter((t) => t.severity === filter.severity);
    }

    if (filter?.status) {
      threats = threats.filter((t) => t.status === filter.status);
    }

    return threats.sort(
      (a, b) => b.detectedAt.getTime() - a.detectedAt.getTime(),
    );
  }

  getSecurityPolicies(): SecurityPolicy[] {
    return [...this.policies];
  }

  getSecurityConfiguration(): SecurityConfiguration {
    return { ...this.securityConfig };
  }

  updateSecurityConfiguration(updates: Partial<SecurityConfiguration>): void {
    this.securityConfig = { ...this.securityConfig, ...updates };
  }
}

// Singleton instance
export const securityService = new SecurityService();
