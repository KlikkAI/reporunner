import { CredentialRepository } from "../../credentials/repositories/CredentialRepository.js";
import { WorkflowEngine } from "../../workflows/services/WorkFlowEngine.js";
import {
  GmailService,
  GmailCredentials,
} from "../../oauth/services/GmailService.js";
import { AppError } from "../../../middleware/errorHandlers.js";
import mongoose from "mongoose";

export class NodeExecutionService {
  private credentialRepository: CredentialRepository;
  private workflowEngine: WorkflowEngine;

  constructor() {
    this.credentialRepository = new CredentialRepository();
    this.workflowEngine = new WorkflowEngine();
  }

  /**
   * Helper function to check if a string is a valid MongoDB ObjectId
   */
  private isValidObjectId(id: string): boolean {
    return mongoose.Types.ObjectId.isValid(id);
  }

  /**
   * Execute a specific node and its dependency chain
   */
  async executeNodeChain(nodeId: string, workflow: any, userId: string) {
    console.log(`Executing node ${nodeId} and its dependencies`);

    // Find the target node
    const targetNode = workflow.nodes.find((node: any) => node.id === nodeId);
    if (!targetNode) {
      throw new AppError("Node not found", 404);
    }

    // Build execution plan (nodes that need to be executed before target node)
    const executionPlan = this.buildExecutionPlan(
      workflow.nodes,
      workflow.edges,
      nodeId,
    );
    console.log(
      "Execution plan:",
      executionPlan.map((n: any) => `${n.data.label} (${n.type})`),
    );

    // Execute nodes in dependency order
    const nodeResults = new Map();

    for (const node of executionPlan) {
      console.log(`Executing node: ${node.data.label} (${node.type})`);

      // Get input data from previous nodes
      const inputData = this.getNodeInputData(
        node,
        workflow.edges,
        nodeResults,
      );

      // Execute the node
      const result = await this.executeNode(node, inputData, userId);
      nodeResults.set(node.id, result);

      console.log(`Node ${node.data.label} executed successfully`);
    }

    // Return the result of the target node
    const targetResult = nodeResults.get(nodeId);

    return {
      nodeId,
      result: targetResult,
      executedNodes: executionPlan.map((n: any) => ({
        id: n.id,
        label: n.data.label,
        type: n.type,
      })),
    };
  }

  /**
   * Build execution plan - topological sort to determine execution order
   */
  private buildExecutionPlan(
    nodes: any[],
    edges: any[],
    targetNodeId: string,
  ): any[] {
    const nodeMap = new Map(nodes.map((node) => [node.id, node]));
    const visited = new Set<string>();
    const plan: any[] = [];

    const visit = (nodeId: string) => {
      if (visited.has(nodeId)) return;
      visited.add(nodeId);

      // Get all nodes that this node depends on (input nodes)
      const inputEdges = edges.filter((edge) => edge.target === nodeId);
      for (const edge of inputEdges) {
        visit(edge.source);
      }

      // Add current node to plan
      const node = nodeMap.get(nodeId);
      if (node) {
        plan.push(node);
      }
    };

    visit(targetNodeId);
    return plan;
  }

  /**
   * Get input data for a node from its connected input nodes
   */
  private getNodeInputData(
    node: any,
    edges: any[],
    nodeResults: Map<string, any>,
  ): any {
    const inputEdges = edges.filter((edge) => edge.target === node.id);

    if (inputEdges.length === 0) {
      return null; // No input nodes (trigger node)
    }

    if (inputEdges.length === 1) {
      // Single input
      const sourceResult = nodeResults.get(inputEdges[0].source);
      return sourceResult?.data || sourceResult;
    }

    // Multiple inputs - combine them
    const combinedInput: any = {};
    inputEdges.forEach((edge) => {
      const sourceResult = nodeResults.get(edge.source);
      const outputKey = edge.sourceHandle || "output";
      combinedInput[outputKey] = sourceResult?.data || sourceResult;
    });

    return combinedInput;
  }

