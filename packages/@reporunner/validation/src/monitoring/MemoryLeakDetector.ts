import { EventEmitter } from 'node:events';
import type { MemoryLeak, MemoryStats } from '../types/index.js';

/**
 * Advanced memory leak detection and analysis tools
 * Requirements: 2.3
 */
export class MemoryLeakDetector extends EventEmitter {
  private memoryHistory: MemoryHistoryEntry[] = [];
  private objectTracking = new Map<string, ObjectTrackingInfo>();
  private leakThresholds: LeakThresholds;
  private isTracking = false;

  constructor(thresholds?: Partial<LeakThresholds>) {
    super();
    this.leakThresholds = {
      sustainedGrowthThreshold: 0.1, // 10%
      memoryGrowthRate: 0.05, // 5% per minute
      objectCountThreshold: 10000,
      heapGrowthThreshold: 50 * 1024 * 1024, // 50MB
      ...thresholds,
    };
  }

  /**
   * Start tracking memory for leak detection
   */
  startTracking(intervalMs: number = 10000): void {
    if (this.isTracking) {
      return;
    }

    this.isTracking = true;
    this.captureInitialBaseline();

    const trackingInterval = setInterval(() => {
      this.captureMemorySnapshot();
      this.analyzeForLeaks();
    }, intervalMs);

    // Store interval for cleanup
    this.once('stop', () => {
      clearInterval(trackingInterval);
    });
  }

  /**
   * Stop memory leak tracking
   */
  stopTracking(): void {
    if (!this.isTracking) {
      return;
    }

    this.isTracking = false;
    this.emit('stop');
  }

  /**
   * Detect memory leaks using multiple analysis methods
   * Requirements: 2.3
   */
  async detectLeaks(): Promise<MemoryLeak[]> {
    const leaks: MemoryLeak[] = [];

    // Analyze sustained memory growth
    const growthLeaks = this.detectSustainedGrowth();
    leaks.push(...growthLeaks);

    // Analyze object lifecycle patterns
    const objectLeaks = this.detectObjectLeaks();
    leaks.push(...objectLeaks);

    // Analyze heap fragmentation
    const fragmentationLeaks = this.detectFragmentation();
    leaks.push(...fragmentationLeaks);

    // Analyze event listener leaks
    const eventLeaks = this.detectEventListenerLeaks();
    leaks.push(...eventLeaks);

    // Analyze timer leaks
    const timerLeaks = this.detectTimerLeaks();
    leaks.push(...timerLeaks);

    return leaks;
  }

  /**
   * Detect sustained memory growth patterns
   */
  private detectSustainedGrowth(): MemoryLeak[] {
    const leaks: MemoryLeak[] = [];

    if (this.memoryHistory.length < 5) {
      return leaks;
    }

    const recentHistory = this.memoryHistory.slice(-10);
    const growthAnalysis = this.analyzeGrowthPattern(recentHistory);

    if (growthAnalysis.sustainedGrowth > this.leakThresholds.sustainedGrowthThreshold) {
      leaks.push({
        location: 'Heap memory',
        severity: this.categorizeSeverity(growthAnalysis.sustainedGrowth),
        description: `Sustained memory growth of ${(growthAnalysis.sustainedGrowth * 100).toFixed(1)}% detected over ${recentHistory.length} measurements`,
        suggestion:
          'Review object lifecycle management, ensure proper cleanup of references, and check for accumulating data structures',
      });
    }

    if (growthAnalysis.rssGrowthRate > this.leakThresholds.memoryGrowthRate) {
      leaks.push({
        location: 'RSS memory',
        severity: 'medium',
        description: `RSS memory growing at ${(growthAnalysis.rssGrowthRate * 100).toFixed(1)}% per measurement interval`,
        suggestion:
          'Check for memory fragmentation, unclosed file handles, or native module memory issues',
      });
    }

    return leaks;
  }

  /**
   * Detect object lifecycle-related leaks
   */
  private detectObjectLeaks(): MemoryLeak[] {
    const leaks: MemoryLeak[] = [];

    // Analyze tracked objects for accumulation patterns
    for (const [objectType, trackingInfo] of this.objectTracking.entries()) {
      if (trackingInfo.currentCount > this.leakThresholds.objectCountThreshold) {
        leaks.push({
          location: `Object type: ${objectType}`,
          severity: 'high',
          description: `High object count detected: ${trackingInfo.currentCount} instances of ${objectType}`,
          suggestion: `Review ${objectType} object lifecycle and ensure proper disposal/cleanup`,
        });
      }

      if (trackingInfo.growthRate > 0.2) {
        // 20% growth rate
        leaks.push({
          location: `Object type: ${objectType}`,
          severity: 'medium',
          description: `Rapid object growth detected: ${objectType} growing at ${(trackingInfo.growthRate * 100).toFixed(1)}% per interval`,
          suggestion: `Check for object pooling opportunities and proper cleanup of ${objectType} instances`,
        });
      }
    }

    return leaks;
  }

