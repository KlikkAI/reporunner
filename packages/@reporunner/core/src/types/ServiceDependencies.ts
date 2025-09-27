import type { ILogger } from '../interfaces/ILogger';
import type { ICache } from '../interfaces/ICache';
import type { IEventBus } from '../interfaces/IEventBus';

export interface ServiceDependencies {
  logger: ILogger;
  cache?: ICache;
  eventBus?: IEventBus;
  [key: string]: unknown;
}
