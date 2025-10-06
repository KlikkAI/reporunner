import type {
  ValidationResults,
  OptimizationRecommendation,
  BuildMetrics,
  BundleMetrics,
  MemoryProfile,
  DependencyReport,
  OrganizationReport,
  TypeSafetyReport,
  TestResults,
  EndpointResults,
  WorkflowResults,
} from '../types/index.js';

/**
 * Recommendation engine that analyzes validation results and generates optimization suggestions
 * Requirements: 5.1, 5.2, 5.4
 */
export class RecommendationEngine {
  private readonly performanceThresholds = {
    buildTime: {
      excellent: 30, // seconds
      good: 60,
      poor: 120,
    },
    bundleSize: {
      excellent: 5, // MB
      good: 10,
      poor: 20,
    },
    testCoverage: {
      excellent: 90, // percentage
      good: 80,
      poor: 60,
    },
    cacheHitRate: {
      excellent: 90, // percentage
      good: 80,
      poor: 60,
    },
    memoryUsage: {
      excellent: 512, // MB
      good: 1024,
      poor: 2048,
    },
  };

  /**
   * Generate comprehensive optimization recommendations
   * Requirements: 5.1, 5.2, 5.4
   */
  generateRecommendations(results: ValidationResults): OptimizationRecommendation[] {
    const recommendations: OptimizationRecommendation[] = [];

    // Analyze performance metrics
    if (results.performanceAnalysis) {
      recommendations.push(...this.analyzePerformanceMetrics(results.performanceAnalysis));
    }

    // Analyze system validation results
    if (results.systemValidation) {
      recommendations.push(...this.analyzeSystemValidation(results.systemValidation));
    }

    // Analyze architecture validation
    if (results.architectureValidation) {
      recommendations.push(...this.analyzeArchitectureValidation(results.architectureValidation));
    }

    // Sort recommendations by priority
    return this.prioritizeRecommendations(recommendations);
  }

  /**
   * Analyze performance metrics and generate recommendations
   */
  private analyzePerformanceMetrics(performanceAnalysis: ValidationResults['performanceAnalysis']): OptimizationRecommendation[] {
    const recommendations: OptimizationRecommendation[] = [];

    // Build time analysis
    if (performanceAnalysis.buildMetrics) {
      recommendations.push(...this.analyzeBuildMetrics(performanceAnalysis.buildMetrics));
    }

    // Bundle size analysis
    if (performanceAnalysis.bundleMetrics) {
      recommendations.push(...this.analyzeBundleMetrics(performanceAnalysis.bundleMetrics));
    }

    // Memory usage analysis
    if (performanceAnalysis.memoryProfile) {
      recommendations.push(...this.analyzeMemoryProfile(performanceAnalysis.memoryProfile));
    }

    // Developer experience analysis
    if (performanceAnalysis.devExperienceMetrics) {
      recommendations.push(...this.analyzeDeveloperExperience(performanceAnalysis.devExperienceMetrics));
    }

    return recommendations;
  }

