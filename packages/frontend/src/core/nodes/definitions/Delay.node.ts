/* eslint-disable @typescript-eslint/no-explicit-any */
import type {
  INodeType,
  INodeTypeDescription,
  INodeExecutionData,
} from "../types";

export class DelayNode implements INodeType {
  description: INodeTypeDescription = {
    displayName: "Delay",
    name: "delay",
    icon: "⏳",
    group: ["utility"],
    version: 1,
    description: "Pauses the workflow execution for a specified amount of time",
    defaults: {
      name: "Delay",
      color: "#9ca3af",
    },
    inputs: ["main"],
    outputs: ["main"],
    properties: [
      {
        displayName: "Amount",
        name: "amount",
        type: "number",
        default: 1,
        required: true,
        min: 0,
        description: "The amount of time to delay",
      },
      {
        displayName: "Unit",
        name: "unit",
        type: "options",
        default: "seconds",
        required: true,
        options: [
          {
            name: "Milliseconds",
            value: "milliseconds",
          },
          {
            name: "Seconds",
            value: "seconds",
          },
          {
            name: "Minutes",
            value: "minutes",
          },
          {
            name: "Hours",
            value: "hours",
          },
        ],
        description: "The unit of time for the delay",
      },
    ],
    categories: ["Core Nodes"],
  };

  async execute(this: any): Promise<INodeExecutionData[][]> {
    const inputData = this.getInputData();
    const amount = this.getNodeParameter("amount", 1) as number;
    const unit = this.getNodeParameter("unit", "seconds") as string;

    // Calculate delay in milliseconds
    let delayMs = amount;
    switch (unit) {
      case "seconds":
        delayMs = amount * 1000;
        break;
      case "minutes":
        delayMs = amount * 60 * 1000;
        break;
      case "hours":
        delayMs = amount * 60 * 60 * 1000;
        break;
      case "milliseconds":
      default:
        delayMs = amount;
        break;
    }

    // Wait for the specified delay
    await new Promise((resolve) => setTimeout(resolve, delayMs));

    // Return the input data unchanged
    return inputData;
  }
}
