/**
 * Advanced Authentication Service
 *
 * Comprehensive authentication system providing:
 * - Multi-factor authentication (MFA)
 * - Role-based access control (RBAC)
 * - Single sign-on (SSO) integration
 * - API key management
 * - Session management
 * - User invitation system
 */

import { performanceMonitor } from './performanceMonitor';
import type {
  User,
  UserRole,
  Permission,
  ProjectAccess,
  SSOProvider,
  MFAConfig,
  MFAMethod,
  APIKey,
  Session,
  UserInvitation,
  UserPreferences,
  AuthContext,
  LoginCredentials,
  RegisterData,
  PasswordResetRequest,
  PasswordResetConfirm,
  MFAChallenge,
  MFAVerification,
  ResourceType,
  ActionType,
} from '@/core/types/authentication';

export interface AuthServiceConfig {
  sessionTimeout: number; // milliseconds
  mfaRequired: boolean;
  passwordPolicy: {
    minLength: number;
    requireUppercase: boolean;
    requireLowercase: boolean;
    requireNumbers: boolean;
    requireSpecialChars: boolean;
  };
  apiKeyExpiration: number; // milliseconds
  invitationExpiration: number; // milliseconds
}

export class AdvancedAuthService {
  private config: AuthServiceConfig;
  private currentUser: User | null = null;
  private currentSession: Session | null = null;
  private authListeners = new Set<(context: AuthContext) => void>();
  private ssoProviders = new Map<string, SSOProvider>();
  private userRoles = new Map<string, UserRole>();
  private apiKeys = new Map<string, APIKey>();
  private sessions = new Map<string, Session>();
  private invitations = new Map<string, UserInvitation>();

  constructor(config: Partial<AuthServiceConfig> = {}) {
    this.config = {
      sessionTimeout: 24 * 60 * 60 * 1000, // 24 hours
      mfaRequired: false,
      passwordPolicy: {
        minLength: 8,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: true,
      },
      apiKeyExpiration: 365 * 24 * 60 * 60 * 1000, // 1 year
      invitationExpiration: 7 * 24 * 60 * 60 * 1000, // 7 days
      ...config,
    };

    this.initializeDefaultRoles();
    this.initializeSSOProviders();
  }

  /**
   * User Authentication
   */
  async login(credentials: LoginCredentials): Promise<AuthContext> {
    const startTime = performance.now();
    
    try {
      // Simulate authentication - in production, this would call backend APIs
      const user = await this.authenticateUser(credentials.email, credentials.password);
      
      if (!user) {
        throw new Error('Invalid credentials');
      }

      // Check if MFA is required
      if (user.mfaEnabled && !credentials.mfaToken) {
        const challenge = await this.generateMFAChallenge(user.id);
        throw new Error(`MFA required: ${challenge.challenge}`);
      }

      // Verify MFA if provided
      if (credentials.mfaToken) {
        const isValid = await this.verifyMFA(user.id, {
          method: 'totp',
          code: credentials.mfaToken,
        });
        
        if (!isValid) {
          throw new Error('Invalid MFA token');
        }
      }

      // Create session
      const session = await this.createSession(user.id, {
        ipAddress: '127.0.0.1', // Would be actual IP
        userAgent: navigator.userAgent,
      });

      this.currentUser = user;
      this.currentSession = session;

      const context: AuthContext = {
        user,
        session,
        permissions: await this.getUserPermissions(user.id),
        projects: user.projects,
        isLoading: false,
        error: null,
      };

      this.notifyListeners(context);
      
      performanceMonitor.measure('auth.login', () => {}, {
        userId: user.id,
        duration: performance.now() - startTime,
      });

      return context;
    } catch (error) {
      const context: AuthContext = {
        user: null,
        session: null,
        permissions: [],
        projects: [],
        isLoading: false,
        error: (error as Error).message,
      };

      this.notifyListeners(context);
      throw error;
    }
  }