  /**
   * Execute individual node based on its type
   */
  private async executeNode(
    node: any,
    inputData: any,
    userId: string,
  ): Promise<any> {
    const nodeType = node.type;
    const nodeData = node.data;

    console.log(`Executing ${nodeType} node with data:`, {
      type: nodeType,
      integrationId: nodeData?.integrationData?.id,
      enhancedNodeType: nodeData?.enhancedNodeType?.id,
      label: nodeData?.label,
    });

    // Handle Gmail Trigger (multiple ways to detect)
    if (
      nodeType === "gmail-trigger" ||
      (nodeType === "trigger" && nodeData?.integrationData?.id === "gmail") ||
      nodeData?.enhancedNodeType?.id === "gmail-trigger" ||
      nodeData?.label?.toLowerCase().includes("gmail")
    ) {
      return await this.executeGmailTrigger(node, userId);
    }

    // Handle Transform node
    if (
      nodeType === "transform" ||
      nodeData?.integrationData?.id === "transform" ||
      nodeData?.enhancedNodeType?.id === "transform"
    ) {
      return await this.executeTransformNode(node, inputData);
    }

    // Handle AI Agent node
    if (
      nodeType === "ai-agent" ||
      nodeData?.integrationData?.id === "ai-agent" ||
      nodeData?.enhancedNodeType?.id === "ai-agent"
    ) {
      return await this.executeAiAgentNode(node, inputData, userId);
    }

    // Handle Condition node
    if (
      nodeType === "condition" ||
      nodeData?.integrationData?.id === "condition" ||
      nodeData?.enhancedNodeType?.id === "condition"
    ) {
      return await this.executeConditionNode(node, inputData);
    }

    // Handle Gmail Send node
    if (
      nodeType === "gmail-send" ||
      (nodeType === "action" &&
        nodeData?.integrationData?.id === "gmail-send") ||
      nodeData?.enhancedNodeType?.id === "gmail-send" ||
      (nodeData?.label?.toLowerCase().includes("gmail") &&
        nodeData?.label?.toLowerCase().includes("send"))
    ) {
      return await this.executeGmailSendNode(node, inputData, userId);
    }

    throw new Error(
      `Execution not implemented for node type: ${nodeType} (integration: ${nodeData?.integrationData?.id})`,
    );
  }

  /**
   * Execute Gmail trigger node
   */
  private async executeGmailTrigger(node: any, userId: string): Promise<any> {
    try {
      // Get credentials - handle both string and array formats
      let credentialId = node.data.credentials;
      if (!credentialId) {
        throw new Error("Gmail credentials not configured");
      }

      // Handle array format - extract first credential ID
      if (Array.isArray(credentialId)) {
        credentialId = credentialId[0];
      }

      // Ensure we have a string
      if (typeof credentialId !== "string") {
        throw new Error("Invalid credential ID format - must be a string");
      }

      console.log("Gmail trigger execution debug:", {
        nodeId: node.id,
        nodeLabel: node.data?.label,
        originalCredentialId: node.data.credentials,
        credentialId,
        credentialIdLength: credentialId.length,
        credentialIdType: typeof credentialId,
        isValidObjectId: this.isValidObjectId(credentialId),
        userId,
      });

      // Try to find credential - check if ID is valid ObjectId first
      let credential;
      if (this.isValidObjectId(credentialId)) {
        credential = await this.credentialRepository.findByIdAndUserIdWithData(
          credentialId,
          userId,
        );
        console.log("Credential lookup result:", {
          found: !!credential,
          credentialId,
          userId,
        });
      }

      // No custom field to check - only MongoDB _id exists
      if (!credential) {
        // Additional debug: check if credential exists for any user
        if (this.isValidObjectId(credentialId)) {
          const credentialAnyUser =
            await this.credentialRepository.findById(credentialId);
          console.log(
            "Credential exists for different user:",
            credentialAnyUser,
          );
        }

        if (!this.isValidObjectId(credentialId)) {
          throw new Error(
            `Invalid Gmail credential ID format: ${credentialId}. This appears to be a temporary ID. Please save the credential properly and try again.`,
          );
        } else {
          throw new Error("Gmail credential not found for this user");
        }
      }

      // Decrypt credentials using the model's decrypt method
      let credentialData;
      try {
        credentialData = credential.decrypt(credential.data);
      } catch (error: any) {
        throw new Error(
          `Failed to decrypt Gmail credentials: ${error.message}`,
        );
      }

      // Validate required fields
      if (
        !credentialData.clientId ||
        !credentialData.clientSecret ||
        !credentialData.refreshToken
      ) {
        throw new Error(
          "Missing required Gmail credentials (clientId, clientSecret, refreshToken)",
        );
      }

      // Create Gmail service with credentials
      const gmailService = new GmailService(credentialData as GmailCredentials);

      // Execute Gmail trigger
      const emails = await gmailService.listMessages(
        node.data.query || "",
        node.data.maxResults || 10,
      );

      return {
        success: true,
        data: emails,
        timestamp: new Date().toISOString(),
        nodeType: "gmail-trigger",
      };
    } catch (error: any) {
      console.error("Gmail trigger execution error:", error);
      throw new Error(`Gmail trigger failed: ${error.message}`);
    }
  }

