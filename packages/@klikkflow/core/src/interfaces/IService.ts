export interface IService {
  healthCheck(): Promise<{ healthy: boolean; details?: Record<string, unknown> }>;
  dispose(): Promise<void>;
}