  async register(data: RegisterData): Promise<AuthContext> {
    try {
      // Validate password policy
      this.validatePassword(data.password);

      // Check if invitation token is valid
      if (data.invitationToken) {
        const invitation = await this.validateInvitation(data.invitationToken);
        if (!invitation) {
          throw new Error('Invalid invitation token');
        }
      }

      // Create user
      const user = await this.createUser({
        email: data.email,
        name: data.name,
        password: data.password, // Would be hashed
        role: data.invitationToken ? 'viewer' : 'guest',
      });

      // Create session
      const session = await this.createSession(user.id, {
        ipAddress: '127.0.0.1',
        userAgent: navigator.userAgent,
      });

      this.currentUser = user;
      this.currentSession = session;

      const context: AuthContext = {
        user,
        session,
        permissions: await this.getUserPermissions(user.id),
        projects: user.projects,
        isLoading: false,
        error: null,
      };

      this.notifyListeners(context);
      return context;
    } catch (error) {
      throw new Error(`Registration failed: ${(error as Error).message}`);
    }
  }

  async logout(): Promise<void> {
    if (this.currentSession) {
      await this.revokeSession(this.currentSession.id);
    }

    this.currentUser = null;
    this.currentSession = null;

    const context: AuthContext = {
      user: null,
      session: null,
      permissions: [],
      projects: [],
      isLoading: false,
      error: null,
    };

    this.notifyListeners(context);
  }

  /**
   * Multi-Factor Authentication
   */
  async enableMFA(userId: string, method: MFAMethod['type']): Promise<MFAMethod> {
    const methodId = `mfa_${Date.now()}`;
    const mfaMethod: MFAMethod = {
      id: methodId,
      type: method,
      name: this.getMFAMethodName(method),
      enabled: false,
      verified: false,
      createdAt: Date.now(),
    };

    // Generate method-specific data
    switch (method) {
      case 'totp':
        mfaMethod.metadata = {
          secret: this.generateTOTPSecret(),
          qrCode: this.generateQRCode(mfaMethod.metadata.secret, userId),
        };
        break;
      case 'sms':
        mfaMethod.metadata = {
          phoneNumber: '', // Would be provided by user
        };
        break;
      case 'email':
        mfaMethod.metadata = {
          email: '', // Would be user's email
        };
        break;
    }

    return mfaMethod;
  }

  async verifyMFA(userId: string, verification: MFAVerification): Promise<boolean> {
    // Simulate MFA verification - in production, this would verify against actual MFA service
    const isValid = this.validateMFACode(verification.method, verification.code);
    
    if (isValid) {
      // Update MFA method last used
      const user = this.currentUser;
      if (user) {
        // Update MFA method in user profile
        console.log(`MFA verified for user ${userId} using ${verification.method}`);
      }
    }

    return isValid;
  }

  async generateMFAChallenge(userId: string): Promise<MFAChallenge> {
    const challenge = `challenge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      method: 'totp',
      challenge,
      expiresAt: Date.now() + (5 * 60 * 1000), // 5 minutes
    };
  }

  /**
   * Role-Based Access Control
   */
  async checkPermission(
    userId: string,
    resource: ResourceType,
    action: ActionType,
    context?: any
  ): Promise<boolean> {
    const user = await this.getUserById(userId);
    if (!user) return false;

    const permissions = await this.getUserPermissions(userId);
    return permissions.some(permission => 
      permission.resource === resource && 
      permission.action === action &&
      (!permission.conditions || this.evaluateConditions(permission.conditions, context))
    );
  }

  async getUserPermissions(userId: string): Promise<Permission[]> {
    const user = await this.getUserById(userId);
    if (!user) return [];

    // Get role permissions
    const rolePermissions = user.role.permissions || [];
    
    // Get user-specific permissions
    const userPermissions = user.permissions || [];
    
    // Get project-specific permissions
    const projectPermissions = user.projects.flatMap(project => project.permissions);

    return [...rolePermissions, ...userPermissions, ...projectPermissions];
  }

  async assignRole(userId: string, roleId: string, assignedBy: string): Promise<void> {
    const user = await this.getUserById(userId);
    const role = this.userRoles.get(roleId);
    
    if (!user || !role) {
      throw new Error('User or role not found');
    }

    // Check if assigner has permission to assign this role
    const canAssign = await this.checkPermission(assignedBy, 'user', 'manage');
    if (!canAssign) {
      throw new Error('Insufficient permissions to assign role');
    }

    user.role = role;
    console.log(`Role ${roleId} assigned to user ${userId} by ${assignedBy}`);
  }

  /**
   * Single Sign-On Integration
   */
  async initiateSSO(providerId: string, redirectUri?: string): Promise<string> {
    const provider = this.ssoProviders.get(providerId);
    if (!provider || !provider.enabled) {
      throw new Error('SSO provider not found or disabled');
    }

    const state = `sso_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const authUrl = this.buildSSOAuthUrl(provider, state, redirectUri);
    
    return authUrl;
  }

