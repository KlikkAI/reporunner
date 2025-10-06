// Test types for source mapping validation
export interface TestEntity {
  id: string;
  name: string;
  createdAt: Date;
}

export type TestStatus = 'active' | 'inactive' | 'pending';

export interface TestConfig {
  enabled: boolean;
  timeout: number;
  retries: number;
}
