import { EventEmitter } from "events";
import { io } from "@/server";
import PQueue from "p-queue";
import {
  IWorkflow,
  IWorkflowNode,
  IWorkflowEdge,
} from "../../../models/Workflow.js";
import {
  IExecution,
  INodeExecution,
  Execution,
} from "../../../models/Execution.js";
import { Credential } from "../../../models/Credentials.js";
import { logger } from "../../../utils/logger.js";
import GmailService, {
  SendEmailOptions,
} from "../../oauth/services/GmailService.js";
// import { IntegrationRegistry } from '@/integrations/IntegrationRegistry';

interface ExecutionContext {
  workflowId: string;
  executionId: string;
  userId: string;
  triggerData?: Record<string, any>;
  variables: Record<string, any>;
  credentials: Record<string, any>;
}

interface NodeExecutionResult {
  success: boolean;
  output?: Record<string, any>;
  error?: Error;
  duration: number;
}

export class WorkflowEngine extends EventEmitter {
  // private integrationRegistry: IntegrationRegistry;
  private executionQueue: PQueue;
  private activeExecutions: Map<string, boolean> = new Map();

  constructor() {
    super();

    // Simple in-memory queue for development (no Redis needed)
    this.executionQueue = new PQueue({
      concurrency: parseInt(process.env.WORKER_CONCURRENCY || "5"),
      timeout: parseInt(process.env.MAX_WORKFLOW_EXECUTION_TIME || "300000"),
    });

    // this.integrationRegistry = new IntegrationRegistry();
  }

  async executeWorkflow(
    workflow: IWorkflow,
    triggerType: "manual" | "webhook" | "schedule" | "api",
    triggerData?: Record<string, any>,
    userId?: string,
  ): Promise<string> {
    const executionId = await this.createExecution(
      workflow,
      triggerType,
      triggerData,
      userId,
    );

    // Add to in-memory queue for processing (no Redis needed)
    this.executionQueue.add(async () => {
      try {
        await this.executeWorkflowInternal(
          workflow._id,
          executionId,
          triggerData,
        );
        logger.info(`Workflow execution completed: ${executionId}`);
      } catch (error) {
        logger.error(`Workflow execution failed: ${executionId}`, error);
      } finally {
        this.activeExecutions.delete(executionId);
      }
    });

    this.activeExecutions.set(executionId, true);
    return executionId;
  }

  private async createExecution(
    workflow: IWorkflow,
    triggerType: "manual" | "webhook" | "schedule" | "api",
    triggerData?: Record<string, any>,
    userId?: string,
  ): Promise<string> {
    const nodeExecutions: INodeExecution[] = workflow.nodes.map((node) => ({
      nodeId: node.id,
      nodeName: node.data.label,
      status: "pending",
      retryAttempt: 0,
    }));

    const execution = new Execution({
      workflowId: workflow._id,
      userId: userId || workflow.userId,
      status: "pending",
      triggerType,
      triggerData,
      nodeExecutions,
      totalNodes: workflow.nodes.length,
      metadata: {
        version: workflow.version,
        environment: process.env.NODE_ENV || "development",
      },
    });

    await execution.save();
    return execution._id;
  }

  private async executeWorkflowInternal(
    workflowId: string,
    executionId: string,
    triggerData?: Record<string, any>,
  ): Promise<void> {
    const execution = await Execution.findById(executionId);
    if (!execution) {
      throw new Error(`Execution not found: ${executionId}`);
    }

    const workflow = await this.getWorkflow(workflowId);
    if (!workflow) {
      throw new Error(`Workflow not found: ${workflowId}`);
    }

    // Store workflow context for node name resolution
    this.currentWorkflow = workflow;

    try {
      execution.status = "running";
      await execution.save();

      this.emit("execution:started", { executionId, workflowId });
      io.to(`execution:${executionId}`).emit("execution_event", {
        type: "execution_started",
        executionId,
        timestamp: new Date().toISOString(),
        data: { workflowId },
      });

      const context: ExecutionContext = {
        workflowId,
        executionId,
        userId: execution.userId,
        triggerData,
        variables: {},
        credentials: await this.loadCredentials(execution.userId),
      };

      // Execute workflow nodes
      await this.executeNodes(workflow, execution, context);

      // Mark execution as completed
      execution.status = "success";
      execution.endTime = new Date();
      await execution.save();

      this.emit("execution:completed", { executionId, workflowId });
      io.to(`execution:${executionId}`).emit("execution_event", {
        type: "execution_completed",
        executionId,
        timestamp: new Date().toISOString(),
        data: { workflowId },
      });
    } catch (error) {
      logger.error(`Workflow execution error: ${executionId}`, error);

      execution.status = "error";
      execution.errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      execution.endTime = new Date();
      await execution.save();

      this.emit("execution:failed", { executionId, workflowId, error });
      io.to(`execution:${executionId}`).emit("execution_event", {
        type: "execution_failed",
        executionId,
        timestamp: new Date().toISOString(),
        data: {
          workflowId,
          error: error instanceof Error ? error.message : String(error),
        },
      });
      throw error;
    } finally {
      // Clear workflow context
      this.currentWorkflow = null;
    }
  }