  async handleSSOCallback(
    providerId: string,
    code: string,
    state: string
  ): Promise<AuthContext> {
    const provider = this.ssoProviders.get(providerId);
    if (!provider) {
      throw new Error('SSO provider not found');
    }

    // Exchange code for token
    const token = await this.exchangeSSOCode(provider, code);
    
    // Get user info from SSO provider
    const userInfo = await this.getSSOUserInfo(provider, token);
    
    // Find or create user
    let user = await this.getUserByEmail(userInfo.email);
    if (!user) {
      user = await this.createUser({
        email: userInfo.email,
        name: userInfo.name,
        ssoProvider: provider,
      });
    }

    // Create session
    const session = await this.createSession(user.id, {
      ipAddress: '127.0.0.1',
      userAgent: navigator.userAgent,
    });

    this.currentUser = user;
    this.currentSession = session;

    const context: AuthContext = {
      user,
      session,
      permissions: await this.getUserPermissions(user.id),
      projects: user.projects,
      isLoading: false,
      error: null,
    };

    this.notifyListeners(context);
    return context;
  }

  /**
   * API Key Management
   */
  async createAPIKey(
    userId: string,
    name: string,
    permissions: Permission[],
    expiresAt?: number
  ): Promise<APIKey> {
    const key = this.generateAPIKey();
    const keyHash = this.hashAPIKey(key);
    
    const apiKey: APIKey = {
      id: `key_${Date.now()}`,
      name,
      key,
      keyHash,
      permissions,
      expiresAt: expiresAt || (Date.now() + this.config.apiKeyExpiration),
      createdAt: Date.now(),
      createdBy: userId,
      status: 'active',
      metadata: {},
    };

    this.apiKeys.set(apiKey.id, apiKey);
    console.log(`API key created: ${apiKey.id} for user ${userId}`);
    
    return apiKey;
  }

  async revokeAPIKey(keyId: string, revokedBy: string): Promise<void> {
    const apiKey = this.apiKeys.get(keyId);
    if (!apiKey) {
      throw new Error('API key not found');
    }

    apiKey.status = 'revoked';
    console.log(`API key revoked: ${keyId} by ${revokedBy}`);
  }

  async validateAPIKey(key: string): Promise<{ valid: boolean; userId?: string; permissions?: Permission[] }> {
    const keyHash = this.hashAPIKey(key);
    
    for (const apiKey of this.apiKeys.values()) {
      if (apiKey.keyHash === keyHash && apiKey.status === 'active') {
        if (apiKey.expiresAt && apiKey.expiresAt < Date.now()) {
          apiKey.status = 'expired';
          return { valid: false };
        }
        
        apiKey.lastUsedAt = Date.now();
        return {
          valid: true,
          userId: apiKey.createdBy,
          permissions: apiKey.permissions,
        };
      }
    }

    return { valid: false };
  }

  /**
   * User Invitation System
   */
  async inviteUser(
    email: string,
    role: string,
    permissions: Permission[],
    projects: string[],
    invitedBy: string,
    message?: string
  ): Promise<UserInvitation> {
    const invitation: UserInvitation = {
      id: `invite_${Date.now()}`,
      email,
      role,
      permissions,
      projects,
      invitedBy,
      invitedAt: Date.now(),
      expiresAt: Date.now() + this.config.invitationExpiration,
      status: 'pending',
      token: this.generateInvitationToken(),
      message,
    };

    this.invitations.set(invitation.id, invitation);
    console.log(`User invitation sent to ${email} by ${invitedBy}`);
    
    return invitation;
  }

