export interface CredentialTypeField {
  name: string;
  type: string;
  required: boolean;
  placeholder?: string;
  description?: string;
}

export interface CredentialTypeDef {
  type: string;
  name: string;
  description?: string;
  fields: CredentialTypeField[];
  icon?: string;
}

export interface TestResult {
  success: boolean;
  message: string;
  details?: Record<string, any>;
}

export interface CredentialData {
  id?: string;
  name: string;
  type: string;
  data: Record<string, any>;
  isConnected?: boolean;
  createdAt?: string;
  updatedAt?: string;
}