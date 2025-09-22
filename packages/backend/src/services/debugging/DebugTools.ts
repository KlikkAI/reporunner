/**
 * Debug Tools and Development Utilities
 * Provides debugging capabilities for development and troubleshooting
 */

import { logger } from "../logging/Logger.js";
import { performanceMonitor } from "../monitoring/PerformanceMonitor.js";
import { errorTracker } from "../monitoring/ErrorTracker.js";
import fs from "fs";
import path from "path";

export interface DebugSession {
  id: string;
  startTime: number;
  endTime?: number;
  context: Record<string, any>;
  events: DebugEvent[];
  metadata: Record<string, any>;
}

export interface DebugEvent {
  timestamp: number;
  type: "log" | "error" | "performance" | "database" | "custom";
  level: "debug" | "info" | "warn" | "error";
  message: string;
  data: any;
  stackTrace?: string;
}

export interface DebugSnapshot {
  timestamp: number;
  memory: NodeJS.MemoryUsage;
  cpuUsage: NodeJS.CpuUsage;
  eventLoopLag: number;
  activeHandles: number;
  activeRequests: number;
  uptime: number;
  environment: Record<string, any>;
  custom: Record<string, any>;
}

export interface WorkflowDebugInfo {
  workflowId: string;
  executionId: string;
  currentNode?: string;
  nodeStates: Record<string, any>;
  edgeStates: Record<string, any>;
  variables: Record<string, any>;
  executionLog: Array<{
    timestamp: number;
    nodeId: string;
    action: string;
    data: any;
    duration?: number;
    error?: string;
  }>;
}

class DebugToolsService {
  private activeSessions: Map<string, DebugSession> = new Map();
  private globalDebugMode: boolean = false;
  private debugHooks: Map<string, Function[]> = new Map();
  private memoryLeakDetector?: NodeJS.Timeout;
  private performanceProfiler: Map<string, any> = new Map();

  constructor() {
    this.setupDebugEnvironment();
  }

