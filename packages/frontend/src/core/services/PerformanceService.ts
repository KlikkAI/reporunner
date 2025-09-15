/**
 * Performance Monitoring Service for Large-Scale Applications
 *
 * Features:
 * - Real-time performance metrics collection
 * - React component render time tracking
 * - Bundle size monitoring
 * - User interaction performance
 * - Memory usage tracking
 * - Network performance monitoring
 * - Core Web Vitals tracking
 */

import { configService } from './ConfigService'
import { logger } from './LoggingService'

export interface PerformanceMetric {
  name: string
  value: number
  unit: 'ms' | 'bytes' | 'count' | 'ratio'
  timestamp: number
  context?: Record<string, any>
}

export interface WebVital {
  name: 'CLS' | 'FID' | 'FCP' | 'LCP' | 'TTFB'
  value: number
  rating: 'good' | 'needs-improvement' | 'poor'
  timestamp: number
}

export interface ComponentPerformance {
  componentName: string
  renderTime: number
  propsSize: number
  updateCount: number
  timestamp: number
}

class PerformanceMonitoringService {
  private metrics: PerformanceMetric[] = []
  private webVitals: WebVital[] = []
  private componentMetrics: ComponentPerformance[] = []
  private observer: PerformanceObserver | null = null
  private memoryInterval: NodeJS.Timeout | null = null

  constructor() {
    if (!configService.isFeatureEnabled('enablePerformanceMonitoring')) {
      return
    }

    this.initializePerformanceObserver()
    this.trackCoreWebVitals()
    this.monitorMemoryUsage()
    this.trackNavigationTiming()
    this.monitorLongTasks()

    logger.info('Performance monitoring service initialized')
  }

  /**
   * Track a custom performance metric
   */
  trackMetric(
    name: string,
    value: number,
    unit: 'ms' | 'bytes' | 'count' | 'ratio' = 'ms',
    context?: Record<string, any>
  ): void {
    const metric: PerformanceMetric = {
      name,
      value,
      unit,
      timestamp: performance.now(),
      context: context || {},
    }

    this.metrics.push(metric)
    logger.logPerformance(
      name,
      value,
      unit as 'ms' | 'bytes' | 'count',
      context
    )

    // Check if metric exceeds threshold
    this.checkThresholds(metric)

    // Keep only recent metrics in memory
    this.pruneOldMetrics()
  }

  /**
   * Track React component render performance
   */
  trackComponentRender(
    componentName: string,
    renderStart: number,
    renderEnd: number,
    props?: any
  ): void {
    const renderTime = renderEnd - renderStart
    const propsSize = props ? JSON.stringify(props).length : 0

    const componentMetric: ComponentPerformance = {
      componentName,
      renderTime,
      propsSize,
      updateCount: 1,
      timestamp: performance.now(),
    }

    this.componentMetrics.push(componentMetric)

    // Log slow renders
    const threshold = configService.getConfig().performance.renderTimeThreshold
    if (renderTime > threshold) {
      logger.warn(`Slow component render: ${componentName}`, {
        renderTime,
        propsSize,
        threshold,
      })
    }

    this.pruneComponentMetrics()
  }

  /**
   * Track user interaction performance
   */
  trackInteraction(
    interactionType: string,
    target: string,
    duration: number
  ): void {
    this.trackMetric(`interaction_${interactionType}`, duration, 'ms', {
      target,
      type: 'user_interaction',
    })

    // Track interaction to next paint (INP)
    if (duration > 200) {
      logger.warn('Slow user interaction detected', {
        interactionType,
        target,
        duration,
      })
    }
  }

  /**
   * Track API request performance
   */
  trackApiRequest(
    url: string,
    method: string,
    duration: number,
    size?: number
  ): void {
    this.trackMetric('api_request_duration', duration, 'ms', {
      url,
      method,
      size,
    })

    if (size) {
      this.trackMetric('api_response_size', size, 'bytes', {
        url,
        method,
      })
    }
  }

  /**
   * Track bundle loading performance
   */
  trackBundleLoad(chunkName: string, loadTime: number, size: number): void {
    this.trackMetric('bundle_load_time', loadTime, 'ms', {
      chunkName,
      size,
    })

    this.trackMetric('bundle_size', size, 'bytes', {
      chunkName,
    })

    // Check bundle size warning threshold
    const threshold =
      configService.getConfig().performance.bundleSizeWarningThreshold
    if (size > threshold) {
      logger.warn(`Large bundle detected: ${chunkName}`, {
        size,
        threshold,
        loadTime,
      })
    }
  }

  /**
   * Get performance summary
   */
  getPerformanceSummary(): {
    averageRenderTime: number
    slowComponents: string[]
    memoryUsage: number
    webVitals: WebVital[]
    totalMetrics: number
  } {
    const renderTimes = this.componentMetrics.map(m => m.renderTime)
    const averageRenderTime =
      renderTimes.length > 0
        ? renderTimes.reduce((a, b) => a + b, 0) / renderTimes.length
        : 0

    const threshold = configService.getConfig().performance.renderTimeThreshold
    const slowComponents = this.componentMetrics
      .filter(m => m.renderTime > threshold)
      .map(m => m.componentName)
      .filter((name, index, array) => array.indexOf(name) === index) // unique

    const memoryUsage = this.getCurrentMemoryUsage()

    return {
      averageRenderTime,
      slowComponents,
      memoryUsage,
      webVitals: [...this.webVitals],
      totalMetrics: this.metrics.length,
    }
  }

