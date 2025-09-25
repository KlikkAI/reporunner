zIndex: 1,
},
  executionConfig:
{
  conditionExpression: 'true',
  ...config,
}
,
})

export const createTryCatchContainer = (
  id: string,
  name: string,
  position: { x: number; y: number },
  config: Partial<ContainerExecutionConfig> = {}
): ContainerNodeConfig => ({
  id,
  type: 'try-catch',
  name,
  children: [],
  position,
  dimensions: { width: 400, height: 300 },
  style: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: '#ef4444',
    borderWidth: 2,
    borderRadius: 8,
    opacity: 0.8,
    zIndex: 1,
  },
  executionConfig: {
    retryAttempts: 3,
    retryDelay: 1000,
    errorHandling: 'retry',
    ...config,
  },
});

export const createBatchContainer = (
  id: string,
  name: string,
  position: { x: number; y: number },
  config: Partial<ContainerExecutionConfig> = {}
): ContainerNodeConfig => ({
  id,
  type: 'batch',
  name,
  children: [],
  position,
  dimensions: { width: 450, height: 350 },
  style: {
    backgroundColor: 'rgba(168, 85, 247, 0.1)',
    borderColor: '#a855f7',
    borderWidth: 2,
    borderRadius: 8,
    opacity: 0.8,
    zIndex: 1,
  },
  executionConfig: {
    batchSize: 10,
    batchDelay: 500,
    batchStrategy: 'sequential',
    ...config,
  },
});