  /**
   * Execute Transform node
   */
  private async executeTransformNode(node: any, inputData: any): Promise<any> {
    console.log("Transform node execution debug:", {
      nodeId: node.id,
      nodeLabel: node.data.label,
      hasInputData: !!inputData,
      inputDataType: typeof inputData,
      inputDataKeys: inputData ? Object.keys(inputData) : "none",
      transformConfig: node.data.transformConfig,
      hasTransformConfig: !!node.data.transformConfig,
      selectedFields: node.data.transformConfig?.selectedFields || "none",
    });

    if (!inputData) {
      throw new Error("Transform node requires input data");
    }

    const transformConfig = node.data.transformConfig || {};
    const selectedFields = transformConfig.selectedFields || [];

    console.log("Transform node selectedFields:", selectedFields);

    if (selectedFields.length === 0) {
      throw new Error("No fields selected for transformation");
    }

    // Process the input data (assuming it's Gmail data)
    const emails = Array.isArray(inputData) ? inputData : [inputData];
    const transformedEmails: any[] = [];

    emails.forEach((email) => {
      const transformedData: any = {};

      selectedFields.forEach((fieldName: string) => {
        const mapping = transformConfig.fieldMappings?.[fieldName];
        if (mapping && mapping.path) {
          const value = this.getNestedValue(email, mapping.path);
          transformedData[fieldName] = value;
        }
      });

      transformedEmails.push(transformedData);
    });

    // Return the first transformed email for sentiment analysis
    const result = transformedEmails[0] || {};

    return {
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
      nodeType: "transform",
      processedCount: transformedEmails.length,
    };
  }