  /**
   * Analyze build metrics and generate recommendations
   */
  private analyzeBuildMetrics(buildMetrics: BuildMetrics): OptimizationRecommendation[] {
    const recommendations: OptimizationRecommendation[] = [];
    const totalBuildTimeSeconds = buildMetrics.totalBuildTime / 1000;

    // Build time recommendations
    if (totalBuildTimeSeconds > this.performanceThresholds.buildTime.poor) {
      recommendations.push({
        category: 'performance',
        priority: 'critical',
        title: 'Optimize Build Performance',
        description: `Build time of ${Math.round(totalBuildTimeSeconds)}s exceeds acceptable threshold of ${this.performanceThresholds.buildTime.poor}s`,
        impact: 'Significantly impacts developer productivity and CI/CD pipeline efficiency',
        effort: 'medium',
        steps: [
          'Enable Turbo build caching across all packages',
          'Implement incremental TypeScript compilation',
          'Optimize package dependency graph to reduce build order complexity',
          'Consider splitting large packages into smaller, focused modules',
          'Use parallel build execution where possible',
        ],
        affectedPackages: buildMetrics.bottlenecks.map(b => b.packageName),
      });
    } else if (totalBuildTimeSeconds > this.performanceThresholds.buildTime.good) {
      recommendations.push({
        category: 'performance',
        priority: 'medium',
        title: 'Improve Build Performance',
        description: `Build time can be optimized from ${Math.round(totalBuildTimeSeconds)}s`,
        impact: 'Moderate improvement to developer experience',
        effort: 'low',
        steps: [
          'Review and optimize build scripts',
          'Ensure proper build caching configuration',
          'Consider using build output caching',
        ],
        affectedPackages: Object.keys(buildMetrics.packageBuildTimes),
      });
    }

    // Cache hit rate recommendations
    if (buildMetrics.cacheHitRate < this.performanceThresholds.cacheHitRate.poor) {
      recommendations.push({
        category: 'build',
        priority: 'high',
        title: 'Improve Build Cache Efficiency',
        description: `Cache hit rate of ${buildMetrics.cacheHitRate.toFixed(1)}% is below optimal threshold`,
        impact: 'Poor cache utilization leads to unnecessary rebuilds and slower development cycles',
        effort: 'medium',
        steps: [
          'Review Turbo cache configuration and ensure proper cache keys',
          'Verify that build outputs are deterministic',
          'Check for unnecessary file changes that invalidate cache',
          'Optimize package.json scripts to be cache-friendly',
          'Consider using remote caching for team collaboration',
        ],
        affectedPackages: Object.keys(buildMetrics.packageBuildTimes),
      });
    }

    // Parallel efficiency recommendations
    if (buildMetrics.parallelEfficiency < 70) {
      recommendations.push({
        category: 'build',
        priority: 'medium',
        title: 'Optimize Build Parallelization',
        description: `Parallel efficiency of ${buildMetrics.parallelEfficiency.toFixed(1)}% indicates suboptimal resource utilization`,
        impact: 'Better parallelization can significantly reduce build times',
        effort: 'medium',
        steps: [
          'Review package dependency graph for unnecessary sequential builds',
          'Optimize build task dependencies in turbo.json',
          'Consider breaking up large packages to enable better parallelization',
          'Ensure build tasks are properly configured for parallel execution',
        ],
        affectedPackages: buildMetrics.bottlenecks.map(b => b.packageName),
      });
    }

    // Package-specific bottleneck recommendations
    buildMetrics.bottlenecks.forEach(bottleneck => {
      if (bottleneck.buildTime > 30000) { // 30 seconds
        recommendations.push({
          category: 'performance',
          priority: 'high',
          title: `Optimize ${bottleneck.packageName} Build Performance`,
          description: `Package ${bottleneck.packageName} takes ${Math.round(bottleneck.buildTime / 1000)}s to build`,
          impact: 'Package-specific optimization can improve overall build time',
          effort: 'medium',
          steps: bottleneck.suggestions,
          affectedPackages: [bottleneck.packageName],
        });
      }
    });

    return recommendations;
  }

  /**
   * Analyze bundle metrics and generate recommendations
   */
  private analyzeBundleMetrics(bundleMetrics: BundleMetrics): OptimizationRecommendation[] {
    const recommendations: OptimizationRecommendation[] = [];
    const totalSizeMB = bundleMetrics.totalSize / 1024 / 1024;

    // Bundle size recommendations
    if (totalSizeMB > this.performanceThresholds.bundleSize.poor) {
      recommendations.push({
        category: 'performance',
        priority: 'high',
        title: 'Reduce Bundle Size',
        description: `Total bundle size of ${totalSizeMB.toFixed(1)}MB exceeds recommended threshold`,
        impact: 'Large bundles impact application load time and user experience',
        effort: 'high',
        steps: [
          'Implement code splitting and lazy loading',
          'Remove unused dependencies and dead code',
          'Optimize asset compression and minification',
          'Consider using dynamic imports for large modules',
          'Analyze bundle composition with webpack-bundle-analyzer',
        ],
        affectedPackages: bundleMetrics.largestBundles.map(b => b.packageName),
      });
    }

    // Package-specific bundle recommendations
    bundleMetrics.largestBundles.forEach(bundle => {
      const sizeMB = bundle.size / 1024 / 1024;
      if (sizeMB > 2) { // 2MB threshold for individual packages
        recommendations.push({
          category: 'performance',
          priority: 'medium',
          title: `Optimize ${bundle.packageName} Bundle Size`,
          description: `Package ${bundle.packageName} bundle size is ${sizeMB.toFixed(1)}MB`,
          impact: 'Package-specific optimization can reduce overall bundle size',
          effort: 'medium',
          steps: bundle.suggestions,
          affectedPackages: [bundle.packageName],
        });
      }
    });

    // Bundle reduction achievement
    if (bundleMetrics.reductionPercentage < 20) {
      recommendations.push({
        category: 'performance',
        priority: bundleMetrics.reductionPercentage < 10 ? 'high' : 'medium',
        title: 'Achieve Bundle Size Reduction Target',
        description: `Current bundle size reduction of ${bundleMetrics.reductionPercentage.toFixed(1)}% is below 20% target`,
        impact: 'Meeting bundle size reduction targets improves application performance',
        effort: 'medium',
        steps: [
          'Identify and remove duplicate dependencies across packages',
          'Implement tree shaking for unused exports',
          'Optimize shared utilities to reduce redundancy',
          'Consider package consolidation opportunities',
        ],
        affectedPackages: Object.keys(bundleMetrics.packageSizes),
      });
    }

    return recommendations;
  }