  private async executeNodes(
    workflow: IWorkflow,
    execution: IExecution,
    context: ExecutionContext,
  ): Promise<void> {
    const nodeMap = new Map(workflow.nodes.map((node) => [node.id, node]));
    const edgeMap = this.buildEdgeMap(workflow.edges);
    const executedNodes = new Set<string>();
    const nodeOutputs = new Map<string, any>();

    // Find start nodes (nodes with no incoming edges)
    const startNodes = workflow.nodes.filter(
      (node) => !workflow.edges.some((edge) => edge.target === node.id),
    );

    if (startNodes.length === 0) {
      throw new Error("No start nodes found in workflow");
    }

    // Execute nodes in topological order
    const executeQueue = [...startNodes];

    while (executeQueue.length > 0) {
      const currentNode = executeQueue.shift()!;

      if (executedNodes.has(currentNode.id)) {
        continue;
      }

      // Check if all dependencies are satisfied
      const incomingEdges = workflow.edges.filter(
        (edge) => edge.target === currentNode.id,
      );
      const dependenciesSatisfied = incomingEdges.every((edge) =>
        executedNodes.has(edge.source),
      );

      if (!dependenciesSatisfied) {
        // Put back in queue and continue
        executeQueue.push(currentNode);
        continue;
      }

      // Execute the node
      io.to(`execution:${context.executionId}`).emit("execution_event", {
        type: "node_started",
        executionId: context.executionId,
        timestamp: new Date().toISOString(),
        data: { nodeId: currentNode.id, nodeName: currentNode.data?.label },
      });

      const result = await this.executeNode(
        currentNode,
        context,
        nodeOutputs,
        execution,
      );

      if (!result.success && workflow.settings.errorHandling === "stop") {
        throw (
          result.error || new Error(`Node execution failed: ${currentNode.id}`)
        );
      }

      executedNodes.add(currentNode.id);
      if (result.output) {
        nodeOutputs.set(currentNode.id, result.output);
      }

      // Add next nodes to queue with conditional routing support
      const outgoingEdges = edgeMap.get(currentNode.id) || [];

      // Handle conditional routing for condition nodes
      if (currentNode.type === "condition" && result.output?.outputPath) {
        // Only follow the edge that matches the condition result
        const matchingEdge = outgoingEdges.find(
          (edge) =>
            edge.sourceHandle === result.output?.outputPath ||
            edge.sourceHandle === result.output?.matchedRule ||
            edge.sourceHandle === "default",
        );

        if (matchingEdge) {
          const nextNode = nodeMap.get(matchingEdge.target);
          if (nextNode && !executedNodes.has(nextNode.id)) {
            logger.info(
              `Condition routing: ${currentNode.id} -> ${nextNode.id} via ${result.output.outputPath}`,
            );
            executeQueue.push(nextNode);
          }
        } else {
          logger.warn(
            `No matching edge found for condition output: ${result.output.outputPath}`,
          );
          // Try to find default edge if specific output path not found
          const defaultEdge = outgoingEdges.find(
            (edge) =>
              edge.sourceHandle === "default" ||
              edge.sourceHandle === result.output?.defaultOutput ||
              !edge.sourceHandle, // Fallback for edges without specific handles
          );
          if (defaultEdge) {
            const nextNode = nodeMap.get(defaultEdge.target);
            if (nextNode && !executedNodes.has(nextNode.id)) {
              logger.info(
                `Using default routing: ${currentNode.id} -> ${nextNode.id}`,
              );
              executeQueue.push(nextNode);
            }
          }
        }
      } else {
        // Standard routing for non-condition nodes
        for (const edge of outgoingEdges) {
          const nextNode = nodeMap.get(edge.target);
          if (nextNode && !executedNodes.has(nextNode.id)) {
            executeQueue.push(nextNode);
          }
        }
      }

      // Emit progress and node completion update
      const progress = (executedNodes.size / workflow.nodes.length) * 100;
      this.emit("execution:progress", {
        executionId: context.executionId,
        nodeId: currentNode.id,
        progress,
      });
      io.to(`execution:${context.executionId}`).emit("execution_event", {
        type: result.success ? "node_completed" : "node_failed",
        executionId: context.executionId,
        timestamp: new Date().toISOString(),
        data: {
          nodeId: currentNode.id,
          nodeName: currentNode.data?.label,
          output: result.output,
          error: result.error?.message,
          duration: result.duration,
          progress,
        },
      });
    }
  }