  /**
   * Execute AI Agent node with real LLM calls
   */
  private async executeAiAgentNode(
    node: any,
    inputData: any,
    userId: string,
  ): Promise<any> {
    const nodeConfig = node.data;

    console.log("AI Agent execution debug:", {
      nodeId: node.id,
      nodeLabel: nodeConfig.label,
      inputData: inputData,
      hasInputData: !!inputData,
      inputDataType: typeof inputData,
      inputDataKeys: inputData ? Object.keys(inputData) : "none",
    });

    // Get credentials - handle both string and array formats
    let credentialId = nodeConfig.credentials;
    if (!credentialId) {
      throw new Error("AI Agent credentials not configured");
    }

    // Handle array format - extract first credential ID
    if (Array.isArray(credentialId)) {
      credentialId = credentialId[0];
    }

    // Ensure we have a string
    if (typeof credentialId !== "string") {
      throw new Error(
        "Invalid AI Agent credential ID format - must be a string",
      );
    }

    console.log("AI Agent execution debug:", {
      nodeId: node.id,
      nodeLabel: nodeConfig.label,
      originalCredentialId: nodeConfig.credentials,
      credentialId,
      credentialIdLength: credentialId.length,
      credentialIdType: typeof credentialId,
      isValidObjectId: this.isValidObjectId(credentialId),
      userId,
    });

    // Try to find credential - check if ID is valid ObjectId first
    let credential;
    if (this.isValidObjectId(credentialId)) {
      credential = await this.credentialRepository.findByIdAndUserIdWithData(
        credentialId,
        userId,
      );
      console.log("AI Agent credential lookup result:", {
        found: !!credential,
        credentialId,
        userId,
      });
    }

    if (!credential) {
      if (!this.isValidObjectId(credentialId)) {
        throw new Error(
          `Invalid AI Agent credential ID format: ${credentialId}. This appears to be a temporary ID. Please save the credential properly and try again.`,
        );
      } else {
        throw new Error("AI Agent credential not found for this user");
      }
    }

    // Decrypt credentials using the model's decrypt method
    let credentialData;
    try {
      credentialData = credential.decrypt(credential.data);
    } catch (error: any) {
      throw new Error(
        `Failed to decrypt AI Agent credentials: ${error.message}`,
      );
    }

    // Prepare parameters - ensure provider is correctly determined
    let provider = nodeConfig.provider || "openai";
    let model = nodeConfig.model || "gpt-3.5-turbo";

    // If provider is not explicitly set, try to determine from credential type
    if (!nodeConfig.provider && credential.integration) {
      console.log(
        `No provider specified, determining from credential integration: ${credential.integration}`,
      );
      switch (credential.integration) {
        case "googleAiApi":
          provider = "google";
          model = model.includes("gemini") ? model : "gemini-1.5-flash";
          break;
        case "openaiApi":
          provider = "openai";
          model = model.includes("gpt") ? model : "gpt-3.5-turbo";
          break;
        case "anthropicApi":
          provider = "anthropic";
          model = model.includes("claude")
            ? model
            : "claude-3-5-sonnet-20241022";
          break;
      }
    }

    console.log(`AI Agent final provider determination:`, {
      nodeConfigProvider: nodeConfig.provider,
      credentialIntegration: credential.integration,
      finalProvider: provider,
      finalModel: model,
    });

    const parameters = {
      provider: provider,
      model: model,
      systemPrompt: nodeConfig.systemPrompt || "",
      userPrompt: nodeConfig.userPrompt || "",
      temperature: parseFloat(nodeConfig.temperature) || 0.7,
      maxTokens: parseInt(nodeConfig.maxTokens) || 1000,
      responseFormat: nodeConfig.responseFormat || "text",
    };

    // Enhanced email processing with classification and response generation
    let emailClassification = null;
    let emailResponse = null;
    let processedUserPrompt = parameters.userPrompt;

    if (inputData && typeof inputData === "object") {
      // Replace {{input}} placeholders with full input data
      const inputText = JSON.stringify(inputData, null, 2);
      processedUserPrompt = processedUserPrompt.replace(
        /\{\{input\}\}/g,
        inputText,
      );

      // Replace specific field placeholders like {{input.subject}}, {{input.sender}}, etc.
      processedUserPrompt = processedUserPrompt.replace(
        /\{\{input\.(\w+)\}\}/g,
        (match: string, fieldName: string) => {
          const fieldValue = inputData[fieldName];
          return fieldValue !== undefined ? fieldValue : match; // Keep placeholder if field not found
        },
      );

      console.log(
        "Processed user prompt after placeholder replacement:",
        processedUserPrompt,
      );

      // For sentiment analysis, append email content if available
      if (
        processedUserPrompt.toLowerCase().includes("sentiment") &&
        inputData.body
      ) {
        processedUserPrompt += `\n\nEmail content to analyze:\n"${inputData.body}"`;
      }

      // Enhanced email classification and response generation for email data
      if (inputData.subject && inputData.body && inputData.from) {
        console.log(
          "Processing email for classification and response generation",
        );

        // Step 1: Classify the email
        emailClassification = await this.classifyEmail(
          inputData,
          parameters,
          credentialData,
        );

        // Step 2: Generate response only for general emails (not support or marketing)
        if (emailClassification?.category === "general") {
          console.log("Email classified as general - generating response");
          emailResponse = await this.generateEmailResponse(
            inputData,
            parameters,
            credentialData,
          );
        } else {
          console.log(
            `Email classified as ${emailClassification?.category} - skipping response generation`,
          );
        }
      }
    }

    console.log(
      `Calling ${parameters.provider} API with model ${parameters.model}`,
    );

    // Call the actual AI service
    let result;

    // Additional validation before API calls
    console.log("Pre-API call validation:", {
      provider: parameters.provider,
      model: parameters.model,
      credentialIntegration: credential.integration,
      hasCredentialData: !!credentialData,
      credentialKeys: credentialData ? Object.keys(credentialData) : "none",
    });

    switch (parameters.provider) {
      case "openai":
        if (credential.integration !== "openaiApi") {
          console.warn(
            `Warning: Using OpenAI API but credential integration is ${credential.integration}`,
          );
        }
        result = await this.callOpenAI(
          parameters,
          processedUserPrompt,
          credentialData,
        );
        break;
      case "anthropic":
        if (credential.integration !== "anthropicApi") {
          console.warn(
            `Warning: Using Anthropic API but credential integration is ${credential.integration}`,
          );
        }
        result = await this.callAnthropic(
          parameters,
          processedUserPrompt,
          credentialData,
        );
        break;
      case "google":
        if (credential.integration !== "googleAiApi") {
          console.warn(
            `Warning: Using Google API but credential integration is ${credential.integration}`,
          );
        }
        result = await this.callGoogle(
          parameters,
          processedUserPrompt,
          credentialData,
        );
        break;
      case "ollama":
        result = await this.callOllama(
          parameters,
          processedUserPrompt,
          credentialData,
        );
        break;
      default:
        throw new Error(
          `Unsupported AI provider: ${parameters.provider}. Available providers: openai, anthropic, google, ollama`,
        );
    }

    // Parse JSON from LLM response if it's structured JSON
    let parsedLlmOutput = null;
    if (result?.output && typeof result.output === "string") {
      try {
        // Extract JSON from markdown code blocks if present
        let jsonText = result.output.trim();

        // Remove markdown code block wrapper if present
        const markdownMatch = jsonText.match(/```json\s*\n([\s\S]*?)\n\s*```/);
        if (markdownMatch) {
          jsonText = markdownMatch[1].trim();
        }

        // Parse the JSON
        parsedLlmOutput = JSON.parse(jsonText);
        console.log("Successfully parsed LLM JSON response:", parsedLlmOutput);
      } catch (parseError) {
        console.log(
          "LLM response is not valid JSON, keeping as string:",
          parseError instanceof Error ? parseError.message : "Unknown error",
        );
      }
    }

    // Enhanced output data structure for next nodes
    const outputData = {
      // LLM Analysis Results (with parsed JSON if available)
      llmResponse: {
        ...result,
        // Add parsed output alongside raw output
        ...(parsedLlmOutput ? { parsedOutput: parsedLlmOutput } : {}),
        // Also add parsed fields directly to llmResponse.output for easier access
        output: parsedLlmOutput || result.output,
      },

      // Original Email Data (preserved for next nodes)
      originalEmail: inputData,

      // Email Classification (if email was processed)
      emailClassification: emailClassification,

      // Generated Response (only for general emails)
      emailResponse: emailResponse,

      // Processing metadata
      processedPrompt: processedUserPrompt,
      timestamp: new Date().toISOString(),
      nodeType: "ai-agent",

      // For backward compatibility and immediate display
      analysis: result?.output || result,

      // Structured output for next nodes to consume
      nextNodeData: {
        original: inputData,
        classification: emailClassification,
        response: emailResponse,
        analysis: result,
      },
    };

    return {
      success: true,
      data: outputData,
      inputData,
      processedPrompt: processedUserPrompt,
      timestamp: new Date().toISOString(),
      nodeType: "ai-agent",
    };
  }

