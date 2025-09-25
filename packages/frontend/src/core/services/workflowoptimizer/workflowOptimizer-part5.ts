previewChanges: {
  removeNodes: group.slice(1).map((n) => n.id), modifyNodes;
  : [
  {
    nodeId: group[0].id, changes;
    :
    {
      parameters: {
        consolidated: true;
      }
    }
    ,
  }
  ,
              ],
}
,
          },
          estimatedBenefit:
{
  category: 'Performance', description;
  : 'Reduce execution time and resource usage',
            quantified: '20% faster, 15% cost reduction',
}
,
        })
}
    }

return suggestions;
}

  private analyzeApiOptimizations(
    nodes: WorkflowNodeInstance[],
    edges: WorkflowEdge[]
  ): OptimizationSuggestion[]
{
  const suggestions: OptimizationSuggestion[] = [];
  const rule = this.optimizationRules.find((r) => r.id === 'api-batching')!;

  // Find sequential API calls that could be batched
  const apiNodes = nodes.filter(
    (node) =>
      node.type.includes('api') || node.type.includes('http') || node.type.includes('webhook')
  );

  const batchableGroups = this.findBatchableApiCalls(apiNodes, edges);

  for (const group of batchableGroups) {
    if (group.length > 2) {
      suggestions.push({
        id: `api-batch-${group[0].id}`,
        rule,
        targetNodes: group.map((n) => n.id),
        title: 'Batch API Calls',
        description: `${group.length} sequential API calls can be batched`,
        reasoning: 'Batching reduces network overhead and improves performance',
        confidence: 0.8,
        priority: 'medium',
        implementation: {
          type: 'node_replacement',
          instructions: 'Replace sequential API calls with a single batched operation',
        },
        estimatedBenefit: {
          category: 'Performance',
          description: 'Reduce network latency and API costs',
          quantified: '25% faster, 30% cost reduction',
        },
      });
    }
  }

  return suggestions;
}

private
analyzeSecurityImprovements(
    nodes: WorkflowNodeInstance[],
    _edges: WorkflowEdge[]
  )
: OptimizationSuggestion[]
{
  const suggestions: OptimizationSuggestion[] = [];
  const rule = this.optimizationRules.find((r) => r.id === 'credential-security')!;

  // Find nodes with potential security issues
  const securityRisks = nodes.filter((node) => {
    return this.hasSecurityRisk(node);
  });

  if (securityRisks.length > 0) {
    suggestions.push({
      id: 'security-improvements',
      rule,
      targetNodes: securityRisks.map((n) => n.id),
      title: 'Improve Security',
      description: `${securityRisks.length} nodes have potential security risks`,
      reasoning: 'Proper credential management and security practices are essential',
      confidence: 0.9,
      priority: 'critical',
      implementation: {
        type: 'configuration',
        instructions: 'Review and update credential configurations and security settings',
      },
      estimatedBenefit: {
        category: 'Security',
        description: 'Reduce security vulnerabilities',
        quantified: 'Critical security improvements',
      },
    });
  }

  return suggestions;
}
