
import { readdir, readFile, stat } from 'node:fs/promises';
import { basename, extname, join } from 'node:path';
import { gzipSync } from 'node:zlib';

export interface BundleFile {
  path: string;
  name: string;
  size: number;
  gzipSize: number;
  type: 'js' | 'css' | 'asset' | 'other';
  isChunk: boolean;
  isVendor: boolean;
}

export interface BundleMetrics {
  totalSize: number;
  totalGzipSize: number;
  jsSize: number;
  cssSize: number;
  assetSize: number;
  chunkCount: number;
  vendorSize: number;
  appSize: number;
  files: BundleFile[];
  timestamp: Date;
}

export interface BundleSizeComparison {
  current: BundleMetrics;
  baseline?: BundleMetrics;
  improvement: {
    totalSizeReduction: number;
    totalSizeReductionPercent: number;
    gzipSizeReduction: number;
    gzipSizeReductionPercent: number;
    jsSizeReduction: number;
    cssSizeReduction: number;
  };
  meetsTarget: boolean;
  targetReduction: number; // 20% target from requirements
}

export interface BundleOptimization {
  type: 'duplicate-dependencies' | 'large-chunks' | 'unused-code' | 'compression' | 'tree-shaking';
  severity: 'high' | 'medium' | 'low';
  description: string;
  impact: string;
  recommendation: string;
  estimatedSavings: number;
  files?: string[];
}

export interface BundleAnalysisReport {
  metrics: BundleMetrics;
  comparison?: BundleSizeComparison;
  optimizations: BundleOptimization[];
  summary: {
    status: 'success' | 'warning' | 'failure';
    message: string;
    meetsRequirements: boolean;
  };
}

export class BundleSizeAnalyzer {
  private readonly distPath: string;
  private readonly baselinePath: string;
  private readonly targetReduction = 20; // 20% reduction target from requirements

  constructor(
    distPath = './packages/frontend/dist',
    baselinePath = './baseline-bundle-metrics.json'
  ) {
    this.distPath = distPath;
    this.baselinePath = baselinePath;
  }