  /**
   * Execute Condition node with proper runtime evaluation
   */
  private async executeConditionNode(node: any, inputData: any): Promise<any> {
    const nodeConfig = node.data;

    // Use the new conditionRules format from the frontend
    const conditionRules =
      nodeConfig.configuration?.conditionRules ||
      nodeConfig.conditionRules ||
      [];

    const defaultOutput =
      nodeConfig.configuration?.defaultOutput ||
      nodeConfig.defaultOutput ||
      "default";

    console.log(`Executing condition node: ${node.id}`, {
      rulesCount: conditionRules.length,
      defaultOutput,
      availableInputKeys: inputData ? Object.keys(inputData) : "none",
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
        console.log(`Skipping disabled rule: ${rule.id}`);
        continue;
      }

      try {
        const fieldValue = this.getFieldValue(inputData, rule.field);
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

        console.log(`Rule evaluation: ${rule.id}`, {
          field: rule.field,
          operator: rule.operator,
          expectedValue: rule.value,
          actualValue: fieldValue,
          matched: conditionMet,
        });

        // Return immediately if condition is met (first match wins)
        if (conditionMet) {
          return {
            success: true,
            data: {
              matchedRule: rule.id,
              outputPath: rule.outputName,
              conditionMet: true,
              field: rule.field,
              actualValue: fieldValue,
              expectedValue: rule.value,
              operator: rule.operator,
              allResults: results,
              executionFlow: "condition_met",
            },
            timestamp: new Date().toISOString(),
            nodeType: "condition",
          };
        }
      } catch (error: any) {
        console.error(`Error evaluating rule ${rule.id}:`, error);
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
      success: true,
      data: {
        matchedRule: null,
        outputPath: defaultOutput,
        conditionMet: false,
        allResults: results,
        executionFlow: "default_path",
        message: `No conditions matched, using default output: ${defaultOutput}`,
      },
      timestamp: new Date().toISOString(),
      nodeType: "condition",
    };
  }

  /**
   * Execute Gmail Send node with proper email sending
   */
  private async executeGmailSendNode(
    node: any,
    inputData: any,
    userId: string,
  ): Promise<any> {
    try {
      const nodeConfig = node.data;

      // Get credentials - handle both string and array formats
      let credentialId = nodeConfig.credentials;
      if (!credentialId) {
        throw new Error("Gmail Send credentials not configured");
      }

      // Handle array format - extract first credential ID
      if (Array.isArray(credentialId)) {
        credentialId = credentialId[0];
      }

      // Ensure we have a string
      if (typeof credentialId !== "string") {
        throw new Error(
          "Invalid Gmail Send credential ID format - must be a string",
        );
      }

      console.log("Gmail Send execution debug:", {
        nodeId: node.id,
        nodeLabel: nodeConfig.label,
        originalCredentialId: nodeConfig.credentials,
        credentialId,
        credentialIdLength: credentialId.length,
        credentialIdType: typeof credentialId,
        isValidObjectId: this.isValidObjectId(credentialId),
        userId,
        hasInputData: !!inputData,
        inputDataKeys: inputData ? Object.keys(inputData) : "none",
      });

      // Try to find credential - check if ID is valid ObjectId first
      let credential;
      if (this.isValidObjectId(credentialId)) {
        credential = await this.credentialRepository.findByIdAndUserIdWithData(
          credentialId,
          userId,
        );
        console.log("Gmail Send credential lookup result:", {
          found: !!credential,
          credentialId,
          userId,
        });
      }

      if (!credential) {
        if (!this.isValidObjectId(credentialId)) {
          throw new Error(
            `Invalid Gmail Send credential ID format: ${credentialId}. This appears to be a temporary ID. Please save the credential properly and try again.`,
          );
        } else {
          throw new Error("Gmail Send credential not found for this user");
        }
      }

      // Decrypt credentials using the model's decrypt method
      let credentialData;
      try {
        credentialData = credential.decrypt(credential.data);
      } catch (error: any) {
        throw new Error(
          `Failed to decrypt Gmail Send credentials: ${error.message}`,
        );
      }

      // Validate required fields
      if (
        !credentialData.clientId ||
        !credentialData.clientSecret ||
        !credentialData.refreshToken
      ) {
        throw new Error(
          "Missing required Gmail Send credentials (clientId, clientSecret, refreshToken)",
        );
      }

      // Create Gmail service with credentials
      const gmailService = new GmailService(credentialData as GmailCredentials);

      // Process email options from node configuration and inputs
      interface SendEmailOptions {
        to: string[];
        cc?: string[];
        bcc?: string[];
        subject: string;
        body: string;
        isHtml?: boolean;
        replyToMessageId?: string;
      }

      const emailOptions: SendEmailOptions = {
        to: this.processEmailList(nodeConfig.to || inputData?.to || ""),
        cc: nodeConfig.cc ? this.processEmailList(nodeConfig.cc) : undefined,
        bcc: nodeConfig.bcc ? this.processEmailList(nodeConfig.bcc) : undefined,
        subject: nodeConfig.subject || inputData?.subject || "No Subject",
        body:
          nodeConfig.message ||
          inputData?.message ||
          inputData?.responseText ||
          "",
        isHtml: nodeConfig.emailType === "html",
        replyToMessageId: inputData?.replyToMessageId,
      };

      console.log("Gmail Send email options:", {
        to: emailOptions.to,
        subject: emailOptions.subject,
        bodyLength: emailOptions.body.length,
        isHtml: emailOptions.isHtml,
        hasReplyTo: !!emailOptions.replyToMessageId,
      });

      // Send email
      const result = await gmailService.sendEmail(emailOptions);

      return {
        success: true,
        data: {
          messageId: result.messageId,
          threadId: result.threadId,
          to: emailOptions.to,
          subject: emailOptions.subject,
          sentAt: new Date().toISOString(),
          bodyLength: emailOptions.body.length,
          isHtml: emailOptions.isHtml,
        },
        timestamp: new Date().toISOString(),
        nodeType: "gmail-send",
      };
    } catch (error: any) {
      console.error("Gmail Send execution error:", error);
      throw new Error(`Gmail Send failed: ${error.message}`);
    }
  }

  /**
   * Helper to get nested values from objects
   */
  private getNestedValue(obj: any, path: string): any {
    if (!obj || !path) return undefined;
    const normalizedPath = path.replace(/\((\d+)\)/g, ".$1");
    const keys = normalizedPath.split(".");
    let current = obj;
    for (const key of keys) {
      if (current === null || current === undefined) return undefined;
      current = current[key];
    }
    return current;
  }

  /**
   * Get field value from inputs using dot notation path (for condition evaluation)
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
      console.warn(`Error accessing field path: ${fieldPath}`, error);
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
          console.warn(`Unknown operator: ${operator}`);
          return false;
      }
    } catch (error) {
      console.warn("Error evaluating condition:", {
        fieldValue,
        operator,
        compareValue,
        error,
      });
      return false;
    }
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

  /**
   * Classify email using AI
   */
  private async classifyEmail(
    emailData: any,
    parameters: any,
    credentialData: any,
  ): Promise<any> {
    const classificationPrompt = `You are an email classification expert. Classify the following email into one of these categories:

CATEGORIES:
1. "support" - Technical support requests, bug reports, account issues, help requests
2. "marketing" - Promotional emails, newsletters, sales pitches, advertisements
3. "general" - Personal messages, business inquiries, general correspondence

EMAIL TO CLASSIFY:
From: ${emailData.from || emailData.sender || "Unknown"}
Subject: ${emailData.subject || "No Subject"}
Body: ${emailData.body || emailData.htmlBody || emailData.textBody || "No Content"}

Return only the category name: support, marketing, or general`;

    try {
      let classificationResult;

      switch (parameters.provider) {
        case "openai":
          classificationResult = await this.callOpenAI(
            { ...parameters, model: parameters.model, maxTokens: 200 },
            classificationPrompt,
            credentialData,
          );
          break;
        case "anthropic":
          classificationResult = await this.callAnthropic(
            { ...parameters, model: parameters.model, maxTokens: 200 },
            classificationPrompt,
            credentialData,
          );
          break;
        case "google":
          classificationResult = await this.callGoogle(
            { ...parameters, model: parameters.model, maxTokens: 200 },
            classificationPrompt,
            credentialData,
          );
          break;
        case "ollama":
          classificationResult = await this.callOllama(
            { ...parameters, model: parameters.model, maxTokens: 200 },
            classificationPrompt,
            credentialData,
          );
          break;
        default:
          throw new Error(
            `Unsupported AI provider for classification: ${parameters.provider}`,
          );
      }

      const classification = (classificationResult.output || "")
        .trim()
        .toLowerCase();
      console.log("Email classification result:", classification);

      return {
        category: ["support", "marketing", "general"].includes(classification)
          ? classification
          : "general",
        confidence: 0.8,
        rawResponse: classificationResult.output,
      };
    } catch (error: any) {
      console.error("Email classification error:", error);
      return {
        category: "general",
        confidence: 0.1,
        error: error.message,
        fallback: true,
      };
    }
  }

  /**
   * Generate email response using AI
   */
  private async generateEmailResponse(
    emailData: any,
    parameters: any,
    credentialData: any,
  ): Promise<any> {
    const responsePrompt = `You are an intelligent email assistant capable of generating personalized, contextual responses. Analyze the email content and generate an appropriate reply.

INSTRUCTIONS:
1. ANALYZE the email's:
   - Intent and purpose (inquiry, request, complaint, proposal, etc.)
   - Tone and formality level
   - Key information and context
   - Required response type

2. GENERATE a professional, contextually appropriate response that:
   - Addresses the main points raised
   - Matches the original email's tone
   - Provides helpful information
   - Includes appropriate greetings and closings
   - Is concise but comprehensive

3. ENSURE your response:
   - Is professional and courteous
   - Addresses all key points from the original email
   - Provides clear next steps if applicable
   - Uses appropriate business language

EMAIL TO RESPOND TO:
From: ${emailData.from || emailData.sender || "Unknown"}
Subject: ${emailData.subject || "No Subject"}
Body: ${emailData.body || emailData.htmlBody || emailData.textBody || "No Content"}

Generate a professional email response:`;

    try {
      const responseParameters = {
        ...parameters,
        maxTokens: Math.min(parameters.maxTokens * 2, 2000), // Allow more tokens for response generation
        temperature: Math.min(parameters.temperature + 0.1, 1.0), // Slightly more creative for responses
      };

      let responseResult;

      switch (parameters.provider) {
        case "openai":
          responseResult = await this.callOpenAI(
            responseParameters,
            responsePrompt,
            credentialData,
          );
          break;
        case "anthropic":
          responseResult = await this.callAnthropic(
            responseParameters,
            responsePrompt,
            credentialData,
          );
          break;
        case "google":
          responseResult = await this.callGoogle(
            responseParameters,
            responsePrompt,
            credentialData,
          );
          break;
        case "ollama":
          responseResult = await this.callOllama(
            responseParameters,
            responsePrompt,
            credentialData,
          );
          break;
        default:
          throw new Error(
            `Unsupported AI provider for response generation: ${parameters.provider}`,
          );
      }

      const generatedResponse =
        responseResult.output || (responseResult as any).text || "";
      console.log(
        "Generated email response:",
        generatedResponse.substring(0, 200) + "...",
      );

      return {
        responseText: generatedResponse,
        generatedAt: new Date().toISOString(),
        provider: parameters.provider,
        model: parameters.model,
        parameters: {
          temperature: responseParameters.temperature,
          maxTokens: responseParameters.maxTokens,
        },
        usage: (responseResult as any).usage,
      };
    } catch (error: any) {
      console.error("Email response generation error:", error);

      // Generate a contextual fallback response
      let fallbackResponse =
        "Thank you for your email. I have received your message and will respond as soon as possible.";

      if (emailData.subject) {
        if (
          emailData.subject.toLowerCase().includes("question") ||
          emailData.subject.includes("?")
        ) {
          fallbackResponse = `Thank you for your question regarding "${emailData.subject}". I have received your inquiry and will provide you with a detailed response shortly.`;
        } else if (emailData.subject.toLowerCase().includes("request")) {
          fallbackResponse = `Thank you for your request concerning "${emailData.subject}". I have received your message and will process your request as soon as possible.`;
        } else {
          fallbackResponse = `Thank you for your email about "${emailData.subject}". I have received your message and will respond promptly.`;
        }
      }

      return {
        responseText: fallbackResponse,
        generatedAt: new Date().toISOString(),
        provider: parameters.provider,
        model: parameters.model,
        error: error.message,
        fallback: true,
      };
    }
  }

  /**
   * Call OpenAI API
   */
  private async callOpenAI(
    parameters: any,
    userPrompt: string,
    credentials: any,
  ) {
    const messages = [];
    if (parameters.systemPrompt) {
      messages.push({ role: "system", content: parameters.systemPrompt });
    }
    messages.push({ role: "user", content: userPrompt });

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${credentials.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: parameters.model,
        messages,
        temperature: parameters.temperature,
        max_tokens: parameters.maxTokens,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        `OpenAI API Error: ${error.error?.message || "Unknown error"}`,
      );
    }

    const data = await response.json();
    return {
      output: data.choices[0].message.content,
      model: parameters.model,
      provider: "openai",
      usage: data.usage,
      metadata: {
        temperature: parameters.temperature,
        maxTokens: parameters.maxTokens,
        timestamp: new Date().toISOString(),
      },
    };
  }

