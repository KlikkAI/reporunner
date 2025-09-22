export const UNIFIED_CATEGORIES = {
  TRIGGERS_EVENTS: 'Triggers & Events',
  COMMUNICATION: 'Communication',
  DATA_STORAGE: 'Data & Storage',
  DATA_TRANSFORMATION: 'Data Transformation',
  DEVELOPMENT_APIS: 'Development & APIs',
  DEVELOPER_TOOLS: 'Developer Tools',
  BUSINESS_PRODUCTIVITY: 'Business & Productivity',
  PRODUCTIVITY: 'Productivity',
  COMMERCE_MARKETING: 'Commerce & Marketing',
  AI_AUTOMATION: 'AI & Automation',
  SECURITY_MONITORING: 'Security & Monitoring',
  ANALYTICS: 'Analytics',
  CRM: 'CRM',
  CLOUD_SERVICES: 'Cloud Services',
  SOCIAL_MEDIA: 'Social Media',
  ECOMMERCE: 'E-commerce',
  SECURITY_AUTH: 'Security & Auth',
} as const;

export const CATEGORY_ICONS: Record<string, string> = {
  [UNIFIED_CATEGORIES.TRIGGERS_EVENTS]: '🚀',
  [UNIFIED_CATEGORIES.COMMUNICATION]: '💬',
  [UNIFIED_CATEGORIES.DATA_STORAGE]: '💾',
  [UNIFIED_CATEGORIES.DATA_TRANSFORMATION]: '🔄',
  [UNIFIED_CATEGORIES.DEVELOPMENT_APIS]: '🔧',
  [UNIFIED_CATEGORIES.DEVELOPER_TOOLS]: '🔧',
  [UNIFIED_CATEGORIES.BUSINESS_PRODUCTIVITY]: '🏢',
  [UNIFIED_CATEGORIES.PRODUCTIVITY]: '📋',
  [UNIFIED_CATEGORIES.COMMERCE_MARKETING]: '🛍️',
  [UNIFIED_CATEGORIES.AI_AUTOMATION]: '🤖',
  [UNIFIED_CATEGORIES.SECURITY_MONITORING]: '🔐',
  [UNIFIED_CATEGORIES.ANALYTICS]: '📊',
  [UNIFIED_CATEGORIES.CRM]: '👥',
  [UNIFIED_CATEGORIES.CLOUD_SERVICES]: '☁️',
  [UNIFIED_CATEGORIES.SOCIAL_MEDIA]: '📱',
  [UNIFIED_CATEGORIES.ECOMMERCE]: '🛒',
  [UNIFIED_CATEGORIES.SECURITY_AUTH]: '🔑',
};

export const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  [UNIFIED_CATEGORIES.TRIGGERS_EVENTS]: 'Schedule triggers, webhooks, and external events',
  [UNIFIED_CATEGORIES.COMMUNICATION]: 'Email, messaging, and video communication tools',
  [UNIFIED_CATEGORIES.DATA_STORAGE]: 'Databases, file storage, and cloud services',
  [UNIFIED_CATEGORIES.DATA_TRANSFORMATION]: 'Transform, filter, and manipulate data',
  [UNIFIED_CATEGORIES.DEVELOPMENT_APIS]: 'GitHub, APIs, webhooks, and development tools',
  [UNIFIED_CATEGORIES.DEVELOPER_TOOLS]: 'Development tools, version control, and code management',
  [UNIFIED_CATEGORIES.BUSINESS_PRODUCTIVITY]: 'CRM, project management, and business tools',
  [UNIFIED_CATEGORIES.PRODUCTIVITY]: 'Task management, note-taking, and productivity apps',
  [UNIFIED_CATEGORIES.COMMERCE_MARKETING]: 'E-commerce, payments, marketing, and analytics',
  [UNIFIED_CATEGORIES.AI_AUTOMATION]: 'AI services, data processing, and automation logic',
  [UNIFIED_CATEGORIES.SECURITY_MONITORING]: 'Authentication, security, and monitoring tools',
  [UNIFIED_CATEGORIES.ANALYTICS]: 'Web analytics, data tracking, and insights',
  [UNIFIED_CATEGORIES.CRM]: 'Customer relationship management and sales tools',
  [UNIFIED_CATEGORIES.CLOUD_SERVICES]: 'AWS, Azure, GCP and other cloud platforms',
  [UNIFIED_CATEGORIES.SOCIAL_MEDIA]: 'Twitter, Facebook, Instagram and social platforms',
  [UNIFIED_CATEGORIES.ECOMMERCE]: 'Online stores, payments, and retail platforms',
  [UNIFIED_CATEGORIES.SECURITY_AUTH]: 'Authentication, authorization, and security services',
};

export const CATEGORY_COLORS: Record<string, string> = {
  [UNIFIED_CATEGORIES.TRIGGERS_EVENTS]: '#10b981',
  [UNIFIED_CATEGORIES.COMMUNICATION]: '#3b82f6',
  [UNIFIED_CATEGORIES.DATA_STORAGE]: '#64748b',
  [UNIFIED_CATEGORIES.DATA_TRANSFORMATION]: '#8b5cf6',
  [UNIFIED_CATEGORIES.DEVELOPMENT_APIS]: '#f97316',
  [UNIFIED_CATEGORIES.DEVELOPER_TOOLS]: '#f97316',
  [UNIFIED_CATEGORIES.BUSINESS_PRODUCTIVITY]: '#6366f1',
  [UNIFIED_CATEGORIES.PRODUCTIVITY]: '#6366f1',
  [UNIFIED_CATEGORIES.COMMERCE_MARKETING]: '#ef4444',
  [UNIFIED_CATEGORIES.AI_AUTOMATION]: '#a855f7',
  [UNIFIED_CATEGORIES.SECURITY_MONITORING]: '#059669',
  [UNIFIED_CATEGORIES.ANALYTICS]: '#0ea5e9',
  [UNIFIED_CATEGORIES.CRM]: '#dc2626',
  [UNIFIED_CATEGORIES.CLOUD_SERVICES]: '#6b7280',
  [UNIFIED_CATEGORIES.SOCIAL_MEDIA]: '#f59e0b',
  [UNIFIED_CATEGORIES.ECOMMERCE]: '#16a34a',
  [UNIFIED_CATEGORIES.SECURITY_AUTH]: '#7c3aed',
};

// Helper function to get all unified categories
export const getUnifiedCategoryList = () => {
  return Object.values(UNIFIED_CATEGORIES);
};

// Helper function to get category metadata
export const getCategoryMetadata = (category: string) => {
  return {
    name: category,
    icon: CATEGORY_ICONS[category],
    description: CATEGORY_DESCRIPTIONS[category],
    color: CATEGORY_COLORS[category],
  };
};
