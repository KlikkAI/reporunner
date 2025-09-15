/* eslint-disable @typescript-eslint/no-explicit-any */
import type {
  INodeType,
  INodeTypeDescription,
  INodeExecutionData,
} from "../types";

export class LoopNode implements INodeType {
  description: INodeTypeDescription = {
    displayName: "Loop",
    name: "loop",
    icon: "🔄",
    group: ["utility"],
    version: 1,
    description: "Executes the connected nodes multiple times in a loop",
    defaults: {
      name: "Loop",
      color: "#8b5cf6",
    },
    inputs: ["main"],
    outputs: ["main"],
    properties: [
      {
        displayName: "Mode",
        name: "mode",
        type: "options",
        default: "count",
        required: true,
        options: [
          {
            name: "Run Fixed Number of Times",
            value: "count",
            description: "Execute a specific number of iterations",
          },
          {
            name: "Loop Over Items",
            value: "items",
            description: "Execute once for each input item",
          },
          {
            name: "While Condition",
            value: "condition",
            description: "Execute while a condition is true",
          },
        ],
        description: "How to determine the number of loop iterations",
      },
      {
        displayName: "Count",
        name: "count",
        type: "number",
        default: 5,
        required: true,
        min: 1,
        displayOptions: {
          show: {
            mode: ["count"],
          },
        },
        description: "Number of times to execute the loop",
      },
      {
        displayName: "Condition",
        name: "condition",
        type: "expression",
        default: "{{$iteration < 10}}",
        displayOptions: {
          show: {
            mode: ["condition"],
          },
        },
        description: "Expression that determines when to continue looping",
      },
      {
        displayName: "Max Iterations",
        name: "maxIterations",
        type: "number",
        default: 100,
        min: 1,
        displayOptions: {
          show: {
            mode: ["condition"],
          },
        },
        description: "Maximum number of iterations to prevent infinite loops",
      },
    ],
    categories: ["Core Nodes"],
  };

  async execute(this: any): Promise<INodeExecutionData[][]> {
    const inputData = this.getInputData();
    const mode = this.getNodeParameter("mode", "count") as string;

    let iterations = 0;
    let maxIterations = 100;
    const results: INodeExecutionData[] = [];

    switch (mode) {
      case "count": {
        const count = this.getNodeParameter("count", 5) as number;
        iterations = count;
        break;
      }
      case "items": {
        iterations = inputData.length;
        break;
      }
      case "condition": {
        maxIterations = this.getNodeParameter("maxIterations", 100) as number;
        iterations = maxIterations; // Will be controlled by condition
        break;
      }
    }

    // Execute loop iterations
    for (let i = 0; i < iterations; i++) {
      if (mode === "condition") {
        // Mock condition evaluation - in real implementation would evaluate expression
        if (i >= 10) break; // Simple mock condition
      }

      // Process data for this iteration
      if (mode === "items") {
        results.push({
          json: {
            ...(inputData[i]?.json || {}),
            $iteration: i,
            $total: iterations,
          },
        });
      } else {
        // For count and condition modes, process all input data each iteration
        inputData.forEach((item: INodeExecutionData) => {
          results.push({
            json: {
              ...item.json,
              $iteration: i,
              $total: iterations,
            },
          });
        });
      }
    }

    return [results];
  }
}