  /**
   * Initialize Performance Observer
   */
  private initializePerformanceObserver(): void {
    if (!('PerformanceObserver' in window)) {
      logger.warn('PerformanceObserver not supported')
      return
    }

    try {
      this.observer = new PerformanceObserver(list => {
        list.getEntries().forEach(entry => {
          this.processPerformanceEntry(entry)
        })
      })

      // Observe various performance entry types
      this.observer.observe({
        entryTypes: [
          'navigation',
          'resource',
          'measure',
          'long-task',
          'layout-shift',
          'paint',
        ],
      })
    } catch (error) {
      logger.error(
        'Failed to initialize PerformanceObserver',
        error instanceof Error ? { message: error.message } : {}
      )
    }
  }

  /**
   * Process performance entry
   */
  private processPerformanceEntry(entry: PerformanceEntry): void {
    switch (entry.entryType) {
      case 'navigation':
        this.processNavigationEntry(entry as PerformanceNavigationTiming)
        break
      case 'resource':
        this.processResourceEntry(entry as PerformanceResourceTiming)
        break
      case 'measure':
        this.processMeasureEntry(entry)
        break
      case 'long-task':
        this.processLongTaskEntry(entry)
        break
      case 'layout-shift':
        this.processLayoutShiftEntry(entry as any) // CLS
        break
      case 'paint':
        this.processPaintEntry(entry)
        break
    }
  }

  /**
   * Process navigation timing
   */
  private processNavigationEntry(entry: PerformanceNavigationTiming): void {
    this.trackMetric(
      'navigation_total',
      entry.loadEventEnd - entry.fetchStart,
      'ms'
    )
    this.trackMetric(
      'navigation_dns',
      entry.domainLookupEnd - entry.domainLookupStart,
      'ms'
    )
    this.trackMetric(
      'navigation_tcp',
      entry.connectEnd - entry.connectStart,
      'ms'
    )
    this.trackMetric(
      'navigation_request',
      entry.responseStart - entry.requestStart,
      'ms'
    )
    this.trackMetric(
      'navigation_response',
      entry.responseEnd - entry.responseStart,
      'ms'
    )
    this.trackMetric(
      'navigation_dom',
      entry.domContentLoadedEventEnd - entry.responseEnd,
      'ms'
    )
  }

  /**
   * Process resource timing
   */
  private processResourceEntry(entry: PerformanceResourceTiming): void {
    const duration = entry.responseEnd - entry.fetchStart

    if (entry.name.includes('.js') || entry.name.includes('.css')) {
      this.trackMetric('resource_load', duration, 'ms', {
        name: entry.name,
        type: entry.name.includes('.js') ? 'script' : 'stylesheet',
        size: entry.transferSize,
      })
    }
  }

  /**
   * Process measure entry
   */
  private processMeasureEntry(entry: PerformanceEntry): void {
    this.trackMetric(`measure_${entry.name}`, entry.duration, 'ms')
  }

  /**
   * Process long task entry
   */
  private processLongTaskEntry(entry: PerformanceEntry): void {
    logger.warn('Long task detected', {
      duration: entry.duration,
      startTime: entry.startTime,
    })

    this.trackMetric('long_task', entry.duration, 'ms')
  }

  /**
   * Process layout shift entry (CLS)
   */
  private processLayoutShiftEntry(entry: any): void {
    if (!entry.hadRecentInput) {
      this.trackMetric('cumulative_layout_shift', entry.value, 'ratio')

      const rating =
        entry.value < 0.1
          ? 'good'
          : entry.value < 0.25
            ? 'needs-improvement'
            : 'poor'

      this.webVitals.push({
        name: 'CLS',
        value: entry.value,
        rating,
        timestamp: performance.now(),
      })
    }
  }

  /**
   * Process paint entry
   */
  private processPaintEntry(entry: PerformanceEntry): void {
    if (entry.name === 'first-contentful-paint') {
      const rating =
        entry.startTime < 1800
          ? 'good'
          : entry.startTime < 3000
            ? 'needs-improvement'
            : 'poor'

      this.webVitals.push({
        name: 'FCP',
        value: entry.startTime,
        rating,
        timestamp: performance.now(),
      })
    }
  }

