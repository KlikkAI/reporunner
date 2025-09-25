export interface ResourceLimits {
  cpu: {
    maxCores: number;
    maxUsagePercent: number;
  };
  memory: {
    maxGB: number;
    maxUsagePercent: number;
  };
  storage: {
    maxGB: number;
    maxUsagePercent: number;
  };
  network: {
    maxBandwidthMbps: number;
    maxConnections: number;
  };
}

export interface ResourceUsage {
  timestamp: Date;
  cpu: {
    usage: number; // percentage
    cores: number;
    load: number[];
  };
  memory: {
    used: number; // GB
    available: number; // GB
    usage: number; // percentage
  };
  storage: {
    used: number; // GB
    available: number; // GB
    usage: number; // percentage
  };
  network: {
    rx: number; // bytes/sec
    tx: number; // bytes/sec
    connections: number;
  };
}

export interface WorkflowResourceProfile {
  workflowId: string;
  organizationId: string;
  estimatedResources: {
    cpu: number;
    memory: number;
    storage: number;
    duration: number; // ms
  };
  priority: 'low' | 'normal' | 'high' | 'critical';
  constraints: {
    maxConcurrent: number;
    timeout: number;
    retries: number;
  };
}

export interface ScalingPolicy {
  id: string;
  name: string;
  organizationId: string;
  triggers: Array<{
    metric: 'cpu' | 'memory' | 'queue_size' | 'response_time';
    threshold: number;
    duration: number; // seconds
    operator: 'greater_than' | 'less_than';
  }>;
  actions: Array<{
    type: 'scale_up' | 'scale_down' | 'notification' | 'throttle';
    parameters: Record<string, any>;
  }>;
  cooldown: number; // seconds
  enabled: boolean;
}

export interface ResourcePool {
  id: string;
  name: string;
  organizationId?: string;
  limits: ResourceLimits;
  currentUsage: ResourceUsage;
  allocatedWorkflows: string[];
  status: 'available' | 'overloaded' | 'maintenance';
}

export class ResourceManager {
  private pools = new Map<string, ResourcePool>();
  private profiles = new Map<string, WorkflowResourceProfile>();
  private policies = new Map<string, ScalingPolicy>();
  private usageHistory: ResourceUsage[] = [];
  private monitoringInterval?: NodeJS.Timeout;

  constructor() {
    this.startMonitoring();
  }

  async createResourcePool(