  private async executeNode(
    node: IWorkflowNode,
    context: ExecutionContext,
    nodeOutputs: Map<string, any>,
    execution: IExecution,
  ): Promise<NodeExecutionResult> {
    const startTime = Date.now();

    try {
      // Update node execution status
      await execution.updateNodeExecution(node.id, {
        status: "running",
        startTime: new Date(),
      });

      // Get node inputs from previous nodes
      const nodeInputs = this.buildNodeInputs(node, nodeOutputs);

      // Execute the node based on its type
      const output = await this.executeNodeByType(node, context, nodeInputs);

      const duration = Date.now() - startTime;

      // Update node execution with success
      await execution.updateNodeExecution(node.id, {
        status: "success",
        endTime: new Date(),
        duration,
        input: nodeInputs,
        output,
      });

      return {
        success: true,
        output,
        duration,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorObj =
        error instanceof Error ? error : new Error(String(error));

      // Update node execution with error
      await execution.updateNodeExecution(node.id, {
        status: "error",
        endTime: new Date(),
        duration,
        error: {
          message: errorObj.message,
          stack: errorObj.stack,
        },
      });

      return {
        success: false,
        error: errorObj,
        duration,
      };
    }
  }

  private buildEdgeMap(edges: IWorkflowEdge[]): Map<string, IWorkflowEdge[]> {
    const edgeMap = new Map<string, IWorkflowEdge[]>();

    for (const edge of edges) {
      if (!edgeMap.has(edge.source)) {
        edgeMap.set(edge.source, []);
      }
      edgeMap.get(edge.source)!.push(edge);
    }

    return edgeMap;
  }

  private buildNodeInputs(
    node: IWorkflowNode,
    nodeOutputs: Map<string, any>,
  ): Record<string, any> {
    const inputs: Record<string, any> = {};

    // Add outputs from all previous nodes to inputs
    // This allows condition nodes to access data like llmResponse.output.is_customer_support_request
    for (const [nodeId, output] of nodeOutputs.entries()) {
      // Use the node ID as the key to avoid naming conflicts
      inputs[nodeId] = output;

      // Also flatten common properties to root level for easier access
      if (output && typeof output === "object") {
        // If output has common properties, make them accessible at root level
        if (output.output !== undefined) inputs.output = output.output;
        if (output.data !== undefined) inputs.data = output.data;
        if (output.result !== undefined) inputs.result = output.result;
        if (output.response !== undefined) inputs.response = output.response;
      }
    }

    // Add node configuration as inputs (for backwards compatibility)
    if (node.data.configuration) {
      Object.assign(inputs, node.data.configuration);
    }

    // Add all previous node outputs with their original node names for easier reference
    // This enables paths like: gmailTrigger.messages[0].subject or llmAgent.output.result
    const workflow = this.getWorkflowFromContext();
    if (workflow) {
      for (const [nodeId, output] of nodeOutputs.entries()) {
        const sourceNode = workflow.nodes.find((n) => n.id === nodeId);
        if (sourceNode && sourceNode.data?.label) {
          const nodeLabel = this.sanitizeNodeName(sourceNode.data.label);
          inputs[nodeLabel] = output;
        }
      }
    }

    return inputs;
  }

  // Helper function to sanitize node names for use as object keys
  private sanitizeNodeName(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "")
      .replace(/\s+/g, "");
  }

