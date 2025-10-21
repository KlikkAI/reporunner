#!/usr/bin/env node

/**
 * Test script for Phase A validation framework
 * Quick test to verify all components are working
 */

import { PerformanceMonitor, ReportingEngine, ValidationController } from '../src/index.js';

async function testValidation() {
  console.log('🧪 Testing Phase A Validation Framework\n');

  try {
    // Test ValidationController
    console.log('1. Testing ValidationController...');
    const controller = new ValidationController();
    const status = controller.getValidationStatus();
    console.log(`   ✅ ValidationController initialized: ${status.phase}`);

    // Test PerformanceMonitor
    console.log('\n2. Testing PerformanceMonitor...');
    const monitor = new PerformanceMonitor();
    monitor.startMonitoring();

    // Simulate some work
    await new Promise((resolve) => setTimeout(resolve, 100));

    monitor.stopMonitoring();
    console.log('   ✅ PerformanceMonitor working correctly');

    // Test ReportingEngine
    console.log('\n3. Testing ReportingEngine...');
    const reporter = new ReportingEngine('./test-reports');
    console.log(`   ✅ ReportingEngine initialized: ${reporter.getOutputDirectory()}`);

    console.log('\n✅ All validation framework components are working!\n');
    return true;
  } catch (error) {
    console.error('❌ Validation framework test failed:', error);
    return false;
  }
}

// Run the test
if (import.meta.url === `file://${process.argv[1]}`) {
  testValidation()
    .then((success) => {
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error('💥 Unexpected error:', error);
      process.exit(1);
    });
}

export { testValidation };
