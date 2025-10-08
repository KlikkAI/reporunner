import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

export interface TurboTaskMetrics {
  task: string;
  package: string;
  hash: string;
  duration: number;
  cached: boolean;
  dependencies: string[];
}

export interface TurboCacheStats {
  totalTasks: number;
  cachedTasks: number;
  hitRate: number;
  timeSaved: number;
}

export interface TurboRunSummary {
  tasks: TurboTaskMetrics[];
  cacheStats: TurboCacheStats;
  totalDuration: number;
  parallelism: number;
}

export class TurboMetricsCollector {
  private readonly turboDir = '.turbo';
  private readonly runDir = join(this.turboDir, 'runs');

  /**
   * Executes a Turbo command and collects detailed metrics
   */
  async runWithMetrics(
    command: string[],
    options: { cwd?: string } = {}
  ): Promise<TurboRunSummary> {
    const startTime = Date.now();

    // Add --summarize flag to get detailed output
    const enhancedCommand = [...command, '--summarize'];

    return new Promise((resolve, reject) => {
      const childProcess = spawn('turbo', enhancedCommand, {
        stdio: 'pipe',
        cwd: options.cwd || process.cwd(),
        env: { ...process.env, TURBO_TELEMETRY_DISABLED: '1' },
      });

      let stdout = '';
      let stderr = '';

      childProcess.stdout?.on('data', (data: Buffer) => {
        stdout += data.toString();
      });

      childProcess.stderr?.on('data', (data: Buffer) => {
        stderr += data.toString();
      });

      childProcess.on('close', async (code: number | null) => {
        const endTime = Date.now();
        const totalDuration = endTime - startTime;

        if (code === 0) {
          try {
            const summary = await this.parseTurboOutput(stdout, totalDuration);
            resolve(summary);
          } catch (error) {
            reject(new Error(`Failed to parse Turbo output: ${error}`));
          }
        } else {
          reject(new Error(`Turbo command failed with code ${code}: ${stderr}`));
        }
      });

      process.on('error', reject);
    });
  }

  /**
   * Gets the latest run summary from Turbo's run directory
   */
  async getLatestRunSummary(): Promise<TurboRunSummary | null> {
    try {
      if (!existsSync(this.runDir)) {
        return null;
      }

      // Find the most recent run summary file
      const runFiles = await this.getRunFiles();
      if (runFiles.length === 0) {
        return null;
      }

      const latestFile = runFiles[runFiles.length - 1];
      const summaryPath = join(this.runDir, latestFile);

      const summaryData = await readFile(summaryPath, 'utf-8');
      return this.parseTurboSummary(JSON.parse(summaryData));
    } catch (_error) {
      return null;
    }
  }

  /**
   * Calculates cache effectiveness metrics
   */
  calculateCacheEffectiveness(summary: TurboRunSummary): {
    hitRate: number;
    timeSaved: number;
    efficiency: number;
    recommendations: string[];
  } {
    const { cacheStats, tasks } = summary;
    const recommendations: string[] = [];

    // Calculate efficiency based on cache hits and time saved
    const efficiency = cacheStats.hitRate * (cacheStats.timeSaved / summary.totalDuration);

    // Generate recommendations based on cache performance
    if (cacheStats.hitRate < 0.5) {
      recommendations.push('Low cache hit rate - review cache key configuration');
      recommendations.push('Consider enabling remote caching for better hit rates');
    }

    if (cacheStats.hitRate > 0.8 && cacheStats.timeSaved < summary.totalDuration * 0.3) {
      recommendations.push('High hit rate but low time savings - optimize cache granularity');
    }

    // Identify tasks that should be cached but aren\'t
    const uncachedLongTasks = tasks
      .filter((task) => !task.cached && task.duration > 5000)
      .map((task) => task.task);

    if (uncachedLongTasks.length > 0) {
      recommendations.push(`Consider caching long-running tasks: ${uncachedLongTasks.join(', ')}`);
    }

    return {
      hitRate: cacheStats.hitRate,
      timeSaved: cacheStats.timeSaved,
      efficiency,
      recommendations,
    };
  }

  /**
   * Analyzes build parallelism and identifies optimization opportunities
   */
  analyzeParallelism(summary: TurboRunSummary): {
    efficiency: number;
    bottlenecks: string[];
    recommendations: string[];
  } {
    const { tasks, totalDuration } = summary;
    const recommendations: string[] = [];
    const bottlenecks: string[] = [];

    // Calculate theoretical minimum time (longest dependency chain)
    const criticalPath = this.calculateCriticalPath(tasks);
    const theoreticalMinTime = criticalPath.reduce((sum, task) => sum + task.duration, 0);

    // Parallelism efficiency
    const efficiency = theoreticalMinTime / totalDuration;

    // Identify bottlenecks (tasks that significantly impact critical path)
    const longTasks = tasks
      .filter((task) => task.duration > totalDuration * 0.1)
      .sort((a, b) => b.duration - a.duration);

    for (const task of longTasks.slice(0, 3)) {
      bottlenecks.push(`${task.package}:${task.task} (${(task.duration / 1000).toFixed(1)}s)`);
    }

    // Generate recommendations
    if (efficiency < 0.6) {
      recommendations.push('Low parallelism efficiency - review task dependencies');
      recommendations.push('Consider breaking down large tasks into smaller parallel units');
    }

    if (longTasks.length > 0) {
      recommendations.push('Optimize bottleneck tasks to improve overall build time');
    }

    // Check for unnecessary dependencies
    const unnecessaryDeps = this.findUnnecessaryDependencies(tasks);
    if (unnecessaryDeps.length > 0) {
      recommendations.push(
        `Review potentially unnecessary dependencies: ${unnecessaryDeps.join(', ')}`
      );
    }

    return {
      efficiency,
      bottlenecks,
      recommendations,
    };
  }

