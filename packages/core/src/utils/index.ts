// Utility functions for workflow automation

export const generateId = (): string => {
  return Math.random().toString(36).substr(2, 9);
};

export const validateEmail = (email: string): boolean => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

export const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
};

export const deepClone = <T>(obj: T): T => {
  return JSON.parse(JSON.stringify(obj));
};

export const isEmpty = (value: any): boolean => {
  if (value == null) return true;
  if (typeof value === 'string') return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
};

// Workflow-specific utilities
export const validateWorkflow = (workflow: any): boolean => {
  return !!(workflow.name && workflow.nodes && workflow.edges);
};

export const getNodeConnections = (nodeId: string, edges: any[]): { inputs: string[]; outputs: string[] } => {
  const inputs = edges.filter(edge => edge.target === nodeId).map(edge => edge.source);
  const outputs = edges.filter(edge => edge.source === nodeId).map(edge => edge.target);
  return { inputs, outputs };
};