  // Debug session management
  public startDebugSession(context: Record<string, any> = {}): string {
    const sessionId = `debug_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const session: DebugSession = {
      id: sessionId,
      startTime: Date.now(),
      context,
      events: [],
      metadata: {
        nodeVersion: process.version,
        platform: process.platform,
        pid: process.pid,
      },
    };

    this.activeSessions.set(sessionId, session);

    this.addDebugEvent(sessionId, {
      timestamp: Date.now(),
      type: "log",
      level: "info",
      message: "Debug session started",
      data: { sessionId, context },
    });

    logger.debug("Debug session started", {
      sessionId,
      context,
      component: "debug-tools",
    });

    return sessionId;
  }

  public endDebugSession(sessionId: string): DebugSession | null {
    const session = this.activeSessions.get(sessionId);
    if (!session) return null;

    session.endTime = Date.now();

    this.addDebugEvent(sessionId, {
      timestamp: Date.now(),
      type: "log",
      level: "info",
      message: "Debug session ended",
      data: {
        duration: session.endTime - session.startTime,
        eventCount: session.events.length,
      },
    });

    logger.debug("Debug session ended", {
      sessionId,
      duration: session.endTime - session.startTime,
      eventCount: session.events.length,
      component: "debug-tools",
    });

    return session;
  }

  public addDebugEvent(sessionId: string, event: DebugEvent): void {
    const session = this.activeSessions.get(sessionId);
    if (!session) return;

    session.events.push(event);

    // Trigger debug hooks
    const hooks = this.debugHooks.get(event.type) || [];
    hooks.forEach((hook) => {
      try {
        hook(event, session);
      } catch (error) {
        logger.warn("Debug hook failed", {
          sessionId,
          hookType: event.type,
          error: error instanceof Error ? error.message : String(error),
          component: "debug-tools",
        });
      }
    });
  }

  // Performance profiling
  public startProfiling(
    name: string,
    options: { sampleInterval?: number; duration?: number } = {},
  ): string {
    const profileId = `profile_${name}_${Date.now()}`;

    const profile: any = {
      id: profileId,
      name,
      startTime: Date.now(),
      samples: [] as any[],
      options,
    };

    this.performanceProfiler.set(profileId, profile);

    // Start sampling if interval specified
    if (options.sampleInterval) {
      const sampleInterval = setInterval(() => {
        const sample = this.takePerfomanceSample();
        profile.samples.push(sample);
      }, options.sampleInterval);

      // Auto-stop after duration
      if (options.duration) {
        setTimeout(() => {
          clearInterval(sampleInterval);
          this.stopProfiling(profileId);
        }, options.duration);
      }

      profile.sampleInterval = sampleInterval;
    }

    logger.debug("Performance profiling started", {
      profileId,
      name,
      options,
      component: "debug-tools",
    });

    return profileId;
  }

  public stopProfiling(profileId: string): any | null {
    const profile = this.performanceProfiler.get(profileId);
    if (!profile) return null;

    profile.endTime = Date.now();
    profile.duration = profile.endTime - profile.startTime;

    if (profile.sampleInterval) {
      clearInterval(profile.sampleInterval);
    }

    this.performanceProfiler.delete(profileId);

    logger.debug("Performance profiling stopped", {
      profileId,
      duration: profile.duration,
      sampleCount: profile.samples.length,
      component: "debug-tools",
    });

    return profile;
  }

  private takePerfomanceSample(): DebugSnapshot {
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();

    return {
      timestamp: Date.now(),
      memory: memoryUsage,
      cpuUsage,
      eventLoopLag: 0, // Would measure actual event loop lag
      activeHandles: (process as any)._getActiveHandles().length,
      activeRequests: (process as any)._getActiveRequests().length,
      uptime: process.uptime(),
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
      },
      custom: {},
    };
  }

  // Memory leak detection
  public startMemoryLeakDetection(interval: number = 30000): void {
    if (this.memoryLeakDetector) {
      clearInterval(this.memoryLeakDetector);
    }

    const memoryHistory: Array<{
      timestamp: number;
      memory: NodeJS.MemoryUsage;
    }> = [];

    this.memoryLeakDetector = setInterval(() => {
      const memory = process.memoryUsage();
      const timestamp = Date.now();

      memoryHistory.push({ timestamp, memory });

      // Keep only last 20 samples
      if (memoryHistory.length > 20) {
        memoryHistory.shift();
      }

      // Analyze trend
      if (memoryHistory.length >= 10) {
        const trend = this.analyzeMemoryTrend(memoryHistory);
        if (trend.isIncreasing && trend.rate > 1024 * 1024) {
          // 1MB/sample increase
          logger.warn("Potential memory leak detected", {
            trend,
            currentMemory: memory,
            component: "debug-tools",
          });

          // Take detailed snapshot
          this.takeMemorySnapshot("memory-leak-detection");
        }
      }
    }, interval);
  }

  public stopMemoryLeakDetection(): void {
    if (this.memoryLeakDetector) {
      clearInterval(this.memoryLeakDetector);
      this.memoryLeakDetector = undefined;
    }
  }

  private analyzeMemoryTrend(
    history: Array<{ timestamp: number; memory: NodeJS.MemoryUsage }>,
  ): {
    isIncreasing: boolean;
    rate: number;
    confidence: number;
  } {
    if (history.length < 2) {
      return { isIncreasing: false, rate: 0, confidence: 0 };
    }

    let increases = 0;
    let totalIncrease = 0;

    for (let i = 1; i < history.length; i++) {
      const diff = history[i].memory.heapUsed - history[i - 1].memory.heapUsed;
      if (diff > 0) {
        increases++;
        totalIncrease += diff;
      }
    }

    const confidence = increases / (history.length - 1);
    const averageRate = totalIncrease / history.length;

    return {
      isIncreasing: confidence > 0.7, // 70% of samples show increase
      rate: averageRate,
      confidence,
    };
  }

  // Memory snapshots
  public takeMemorySnapshot(name: string): string {
    const snapshotId = `snapshot_${name}_${Date.now()}`;

    const snapshot = {
      id: snapshotId,
      name,
      timestamp: Date.now(),
      memory: process.memoryUsage(),
      heap: this.analyzeHeap(),
      gc: this.getGCStats(),
      activeHandles: (process as any)._getActiveHandles().length,
      activeRequests: (process as any)._getActiveRequests().length,
    };

    // Save snapshot to file in debug mode
    if (this.globalDebugMode) {
      this.saveSnapshotToFile(snapshot);
    }

    logger.debug("Memory snapshot taken", {
      snapshotId,
      name,
      memory: snapshot.memory,
      component: "debug-tools",
    });

    return snapshotId;
  }

  private analyzeHeap(): any {
    // Basic heap analysis - in production, you might use v8.getHeapSnapshot()
    const memory = process.memoryUsage();
    return {
      used: memory.heapUsed,
      total: memory.heapTotal,
      percentage: (memory.heapUsed / memory.heapTotal) * 100,
      external: memory.external,
    };
  }

  private getGCStats(): any {
    // GC stats would be more detailed with --expose-gc flag
    return {
      enabled: typeof global.gc === "function",
      lastCollection: Date.now(), // Would track actual GC events
    };
  }

  private saveSnapshotToFile(snapshot: any): void {
    try {
      const debugDir = path.join(process.cwd(), "debug");
      if (!fs.existsSync(debugDir)) {
        fs.mkdirSync(debugDir, { recursive: true });
      }

      const filename = `${snapshot.id}.json`;
      const filepath = path.join(debugDir, filename);

      fs.writeFileSync(filepath, JSON.stringify(snapshot, null, 2));

      logger.debug("Snapshot saved to file", {
        filepath,
        component: "debug-tools",
      });
    } catch (error) {
      logger.warn("Failed to save snapshot to file", {
        error: error instanceof Error ? error.message : String(error),
        component: "debug-tools",
      });
    }
  }

  // Workflow debugging
  public createWorkflowDebugger(
    workflowId: string,
    executionId: string,
  ): WorkflowDebugger {
    return new WorkflowDebugger(workflowId, executionId, this);
  }

  // Debug hooks
  public addDebugHook(eventType: string, callback: Function): void {
    if (!this.debugHooks.has(eventType)) {
      this.debugHooks.set(eventType, []);
    }
    this.debugHooks.get(eventType)!.push(callback);
  }

  public removeDebugHook(eventType: string, callback: Function): void {
    const hooks = this.debugHooks.get(eventType);
    if (hooks) {
      const index = hooks.indexOf(callback);
      if (index > -1) {
        hooks.splice(index, 1);
      }
    }
  }

  // Debug utilities
  public setGlobalDebugMode(enabled: boolean): void {
    this.globalDebugMode = enabled;
    logger.info(`Global debug mode ${enabled ? "enabled" : "disabled"}`, {
      component: "debug-tools",
    });
  }

  public dumpState(sessionId?: string): any {
    const state: any = {
      timestamp: Date.now(),
      activeSessions: this.activeSessions.size,
      globalDebugMode: this.globalDebugMode,
      memoryUsage: process.memoryUsage(),
      uptime: process.uptime(),
      activeProfiles: this.performanceProfiler.size,
      recentErrors: errorTracker.getErrors({ limit: 10 }),
      recentMetrics: performanceMonitor.getMetrics(
        undefined,
        Date.now() - 60000,
      ), // Last minute
    };

    if (sessionId) {
      state.session = this.activeSessions.get(sessionId);
    }

    return state;
  }

  public exportDebugSession(
    sessionId: string,
    format: "json" | "csv" = "json",
  ): string | null {
    const session = this.activeSessions.get(sessionId);
    if (!session) return null;

    if (format === "json") {
      return JSON.stringify(session, null, 2);
    }

    // CSV export for events
    const headers = ["timestamp", "type", "level", "message", "data"];
    const rows = session.events.map((event) => [
      event.timestamp,
      event.type,
      event.level,
      event.message,
      JSON.stringify(event.data),
    ]);

    return [headers, ...rows].map((row) => row.join(",")).join("\n");
  }

  // Express middleware for debugging
  public createDebugMiddleware() {
    return (req: any, res: any, next: any) => {
      if (!this.globalDebugMode) {
        return next();
      }

      const sessionId = this.startDebugSession({
        requestId: req.id,
        method: req.method,
        url: req.originalUrl,
        userId: req.user?.id,
      });

      req.debugSession = sessionId;

      // Log request details
      this.addDebugEvent(sessionId, {
        timestamp: Date.now(),
        type: "log",
        level: "debug",
        message: "HTTP request received",
        data: {
          method: req.method,
          url: req.originalUrl,
          headers: req.headers,
          query: req.query,
          body: req.body,
        },
      });

      // Intercept response
      const originalSend = res.send;
      res.send = function (data: any) {
        if (req.debugSession) {
          debugTools.addDebugEvent(req.debugSession, {
            timestamp: Date.now(),
            type: "log",
            level: "debug",
            message: "HTTP response sent",
            data: {
              statusCode: res.statusCode,
              headers: res.getHeaders(),
              body: data,
            },
          });

          debugTools.endDebugSession(req.debugSession);
        }

        return originalSend.call(this, data);
      };

      next();
    };
  }

  // Setup and cleanup
  private setupDebugEnvironment(): void {
    // Set up global error tracking for debug mode
    this.addDebugHook("error", (event: DebugEvent, session: DebugSession) => {
      if (event.level === "error") {
        console.error(
          `[DEBUG SESSION ${session.id}] ${event.message}`,
          event.data,
        );
      }
    });

    // Check for debug environment variables
    if (process.env.DEBUG_MODE === "true") {
      this.setGlobalDebugMode(true);
    }

    if (process.env.MEMORY_LEAK_DETECTION === "true") {
      this.startMemoryLeakDetection();
    }
  }

  public stop(): void {
    this.stopMemoryLeakDetection();
    this.activeSessions.clear();
    this.debugHooks.clear();
    this.performanceProfiler.clear();
  }
}

// Workflow-specific debugger
export class WorkflowDebugger {
  private info: WorkflowDebugInfo;

  constructor(
    workflowId: string,
    executionId: string,
    private debugTools: DebugToolsService,
  ) {
    this.info = {
      workflowId,
      executionId,
      nodeStates: {},
      edgeStates: {},
      variables: {},
      executionLog: [],
    };
  }

  public logNodeExecution(
    nodeId: string,
    action: string,
    data: any,
    duration?: number,
    error?: string,
  ): void {
    this.info.executionLog.push({
      timestamp: Date.now(),
      nodeId,
      action,
      data,
      duration,
      error,
    });

    this.info.currentNode = nodeId;
  }

  public setNodeState(nodeId: string, state: any): void {
    this.info.nodeStates[nodeId] = state;
  }

  public setVariable(name: string, value: any): void {
    this.info.variables[name] = value;
  }

  public getDebugInfo(): WorkflowDebugInfo {
    return { ...this.info };
  }

  public exportLog(): string {
    return JSON.stringify(this.info, null, 2);
  }
}

// Export singleton instance
export const debugTools = new DebugToolsService();
export default debugTools;