  /**
   * Analyze memory profile and generate recommendations
   */
  private analyzeMemoryProfile(memoryProfile: MemoryProfile): OptimizationRecommendation[] {
    const recommendations: OptimizationRecommendation[] = [];

    // Memory leak recommendations
    if (memoryProfile.leaks.length > 0) {
      const criticalLeaks = memoryProfile.leaks.filter(leak => leak.severity === 'high');

      if (criticalLeaks.length > 0) {
        recommendations.push({
          category: 'performance',
          priority: 'critical',
          title: 'Fix Critical Memory Leaks',
          description: `${criticalLeaks.length} critical memory leaks detected`,
          impact: 'Memory leaks can cause application crashes and performance degradation',
          effort: 'high',
          steps: criticalLeaks.map(leak => `Fix memory leak in ${leak.location}: ${leak.suggestion}`),
          affectedPackages: criticalLeaks.map(leak => leak.location.split('/')[0]).filter((v, i, a) => a.indexOf(v) === i),
        });
      }

      const moderateLeaks = memoryProfile.leaks.filter(leak => leak.severity === 'medium');
      if (moderateLeaks.length > 0) {
        recommendations.push({
          category: 'performance',
          priority: 'medium',
          title: 'Address Memory Leaks',
          description: `${moderateLeaks.length} memory leaks need attention`,
          impact: 'Addressing memory leaks improves application stability',
          effort: 'medium',
          steps: moderateLeaks.map(leak => leak.suggestion),
          affectedPackages: moderateLeaks.map(leak => leak.location.split('/')[0]).filter((v, i, a) => a.indexOf(v) === i),
        });
      }
    }

    // Memory optimization recommendations
    memoryProfile.optimizations.forEach(optimization => {
      if (optimization.potentialSavings > 100 * 1024 * 1024) { // 100MB potential savings
        recommendations.push({
          category: 'performance',
          priority: 'medium',
          title: `Optimize Memory Usage in ${optimization.area}`,
          description: `Potential memory savings of ${Math.round(optimization.potentialSavings / 1024 / 1024)}MB identified`,
          impact: 'Memory optimization improves application performance and resource utilization',
          effort: 'medium',
          steps: [optimization.recommendation],
          affectedPackages: [optimization.area],
        });
      }
    });

    // Build memory usage
    const buildMemoryMB = memoryProfile.build.heapUsed / 1024 / 1024;
    if (buildMemoryMB > this.performanceThresholds.memoryUsage.poor) {
      recommendations.push({
        category: 'build',
        priority: 'medium',
        title: 'Optimize Build Memory Usage',
        description: `Build process uses ${Math.round(buildMemoryMB)}MB of memory`,
        impact: 'High memory usage during builds can slow down CI/CD and development',
        effort: 'medium',
        steps: [
          'Optimize TypeScript compiler memory usage with incremental compilation',
          'Consider using build workers to distribute memory load',
          'Review build tools configuration for memory efficiency',
          'Implement build process memory monitoring',
        ],
        affectedPackages: ['build-system'],
      });
    }

    return recommendations;
  }

