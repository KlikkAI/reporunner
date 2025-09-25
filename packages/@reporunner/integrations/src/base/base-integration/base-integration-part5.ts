name: string;
displayName: string;
description: string;
parameters: ActionParameter[];
outputs: ActionOutput[];
}

export interface IntegrationTrigger {
  name: string;
  displayName: string;
  description: string;
  type: 'webhook' | 'polling' | 'manual';
  parameters: TriggerParameter[];
  outputs: TriggerOutput[];
}

export interface ActionParameter {
  name: string;
  displayName: string;
  type: 'string' | 'number' | 'boolean' | 'json' | 'options' | 'file';
  required: boolean;
  default?: any;
  description?: string;
  options?: Array<{ name: string; value: any }>;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    enum?: any[];
  };
}

export interface ActionOutput {
  name: string;
  displayName: string;
  type: string;
  description?: string;
}

export interface TriggerParameter extends ActionParameter {}
export interface TriggerOutput extends ActionOutput {}

export default BaseIntegration;
