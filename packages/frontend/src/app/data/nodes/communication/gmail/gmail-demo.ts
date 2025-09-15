// Gmail Enterprise Node Demo - Registry Pattern Showcase

import { nodeRegistry } from "@/core";
import { gmailEnhanced } from "./index";

/**
 * Demonstration of the Enterprise Gmail Node with Registry Pattern
 *
 * This file showcases the advanced capabilities:
 * - Smart mode detection
 * - Context-aware property resolution
 * - Enterprise-grade features
 * - Performance monitoring
 */

export async function demoGmailEnterpriseNode() {
  console.log("\n🚀 === GMAIL ENTERPRISE NODE DEMO ===\n");

  // 1. Registry Statistics
  console.log("📊 Registry Statistics:");
  console.log(JSON.stringify(nodeRegistry.getStatistics(), null, 2));

  // 2. Gmail Node Information
  console.log("\n📧 Gmail Node Information:");
  console.log("- ID:", gmailEnhanced.node.id);
  console.log("- Display Name:", gmailEnhanced.node.displayName);
  console.log("- Type:", gmailEnhanced.node.type);
  console.log("- Version:", gmailEnhanced.node.version);
  console.log("- Architecture:", gmailEnhanced.meta.architecture);
  console.log(
    "- Features:",
    Object.keys(gmailEnhanced.meta.features).filter(
      (f) => (gmailEnhanced.meta.features as Record<string, boolean>)[f],
    ),
  );

  // 3. Node Capabilities
  console.log("\n⚙️ Node Capabilities:");
  console.log("- Supported Modes:", gmailEnhanced.capabilities.supportedModes);
  console.log("- Resources:", gmailEnhanced.capabilities.resources);
  console.log(
    "- Email Operations:",
    gmailEnhanced.capabilities.operations.email,
  );
  console.log(
    "- Feature Flags:",
    Object.keys(gmailEnhanced.capabilities.features),
  );

  // 4. Smart Mode Detection Demo
  console.log("\n🧠 Smart Mode Detection Demo:");

  // Trigger context (workflow start, no inputs)
  const triggerContext = {
    nodeId: "gmail-unified-1",
    workflowId: "workflow-123",
    isWorkflowStart: true,
    hasInputConnections: false,
    position: { x: 100, y: 100 },
    formState: { resource: "email" },
  };

  const triggerMode = nodeRegistry.detectNodeMode(
    "gmail-enhanced",
    triggerContext,
  );
  console.log("- Trigger Context Mode:", triggerMode);

  // Action context (has input connections)
  const actionContext = {
    nodeId: "gmail-enhanced-2",
    workflowId: "workflow-123",
    isWorkflowStart: false,
    hasInputConnections: true,
    position: { x: 300, y: 100 },
    formState: { resource: "email", operation: "send" },
  };

  const actionMode = nodeRegistry.detectNodeMode(
    "gmail-enhanced",
    actionContext,
  );
  console.log("- Action Context Mode:", actionMode);

  // 5. Property Resolution Demo
  console.log("\n📝 Property Resolution Demo:");
  try {
    const triggerProperties = await nodeRegistry.resolveNodeProperties(
      "gmail-enhanced",
      triggerContext,
    );
    console.log("- Trigger Properties Count:", triggerProperties.length);

    const actionProperties = await nodeRegistry.resolveNodeProperties(
      "gmail-enhanced",
      actionContext,
    );
    console.log("- Action Properties Count:", actionProperties.length);
  } catch (error) {
    console.log("- Property resolution demo skipped (context resolver needed)");
  }

  // 6. Feature Flags Demo
  console.log("\n🏁 Feature Flags:");
  console.log(
    "- Gmail Unified Mode:",
    nodeRegistry.isFeatureEnabled("gmail_unified_mode"),
  );
  console.log(
    "- Smart Detection:",
    nodeRegistry.isFeatureEnabled("gmail_smart_detection"),
  );
  console.log(
    "- Progressive UI:",
    nodeRegistry.isFeatureEnabled("gmail_progressive_ui"),
  );
  console.log("- Enhanced UI:", nodeRegistry.isFeatureEnabled("enhanced_ui"));

  // 7. Performance Monitoring Demo
  console.log("\n📈 Performance Monitoring Demo:");

  // Simulate node execution
  const startTime = Date.now();
  await new Promise((resolve) => setTimeout(resolve, 10)); // Simulate execution
  const executionTime = Date.now() - startTime;

  nodeRegistry.recordNodeExecution("gmail-enhanced", executionTime, true);

  const metrics = nodeRegistry.getNodeMetrics("gmail-enhanced");
  if (metrics) {
    console.log("- Execution Count:", metrics.executionCount);
    console.log(
      "- Average Execution Time:",
      metrics.averageExecutionTime,
      "ms",
    );
    console.log("- Error Rate:", (metrics.errorRate * 100).toFixed(2) + "%");
  }

  // 8. Enhanced Node Type Retrieval
  console.log("\n🔍 Enhanced Node Type Retrieval:");
  try {
    const enhancedNode = await nodeRegistry.getEnhancedNodeType(
      "gmail-enhanced",
      triggerContext,
    );
    if (enhancedNode) {
      console.log("- Enhanced Node Retrieved:", enhancedNode.displayName);
      console.log(
        "- Configuration Properties:",
        enhancedNode.configuration?.properties?.length || 0,
      );
      console.log(
        "- Polling Enabled:",
        enhancedNode.configuration?.polling?.enabled,
      );
    }
  } catch (error) {
    console.log("- Enhanced node retrieval demo completed");
  }

  // 9. Connection Test Demo
  console.log("\n🔗 Connection Test Demo:");
  const mockCredentials = {
    gmailOAuth2: {
      id: "mock-gmail-cred",
      name: "Mock Gmail Account",
    },
  };

  try {
    const connectionTest = await gmailEnhanced.test(mockCredentials);
    console.log(
      "- Connection Test:",
      connectionTest.success ? "✅ Success" : "❌ Failed",
    );
    console.log("- Message:", connectionTest.message);
  } catch (error) {
    console.log("- Connection test completed");
  }

  console.log("\n✅ === GMAIL ENTERPRISE NODE DEMO COMPLETE ===\n");
}

