import { inject, injectable } from 'inversify';
import { CalculateMemoryTrendUseCase } from './application/use-cases/CalculateMemoryTrend.use-case';
import { CatchUseCase } from './application/use-cases/Catch.use-case';
import { CollectSystemMetricsUseCase } from './application/use-cases/CollectSystemMetrics.use-case';
import { CreateExpressMiddlewareUseCase } from './application/use-cases/CreateExpressMiddleware.use-case';
import { DetectMemoryLeaksUseCase } from './application/use-cases/DetectMemoryLeaks.use-case';
import { EndTimerUseCase } from './application/use-cases/EndTimer.use-case';
import { ForUseCase, ForUseCase } from './application/use-cases/For.use-case';
import { GetAverageMetricUseCase } from './application/use-cases/GetAverageMetric.use-case';
import { GetCurrentSystemMetricsUseCase } from './application/use-cases/GetCurrentSystemMetrics.use-case';
import { GetMetricsUseCase } from './application/use-cases/GetMetrics.use-case';
import { GetPercentileUseCase } from './application/use-cases/GetPercentile.use-case';
import {
  IfUseCase,
  IfUseCase,
  IfUseCase,
  IfUseCase,
  IfUseCase,
  IfUseCase,
  IfUseCase,
  IfUseCase,
  IfUseCase,
  IfUseCase,
} from './application/use-cases/If.use-case';
import { IncrementCounterUseCase } from './application/use-cases/IncrementCounter.use-case';
import { MeasureEventLoopLagUseCase } from './application/use-cases/MeasureEventLoopLag.use-case';
import { RecordGaugeUseCase } from './application/use-cases/RecordGauge.use-case';
import { RecordMetricUseCase } from './application/use-cases/RecordMetric.use-case';
import { SetupGCMonitoringUseCase } from './application/use-cases/SetupGCMonitoring.use-case';
import { StartSystemMonitoringUseCase } from './application/use-cases/StartSystemMonitoring.use-case';
import { StartTimerUseCase } from './application/use-cases/StartTimer.use-case';
import { StopUseCase } from './application/use-cases/Stop.use-case';
import type { IPerformanceMonitorRepository } from './domain/repositories/IPerformanceMonitorRepository';

@injectable()
export class PerformanceMonitorService {
  constructor(
    @inject('IPerformanceMonitorRepository') private repository: IPerformanceMonitorRepository,
    @inject(StartTimerUseCase) private startTimerUseCase: StartTimerUseCase,
    @inject(EndTimerUseCase) private endTimerUseCase: EndTimerUseCase,
    @inject(IfUseCase) private ifUseCase: IfUseCase,
    @inject(IfUseCase) private ifUseCase: IfUseCase,
    @inject(CatchUseCase) private catchUseCase: CatchUseCase,
    @inject(RecordMetricUseCase) private recordMetricUseCase: RecordMetricUseCase,
    @inject(IfUseCase) private ifUseCase: IfUseCase,
    @inject(IncrementCounterUseCase) private incrementCounterUseCase: IncrementCounterUseCase,
    @inject(RecordGaugeUseCase) private recordGaugeUseCase: RecordGaugeUseCase,
    @inject(StartSystemMonitoringUseCase) private startSystemMonitoringUseCase: StartSystemMonitoringUseCase,
    @inject(CollectSystemMetricsUseCase) private collectSystemMetricsUseCase: CollectSystemMetricsUseCase,
    @inject(MeasureEventLoopLagUseCase) private measureEventLoopLagUseCase: MeasureEventLoopLagUseCase,
    @inject(DetectMemoryLeaksUseCase) private detectMemoryLeaksUseCase: DetectMemoryLeaksUseCase,
    @inject(ForUseCase) private forUseCase: ForUseCase,
    @inject(IfUseCase) private ifUseCase: IfUseCase,
    @inject(IfUseCase) private ifUseCase: IfUseCase,
    @inject(CalculateMemoryTrendUseCase) private calculateMemoryTrendUseCase: CalculateMemoryTrendUseCase,
    @inject(ForUseCase) private forUseCase: ForUseCase,
    @inject(IfUseCase) private ifUseCase: IfUseCase,
    @inject(SetupGCMonitoringUseCase) private setupGCMonitoringUseCase: SetupGCMonitoringUseCase,
    @inject(IfUseCase) private ifUseCase: IfUseCase,
    @inject(GetMetricsUseCase) private getMetricsUseCase: GetMetricsUseCase,
    @inject(IfUseCase) private ifUseCase: IfUseCase,
    @inject(IfUseCase) private ifUseCase: IfUseCase,
    @inject(GetAverageMetricUseCase) private getAverageMetricUseCase: GetAverageMetricUseCase,
    @inject(GetPercentileUseCase) private getPercentileUseCase: GetPercentileUseCase,
    @inject(GetCurrentSystemMetricsUseCase) private getCurrentSystemMetricsUseCase: GetCurrentSystemMetricsUseCase,
    @inject(CreateExpressMiddlewareUseCase) private createExpressMiddlewareUseCase: CreateExpressMiddlewareUseCase,
    @inject(StopUseCase) private stopUseCase: StopUseCase,
    @inject(IfUseCase) private ifUseCase: IfUseCase
  ) {}

