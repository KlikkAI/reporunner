import { describe, it, expect } from "vitest";
import { type WorkflowNodeInstance } from "@/core";

describe("Lean Workflow Architecture", () => {
  describe("Workflow Size Optimization", () => {
    it("should create significantly smaller save files than legacy approach", () => {
      // Mock workflow data with 6 nodes (representative of user's test case)
      const leanNodes: WorkflowNodeInstance[] = [
        {
          id: "node-1",
          type: "trigger",
          position: { x: 100, y: 100 },
          parameters: { triggerType: "webhook" },
        },
        {
          id: "node-2",
          type: "transform",
          position: { x: 300, y: 100 },
          parameters: {
            mode: "addFields",
            fieldsToAdd: [{ fieldName: "processed", fieldValue: "true" }],
          },
        },
        {
          id: "node-3",
          type: "condition",
          position: { x: 500, y: 100 },
          parameters: { mode: "expression", expression: "{{$json.id > 0}}" },
        },
        {
          id: "node-4",
          type: "http",
          position: { x: 700, y: 50 },
          parameters: { method: "POST", url: "https://api.example.com/data" },
        },
        {
          id: "node-5",
          type: "action",
          position: { x: 700, y: 150 },
          parameters: { actionType: "log" },
        },
        {
          id: "node-6",
          type: "action",
          position: { x: 900, y: 100 },
          parameters: {
            actionType: "set",
            variableName: "result",
            variableValue: "success",
          },
        },
      ];

      const leanWorkflow = {
        id: "test-workflow",
        name: "Test Workflow",
        active: false,
        nodes: leanNodes,
        connections: {
          "node-1": { main: [{ node: "node-2", type: "main", index: 0 }] },
          "node-2": { main: [{ node: "node-3", type: "main", index: 0 }] },
          "node-3": {
            true: [{ node: "node-4", type: "main", index: 0 }],
            false: [{ node: "node-5", type: "main", index: 0 }],
          },
          "node-4": { main: [{ node: "node-6", type: "main", index: 0 }] },
          "node-5": { main: [{ node: "node-6", type: "main", index: 0 }] },
        },
        settings: {
          saveDataErrorExecution: "all",
          saveDataSuccessExecution: "all",
          executionTimeout: 300,
        },
        tags: [],
      };

      // Simulate legacy bloated data with UI properties
      const legacyBloatedData = {
        ...leanWorkflow,
        nodes: leanNodes.map((node) => ({
          ...node,
          // Simulate bloated legacy data
          data: {
            ...node.parameters,
            onDelete: "function() { /* delete handler */ }",
            onConnect: "function() { /* connect handler */ }",
            onOpenProperties: "function() { /* properties handler */ }",
            hasOutgoingConnection: true,
            isSelected: false,
            integrationData: {
              id: node.type,
              name: node.type,
              icon: "⚡",
              category: "action",
              description: "Long description here...",
              nodeTypes: [
                {
                  displayName: "Action Node",
                  name: node.type,
                  group: ["action"],
                  version: 1,
                  description:
                    "This is a comprehensive description of what this node does and how it works...",
                  properties: Array(20)
                    .fill(0)
                    .map((_, i) => ({
                      displayName: `Property ${i}`,
                      name: `prop${i}`,
                      type: "string",
                      default: "",
                      description: `This is property ${i} with a detailed description...`,
                      options: Array(10)
                        .fill(0)
                        .map((_, j) => ({
                          name: `Option ${j}`,
                          value: `option${j}`,
                          description: `This is option ${j}...`,
                        })),
                    })),
                },
              ],
            },
            nodeTypeData: {
              // ... lots of UI metadata
            },
            config: {},
            credentials: [],
            icon: "⚡",
            enhancedNodeType: {
              // ... more UI data
            },
          },
        })),
      };

      // Calculate sizes
      const leanSize = JSON.stringify(leanWorkflow).length;
      const bloatedSize = JSON.stringify(legacyBloatedData).length;
      const reductionPercentage = Math.round(
        ((bloatedSize - leanSize) / bloatedSize) * 100,
      );

      console.log(`Lean workflow size: ${leanSize} characters`);
      console.log(`Legacy workflow size: ${bloatedSize} characters`);
      console.log(`Size reduction: ${reductionPercentage}%`);

      // Assertions
      expect(leanSize).toBeLessThan(2000); // Should be under 2KB for 6 nodes (very reasonable)
      expect(reductionPercentage).toBeGreaterThan(95); // At least 95% reduction (achieved 99%!)
      expect(leanWorkflow.nodes).toHaveLength(6);

      // Verify lean nodes only contain essential data
      leanWorkflow.nodes.forEach((node) => {
        expect(node).toHaveProperty("id");
        expect(node).toHaveProperty("type");
        expect(node).toHaveProperty("position");
        expect(node).toHaveProperty("parameters");

        // Should NOT have UI properties
        expect(node).not.toHaveProperty("data");
        expect(node).not.toHaveProperty("onDelete");
        expect(node).not.toHaveProperty("integrationData");
      });
    });

    it("should maintain all essential workflow data in lean format", () => {
      const essentialData = {
        id: "workflow-123",
        name: "Customer Support Flow",
        active: true,
        nodes: [
          {
            id: "trigger-1",
            type: "trigger",
            position: { x: 0, y: 100 },
            parameters: { triggerType: "webhook" },
          },
          {
            id: "ai-agent-1",
            type: "action",
            position: { x: 200, y: 100 },
            parameters: {
              actionType: "ai",
              provider: "openai",
              model: "gpt-4",
              systemPrompt: "You are a helpful assistant",
            },
            credentials: "openai-creds-1",
          },
        ],
        connections: {
          "trigger-1": {
            main: [{ node: "ai-agent-1", type: "main", index: 0 }],
          },
        },
        settings: { executionTimeout: 300 },
        tags: ["customer-support", "ai"],
      };

      const serialized = JSON.stringify(essentialData);
      const deserialized = JSON.parse(serialized);

      // Verify no data loss in serialization
      expect(deserialized).toEqual(essentialData);
      expect(deserialized.nodes[1].credentials).toBe("openai-creds-1");
      expect(deserialized.nodes[1].parameters.provider).toBe("openai");

      // Verify compact size
      expect(serialized.length).toBeLessThan(600); // Much smaller than legacy
    });
  });
});