  /**
   * Analyze developer experience metrics
   */
  private analyzeDeveloperExperience(devMetrics: ValidationResults['performanceAnalysis']['devExperienceMetrics']): OptimizationRecommendation[] {
    const recommendations: OptimizationRecommendation[] = [];

    // TypeScript performance
    if (devMetrics.typeScriptPerformance.autocompleteSpeed > 1000) { // 1 second
      recommendations.push({
        category: 'developer-experience',
        priority: 'medium',
        title: 'Improve TypeScript Autocomplete Performance',
        description: `Autocomplete response time of ${devMetrics.typeScriptPerformance.autocompleteSpeed}ms is slow`,
        impact: 'Slow autocomplete impacts developer productivity',
        effort: 'medium',
        steps: [
          'Optimize TypeScript configuration for better performance',
          'Consider using project references for large codebases',
          'Review and optimize type definitions',
          'Enable incremental compilation',
        ],
        affectedPackages: ['typescript-config'],
      });
    }

    // IDE performance
    if (devMetrics.idePerformance.navigationSpeed > 500) { // 500ms
      recommendations.push({
        category: 'developer-experience',
        priority: 'medium',
        title: 'Optimize IDE Navigation Performance',
        description: `IDE navigation takes ${devMetrics.idePerformance.navigationSpeed}ms on average`,
        impact: 'Slow navigation reduces development efficiency',
        effort: 'low',
        steps: [
          'Optimize IDE indexing configuration',
          'Review workspace settings for performance',
          'Consider excluding unnecessary files from indexing',
        ],
        affectedPackages: ['ide-config'],
      });
    }

    // Import path optimization
    if (devMetrics.importPathMetrics.circularDependencies > 0) {
      recommendations.push({
        category: 'architecture',
        priority: 'high',
        title: 'Resolve Circular Import Dependencies',
        description: `${devMetrics.importPathMetrics.circularDependencies} circular dependencies found in import paths`,
        impact: 'Circular dependencies can cause build issues and runtime errors',
        effort: 'high',
        steps: [
          'Identify and break circular import chains',
          'Refactor shared utilities to eliminate circular references',
          'Implement dependency injection where appropriate',
          'Use interface segregation to reduce coupling',
        ],
        affectedPackages: ['shared-utilities'],
      });
    }

    if (devMetrics.importPathMetrics.inconsistentPaths > 5) {
      recommendations.push({
        category: 'developer-experience',
        priority: 'low',
        title: 'Standardize Import Paths',
        description: `${devMetrics.importPathMetrics.inconsistentPaths} inconsistent import paths found`,
        impact: 'Consistent import paths improve code maintainability',
        effort: 'low',
        steps: [
          'Establish import path conventions',
          'Use TypeScript path mapping consistently',
          'Implement linting rules for import path consistency',
          'Create automated tools to fix inconsistent imports',
        ],
        affectedPackages: ['all-packages'],
      });
    }

    return recommendations;
  }

  /**
   * Analyze system validation results
   */
  private analyzeSystemValidation(systemValidation: ValidationResults['systemValidation']): OptimizationRecommendation[] {
    const recommendations: OptimizationRecommendation[] = [];

    // Test results analysis
    if (systemValidation.testResults) {
      recommendations.push(...this.analyzeTestResults(systemValidation.testResults));
    }

    // API validation analysis
    if (systemValidation.apiValidation) {
      recommendations.push(...this.analyzeApiValidation(systemValidation.apiValidation));
    }

    // E2E validation analysis
    if (systemValidation.e2eResults) {
      recommendations.push(...this.analyzeE2EResults(systemValidation.e2eResults));
    }

    return recommendations;
  }