  async startTimer(input: any): Promise<any> {
    return this.startTimerUseCase.execute(input);
  }

  async endTimer(input: any): Promise<any> {
    return this.endTimerUseCase.execute(input);
  }

  async if(input: any): Promise<any> {
    return this.ifUseCase.execute(input);
  }

  async if(input: any): Promise<any> {
    return this.ifUseCase.execute(input);
  }

  async catch(input: any): Promise<any> {
    return this.catchUseCase.execute(input);
  }

  async recordMetric(input: any): Promise<any> {
    return this.recordMetricUseCase.execute(input);
  }

  async if(input: any): Promise<any> {
    return this.ifUseCase.execute(input);
  }

  async incrementCounter(input: any): Promise<any> {
    return this.incrementCounterUseCase.execute(input);
  }

  async recordGauge(input: any): Promise<any> {
    return this.recordGaugeUseCase.execute(input);
  }

  async startSystemMonitoring(input: any): Promise<any> {
    return this.startSystemMonitoringUseCase.execute(input);
  }

  async collectSystemMetrics(input: any): Promise<any> {
    return this.collectSystemMetricsUseCase.execute(input);
  }

  async measureEventLoopLag(input: any): Promise<any> {
    return this.measureEventLoopLagUseCase.execute(input);
  }

  async detectMemoryLeaks(input: any): Promise<any> {
    return this.detectMemoryLeaksUseCase.execute(input);
  }

  async for(input: any): Promise<any> {
    return this.forUseCase.execute(input);
  }

  async if(input: any): Promise<any> {
    return this.ifUseCase.execute(input);
  }

  async if(input: any): Promise<any> {
    return this.ifUseCase.execute(input);
  }

  async calculateMemoryTrend(input: any): Promise<any> {
    return this.calculateMemoryTrendUseCase.execute(input);
  }

  async for(input: any): Promise<any> {
    return this.forUseCase.execute(input);
  }

  async if(input: any): Promise<any> {
    return this.ifUseCase.execute(input);
  }

  async setupGCMonitoring(input: any): Promise<any> {
    return this.setupGCMonitoringUseCase.execute(input);
  }

  async if(input: any): Promise<any> {
    return this.ifUseCase.execute(input);
  }

  async getMetrics(input: any): Promise<any> {
    return this.getMetricsUseCase.execute(input);
  }

  async if(input: any): Promise<any> {
    return this.ifUseCase.execute(input);
  }

  async if(input: any): Promise<any> {
    return this.ifUseCase.execute(input);
  }

  async getAverageMetric(input: any): Promise<any> {
    return this.getAverageMetricUseCase.execute(input);
  }

  async getPercentile(input: any): Promise<any> {
    return this.getPercentileUseCase.execute(input);
  }

  async getCurrentSystemMetrics(input: any): Promise<any> {
    return this.getCurrentSystemMetricsUseCase.execute(input);
  }

  async createExpressMiddleware(input: any): Promise<any> {
    return this.createExpressMiddlewareUseCase.execute(input);
  }

  async stop(input: any): Promise<any> {
    return this.stopUseCase.execute(input);
  }

  async if(input: any): Promise<any> {
    return this.ifUseCase.execute(input);
  }
}