  // Store workflow context for node name resolution
  private currentWorkflow: IWorkflow | null = null;
  private getWorkflowFromContext(): IWorkflow | null {
    return this.currentWorkflow;
  }

  private async loadCredentials(userId: string): Promise<Record<string, any>> {
    const credentials = await Credential.find({
      userId,
      isActive: true,
    }).select("+data");
    const credentialMap: Record<string, any> = {};

    for (const credential of credentials) {
      credentialMap[credential.integration] = credential.getDecryptedData();
    }

    return credentialMap;
  }

  private async getWorkflow(workflowId: string): Promise<IWorkflow | null> {
    const { Workflow } = await import("@/models/Workflow");
    return Workflow.findById(workflowId);
  }

  async stopExecution(executionId: string): Promise<void> {
    if (this.activeExecutions.has(executionId)) {
      const execution = await Execution.findById(executionId);
      if (execution) {
        execution.status = "cancelled";
        execution.endTime = new Date();
        await execution.save();

        this.activeExecutions.delete(executionId);
        this.emit("execution:cancelled", { executionId });
      }
    }
  }

  async getExecutionStatus(executionId: string): Promise<IExecution | null> {
    return Execution.findById(executionId);
  }

  async getExecutionHistory(
    workflowId: string,
    limit: number = 50,
    offset: number = 0,
  ): Promise<IExecution[]> {
    return Execution.find({ workflowId })
      .sort({ startTime: -1 })
      .limit(limit)
      .skip(offset);
  }

  /**
   * Execute node based on its type and configuration
   */
  private async executeNodeByType(
    node: IWorkflowNode,
    context: ExecutionContext,
    inputs: Record<string, any>,
  ): Promise<any> {
    const nodeType = node.type;
    const nodeData = node.data || {};

    logger.info(`Executing node: ${nodeType} (${node.id})`);

    switch (nodeType) {
      case "gmail-trigger":
        return this.executeGmailTrigger(node, context, inputs);

      case "gmail-send":
        return this.executeGmailSend(node, context, inputs);

      case "webhook":
        return this.executeWebhook(node, context, inputs);

      case "condition":
        return this.executeCondition(node, context, inputs);

      case "delay":
        return this.executeDelay(node, context, inputs);

      case "transform":
        return this.executeTransform(node, context, inputs);

      default:
        logger.warn(`Unknown node type: ${nodeType}`);
        return {
          message: `Node type '${nodeType}' executed (placeholder)`,
          nodeId: node.id,
          type: nodeType,
        };
    }
  }