  /**
   * Analyze test results
   */
  private analyzeTestResults(testResults: TestResults): OptimizationRecommendation[] {
    const recommendations: OptimizationRecommendation[] = [];

    // Test coverage analysis
    if (testResults.coverage.overall < this.performanceThresholds.testCoverage.poor) {
      recommendations.push({
        category: 'build',
        priority: 'critical',
        title: 'Improve Test Coverage',
        description: `Test coverage of ${testResults.coverage.overall}% is below acceptable threshold`,
        impact: 'Low test coverage increases risk of bugs and reduces code quality',
        effort: 'high',
        steps: [
          'Identify untested code paths and add comprehensive tests',
          'Implement test-driven development practices',
          'Add integration tests for critical workflows',
          'Set up automated coverage reporting and enforcement',
        ],
        affectedPackages: Object.keys(testResults.coverage.packageCoverage).filter(
          pkg => testResults.coverage.packageCoverage[pkg] < this.performanceThresholds.testCoverage.poor
        ),
      });
    } else if (testResults.coverage.overall < this.performanceThresholds.testCoverage.good) {
      recommendations.push({
        category: 'build',
        priority: 'medium',
        title: 'Enhance Test Coverage',
        description: `Test coverage can be improved from ${testResults.coverage.overall}%`,
        impact: 'Better test coverage improves code quality and reduces bugs',
        effort: 'medium',
        steps: [
          'Add tests for edge cases and error conditions',
          'Improve test coverage for utility functions',
          'Add integration tests where missing',
        ],
        affectedPackages: Object.keys(testResults.coverage.packageCoverage).filter(
          pkg => testResults.coverage.packageCoverage[pkg] < this.performanceThresholds.testCoverage.good
        ),
      });
    }

    // Failed tests analysis
    if (testResults.failedTests > 0) {
      recommendations.push({
        category: 'build',
        priority: 'critical',
        title: 'Fix Failing Tests',
        description: `${testResults.failedTests} tests are currently failing`,
        impact: 'Failing tests indicate potential bugs and prevent reliable deployments',
        effort: 'high',
        steps: [
          'Investigate and fix root causes of test failures',
          'Update tests if they are outdated due to code changes',
          'Ensure test environment consistency',
          'Implement proper test isolation',
        ],
        affectedPackages: testResults.packageResults
          .filter(pkg => pkg.status === 'failure')
          .map(pkg => pkg.packageName),
      });
    }

    return recommendations;
  }

  /**
   * Analyze API validation results
   */
  private analyzeApiValidation(apiValidation: EndpointResults): OptimizationRecommendation[] {
    const recommendations: OptimizationRecommendation[] = [];

    // Failed endpoints analysis
    if (apiValidation.failedEndpoints.length > 0) {
      recommendations.push({
        category: 'build',
        priority: 'critical',
        title: 'Fix API Endpoint Failures',
        description: `${apiValidation.failedEndpoints.length} API endpoints are failing validation`,
        impact: 'Failed API endpoints can break application functionality',
        effort: 'high',
        steps: [
          'Investigate and fix failing API endpoints',
          'Ensure proper error handling and response formats',
          'Update API documentation and contracts',
          'Implement comprehensive API testing',
        ],
        affectedPackages: ['backend', 'api'],
      });
    }

    // Response time analysis
    if (apiValidation.responseTimeMetrics.p95 > 2000) { // 2 seconds
      recommendations.push({
        category: 'performance',
        priority: 'medium',
        title: 'Optimize API Response Times',
        description: `95th percentile response time is ${apiValidation.responseTimeMetrics.p95}ms`,
        impact: 'Slow API responses impact user experience',
        effort: 'medium',
        steps: [
          'Identify and optimize slow API endpoints',
          'Implement caching strategies',
          'Optimize database queries',
          'Consider API response compression',
        ],
        affectedPackages: ['backend', 'api'],
      });
    }

    return recommendations;
  }

  /**
   * Analyze E2E test results
   */
  private analyzeE2EResults(e2eResults: WorkflowResults): OptimizationRecommendation[] {
    const recommendations: OptimizationRecommendation[] = [];

    // Failed workflows analysis
    if (e2eResults.failedWorkflows.length > 0) {
      recommendations.push({
        category: 'build',
        priority: 'critical',
        title: 'Fix E2E Workflow Failures',
        description: `${e2eResults.failedWorkflows.length} E2E workflows are failing`,
        impact: 'Failed E2E tests indicate broken user workflows',
        effort: 'high',
        steps: [
          'Investigate and fix failing E2E workflows',
          'Update E2E tests for recent UI changes',
          'Ensure test environment stability',
          'Implement better error handling in tests',
        ],
        affectedPackages: ['frontend', 'e2e-tests'],
      });
    }

    // Integration failures analysis
    if (e2eResults.crossPackageIntegration.failedIntegrations.length > 0) {
      recommendations.push({
        category: 'architecture',
        priority: 'high',
        title: 'Fix Cross-Package Integration Issues',
        description: `${e2eResults.crossPackageIntegration.failedIntegrations.length} cross-package integrations are failing`,
        impact: 'Integration failures can break application functionality',
        effort: 'high',
        steps: [
          'Fix broken integrations between packages',
          'Update integration contracts and interfaces',
          'Implement comprehensive integration testing',
          'Review package boundaries and dependencies',
        ],
        affectedPackages: e2eResults.crossPackageIntegration.failedIntegrations
          .flatMap(f => [f.fromPackage, f.toPackage])
          .filter((v, i, a) => a.indexOf(v) === i),
      });
    }

    return recommendations;
  }