  /**
   * Track Core Web Vitals
   */
  private trackCoreWebVitals(): void {
    // Track First Input Delay (FID)
    if ('PerformanceEventTiming' in window) {
      const observer = new PerformanceObserver(list => {
        list.getEntries().forEach(entry => {
          if (entry.entryType === 'first-input') {
            const fid = (entry as any).processingStart - entry.startTime
            const rating =
              fid < 100 ? 'good' : fid < 300 ? 'needs-improvement' : 'poor'

            this.webVitals.push({
              name: 'FID',
              value: fid,
              rating,
              timestamp: performance.now(),
            })
          }
        })
      })

      observer.observe({ type: 'first-input', buffered: true })
    }

    // Track Largest Contentful Paint (LCP)
    if ('PerformanceObserver' in window && 'PerformanceEntry' in window) {
      const observer = new PerformanceObserver(list => {
        const entries = list.getEntries()
        const lastEntry = entries[entries.length - 1]

        if (lastEntry) {
          const rating =
            lastEntry.startTime < 2500
              ? 'good'
              : lastEntry.startTime < 4000
                ? 'needs-improvement'
                : 'poor'

          this.webVitals.push({
            name: 'LCP',
            value: lastEntry.startTime,
            rating,
            timestamp: performance.now(),
          })
        }
      })

      observer.observe({ type: 'largest-contentful-paint', buffered: true })
    }
  }

  /**
   * Monitor memory usage
   */
  private monitorMemoryUsage(): void {
    if (!('memory' in performance)) {
      return
    }

    this.memoryInterval = setInterval(() => {
      const memory = this.getCurrentMemoryUsage()
      this.trackMetric('memory_usage', memory, 'bytes')

      // Warn if memory usage is high
      if (memory > 100 * 1024 * 1024) {
        // 100MB
        logger.warn('High memory usage detected', { memory })
      }
    }, 30000) // Check every 30 seconds
  }

  /**
   * Get current memory usage
   */
  private getCurrentMemoryUsage(): number {
    if ('memory' in performance) {
      return (performance as any).memory.usedJSHeapSize || 0
    }
    return 0
  }

  /**
   * Track navigation timing on page load
   */
  private trackNavigationTiming(): void {
    window.addEventListener('load', () => {
      setTimeout(() => {
        const navigation = performance.getEntriesByType(
          'navigation'
        )[0] as PerformanceNavigationTiming
        if (navigation) {
          this.processNavigationEntry(navigation)
        }
      }, 0)
    })
  }

  /**
   * Monitor long tasks
   */
  private monitorLongTasks(): void {
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver(list => {
          list.getEntries().forEach(entry => {
            this.processLongTaskEntry(entry)
          })
        })

        observer.observe({ type: 'longtask', buffered: true })
      } catch (error) {
        // Long task observer not supported
      }
    }
  }

  /**
   * Check if metrics exceed thresholds
   */
  private checkThresholds(metric: PerformanceMetric): void {
    // Example threshold checks
    if (metric.name === 'api_request_duration' && metric.value > 5000) {
      logger.warn('Slow API request detected', {
        name: metric.name,
        value: metric.value,
        unit: metric.unit,
        timestamp: metric.timestamp.toString(),
      })
    }

    if (metric.name === 'bundle_load_time' && metric.value > 3000) {
      logger.warn('Slow bundle loading detected', {
        name: metric.name,
        value: metric.value,
        unit: metric.unit,
        timestamp: metric.timestamp.toString(),
      })
    }
  }

  /**
   * Prune old metrics to prevent memory leaks
   */
  private pruneOldMetrics(): void {
    const maxAge = 5 * 60 * 1000 // 5 minutes
    const now = performance.now()

    this.metrics = this.metrics.filter(
      metric => now - metric.timestamp < maxAge
    )
  }

  /**
   * Prune old component metrics
   */
  private pruneComponentMetrics(): void {
    const maxAge = 2 * 60 * 1000 // 2 minutes
    const now = performance.now()

    this.componentMetrics = this.componentMetrics.filter(
      metric => now - metric.timestamp < maxAge
    )
  }

  /**
   * Get metrics for a specific time range
   */
  getMetricsInRange(startTime: number, endTime: number): PerformanceMetric[] {
    return this.metrics.filter(
      metric => metric.timestamp >= startTime && metric.timestamp <= endTime
    )
  }

  /**
   * Export metrics for external analysis
   */
  exportMetrics(): {
    metrics: PerformanceMetric[]
    webVitals: WebVital[]
    componentMetrics: ComponentPerformance[]
    summary: any
  } {
    return {
      metrics: [...this.metrics],
      webVitals: [...this.webVitals],
      componentMetrics: [...this.componentMetrics],
      summary: this.getPerformanceSummary(),
    }
  }

  /**
   * Clear all metrics (for testing or privacy)
   */
  clearMetrics(): void {
    this.metrics = []
    this.webVitals = []
    this.componentMetrics = []
  }

  /**
   * Cleanup on destroy
   */
  destroy(): void {
    if (this.observer) {
      this.observer.disconnect()
      this.observer = null
    }

    if (this.memoryInterval) {
      clearInterval(this.memoryInterval)
      this.memoryInterval = null
    }
  }
}

// Export singleton instance
export const performanceService = new PerformanceMonitoringService()

// Export types and class for testing
export { PerformanceMonitoringService }
export default performanceService
