import type { EnhancedIntegrationNodeType } from "@/core/nodes/types";
import { modelTrainerProperties } from "./properties";
import { modelTrainerCredentials } from "./credentials";
import { modelTrainerActions } from "./actions";

export const modelTrainerNode: EnhancedIntegrationNodeType = {
  id: "model-trainer",
  name: "Model Trainer",
  description:
    "Train and fine-tune AI/ML models with advanced configuration options",
  type: "ai-agent",
  category: "AI/ML",
  subcategory: "Training",
  icon: "🤖",
  configuration: {
    properties: modelTrainerProperties,
    credentials: modelTrainerCredentials,
    polling: {
      active: true,
      interval: 5000, // Check training status every 5 seconds
    },
  },
  inputs: [
    {
      type: "main",
      displayName: "Training Data",
      required: true,
    },
    {
      type: "ai_dataset",
      displayName: "Dataset",
      required: false,
    },
  ],
  outputs: [
    {
      type: "main",
      displayName: "Trained Model",
    },
    {
      type: "ai_model",
      displayName: "Model Output",
    },
    {
      type: "main",
      displayName: "Training Metrics",
    },
  ],
  codex: {
    categories: ["AI/ML", "Training", "Models"],
    subcategories: {
      "AI/ML": ["Training", "Fine-tuning", "Hyperparameters"],
      Models: ["Neural Networks", "Transformers", "Vision Models"],
    },
  },
  ...modelTrainerActions,
};