  /**
   * Analyze architecture validation results
   */
  private analyzeArchitectureValidation(architectureValidation: ValidationResults['architectureValidation']): OptimizationRecommendation[] {
    const recommendations: OptimizationRecommendation[] = [];

    // Dependency analysis
    if (architectureValidation.dependencyAnalysis) {
      recommendations.push(...this.analyzeDependencyReport(architectureValidation.dependencyAnalysis));
    }

    // Code organization analysis
    if (architectureValidation.codeOrganization) {
      recommendations.push(...this.analyzeCodeOrganization(architectureValidation.codeOrganization));
    }

    // Type safety analysis
    if (architectureValidation.typeSafety) {
      recommendations.push(...this.analyzeTypeSafety(architectureValidation.typeSafety));
    }

    return recommendations;
  }

  /**
   * Analyze dependency report
   */
  private analyzeDependencyReport(dependencyReport: DependencyReport): OptimizationRecommendation[] {
    const recommendations: OptimizationRecommendation[] = [];

    // Circular dependencies
    if (dependencyReport.circularDependencies.length > 0) {
      const criticalCircular = dependencyReport.circularDependencies.filter(dep => dep.severity === 'high');

      if (criticalCircular.length > 0) {
        recommendations.push({
          category: 'architecture',
          priority: 'critical',
          title: 'Resolve Critical Circular Dependencies',
          description: `${criticalCircular.length} critical circular dependencies found`,
          impact: 'Circular dependencies can cause build failures and runtime issues',
          effort: 'high',
          steps: criticalCircular.map(dep => dep.suggestion),
          affectedPackages: criticalCircular.flatMap(dep => dep.packages),
        });
      }
    }

    // Package boundary violations
    if (dependencyReport.packageBoundaryViolations.length > 0) {
      recommendations.push({
        category: 'architecture',
        priority: 'high',
        title: 'Fix Package Boundary Violations',
        description: `${dependencyReport.packageBoundaryViolations.length} package boundary violations found`,
        impact: 'Boundary violations compromise architectural integrity',
        effort: 'medium',
        steps: dependencyReport.packageBoundaryViolations.map(violation => violation.suggestion),
        affectedPackages: dependencyReport.packageBoundaryViolations
          .flatMap(v => [v.fromPackage, v.toPackage])
          .filter((v, i, a) => a.indexOf(v) === i),
      });
    }

    // Architecture health score
    if (dependencyReport.healthScore < 70) {
      recommendations.push({
        category: 'architecture',
        priority: dependencyReport.healthScore < 50 ? 'critical' : 'high',
        title: 'Improve Architecture Health Score',
        description: `Architecture health score of ${dependencyReport.healthScore}/100 needs improvement`,
        impact: 'Poor architecture health affects maintainability and scalability',
        effort: 'high',
        steps: [
          'Address circular dependencies and boundary violations',
          'Improve package cohesion and reduce coupling',
          'Refactor complex dependency relationships',
          'Implement clear architectural boundaries',
        ],
        affectedPackages: ['architecture'],
      });
    }

    return recommendations;
  }