  async validateInvitation(token: string): Promise<UserInvitation | null> {
    for (const invitation of this.invitations.values()) {
      if (invitation.token === token && invitation.status === 'pending') {
        if (invitation.expiresAt < Date.now()) {
          invitation.status = 'expired';
          return null;
        }
        return invitation;
      }
    }
    return null;
  }

  async acceptInvitation(token: string, userData: RegisterData): Promise<AuthContext> {
    const invitation = await this.validateInvitation(token);
    if (!invitation) {
      throw new Error('Invalid or expired invitation');
    }

    // Create user with invitation data
    const user = await this.createUser({
      email: userData.email,
      name: userData.name,
      password: userData.password,
      role: invitation.role,
      permissions: invitation.permissions,
      projects: invitation.projects.map(projectId => ({
        projectId,
        role: invitation.role,
        permissions: invitation.permissions,
        grantedAt: Date.now(),
        grantedBy: invitation.invitedBy,
      })),
    });

    // Mark invitation as accepted
    invitation.status = 'accepted';
    invitation.acceptedAt = Date.now();

    // Create session
    const session = await this.createSession(user.id, {
      ipAddress: '127.0.0.1',
      userAgent: navigator.userAgent,
    });

    this.currentUser = user;
    this.currentSession = session;

    const context: AuthContext = {
      user,
      session,
      permissions: await this.getUserPermissions(user.id),
      projects: user.projects,
      isLoading: false,
      error: null,
    };

    this.notifyListeners(context);
    return context;
  }

  /**
   * Session Management
   */
  async createSession(userId: string, metadata: any): Promise<Session> {
    const session: Session = {
      id: `session_${Date.now()}`,
      userId,
      token: this.generateSessionToken(),
      refreshToken: this.generateRefreshToken(),
      expiresAt: Date.now() + this.config.sessionTimeout,
      createdAt: Date.now(),
      lastActivityAt: Date.now(),
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent,
      isActive: true,
      mfaVerified: true,
    };

    this.sessions.set(session.id, session);
    return session;
  }