  /**
   * Detect memory fragmentation issues
   */
  private detectFragmentation(): MemoryLeak[] {
    const leaks: MemoryLeak[] = [];

    if (this.memoryHistory.length < 3) {
      return leaks;
    }

    const latest = this.memoryHistory[this.memoryHistory.length - 1];
    const fragmentationRatio = latest.memory.rss / latest.memory.heapUsed;

    if (fragmentationRatio > 3) {
      leaks.push({
        location: 'Memory fragmentation',
        severity: 'low',
        description: `High fragmentation ratio detected: ${fragmentationRatio.toFixed(2)}x RSS to heap ratio`,
        suggestion:
          'Consider implementing memory pooling, adjusting garbage collection settings, or reviewing allocation patterns',
      });
    }

    // Check for heap vs total heap discrepancy
    const heapUtilization = latest.memory.heapUsed / latest.memory.heapTotal;
    if (heapUtilization < 0.3 && latest.memory.heapTotal > 100 * 1024 * 1024) {
      // 100MB
      leaks.push({
        location: 'Heap allocation',
        severity: 'low',
        description: `Low heap utilization: ${(heapUtilization * 100).toFixed(1)}% of allocated heap is used`,
        suggestion:
          'Consider reducing initial heap size or implementing more efficient memory allocation strategies',
      });
    }

    return leaks;
  }

  /**
   * Detect event listener leaks
   */
  private detectEventListenerLeaks(): MemoryLeak[] {
    const leaks: MemoryLeak[] = [];

    // Check for excessive event listeners
    const maxListeners = EventEmitter.defaultMaxListeners;
    const processListenerCount =
      process.listenerCount('uncaughtException') +
      process.listenerCount('unhandledRejection') +
      process.listenerCount('exit');

    if (processListenerCount > maxListeners) {
      leaks.push({
        location: 'Process event listeners',
        severity: 'medium',
        description: `High number of process event listeners: ${processListenerCount}`,
        suggestion:
          'Review event listener registration and ensure proper cleanup with removeListener() or off()',
      });
    }

    return leaks;
  }

  /**
   * Detect timer-related leaks
   */
  private detectTimerLeaks(): MemoryLeak[] {
    const leaks: MemoryLeak[] = [];

    // Note: In a real implementation, you might track active timers
    // This is a simplified version that checks for common timer leak patterns

    // Check for potential timer accumulation by analyzing memory patterns
    if (this.memoryHistory.length >= 5) {
      const recentGrowth = this.analyzeGrowthPattern(this.memoryHistory.slice(-5));

      // If we see steady, small incremental growth, it might indicate timer leaks
      if (recentGrowth.isLinearGrowth && recentGrowth.sustainedGrowth > 0.02) {
        leaks.push({
          location: 'Timer/Interval leaks',
          severity: 'medium',
          description:
            'Linear memory growth pattern detected, possibly indicating timer or interval leaks',
          suggestion:
            'Review setTimeout, setInterval, and setImmediate usage. Ensure all timers are properly cleared with clearTimeout/clearInterval',
        });
      }
    }

    return leaks;
  }

  /**
   * Track specific object types for leak detection
   */
  trackObjectType(objectType: string, currentCount: number): void {
    const existing = this.objectTracking.get(objectType);

    if (existing) {
      const growthRate = (currentCount - existing.currentCount) / existing.currentCount;
      existing.previousCount = existing.currentCount;
      existing.currentCount = currentCount;
      existing.growthRate = growthRate;
      existing.lastUpdated = Date.now();
    } else {
      this.objectTracking.set(objectType, {
        objectType,
        currentCount,
        previousCount: currentCount,
        growthRate: 0,
        firstSeen: Date.now(),
        lastUpdated: Date.now(),
      });
    }
  }

  /**
   * Analyze memory growth patterns
   */
  private analyzeGrowthPattern(history: MemoryHistoryEntry[]): GrowthAnalysis {
    if (history.length < 2) {
      return {
        sustainedGrowth: 0,
        rssGrowthRate: 0,
        heapGrowthRate: 0,
        isLinearGrowth: false,
      };
    }

    const first = history[0];
    const last = history[history.length - 1];

    const sustainedGrowth = (last.memory.heapUsed - first.memory.heapUsed) / first.memory.heapUsed;
    const rssGrowthRate = (last.memory.rss - first.memory.rss) / first.memory.rss;
    const heapGrowthRate =
      (last.memory.heapTotal - first.memory.heapTotal) / first.memory.heapTotal;

    // Check for linear growth pattern
    const isLinearGrowth = this.isLinearGrowthPattern(history);

    return {
      sustainedGrowth,
      rssGrowthRate,
      heapGrowthRate,
      isLinearGrowth,
    };
  }

