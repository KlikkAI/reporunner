import type { EnhancedIntegrationNodeType } from "@/core/types/nodes";
import { mlPipelineProperties } from "./properties";
import { mlPipelineCredentials } from "./credentials";
import { mlPipelineActions } from "./actions";

export const mlPipelineNode: EnhancedIntegrationNodeType = {
  id: "ml-pipeline",
  name: "ML Pipeline Orchestrator",
  description:
    "Orchestrate end-to-end machine learning pipelines with data preprocessing, training, validation, and deployment",
  type: "ai-agent",
  category: "AI/ML",
  subcategory: "MLOps",
  icon: "🔄",
  configuration: {
    properties: mlPipelineProperties,
    credentials: mlPipelineCredentials,
    polling: {
      active: true,
      interval: 10000, // Check pipeline status every 10 seconds
    },
  },
  inputs: [
    {
      type: "main",
      displayName: "Raw Data",
      required: true,
    },
    {
      type: "ai_model",
      displayName: "Pre-trained Model",
      required: false,
    },
    {
      type: "main",
      displayName: "Pipeline Config",
      required: false,
    },
  ],
  outputs: [
    {
      type: "main",
      displayName: "Pipeline Results",
    },
    {
      type: "ai_model",
      displayName: "Trained Model",
    },
    {
      type: "main",
      displayName: "Deployment Info",
    },
    {
      type: "main",
      displayName: "Pipeline Metrics",
    },
  ],
  codex: {
    categories: ["AI/ML", "MLOps", "Pipelines"],
    subcategories: {
      "AI/ML": ["Pipelines", "Automation", "Orchestration"],
      MLOps: ["CI/CD", "Deployment", "Monitoring"],
    },
  },
  ...mlPipelineActions,
};