  async revokeSession(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.isActive = false;
      console.log(`Session revoked: ${sessionId}`);
    }
  }

  async refreshSession(sessionId: string): Promise<Session | null> {
    const session = this.sessions.get(sessionId);
    if (!session || !session.isActive) {
      return null;
    }

    if (session.expiresAt < Date.now()) {
      session.isActive = false;
      return null;
    }

    // Extend session
    session.expiresAt = Date.now() + this.config.sessionTimeout;
    session.lastActivityAt = Date.now();
    
    return session;
  }

  /**
   * Event Listeners
   */
  subscribe(listener: (context: AuthContext) => void): () => void {
    this.authListeners.add(listener);
    return () => this.authListeners.delete(listener);
  }

  getCurrentContext(): AuthContext {
    return {
      user: this.currentUser,
      session: this.currentSession,
      permissions: this.currentUser ? this.getUserPermissions(this.currentUser.id) : [],
      projects: this.currentUser?.projects || [],
      isLoading: false,
      error: null,
    };
  }

  // Private helper methods

  private async authenticateUser(email: string, password: string): Promise<User | null> {
    // Simulate user authentication - in production, this would verify against database
    if (email === 'admin@reporunner.com' && password === 'admin123') {
      return {
        id: 'user_1',
        email,
        name: 'Admin User',
        role: this.userRoles.get('admin')!,
        status: 'active',
        createdAt: Date.now(),
        mfaEnabled: false,
        preferences: this.createDefaultPreferences(),
        permissions: [],
        projects: [],
      };
    }
    return null;
  }

  private async createUser(data: any): Promise<User> {
    const user: User = {
      id: `user_${Date.now()}`,
      email: data.email,
      name: data.name,
      role: this.userRoles.get(data.role) || this.userRoles.get('viewer')!,
      status: 'active',
      createdAt: Date.now(),
      mfaEnabled: false,
      preferences: this.createDefaultPreferences(),
      permissions: data.permissions || [],
      projects: data.projects || [],
    };

    return user;
  }

  private async getUserById(userId: string): Promise<User | null> {
    return this.currentUser?.id === userId ? this.currentUser : null;
  }

  private async getUserByEmail(email: string): Promise<User | null> {
    return this.currentUser?.email === email ? this.currentUser : null;
  }

  private validatePassword(password: string): void {
    const policy = this.config.passwordPolicy;
    
    if (password.length < policy.minLength) {
      throw new Error(`Password must be at least ${policy.minLength} characters long`);
    }
    
    if (policy.requireUppercase && !/[A-Z]/.test(password)) {
      throw new Error('Password must contain at least one uppercase letter');
    }
    
    if (policy.requireLowercase && !/[a-z]/.test(password)) {
      throw new Error('Password must contain at least one lowercase letter');
    }
    
    if (policy.requireNumbers && !/\d/.test(password)) {
      throw new Error('Password must contain at least one number');
    }
    
    if (policy.requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      throw new Error('Password must contain at least one special character');
    }
  }

  private getMFAMethodName(method: MFAMethod['type']): string {
    const names = {
      totp: 'Authenticator App',
      sms: 'SMS',
      email: 'Email',
      hardware: 'Hardware Token',
    };
    return names[method];
  }

  private generateTOTPSecret(): string {
    return Math.random().toString(36).substr(2, 16).toUpperCase();
  }

  private generateQRCode(secret: string, userId: string): string {
    return `otpauth://totp/Reporunner:${userId}?secret=${secret}&issuer=Reporunner`;
  }

  private validateMFACode(method: MFAMethod['type'], code: string): boolean {
    // Simulate MFA validation - in production, this would validate against actual MFA service
    return code.length >= 6 && /^\d+$/.test(code);
  }

  private evaluateConditions(conditions: any[], context: any): boolean {
    // Simplified condition evaluation
    return conditions.every(condition => {
      // In production, this would evaluate actual conditions
      return true;
    });
  }

  private buildSSOAuthUrl(provider: SSOProvider, state: string, redirectUri?: string): string {
    const params = new URLSearchParams({
      client_id: provider.configuration.clientId,
      redirect_uri: redirectUri || provider.configuration.redirectUri,
      response_type: 'code',
      scope: provider.configuration.scopes.join(' '),
      state,
    });

    return `${provider.configuration.endpoints.authorization}?${params.toString()}`;
  }

  private async exchangeSSOCode(provider: SSOProvider, code: string): Promise<string> {
    // Simulate token exchange - in production, this would make actual API call
    return `token_${Date.now()}`;
  }

  private async getSSOUserInfo(provider: SSOProvider, token: string): Promise<any> {
    // Simulate user info retrieval - in production, this would make actual API call
    return {
      email: 'user@sso-provider.com',
      name: 'SSO User',
    };
  }

  private generateAPIKey(): string {
    return `rr_${Math.random().toString(36).substr(2, 32)}`;
  }

  private hashAPIKey(key: string): string {
    // Simulate key hashing - in production, use proper hashing
    return btoa(key);
  }

  private generateInvitationToken(): string {
    return Math.random().toString(36).substr(2, 32);
  }

  private generateSessionToken(): string {
    return `session_${Math.random().toString(36).substr(2, 32)}`;
  }

  private generateRefreshToken(): string {
    return `refresh_${Math.random().toString(36).substr(2, 32)}`;
  }

  private createDefaultPreferences(): UserPreferences {
    return {
      theme: 'dark',
      language: 'en',
      timezone: 'UTC',
      notifications: {
        email: true,
        push: false,
        inApp: true,
        workflows: true,
        executions: true,
        security: true,
      },
      dashboard: {
        layout: 'grid',
        widgets: ['workflows', 'executions', 'recent'],
        refreshInterval: 30000,
      },
      editor: {
        autoSave: true,
        autoComplete: true,
        syntaxHighlighting: true,
        wordWrap: true,
      },
    };
  }

  private initializeDefaultRoles(): void {
    const roles: UserRole[] = [
      {
        id: 'owner',
        name: 'Owner',
        description: 'Full system access',
        level: 10,
        permissions: [
          { id: 'all', resource: 'workflow', action: 'manage' },
          { id: 'all', resource: 'execution', action: 'manage' },
          { id: 'all', resource: 'user', action: 'manage' },
          { id: 'all', resource: 'organization', action: 'manage' },
        ],
        isSystem: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
      {
        id: 'admin',
        name: 'Administrator',
        description: 'System administration',
        level: 8,
        permissions: [
          { id: 'manage_workflows', resource: 'workflow', action: 'manage' },
          { id: 'manage_executions', resource: 'execution', action: 'manage' },
          { id: 'manage_users', resource: 'user', action: 'manage' },
        ],
        isSystem: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
      {
        id: 'manager',
        name: 'Manager',
        description: 'Project management',
        level: 6,
        permissions: [
          { id: 'manage_project_workflows', resource: 'workflow', action: 'manage' },
          { id: 'view_executions', resource: 'execution', action: 'read' },
          { id: 'manage_project_users', resource: 'user', action: 'update' },
        ],
        isSystem: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
      {
        id: 'editor',
        name: 'Editor',
        description: 'Create and edit workflows',
        level: 4,
        permissions: [
          { id: 'create_workflows', resource: 'workflow', action: 'create' },
          { id: 'edit_workflows', resource: 'workflow', action: 'update' },
          { id: 'execute_workflows', resource: 'workflow', action: 'execute' },
        ],
        isSystem: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
      {
        id: 'viewer',
        name: 'Viewer',
        description: 'View-only access',
        level: 2,
        permissions: [
          { id: 'view_workflows', resource: 'workflow', action: 'read' },
          { id: 'view_executions', resource: 'execution', action: 'read' },
        ],
        isSystem: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ];

    roles.forEach(role => {
      this.userRoles.set(role.id, role);
    });
  }

  private initializeSSOProviders(): void {
    const providers: SSOProvider[] = [
      {
        id: 'google',
        name: 'Google',
        type: 'oauth2',
        enabled: true,
        configuration: {
          issuer: 'https://accounts.google.com',
          clientId: 'google-client-id',
          redirectUri: 'http://localhost:3000/auth/callback/google',
          scopes: ['openid', 'email', 'profile'],
          endpoints: {
            authorization: 'https://accounts.google.com/o/oauth2/v2/auth',
            token: 'https://oauth2.googleapis.com/token',
            userInfo: 'https://www.googleapis.com/oauth2/v2/userinfo',
          },
          attributes: {
            email: 'email',
            name: 'name',
          },
        },
        metadata: {
          logo: 'https://developers.google.com/identity/images/g-logo.png',
          description: 'Sign in with Google',
        },
      },
      {
        id: 'microsoft',
        name: 'Microsoft',
        type: 'oauth2',
        enabled: false,
        configuration: {
          issuer: 'https://login.microsoftonline.com/common',
          clientId: 'microsoft-client-id',
          redirectUri: 'http://localhost:3000/auth/callback/microsoft',
          scopes: ['openid', 'email', 'profile'],
          endpoints: {
            authorization: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
            token: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
            userInfo: 'https://graph.microsoft.com/v1.0/me',
          },
          attributes: {
            email: 'mail',
            name: 'displayName',
          },
        },
        metadata: {
          logo: 'https://img.icons8.com/color/48/000000/microsoft.png',
          description: 'Sign in with Microsoft',
        },
      },
    ];

    providers.forEach(provider => {
      this.ssoProviders.set(provider.id, provider);
    });
  }

  private notifyListeners(context: AuthContext): void {
    this.authListeners.forEach(listener => {
      try {
        listener(context);
      } catch (error) {
        console.error('Error in auth listener:', error);
      }
    });
  }
}

// Export singleton instance
export const advancedAuthService = new AdvancedAuthService();