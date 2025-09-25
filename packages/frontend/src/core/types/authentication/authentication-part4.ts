export const createDefaultPreferences = (): UserPreferences => ({
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
});

export const createAPIKey = (data: Partial<APIKey>): APIKey => ({
  id: `key_${Date.now()}`,
  name: '',
  key: '',
  keyHash: '',
  permissions: [],
  createdAt: Date.now(),
  createdBy: '',
  status: 'active',
  metadata: {},
  ...data,
});

export const createUserInvitation = (data: Partial<UserInvitation>): UserInvitation => ({
  id: `invite_${Date.now()}`,
  email: '',
  role: 'viewer',
  permissions: [],
  projects: [],
  invitedBy: '',
  invitedAt: Date.now(),
  expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
  status: 'pending',
  token: '',
  ...data,
});

// Permission checking utilities
export const hasPermission = (
  userPermissions: Permission[],
  resource: ResourceType,
  action: ActionType,
  context?: any
): boolean => {
  return userPermissions.some(
    (permission) =>
      permission.resource === resource &&
      permission.action === action &&
      (!permission.conditions || evaluateConditions(permission.conditions, context))
  );
};

export const hasAnyPermission = (
  userPermissions: Permission[],
  checks: Array<{ resource: ResourceType; action: ActionType }>
): boolean => {
  return checks.some((check) => hasPermission(userPermissions, check.resource, check.action));
};

export const hasAllPermissions = (
  userPermissions: Permission[],
  checks: Array<{ resource: ResourceType; action: ActionType }>
): boolean => {
  return checks.every((check) => hasPermission(userPermissions, check.resource, check.action));
};

export const evaluateConditions = (conditions: AccessCondition[], context: any): boolean => {
  return conditions.every((condition) => {
    const value = getContextValue(context, condition.type);

    switch (condition.operator) {
      case 'equals':
        return value === condition.value;
      case 'not_equals':
        return value !== condition.value;
      case 'contains':
        return String(value).includes(String(condition.value));
      case 'not_contains':
        return !String(value).includes(String(condition.value));
      case 'in':
        return Array.isArray(condition.value) && condition.value.includes(value);
      case 'not_in':
        return Array.isArray(condition.value) && !condition.value.includes(value);
      case 'before':
