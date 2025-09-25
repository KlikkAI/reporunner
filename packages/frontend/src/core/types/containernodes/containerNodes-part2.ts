export interface ContainerResizeEvent {
  containerId: string;
  newDimensions: {
    width: number;
    height: number;
  };
  childrenPositions: Array<{
    nodeId: string;
    position: { x: number; y: number };
  }>;
}

export interface ContainerDropEvent {
  containerId: string;
  nodeId: string;
  position: { x: number; y: number };
}

export interface ContainerConnectionEvent {
  containerId: string;
  sourceNodeId: string;
  targetNodeId: string;
  connectionType: 'internal' | 'external';
}

// Container node factory functions
export const createLoopContainer = (
  id: string,
  name: string,
  position: { x: number; y: number },
  config: Partial<ContainerExecutionConfig> = {}
): ContainerNodeConfig => ({
  id,
  type: 'loop',
  name,
  children: [],
  position,
  dimensions: { width: 400, height: 300 },
  style: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderColor: '#3b82f6',
    borderWidth: 2,
    borderRadius: 8,
    opacity: 0.8,
    zIndex: 1,
  },
  executionConfig: {
    loopType: 'for',
    loopLimit: 10,
    loopDelay: 1000,
    ...config,
  },
});

export const createParallelContainer = (
  id: string,
  name: string,
  position: { x: number; y: number },
  config: Partial<ContainerExecutionConfig> = {}
): ContainerNodeConfig => ({
  id,
  type: 'parallel',
  name,
  children: [],
  position,
  dimensions: { width: 500, height: 400 },
  style: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderColor: '#22c55e',
    borderWidth: 2,
    borderRadius: 8,
    opacity: 0.8,
    zIndex: 1,
  },
  executionConfig: {
    maxConcurrency: 5,
    parallelStrategy: 'all',
    ...config,
  },
});

export const createConditionalContainer = (
  id: string,
  name: string,
  position: { x: number; y: number },
  config: Partial<ContainerExecutionConfig> = {}
): ContainerNodeConfig => ({
  id,
  type: 'conditional',
  name,
  children: [],
  position,
  dimensions: { width: 350, height: 250 },
  style: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderColor: '#f59e0b',
    borderWidth: 2,
    borderRadius: 8,
    opacity: 0.8,