  /**
   * Analyze code organization
   */
  private analyzeCodeOrganization(codeOrganization: OrganizationReport): OptimizationRecommendation[] {
    const recommendations: OptimizationRecommendation[] = [];

    // Separation of concerns
    if (codeOrganization.separationOfConcerns.score < 70) {
      recommendations.push({
        category: 'architecture',
        priority: 'medium',
        title: 'Improve Separation of Concerns',
        description: `Separation of concerns score is ${codeOrganization.separationOfConcerns.score}/100`,
        impact: 'Poor separation of concerns reduces code maintainability',
        effort: 'high',
        steps: codeOrganization.separationOfConcerns.suggestions,
        affectedPackages: ['code-organization'],
      });
    }

    // Code duplication
    if (codeOrganization.codeDuplication.overallPercentage > 10) {
      recommendations.push({
        category: 'architecture',
        priority: 'medium',
        title: 'Reduce Code Duplication',
        description: `${codeOrganization.codeDuplication.overallPercentage}% code duplication found`,
        impact: 'Code duplication increases maintenance burden and bug risk',
        effort: 'medium',
        steps: [
          'Extract common functionality into shared utilities',
          'Implement proper abstraction layers',
          'Refactor duplicated code blocks',
          'Establish code reuse patterns',
        ],
        affectedPackages: codeOrganization.codeDuplication.duplicatedFiles
          .flatMap(f => f.files.map(file => file.split('/')[0]))
          .filter((v, i, a) => a.indexOf(v) === i),
      });
    }

    // Naming consistency
    if (codeOrganization.namingConsistency.consistencyScore < 80) {
      recommendations.push({
        category: 'developer-experience',
        priority: 'low',
        title: 'Improve Naming Consistency',
        description: `Naming consistency score is ${codeOrganization.namingConsistency.consistencyScore}/100`,
        impact: 'Consistent naming improves code readability and maintainability',
        effort: 'low',
        steps: codeOrganization.namingConsistency.suggestions,
        affectedPackages: ['naming-conventions'],
      });
    }

    return recommendations;
  }

  /**
   * Analyze type safety
   */
  private analyzeTypeSafety(typeSafety: TypeSafetyReport): OptimizationRecommendation[] {
    const recommendations: OptimizationRecommendation[] = [];

    // Cross-package type consistency
    if (typeSafety.crossPackageTypeConsistency < 90) {
      recommendations.push({
        category: 'architecture',
        priority: 'medium',
        title: 'Improve Cross-Package Type Consistency',
        description: `Type consistency score is ${typeSafety.crossPackageTypeConsistency}/100`,
        impact: 'Inconsistent types can cause runtime errors and integration issues',
        effort: 'medium',
        steps: [
          'Standardize shared type definitions',
          'Implement strict TypeScript configuration',
          'Create shared type libraries',
          'Establish type compatibility testing',
        ],
        affectedPackages: ['shared-types'],
      });
    }

    // Interface compatibility
    if (typeSafety.interfaceCompatibility.incompatibleInterfaces.length > 0) {
      recommendations.push({
        category: 'architecture',
        priority: 'high',
        title: 'Fix Interface Compatibility Issues',
        description: `${typeSafety.interfaceCompatibility.incompatibleInterfaces.length} interface compatibility issues found`,
        impact: 'Interface incompatibilities can cause integration failures',
        effort: 'medium',
        steps: typeSafety.interfaceCompatibility.suggestions,
        affectedPackages: typeSafety.interfaceCompatibility.incompatibleInterfaces
          .flatMap(i => i.packages)
          .filter((v, i, a) => a.indexOf(v) === i),
      });
    }

    return recommendations;
  }

  /**
   * Prioritize recommendations based on impact and effort
   */
  private prioritizeRecommendations(recommendations: OptimizationRecommendation[]): OptimizationRecommendation[] {
    const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
    const effortOrder = { low: 3, medium: 2, high: 1 };

    return recommendations.sort((a, b) => {
      // First sort by priority
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;

      // Then by effort (lower effort first for same priority)
      return effortOrder[b.effort] - effortOrder[a.effort];
    });
  }

  /**
   * Filter recommendations by category
   */
  filterByCategory(recommendations: OptimizationRecommendation[], category: OptimizationRecommendation['category']): OptimizationRecommendation[] {
    return recommendations.filter(rec => rec.category === category);
  }

  /**
   * Filter recommendations by priority
   */
  filterByPriority(recommendations: OptimizationRecommendation[], priority: OptimizationRecommendation['priority']): OptimizationRecommendation[] {
    return recommendations.filter(rec => rec.priority === priority);
  }

  /**
   * Get recommendations for specific packages
   */
  getPackageRecommendations(recommendations: OptimizationRecommendation[], packageName: string): OptimizationRecommendation[] {
    return recommendations.filter(rec => rec.affectedPackages.includes(packageName));
  }
}
