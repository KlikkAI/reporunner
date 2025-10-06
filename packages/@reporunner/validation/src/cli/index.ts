// CLI module exports
export { BuildAnalyzerCLI } from './build-analyzer-cli.js';
export { BundleAnalyzerCLI } from './bundle-analyzer-cli.js';
export { ValidationOrchestratorCLI } from './validation-orchestrator-cli.js';

export interface ValidationCLIOptions {
  outputFormat?: 'json' | 'html' | 'csv' | 'all';
  outputDirectory?: string;
  verbose?: boolean;
}
