wordWrap: boolean;
}
}

export interface AuthContext {
  user: User | null;
  session: Session | null;
  permissions: Permission[];
  projects: ProjectAccess[];
  isLoading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
  mfaToken?: string;
  rememberMe?: boolean;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  invitationToken?: string;
  acceptTerms: boolean;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetConfirm {
  token: string;
  password: string;
}

export interface MFAChallenge {
  method: MFAMethod['type'];
  challenge: string;
  expiresAt: number;
}

export interface MFAVerification {
  method: MFAMethod['type'];
  code: string;
  backupCode?: string;
}

// Enums
export type ResourceType =
  | 'workflow'
  | 'execution'
  | 'credential'
  | 'user'
  | 'project'
  | 'organization'
  | 'integration'
  | 'audit'
  | 'settings';

export type ActionType =
  | 'create'
  | 'read'
  | 'update'
  | 'delete'
  | 'execute'
  | 'share'
  | 'export'
  | 'import'
  | 'manage';

// Factory functions
export const createUser = (data: Partial<User>): User => ({
  id: `user_${Date.now()}`,
  email: '',
  name: '',
  role: createDefaultRole(),
  status: 'pending',
  createdAt: Date.now(),
  mfaEnabled: false,
  preferences: createDefaultPreferences(),
  permissions: [],
  projects: [],
  ...data,
});

export const createDefaultRole = (): UserRole => ({
  id: 'viewer',
  name: 'Viewer',
  description: 'Can view workflows and executions',
  level: 1,
  permissions: [
    { id: 'read_workflow', resource: 'workflow', action: 'read' },
    { id: 'read_execution', resource: 'execution', action: 'read' },
  ],
  isSystem: true,
  createdAt: Date.now(),
  updatedAt: Date.now(),
});