  private async parseTurboOutput(output: string, totalDuration: number): Promise<TurboRunSummary> {
    // Parse Turbo's output to extract task information
    const lines = output.split('\n');
    const tasks: TurboTaskMetrics[] = [];
    let cachedTasks = 0;
    let totalTasks = 0;

    for (const line of lines) {
      // Parse task execution lines
      const taskMatch = line.match(/^(.+?):(.+?)\s+(\d+(?:\.\d+)?[ms]+)\s*(CACHED)?/);
      if (taskMatch) {
        const [, packageName, taskName, durationStr, cached] = taskMatch;
        const duration = this.parseDuration(durationStr);

        tasks.push({
          task: taskName.trim(),
          package: packageName.trim(),
          hash: '', // Would need to extract from detailed output
          duration,
          cached: !!cached,
          dependencies: [], // Would need dependency graph analysis
        });

        totalTasks++;
        if (cached) {
          cachedTasks++;
        }
      }
    }

    const hitRate = totalTasks > 0 ? cachedTasks / totalTasks : 0;
    const timeSaved = tasks
      .filter((task) => task.cached)
      .reduce((sum, task) => sum + task.duration, 0);

    return {
      tasks,
      cacheStats: {
        totalTasks,
        cachedTasks,
        hitRate,
        timeSaved,
      },
      totalDuration,
      parallelism: this.calculateParallelism(tasks, totalDuration),
    };
  }

  private parseTurboSummary(summaryData: any): TurboRunSummary {
    // Parse Turbo's JSON summary format
    const tasks: TurboTaskMetrics[] = [];

    if (summaryData.tasks) {
      for (const [taskId, taskData] of Object.entries(summaryData.tasks as any)) {
        const [packageName, taskName] = taskId.split('#');
        const task = taskData as any;

        tasks.push({
          task: taskName,
          package: packageName,
          hash: task.hash || '',
          duration: task.execution?.duration || 0,
          cached: task.cache?.status === 'HIT',
          dependencies: task.dependencies || [],
        });
      }
    }

    const cachedTasks = tasks.filter((task) => task.cached).length;
    const hitRate = tasks.length > 0 ? cachedTasks / tasks.length : 0;
    const timeSaved = tasks
      .filter((task) => task.cached)
      .reduce((sum, task) => sum + task.duration, 0);

    return {
      tasks,
      cacheStats: {
        totalTasks: tasks.length,
        cachedTasks,
        hitRate,
        timeSaved,
      },
      totalDuration: summaryData.execution?.duration || 0,
      parallelism: this.calculateParallelism(tasks, summaryData.execution?.duration || 0),
    };
  }

  private parseDuration(durationStr: string): number {
    const match = durationStr.match(/(\d+(?:\.\d+)?)(ms|s|m)/);
    if (!match) {
      return 0;
    }

    const [, value, unit] = match;
    const numValue = Number.parseFloat(value);

    switch (unit) {
      case 'ms':
        return numValue;
      case 's':
        return numValue * 1000;
      case 'm':
        return numValue * 60 * 1000;
      default:
        return numValue;
    }
  }

  private calculateParallelism(tasks: TurboTaskMetrics[], totalDuration: number): number {
    if (totalDuration === 0) {
      return 0;
    }

    const totalTaskTime = tasks.reduce((sum, task) => sum + task.duration, 0);
    return totalTaskTime / totalDuration;
  }

  private calculateCriticalPath(tasks: TurboTaskMetrics[]): TurboTaskMetrics[] {
    // Simplified critical path calculation
    // In a real implementation, this would use the dependency graph
    return tasks.sort((a, b) => b.duration - a.duration).slice(0, 5);
  }

  private findUnnecessaryDependencies(tasks: TurboTaskMetrics[]): string[] {
    // Analyze dependency patterns to find potentially unnecessary dependencies
    // This is a simplified implementation
    const dependencies: string[] = [];

    // Look for tasks that might not need all their dependencies
    for (const task of tasks) {
      if (task.dependencies.length > 3) {
        dependencies.push(`${task.package}:${task.task}`);
      }
    }

    return dependencies.slice(0, 3); // Limit to top 3
  }

  private async getRunFiles(): Promise<string[]> {
    try {
      const { readdir } = await import('node:fs/promises');
      const files = await readdir(this.runDir);
      return files.filter((file) => file.endsWith('.json')).sort();
    } catch {
      return [];
    }
  }
}
