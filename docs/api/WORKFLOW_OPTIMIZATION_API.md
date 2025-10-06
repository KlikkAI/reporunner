# Workflow Optimization API Documentation

## Overview

The Workflow Optimization API provides AI-powered analysis and optimization suggestions for workflows. It leverages machine learning and large language models to identify performance bottlenecks, reliability issues, cost optimization opportunities, and maintainability improvements.

## Base URL

```
/api/workflow-optimization
```

## Authentication

All endpoints require authentication via JWT token in the Authorization header:

```
Authorization: Bearer <jwt_token>
```

## Endpoints

### Workflow Analysis

#### `POST /analyze`

Analyze a workflow and get comprehensive optimization suggestions.

**Request Body:**
```json
{
  "workflowId": "workflow-123",
  "nodes": [
    {
      "id": "node-1",
      "type": "http-request",
      "name": "Fetch User Data",
      "config": {
        "url": "https://api.example.com/users",
        "method": "GET",
        "timeout": 30000
      },
      "connections": ["node-2"],
      "executionTime": 2500,
      "errorRate": 0.02
    },
    {
      "id": "node-2",
      "type": "data-transform",
      "name": "Process User Data",
      "config": {
        "transformation": "user.name + ' - ' + user.email"
      },
      "connections": ["node-3"],
      "executionTime": 150,
      "errorRate": 0.001
    }
  ],
  "executionHistory": [
    {
      "executionId": "exec-1",
      "startTime": "2024-01-01T10:00:00Z",
      "endTime": "2024-01-01T10:00:05Z",
      "status": "success",
      "nodeExecutions": [
        {
          "nodeId": "node-1",
          "duration": 2500,
          "status": "success"
        },
        {
          "nodeId": "node-2",
          "duration": 150,
          "status": "success"
        }
      ]
    }
  ],
  "metrics": {
    "totalExecutions": 1000,
    "successRate": 0.94,
    "averageExecutionTime": 2800,
    "errorCount": 60
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "workflowId": "workflow-123",
    "analysisDate": "2024-01-15T10:00:00Z",
    "overallScore": 75,
    "suggestions": [
      {
        "id": "perf-001",
        "type": "performance",
        "priority": "high",
        "title": "Optimize HTTP request timeout",
        "description": "The HTTP request node has a high timeout value that may be causing delays.",
        "impact": {
          "performanceImprovement": 30,
          "costReduction": 15
        },
        "implementation": {
          "difficulty": "easy",
          "estimatedTime": "30 minutes",
          "steps": [
            "Reduce timeout from 30s to 10s",
            "Add retry logic with exponential backoff",
            "Monitor success rates after change"
          ],
          "codeChanges": [
            {
              "nodeId": "node-1",
              "changes": {
                "timeout": 10000,
                "retries": 3,
                "retryDelay": 1000
              }
            }
          ]
        },
        "reasoning": "High timeout values can cause unnecessary delays when services are slow to respond."
      },
      {
        "id": "rel-001",
        "type": "reliability",
        "priority": "medium",
        "title": "Add error handling to data transformation",
        "description": "The data transformation node lacks proper error handling for malformed data.",
        "impact": {
          "reliabilityImprovement": 25
        },
        "implementation": {
          "difficulty": "medium",
          "estimatedTime": "1-2 hours",
          "steps": [
            "Add try-catch blocks around transformation logic",
            "Validate input data structure",
            "Provide fallback values for missing fields",
            "Log transformation errors for debugging"
          ]
        },
        "reasoning": "Proper error handling prevents workflow failures when processing unexpected data formats."
      }
    ],
    "metrics": {
      "currentPerformance": 75,
      "potentialImprovement": 25,
      "estimatedCostSavings": 20
    },
    "summary": "Your workflow shows good overall performance but has opportunities for optimization in HTTP timeouts and error handling. Implementing the suggested changes could improve performance by 25% and reduce costs by 20%."
  }
}
```

### Optimization Suggestions

#### `GET /suggestions/:workflowId`

Get cached optimization suggestions for a workflow.

**Response:**
```json
{
  "success": true,
  "data": {
    "workflowId": "workflow-123",
    "suggestions": [
      {
        /* suggestion objects */
      }
    ],
    "lastAnalyzed": "2024-01-15T10:00:00Z"
  }
}
```

#### `POST /apply-suggestion`

Apply an optimization suggestion to a workflow.

**Request Body:**
```json
{
  "workflowId": "workflow-123",
  "suggestionId": "perf-001",
  "autoApply": false
}
```

**Response:**
```json
{
  "success": true,
  "message": "Optimization suggestion applied successfully",
  "data": {
    "workflowId": "workflow-123",
    "suggestionId": "perf-001",
    "appliedAt": "2024-01-15T10:30:00Z",
    "backupId": "backup-1705315800000"
  }
}
```

### Performance Metrics

#### `GET /metrics/:workflowId`

Get performance metrics for a workflow.

**Query Parameters:**
- `timeRange` (string, optional): Time range for metrics (`1d`, `7d`, `30d`, default: `7d`)

**Response:**
```json
{
  "success": true,
  "data": {
    "workflowId": "workflow-123",
    "timeRange": "7d",
    "metrics": {
      "totalExecutions": 150,
      "successRate": 0.94,
      "averageExecutionTime": 2500,
      "errorCount": 9,
      "performanceTrend": "improving",
      "reliabilityTrend": "stable"
    },
    "chartData": {
      "executionTimes": [
        {
          "date": "2024-01-01",
          "avgTime": 2800
        },
        {
          "date": "2024-01-02",
          "avgTime": 2600
        },
        {
          "date": "2024-01-03",
          "avgTime": 2500
        }
      ],
      "successRates": [
        {
          "date": "2024-01-01",
          "rate": 0.92
        },
        {
          "date": "2024-01-02",
          "rate": 0.95
        },
        {
          "date": "2024-01-03",
          "rate": 0.94
        }
      ]
    }
  }
}
```