  /**
   * Check if memory growth follows a linear pattern
   */
  private isLinearGrowthPattern(history: MemoryHistoryEntry[]): boolean {
    if (history.length < 4) {
      return false;
    }

    const heapValues = history.map((entry) => entry.memory.heapUsed);
    const growthRates = [];

    for (let i = 1; i < heapValues.length; i++) {
      const rate = (heapValues[i] - heapValues[i - 1]) / heapValues[i - 1];
      growthRates.push(rate);
    }

    // Check if growth rates are relatively consistent (indicating linear growth)
    const avgGrowthRate = growthRates.reduce((sum, rate) => sum + rate, 0) / growthRates.length;
    const variance =
      growthRates.reduce((sum, rate) => sum + (rate - avgGrowthRate) ** 2, 0) / growthRates.length;

    // Low variance indicates consistent growth pattern
    return variance < 0.01 && avgGrowthRate > 0.005; // 0.5% consistent growth
  }

  /**
   * Categorize leak severity based on growth rate
   */
  private categorizeSeverity(growthRate: number): 'low' | 'medium' | 'high' {
    if (growthRate > 0.3) {
      return 'high';
    }
    if (growthRate > 0.15) {
      return 'medium';
    }
    return 'low';
  }

  /**
   * Capture initial memory baseline
   */
  private captureInitialBaseline(): void {
    const baseline: MemoryHistoryEntry = {
      timestamp: Date.now(),
      memory: this.getCurrentMemoryStats(),
      gcInfo: this.getGCInfo(),
    };

    this.memoryHistory.push(baseline);
  }

  /**
   * Capture memory snapshot for analysis
   */
  private captureMemorySnapshot(): void {
    const snapshot: MemoryHistoryEntry = {
      timestamp: Date.now(),
      memory: this.getCurrentMemoryStats(),
      gcInfo: this.getGCInfo(),
    };

    this.memoryHistory.push(snapshot);

    // Keep only last 50 snapshots to prevent memory growth
    if (this.memoryHistory.length > 50) {
      this.memoryHistory = this.memoryHistory.slice(-50);
    }
  }

  /**
   * Analyze current state for leaks and emit events
   */
  private analyzeForLeaks(): void {
    this.detectLeaks()
      .then((leaks) => {
        if (leaks.length > 0) {
          this.emit('leaksDetected', leaks);

          // Emit specific events for different leak types
          const criticalLeaks = leaks.filter((leak) => leak.severity === 'high');
          if (criticalLeaks.length > 0) {
            this.emit('criticalLeaks', criticalLeaks);
          }
        }
      })
      .catch((error) => {
        this.emit('error', error);
      });
  }

  /**
   * Get current memory statistics
   */
  private getCurrentMemoryStats(): MemoryStats {
    const memUsage = process.memoryUsage();
    return {
      heapUsed: memUsage.heapUsed,
      heapTotal: memUsage.heapTotal,
      external: memUsage.external,
      rss: memUsage.rss,
      peak: memUsage.heapUsed,
    };
  }

  /**
   * Get garbage collection information
   */
  private getGCInfo(): GCInfo {
    // In a real implementation, you might use v8.getHeapStatistics()
    return {
      collections: 0,
      timeSpent: 0,
      heapSizeLimit: 0,
    };
  }

  /**
   * Get current tracking statistics
   */
  getTrackingStats(): LeakDetectionStats {
    return {
      isTracking: this.isTracking,
      historyLength: this.memoryHistory.length,
      trackedObjectTypes: this.objectTracking.size,
      thresholds: this.leakThresholds,
      lastAnalysis:
        this.memoryHistory.length > 0
          ? new Date(this.memoryHistory[this.memoryHistory.length - 1].timestamp)
          : null,
    };
  }

  /**
   * Reset leak detection state
   */
  reset(): void {
    this.stopTracking();
    this.memoryHistory = [];
    this.objectTracking.clear();
  }
}

// Supporting interfaces
interface MemoryHistoryEntry {
  timestamp: number;
  memory: MemoryStats;
  gcInfo: GCInfo;
}

interface GCInfo {
  collections: number;
  timeSpent: number;
  heapSizeLimit: number;
}

interface ObjectTrackingInfo {
  objectType: string;
  currentCount: number;
  previousCount: number;
  growthRate: number;
  firstSeen: number;
  lastUpdated: number;
}

interface LeakThresholds {
  sustainedGrowthThreshold: number;
  memoryGrowthRate: number;
  objectCountThreshold: number;
  heapGrowthThreshold: number;
}

interface GrowthAnalysis {
  sustainedGrowth: number;
  rssGrowthRate: number;
  heapGrowthRate: number;
  isLinearGrowth: boolean;
}

interface LeakDetectionStats {
  isTracking: boolean;
  historyLength: number;
  trackedObjectTypes: number;
  thresholds: LeakThresholds;
  lastAnalysis: Date | null;
}
