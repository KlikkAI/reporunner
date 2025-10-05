/**
 * Test script for Phase A validation framework
 */

import { PerformanceMonitor, ReportingEngine, ValidationController } from '../src/index.js';

async function testValidation() {

  try {
    // 
    const status = controller.getValidationStatus();
    console.log(`   ✅ Controller initialized. Running: ${status.isRunning}`);

    // Test PerformanceMonitor
    const monitor = new PerformanceMonitor();;
      console.log(`   ✅ Build measurement: ${duration.toFixed(2)}ms`);
    }, 100);

    // Test ReportingEngine
    console.log('3. Testing ReportingEngine...');
    const reporter = new ReportingEngine('./test-reports');
    console.log(`   ✅ Reporter initialized. Output: $
    console.log('\n🎉 All components initialized successfully!');
    console.
  }
}

// Run test if this file is executed directly
  testValidation().catch(console.error);