### Batch Operations

#### `POST /batch-analyze`

Analyze multiple workflows in batch.

**Request Body:**
```json
{
  "workflowIds": ["workflow-1", "workflow-2", "workflow-3"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "batchId": "batch-1705315800000",
    "workflowIds": ["workflow-1", "workflow-2", "workflow-3"],
    "status": "queued",
    "estimatedCompletionTime": "2024-01-15T10:35:00Z",
    "jobs": [
      {
        "workflowId": "workflow-1",
        "status": "queued",
        "jobId": "job-workflow-1-1705315800000"
      },
      {
        "workflowId": "workflow-2",
        "status": "queued",
        "jobId": "job-workflow-2-1705315800000"
      },
      {
        "workflowId": "workflow-3",
        "status": "queued",
        "jobId": "job-workflow-3-1705315800000"
      }
    ]
  }
}
```

#### `GET /batch-status/:batchId`

Get status of batch analysis.

**Response:**
```json
{
  "success": true,
  "data": {
    "batchId": "batch-1705315800000",
    "status": "completed",
    "progress": 100,
    "completedAt": "2024-01-15T10:35:00Z",
    "results": [
      {
        "workflowId": "workflow-1",
        "status": "completed",
        "overallScore": 85,
        "suggestionsCount": 3
      },
      {
        "workflowId": "workflow-2",
        "status": "completed",
        "overallScore": 72,
        "suggestionsCount": 5
      },
      {
        "workflowId": "workflow-3",
        "status": "failed",
        "error": "Insufficient execution data"
      }
    ]
  }
}
```

## Optimization Types

### Performance Optimization
- **Bottleneck Detection**: Identifies slow-running nodes and operations
- **Parallel Processing**: Suggests opportunities for parallel execution
- **Caching**: Recommends caching strategies for expensive operations
- **Resource Usage**: Analyzes memory and CPU usage patterns

### Reliability Enhancement
- **Error Handling**: Identifies missing error handling and retry logic
- **Circuit Breakers**: Suggests circuit breaker patterns for external services
- **Input Validation**: Recommends data validation and sanitization
- **Timeout Configuration**: Optimizes timeout values for better reliability

### Cost Optimization
- **Resource Efficiency**: Identifies wasteful resource usage
- **API Call Reduction**: Suggests ways to reduce expensive API calls
- **Caching Strategies**: Recommends caching to reduce costs
- **Duplicate Operations**: Identifies and suggests elimination of redundant operations

### Maintainability Improvement
- **Code Quality**: Analyzes code complexity and suggests simplifications
- **Naming Conventions**: Recommends better naming for nodes and variables
- **Documentation**: Suggests areas needing better documentation
- **Modularization**: Recommends breaking down complex workflows

## Scoring System

The optimization system uses a 0-100 scoring system:

- **90-100**: Excellent - Well-optimized workflow with minimal issues
- **80-89**: Good - Minor optimization opportunities
- **70-79**: Fair - Several optimization opportunities
- **60-69**: Poor - Significant optimization needed
- **0-59**: Critical - Major issues requiring immediate attention

## AI Integration

The optimization engine leverages AI/LLM capabilities for:

- **Pattern Recognition**: Identifying common anti-patterns and optimization opportunities
- **Context-Aware Suggestions**: Providing suggestions based on workflow context and purpose
- **Natural Language Explanations**: Generating human-readable explanations for suggestions
- **Best Practice Recommendations**: Suggesting industry best practices

## Error Responses

```json
{
  "success": false,
  "error": "Error message",
  "details": ["Additional error details"]
}
```

## HTTP Status Codes

- `200` - Success
- `400` - Bad Request (invalid workflow data)
- `401` - Unauthorized (authentication required)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found (workflow not found)
- `429` - Too Many Requests (rate limited)
- `500` - Internal Server Error

## Rate Limiting

- Analysis endpoints: 10 requests per minute per user
- Metrics endpoints: 60 requests per minute per user
- Batch operations: 5 requests per minute per user

## Examples

### Analyze a Workflow
```bash
curl -X POST "/api/workflow-optimization/analyze" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "workflowId": "workflow-123",
    "nodes": [...],
    "executionHistory": [...],
    "metrics": {...}
  }'
```

### Get Workflow Metrics
```bash
curl -X GET "/api/workflow-optimization/metrics/workflow-123?timeRange=7d" \
  -H "Authorization: Bearer <token>"
```

### Apply Optimization Suggestion
```bash
curl -X POST "/api/workflow-optimization/apply-suggestion" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "workflowId": "workflow-123",
    "suggestionId": "perf-001",
    "autoApply": false
  }'
```

### Batch Analyze Workflows
```bash
curl -X POST "/api/workflow-optimization/batch-analyze" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "workflowIds": ["workflow-1", "workflow-2", "workflow-3"]
  }'
```

## Integration with Frontend

Use the optimization features in your React components:

```typescript
import { useWorkflowOptimization } from '@/hooks/useWorkflowOptimization';

const OptimizationDashboard = ({ workflowId }) => {
  const {
    analyzeWorkflow,
    suggestions,
    metrics,
    loading
  } = useWorkflowOptimization();

  const handleAnalyze = async () => {
    await analyzeWorkflow(workflowData);
  };

  return (
    <div>
      <button onClick={handleAnalyze} disabled={loading}>
        Analyze Workflow
      </button>
      {suggestions.map(suggestion => (
        <OptimizationSuggestion key={suggestion.id} suggestion={suggestion} />
      ))}
    </div>
  );
};
```