  /**
   * Execute Gmail trigger node
   */
  private async executeGmailTrigger(
    node: IWorkflowNode,
    context: ExecutionContext,
    inputs: Record<string, any>,
  ): Promise<any> {
    try {
      const credentials = await this.getGmailCredentials(context.userId);
      const gmailService = new GmailService(credentials);

      const nodeConfig = node.data.configuration || {};
      const filters = nodeConfig.filters || [];
      const options = nodeConfig.options || {};

      // Get maxResults from node configuration, default to 1 for latest email workflow
      const maxResults = options.maxResults || 1;

      // Build Gmail query from filters
      let query = "";
      if (filters.length > 0) {
        const queryParts: string[] = [];
        filters.forEach((filter: any) => {
          switch (filter.field) {
            case "from":
              queryParts.push(`from:${filter.value}`);
              break;
            case "to":
              queryParts.push(`to:${filter.value}`);
              break;
            case "subject":
              queryParts.push(`subject:${filter.value}`);
              break;
            case "body":
              queryParts.push(`${filter.value}`);
              break;
            case "hasAttachment":
              queryParts.push("has:attachment");
              break;
            case "isUnread":
              queryParts.push("is:unread");
              break;
            case "label":
              queryParts.push(`label:${filter.value}`);
              break;
          }
        });
        query = queryParts.join(" ");
      }

      // Get messages with configurable limit
      const messages = await gmailService.listMessages(query, maxResults);

      return {
        messages,
        totalCount: messages.length,
        query,
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      logger.error(`Gmail trigger error: ${error.message}`);
      throw new Error(`Gmail trigger failed: ${error.message}`);
    }
  }

  /**
   * Execute Gmail send node
   */
  private async executeGmailSend(
    node: IWorkflowNode,
    context: ExecutionContext,
    inputs: Record<string, any>,
  ): Promise<any> {
    try {
      const credentials = await this.getGmailCredentials(context.userId);
      const gmailService = new GmailService(credentials);

      const nodeConfig = node.data.configuration || {};

      // Process email options from node configuration and inputs
      const emailOptions: SendEmailOptions = {
        to: this.processEmailList(nodeConfig.to || inputs.to),
        cc: nodeConfig.cc ? this.processEmailList(nodeConfig.cc) : undefined,
        bcc: nodeConfig.bcc ? this.processEmailList(nodeConfig.bcc) : undefined,
        subject: nodeConfig.subject || inputs.subject || "No Subject",
        body: nodeConfig.message || inputs.message || "",
        isHtml: nodeConfig.emailType === "html",
        replyToMessageId: inputs.replyToMessageId,
      };

      // Send email
      const result = await gmailService.sendEmail(emailOptions);

      return {
        messageId: result.messageId,
        threadId: result.threadId,
        to: emailOptions.to,
        subject: emailOptions.subject,
        sentAt: new Date().toISOString(),
      };
    } catch (error: any) {
      logger.error(`Gmail send error: ${error.message}`);
      throw new Error(`Gmail send failed: ${error.message}`);
    }
  }

  /**
   * Execute webhook node
   */
  private async executeWebhook(
    node: IWorkflowNode,
    context: ExecutionContext,
    inputs: Record<string, any>,
  ): Promise<any> {
    // Webhook execution logic
    return {
      message: "Webhook executed",
      nodeId: node.id,
      inputs,
    };
  }

  /**
   * Execute condition node with proper runtime evaluation
   */
  private async executeCondition(
    node: IWorkflowNode,
    context: ExecutionContext,
    inputs: Record<string, any>,
  ): Promise<any> {
    // Use the new conditionRules format from the frontend
    const conditionRules =
      node.data.configuration?.conditionRules || node.data.conditionRules || [];

    const defaultOutput =
      node.data.configuration?.defaultOutput ||
      node.data.defaultOutput ||
      "default";

    logger.info(`Executing condition node: ${node.id}`, {
      rulesCount: conditionRules.length,
      defaultOutput,
      availableInputKeys: Object.keys(inputs),
    });

    const results: Array<{
      ruleId: string;
      outputName: string;
      matched: boolean;
      field: string;
      operator: string;
      expectedValue: any;
      actualValue: any;
      error?: string;
    }> = [];

    // Evaluate each condition rule
    for (const rule of conditionRules) {
      if (!rule.enabled) {
        logger.info(`Skipping disabled rule: ${rule.id}`);
        continue;
      }

      try {
        const fieldValue = this.getFieldValue(inputs, rule.field);
        const conditionMet = this.evaluateCondition(
          fieldValue,
          rule.operator,
          rule.value,
        );

        results.push({
          ruleId: rule.id,
          outputName: rule.outputName,
          matched: conditionMet,
          field: rule.field,
          operator: rule.operator,
          expectedValue: rule.value,
          actualValue: fieldValue,
        });

        logger.info(`Rule evaluation: ${rule.id}`, {
          field: rule.field,
          operator: rule.operator,
          expectedValue: rule.value,
          actualValue: fieldValue,
          matched: conditionMet,
        });

        // Return immediately if condition is met (first match wins)
        if (conditionMet) {
          return {
            matchedRule: rule.id,
            outputPath: rule.outputName,
            conditionMet: true,
            field: rule.field,
            actualValue: fieldValue,
            expectedValue: rule.value,
            operator: rule.operator,
            allResults: results,
            executionFlow: "condition_met",
          };
        }
      } catch (error: any) {
        logger.error(`Error evaluating rule ${rule.id}:`, error);
        results.push({
          ruleId: rule.id,
          outputName: rule.outputName,
          matched: false,
          field: rule.field,
          operator: rule.operator,
          expectedValue: rule.value,
          actualValue: undefined,
          error: error.message,
        });
      }
    }

    // No conditions matched, use default output
    return {
      matchedRule: null,
      outputPath: defaultOutput,
      conditionMet: false,
      allResults: results,
      executionFlow: "default_path",
      message: `No conditions matched, using default output: ${defaultOutput}`,
    };
  }

  /**
   * Get field value from inputs using dot notation path
   */
  private getFieldValue(inputs: Record<string, any>, fieldPath: string): any {
    if (!fieldPath || !inputs) {
      return undefined;
    }

    try {
      const pathParts = fieldPath.split(".");
      let currentValue = inputs;

      for (let i = 0; i < pathParts.length; i++) {
        const key = pathParts[i];

        if (currentValue === null || currentValue === undefined) {
          return undefined;
        }

        // Handle array index notation (e.g., "messages.0" or "emails[1]")
        if (key.includes("[") && key.includes("]")) {
          const arrayKey = key.substring(0, key.indexOf("["));
          const indexStr = key.substring(
            key.indexOf("[") + 1,
            key.indexOf("]"),
          );
          const index = parseInt(indexStr, 10);

          if (arrayKey && !isNaN(index)) {
            currentValue = currentValue[arrayKey]?.[index];
          }
        } else {
          currentValue = currentValue[key];
        }

        // If we hit a JSON string and there are more path parts, try to parse it
        if (typeof currentValue === "string" && i < pathParts.length - 1) {
          const parsed = this.tryParseJsonString(currentValue);
          if (parsed !== null) {
            currentValue = parsed;
            // Continue with the remaining path parts in the parsed object
            const remainingPath = pathParts.slice(i + 1).join(".");
            return this.getFieldValue(
              { parsed: currentValue },
              "parsed." + remainingPath,
            );
          }
        }
      }

      return currentValue;
    } catch (error) {
      logger.warn(`Error accessing field path: ${fieldPath}`, error);
      return undefined;
    }
  }

  /**
   * Try to parse a JSON string
   */
  private tryParseJsonString(str: string): any {
    if (typeof str !== "string") return null;

    let cleanStr = str.trim();

    // Handle markdown-wrapped JSON (```json ... ```)
    if (cleanStr.includes("```json")) {
      const jsonMatch = cleanStr.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        cleanStr = jsonMatch[1].trim();
      }
    }
    // Handle code-wrapped JSON (``` ... ```)
    else if (cleanStr.startsWith("```") && cleanStr.endsWith("```")) {
      cleanStr = cleanStr.slice(3, -3).trim();
    }

    // Check if it looks like JSON
    if (
      (cleanStr.startsWith("{") && cleanStr.endsWith("}")) ||
      (cleanStr.startsWith("[") && cleanStr.endsWith("]"))
    ) {
      try {
        return JSON.parse(cleanStr);
      } catch {
        return null;
      }
    }

    return null;
  }