  /**
   * Call Anthropic API
   */
  private async callAnthropic(
    parameters: any,
    userPrompt: string,
    credentials: any,
  ) {
    const messages = [{ role: "user", content: userPrompt }];

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": credentials.apiKey,
        "Content-Type": "application/json",
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: parameters.model,
        max_tokens: parameters.maxTokens,
        temperature: parameters.temperature,
        system: parameters.systemPrompt || undefined,
        messages,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        `Anthropic API Error: ${error.error?.message || "Unknown error"}`,
      );
    }

    const data = await response.json();
    return {
      output: data.content[0].text,
      model: parameters.model,
      provider: "anthropic",
      usage: data.usage,
      metadata: {
        temperature: parameters.temperature,
        maxTokens: parameters.maxTokens,
        timestamp: new Date().toISOString(),
      },
    };
  }

  /**
   * Call Google API
   */
  private async callGoogle(
    parameters: any,
    userPrompt: string,
    credentials: any,
  ) {
    const fullPrompt = parameters.systemPrompt
      ? `${parameters.systemPrompt}\n\n${userPrompt}`
      : userPrompt;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${parameters.model}:generateContent?key=${credentials.apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: fullPrompt }] }],
          generationConfig: {
            temperature: parameters.temperature,
            maxOutputTokens: parameters.maxTokens,
          },
        }),
      },
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        `Google API Error: ${error.error?.message || "Unknown error"}`,
      );
    }

    const data = await response.json();
    return {
      output: data.candidates[0].content.parts[0].text,
      model: parameters.model,
      provider: "google",
      metadata: {
        temperature: parameters.temperature,
        maxTokens: parameters.maxTokens,
        timestamp: new Date().toISOString(),
      },
    };
  }

  /**
   * Call Ollama API
   */
  private async callOllama(
    parameters: any,
    userPrompt: string,
    credentials: any,
  ) {
    const ollamaUrl = parameters.ollamaUrl || "http://localhost:11434";
    const fullPrompt = parameters.systemPrompt
      ? `${parameters.systemPrompt}\n\n${userPrompt}`
      : userPrompt;

    const response = await fetch(`${ollamaUrl}/api/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: parameters.model,
        prompt: fullPrompt,
        stream: false,
        options: {
          temperature: parameters.temperature,
          num_predict: parameters.maxTokens,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama API Error: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      output: data.response,
      model: parameters.model,
      provider: "ollama",
      metadata: {
        temperature: parameters.temperature,
        maxTokens: parameters.maxTokens,
        timestamp: new Date().toISOString(),
      },
    };
  }
}