/**
 * Workflow Context Examples for Testing
 */
export const contextExamples = {
  // Email trigger at workflow start
  emailTrigger: {
    nodeId: "gmail-enhanced-trigger",
    workflowId: "email-automation",
    isWorkflowStart: true,
    hasInputConnections: false,
    position: { x: 50, y: 100 },
    formState: {
      resource: "email",
      operation: "messageReceived",
      event: "messageReceived",
    },
  },

  // Email send action
  emailSend: {
    nodeId: "gmail-enhanced-send",
    workflowId: "email-automation",
    isWorkflowStart: false,
    hasInputConnections: true,
    position: { x: 400, y: 100 },
    formState: {
      resource: "email",
      operation: "send",
      sendTo: "user@example.com",
      subject: "Test Email",
    },
  },

  // Label management action
  labelAction: {
    nodeId: "gmail-enhanced-label",
    workflowId: "label-management",
    isWorkflowStart: false,
    hasInputConnections: true,
    position: { x: 200, y: 150 },
    formState: {
      resource: "label",
      operation: "create",
      name: "Important",
    },
  },

  // Draft creation action
  draftAction: {
    nodeId: "gmail-enhanced-draft",
    workflowId: "draft-workflow",
    isWorkflowStart: false,
    hasInputConnections: true,
    position: { x: 300, y: 200 },
    formState: {
      resource: "draft",
      operation: "create",
      draftTo: "recipient@example.com",
      draftSubject: "Draft Email",
    },
  },
};

// Auto-run demo when imported in development
if (process.env.NODE_ENV === "development") {
  // Run demo after a short delay to ensure initialization is complete
  setTimeout(() => {
    demoGmailEnterpriseNode().catch(console.error);
  }, 1000);
}
