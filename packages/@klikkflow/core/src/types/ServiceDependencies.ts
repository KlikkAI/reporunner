import type { ICache } from '../interfaces/ICache';
import type { IEventBus } from '../interfaces/IEventBus';
import type { ILogger } from '../interfaces/ILogger';

export interface ServiceDependencies {
  logger: ILogger;
  cache?: ICache;
  eventBus?: IEventBus;
  [key: string]: unknown;
}