  /**
   * Evaluate condition with comprehensive operator support
   */
  private evaluateCondition(
    fieldValue: any,
    operator: string,
    compareValue: any,
  ): boolean {
    try {
      // Handle null/undefined field values
      if (fieldValue === null || fieldValue === undefined) {
        switch (operator) {
          case "is_empty":
          case "is_null":
            return true;
          case "is_not_empty":
            return false;
          default:
            return false;
        }
      }

      // Type-aware comparisons
      switch (operator) {
        case "equals":
          // Handle different types intelligently
          if (typeof fieldValue === typeof compareValue) {
            return fieldValue === compareValue;
          }
          // Loose equality for mixed types
          return fieldValue == compareValue;

        case "not_equals":
          if (typeof fieldValue === typeof compareValue) {
            return fieldValue !== compareValue;
          }
          return fieldValue != compareValue;

        case "contains":
          if (Array.isArray(fieldValue)) {
            return fieldValue.includes(compareValue);
          }
          return String(fieldValue).includes(String(compareValue));

        case "not_contains":
          if (Array.isArray(fieldValue)) {
            return !fieldValue.includes(compareValue);
          }
          return !String(fieldValue).includes(String(compareValue));

        case "starts_with":
          return String(fieldValue).startsWith(String(compareValue));

        case "ends_with":
          return String(fieldValue).endsWith(String(compareValue));

        case "greater":
        case "greater_equal":
          const numField = Number(fieldValue);
          const numCompare = Number(compareValue);
          if (isNaN(numField) || isNaN(numCompare)) return false;
          return operator === "greater"
            ? numField > numCompare
            : numField >= numCompare;

        case "less":
        case "less_equal":
          const numField2 = Number(fieldValue);
          const numCompare2 = Number(compareValue);
          if (isNaN(numField2) || isNaN(numCompare2)) return false;
          return operator === "less"
            ? numField2 < numCompare2
            : numField2 <= numCompare2;

        case "between":
          if (typeof compareValue === "string" && compareValue.includes(",")) {
            const [min, max] = compareValue
              .split(",")
              .map((v) => Number(v.trim()));
            const num = Number(fieldValue);
            if (!isNaN(num) && !isNaN(min) && !isNaN(max)) {
              return num >= min && num <= max;
            }
          }
          return false;

        case "is_empty":
          if (Array.isArray(fieldValue)) return fieldValue.length === 0;
          if (typeof fieldValue === "object")
            return Object.keys(fieldValue).length === 0;
          return !fieldValue || fieldValue === "";

        case "is_not_empty":
          if (Array.isArray(fieldValue)) return fieldValue.length > 0;
          if (typeof fieldValue === "object")
            return Object.keys(fieldValue).length > 0;
          return fieldValue && fieldValue !== "";

        case "length_equals":
        case "length_greater":
          if (Array.isArray(fieldValue) || typeof fieldValue === "string") {
            const length = fieldValue.length;
            const compareNum = Number(compareValue);
            if (!isNaN(compareNum)) {
              return operator === "length_equals"
                ? length === compareNum
                : length > compareNum;
            }
          }
          return false;

        case "is_true":
          return (
            fieldValue === true || fieldValue === "true" || fieldValue === 1
          );

        case "is_false":
          return (
            fieldValue === false || fieldValue === "false" || fieldValue === 0
          );

        case "is_null":
          return fieldValue === null;

        case "regex":
          try {
            // Handle regex patterns like /pattern/flags
            if (
              typeof compareValue === "string" &&
              compareValue.startsWith("/")
            ) {
              const lastSlash = compareValue.lastIndexOf("/");
              const pattern = compareValue.slice(1, lastSlash);
              const flags = compareValue.slice(lastSlash + 1);
              const regex = new RegExp(pattern, flags);
              return regex.test(String(fieldValue));
            }
            // Fallback to simple regex
            const regex = new RegExp(String(compareValue));
            return regex.test(String(fieldValue));
          } catch {
            return false;
          }

        default:
          logger.warn(`Unknown operator: ${operator}`);
          return false;
      }
    } catch (error) {
      logger.warn("Error evaluating condition:", {
        fieldValue,
        operator,
        compareValue,
        error,
      });
      return false;
    }
  }

