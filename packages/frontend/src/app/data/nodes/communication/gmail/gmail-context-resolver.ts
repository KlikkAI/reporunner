// Gmail Context Resolver - Smart Mode Detection for Enterprise Registry
import type {
  ContextResolver,
  WorkflowContext,
  ResolvedContext,
} from "../../../../core/nodes/registry";

/**
 * Gmail-specific context resolver that determines the appropriate mode,
 * resource, and properties based on workflow context
 */
export const gmailContextResolver: ContextResolver = {
  id: "gmail-context-resolver",
  priority: 100, // High priority for Gmail nodes

  async resolve(context: WorkflowContext): Promise<ResolvedContext | null> {
    // Only handle Gmail nodes
    if (!context.nodeId.includes("gmail")) {
      return null;
    }

    console.log("🧠 Resolving Gmail context for node:", context.nodeId, {
      isWorkflowStart: context.isWorkflowStart,
      hasInputConnections: context.hasInputConnections,
      formState: context.formState,
    });

    // Smart mode detection
    const mode = this.detectGmailMode(context);
    const resource = this.detectResource(context, mode);
    const operation = this.detectOperation(context, mode, resource);
    const properties = await this.resolveProperties(
      context,
      mode,
      resource,
      operation,
    );
    const capabilities = this.getCapabilities(mode, resource);

    const resolvedContext: ResolvedContext = {
      mode,
      resource,
      operation,
      properties,
      capabilities,
    };

    console.log("✅ Resolved Gmail context:", resolvedContext);
    return resolvedContext;
  },

  /**
   * Detect Gmail node mode based on workflow context
   */
  detectGmailMode(
    context: WorkflowContext,
  ): "trigger" | "action" | "webhook" | "poll" {
    // If at workflow start and no inputs, it's likely a trigger
    if (context.isWorkflowStart && !context.hasInputConnections) {
      return "trigger";
    }

    // If has input connections, it's likely an action
    if (context.hasInputConnections) {
      return "action";
    }

    // Check form state for explicit mode selection
    const explicitMode = context.formState?.mode as string;
    if (
      explicitMode &&
      ["trigger", "action", "webhook", "poll"].includes(explicitMode)
    ) {
      return explicitMode as "trigger" | "action" | "webhook" | "poll";
    }

    // Default to action for safety
    return "action";
  },

  /**
   * Detect Gmail resource type based on context and mode
   */
  detectResource(
    context: WorkflowContext,
    mode: "trigger" | "action" | "webhook" | "poll",
  ): string {
    // Check explicit resource selection
    const explicitResource = context.formState?.resource as string;
    if (
      explicitResource &&
      ["email", "label", "draft", "thread"].includes(explicitResource)
    ) {
      return explicitResource;
    }

    // Default resources by mode
    switch (mode) {
      case "trigger":
        return "email"; // Triggers are primarily for new emails
      case "action":
        return "email"; // Actions default to email operations
      case "webhook":
        return "email"; // Webhooks for email notifications
      case "poll":
        return "email"; // Polling for new emails
      default:
        return "email";
    }
  },

  /**
   * Detect operation based on context, mode, and resource
   */
  detectOperation(
    context: WorkflowContext,
    mode: "trigger" | "action" | "webhook" | "poll",
    resource: string,
  ): string | undefined {
    // Check explicit operation selection
    const explicitOperation = context.formState?.operation as string;
    if (explicitOperation) {
      return explicitOperation;
    }

    // Default operations by mode and resource
    if (mode === "trigger") {
      return resource === "email" ? "messageReceived" : undefined;
    }

    if (mode === "action") {
      switch (resource) {
        case "email":
          return "send"; // Default email operation
        case "label":
          return "getAll"; // Default label operation
        case "draft":
          return "create"; // Default draft operation
        case "thread":
          return "get"; // Default thread operation
        default:
          return "send";
      }
    }

    return undefined;
  },

  /**
   * Resolve properties based on resolved context
   */
  async resolveProperties(
    context: WorkflowContext,
    mode: "trigger" | "action" | "webhook" | "poll",
    resource: string,
    operation?: string,
  ): Promise<any[]> {
    // This will be populated with context-aware property filtering
    // For now, return empty array - properties will be resolved by the registry
    return [];
  },

  /**
   * Get capabilities for the resolved context
   */
  getCapabilities(mode: string, resource: string): string[] {
    const capabilities: string[] = [];

    // Mode-based capabilities
    capabilities.push(`mode:${mode}`);
    capabilities.push(`resource:${resource}`);

    // Feature capabilities
    if (mode === "trigger") {
      capabilities.push("polling", "event-driven", "real-time");
    }

    if (mode === "action") {
      capabilities.push("batch-processing", "data-transformation", "api-calls");
    }

    // Resource-specific capabilities
    switch (resource) {
      case "email":
        capabilities.push("attachments", "html-content", "threading");
        break;
      case "label":
        capabilities.push("categorization", "filtering");
        break;
      case "draft":
        capabilities.push("composition", "templates");
        break;
      case "thread":
        capabilities.push("conversation-management", "threading");
        break;
    }

    return capabilities;
  },
};

/**
 * Register the Gmail context resolver with the node registry
 */
export function registerGmailContextResolver() {
  // This will be called during Gmail node registration
  import("@/core/nodes/registry")
    .then(({ nodeRegistry }) => {
      if (nodeRegistry && nodeRegistry.registerContextResolver) {
        nodeRegistry.registerContextResolver(gmailContextResolver);
        console.log("📧 Gmail context resolver registered successfully");
      }
    })
    .catch((err) => {
      console.warn("⚠️ Could not register Gmail context resolver:", err);
    });
}