  /**
   * Analyze bundle sizes in the distribution directory
   */
  async analyzeBundleSizes(): Promise<BundleMetrics> {
    try {
      const files = await this.scanDistDirectory();
      const bundleFiles = await Promise.all(
        files.map((filePath) => this.analyzeBundleFile(filePath))
      );

      const metrics: BundleMetrics = {
        totalSize: bundleFiles.reduce((sum, file) => sum + file.size, 0),
        totalGzipSize: bundleFiles.reduce((sum, file) => sum + file.gzipSize, 0),
        jsSize: bundleFiles
          .filter((f) => f.type === 'js')
          .reduce((sum, file) => sum + file.size, 0),
        cssSize: bundleFiles
          .filter((f) => f.type === 'css')
          .reduce((sum, file) => sum + file.size, 0),
        assetSize: bundleFiles
          .filter((f) => f.type === 'asset')
          .reduce((sum, file) => sum + file.size, 0),
        chunkCount: bundleFiles.filter((f) => f.isChunk).length,
        vendorSize: bundleFiles.filter((f) => f.isVendor).reduce((sum, file) => sum + file.size, 0),
        appSize: bundleFiles
          .filter((f) => !f.isVendor && f.type === 'js')
          .reduce((sum, file) => sum + file.size, 0),
        files: bundleFiles,
        timestamp: new Date(),
      };

      return metrics;
    } catch (error) {
      throw new Error(
        `Failed to analyze bundle sizes: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Compare current bundle metrics with baseline
   */
  async compareWithBaseline(currentMetrics: BundleMetrics): Promise<BundleSizeComparison> {
    let baseline: BundleMetrics | undefined;

    try {
      const baselineData = await readFile(this.baselinePath, 'utf-8');
      baseline = JSON.parse(baselineData);
    } catch {
      // Baseline doesn't exist, create it
      await this.saveBaseline(currentMetrics);
    }

    const comparison: BundleSizeComparison = {
      current: currentMetrics,
      baseline,
      improvement: {
        totalSizeReduction: baseline ? baseline.totalSize - currentMetrics.totalSize : 0,
        totalSizeReductionPercent: baseline
          ? ((baseline.totalSize - currentMetrics.totalSize) / baseline.totalSize) * 100
          : 0,
        gzipSizeReduction: baseline ? baseline.totalGzipSize - currentMetrics.totalGzipSize : 0,
        gzipSizeReductionPercent: baseline
          ? ((baseline.totalGzipSize - currentMetrics.totalGzipSize) / baseline.totalGzipSize) * 100
          : 0,
        jsSizeReduction: baseline ? baseline.jsSize - currentMetrics.jsSize : 0,
        cssSizeReduction: baseline ? baseline.cssSize - currentMetrics.cssSize : 0,
      },
      meetsTarget: false,
      targetReduction: this.targetReduction,
    };

    comparison.meetsTarget =
      comparison.improvement.totalSizeReductionPercent >= this.targetReduction;

    return comparison;
  }

  /**
   * Identify bundle optimization opportunities
   */
  async identifyOptimizations(metrics: BundleMetrics): Promise<BundleOptimization[]> {
    const optimizations: BundleOptimization[] = [];

    // Check for large chunks
    const largeChunks = metrics.files.filter(
      (file) => file.isChunk && file.size > 500 * 1024 // > 500KB
    );

    if (largeChunks.length > 0) {
      optimizations.push({
        type: 'large-chunks',
        severity: 'high',
        description: `Found ${largeChunks.length} large chunks that could be split`,
        impact: 'Large chunks can slow initial page load and reduce caching effectiveness',
        recommendation: 'Consider code splitting and dynamic imports to reduce chunk sizes',
        estimatedSavings: largeChunks.reduce(
          (sum, chunk) => sum + Math.max(0, chunk.size - 300 * 1024),
          0
        ),
        files: largeChunks.map((chunk) => chunk.name),
      });
    }

    // Check vendor bundle size
    if (metrics.vendorSize > 300 * 1024) {
      // > 300KB
      optimizations.push({
        type: 'duplicate-dependencies',
        severity: 'medium',
        description: 'Vendor bundle is larger than recommended',
        impact: 'Large vendor bundles increase initial load time',
        recommendation: 'Analyze vendor dependencies for duplicates and consider tree shaking',
        estimatedSavings: Math.max(0, metrics.vendorSize - 250 * 1024),
      });
    }

    // Check compression opportunities
    const uncompressedFiles = metrics.files.filter((file) => {
      const compressionRatio = file.gzipSize / file.size;
      return compressionRatio > 0.7 && file.size > 10 * 1024; // Poor compression ratio and > 10KB
    });

    if (uncompressedFiles.length > 0) {
      optimizations.push({
        type: 'compression',
        severity: 'low',
        description: `${uncompressedFiles.length} files have poor compression ratios`,
        impact: 'Files with poor compression ratios increase transfer size',
        recommendation: 'Consider minification improvements or alternative compression strategies',
        estimatedSavings: uncompressedFiles.reduce(
          (sum, file) => sum + (file.size - file.gzipSize) * 0.3,
          0
        ),
        files: uncompressedFiles.map((file) => file.name),
      });
    }

    // Check for potential tree shaking opportunities
    if (metrics.jsSize > metrics.vendorSize * 0.5) {
      optimizations.push({
        type: 'tree-shaking',
        severity: 'medium',
        description: 'Application code size is large relative to vendor code',
        impact: 'Unused code increases bundle size and parsing time',
        recommendation: 'Review imports and enable tree shaking for unused code elimination',
        estimatedSavings: metrics.jsSize * 0.15, // Estimate 15% savings from tree shaking
      });
    }

    return optimizations.sort((a, b) => {
      const severityOrder = { high: 3, medium: 2, low: 1 };
      return severityOrder[b.severity] - severityOrder[a.severity];
    });
  }

  /**
   * Generate comprehensive bundle analysis report
   */
  async generateReport(): Promise<BundleAnalysisReport> {
    const metrics = await this.analyzeBundleSizes();
    const comparison = await this.compareWithBaseline(metrics);
    const optimizations = await this.identifyOptimizations(metrics);

    const meetsRequirements =
      comparison.improvement.totalSizeReductionPercent >= this.targetReduction;

    let status: 'success' | 'warning' | 'failure' = 'success';
    let message = 'Bundle analysis completed successfully';

    if (!meetsRequirements && comparison.baseline) {
      status = 'warning';
      message = `Bundle size reduction (${comparison.improvement.totalSizeReductionPercent.toFixed(1)}%) is below target (${this.targetReduction}%)`;
    }

    if (optimizations.some((opt) => opt.severity === 'high')) {
      status = 'failure';
      message = 'Critical bundle optimization issues found';
    }

    return {
      metrics,
      comparison,
      optimizations,
      summary: {
        status,
        message,
        meetsRequirements,
      },
    };
  }

  /**
   * Save current metrics as baseline for future comparisons
   */
  async saveBaseline(metrics: BundleMetrics): Promise<void> {
    try {
      await readFile(this.baselinePath);
      // Baseline already exists, don't overwrite
      return;
    } catch {
      // Baseline doesn't exist, create it
      const fs = await import('node:fs/promises');
      await fs.writeFile(this.baselinePath, JSON.stringify(metrics, null, 2));
    }
  }

  /**
   * Update baseline with current metrics
   */
  async updateBaseline(metrics: BundleMetrics): Promise<void> {
    const fs = await import('node:fs/promises');
    await fs.writeFile(this.baselinePath, JSON.stringify(metrics, null, 2));
  }

  private async scanDistDirectory(): Promise<string[]> {
    const files: string[] = [];

    try {
      await this.scanDirectory(this.distPath, files);
    } catch (error) {
      throw new Error(
        `Failed to scan distribution directory: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }

    return files.filter((file) => {
      const ext = extname(file).toLowerCase();
      return ['.js', '.css', '.woff', '.woff2', '.png', '.jpg', '.jpeg', '.svg', '.ico'].includes(
        ext
      );
    });
  }

  private async scanDirectory(dirPath: string, files: string[]): Promise<void> {
    try {
      const entries = await readdir(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = join(dirPath, entry.name);

        if (entry.isDirectory()) {
          await this.scanDirectory(fullPath, files);
        } else {
          files.push(fullPath);
        }
      }
    } catch (_error) {
      // Directory might not exist, skip silently
    }
  }

  private async analyzeBundleFile(filePath: string): Promise<BundleFile> {
    const stats = await stat(filePath);
    const content = await readFile(filePath);
    const gzipSize = gzipSync(content).length;
    const fileName = basename(filePath);
    const ext = extname(filePath).toLowerCase();

    let type: BundleFile['type'] = 'other';
    if (ext === '.js') { type = 'js'; }
    else if (ext === '.css') { type = 'css'; }
    else if (['.woff', '.woff2', '.png', '.jpg', '.jpeg', '.svg', '.ico'].includes(ext)) {
      type = 'asset';
    }

    const isChunk = type === 'js' && (fileName.includes('-') || fileName.includes('.'));
    const isVendor = fileName.includes('vendor') || fileName.includes('chunk');

    return {
      path: filePath,
      name: fileName,
      size: stats.size,
      gzipSize,
      type,
      isChunk,
      isVendor,
    };
  }

  /**
   * Format bytes to human readable string
   */
  static formatBytes(bytes: number): string {
    if (bytes === 0) { return '0 B'; }
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${Number.parseFloat((bytes / k ** i).toFixed(1))} ${sizes[i]}`;
  }

  /**
   * Format percentage with sign
   */
  static formatPercentage(value: number): string {
    const sign = value > 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
  }
}