  /**
   * Execute delay node
   */
  private async executeDelay(
    node: IWorkflowNode,
    context: ExecutionContext,
    inputs: Record<string, any>,
  ): Promise<any> {
    const delayMs = node.data.configuration?.delay || 1000;

    await new Promise((resolve) => setTimeout(resolve, delayMs));

    return {
      delayed: delayMs,
      message: `Delayed execution by ${delayMs}ms`,
      inputs,
    };
  }

  /**
   * Execute transform node
   */
  private async executeTransform(
    node: IWorkflowNode,
    context: ExecutionContext,
    inputs: Record<string, any>,
  ): Promise<any> {
    const transformations = node.data.configuration?.transformations || [];
    const output = { ...inputs };

    transformations.forEach((transform: any) => {
      const { operation, field, value } = transform;

      switch (operation) {
        case "set":
          output[field] = value;
          break;
        case "append":
          output[field] = (output[field] || "") + value;
          break;
        case "uppercase":
          output[field] = String(output[field] || "").toUpperCase();
          break;
        case "lowercase":
          output[field] = String(output[field] || "").toLowerCase();
          break;
      }
    });

    return output;
  }

  /**
   * Get Gmail credentials for user
   */
  private async getGmailCredentials(userId: string): Promise<any> {
    const credential = await Credential.findOne({
      userId,
      integration: { $in: ["gmail", "gmailOAuth2"] },
      isActive: true,
    }).select("+data");

    if (!credential) {
      throw new Error("No valid Gmail credentials found for user");
    }

    return credential.getDecryptedData();
  }

  /**
   * Process email list (comma-separated string to array)
   */
  private processEmailList(emailString: string): string[] {
    if (!emailString) return [];
    return emailString
      .split(",")
      .map((email) => email.trim())
      .filter((email) => email.length > 0);
  }
}
