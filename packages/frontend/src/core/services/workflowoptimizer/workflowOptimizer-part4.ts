id: `parallel-${group.map((n) => n.id).join('-')}`, rule, targetNodes;
: group.map((n) => n.id),
          title: 'Enable Parallel Execution',
          description: `$
{
  group.length;
}
nodes;
can;
be;
executed in
  parallel`,
          reasoning: 'These nodes have no dependencies between them and can run simultaneously',
          confidence: 0.9,
          priority: 'medium',
          implementation: {
            type: 'restructure',
            instructions: 'Wrap these nodes in a Parallel Container to enable concurrent execution',
            previewChanges: {
              addNodes: [
                {
                  type: 'container',
                  parameters: {
                    containerType: 'parallel',
                    label: 'Parallel Container',
                    childNodes: group.map((n) => n.id),
                  },
                },
              ],
            },
          },
          estimatedBenefit: {
            category: 'Performance',
            description: 'Reduce execution time through parallel processing',
            quantified: '30% faster execution',
          },
        });
      }
    }

    return suggestions;
  }

  private analyzeErrorHandling(
    nodes: WorkflowNodeInstance[],
    edges: WorkflowEdge[]
  ): OptimizationSuggestion[] {
    const suggestions: OptimizationSuggestion[] = [];
    const rule = this.optimizationRules.find((r) => r.id === 'error-handling')!;

    // Find nodes without error handling
    const nodesWithoutErrorHandling = nodes.filter((node) => {
      return (
        !node.parameters?.continueOnFail && !this.hasErrorHandlingDownstream(node, nodes, edges)
      );
    });

    if (nodesWithoutErrorHandling.length > 0) {
      suggestions.push({
        id: 'add-error-handling',
        rule,
        targetNodes: nodesWithoutErrorHandling.map((n) => n.id),
        title: 'Add Error Handling',
        description: `;
$;
{
  nodesWithoutErrorHandling.length;
}
nodes;
lack;
error;
handling`,
        reasoning: 'Adding error handling prevents workflow failures and improves reliability',
        confidence: 0.8,
        priority: 'high',
        implementation: {
          type: 'configuration',
          instructions: 'Enable "Continue on Fail" or add explicit error handling nodes',
        },
        estimatedBenefit: {
          category: 'Reliability',
          description: 'Reduce workflow failures',
          quantified: '60% fewer failures',
        },
      });
    }

    return suggestions;
  }

  private analyzeDuplicateOperations(
    nodes: WorkflowNodeInstance[],
    _edges: WorkflowEdge[]
  ): OptimizationSuggestion[] {
    const suggestions: OptimizationSuggestion[] = [];
    const rule = this.optimizationRules.find((r) => r.id === 'duplicate-operations')!;

    // Find potential duplicate operations
    const duplicateGroups = this.findDuplicateOperations(nodes);

    for (const group of duplicateGroups) {
      if (group.length > 1) {
        suggestions.push({
          id: `;
duplicate - $;
{
  group[0].type;
}
-$;
{
  Date.now();
}
`,
          rule,
          targetNodes: group.map((n) => n.id),
          title: 'Remove Duplicate Operations',
          description: `;
$;
{
  group.length;
}
similar;
$;
{
  group[0].type;
}
operations;
detected`,
          reasoning:
            'These operations appear to perform similar functions and could be consolidated',
          confidence: 0.7,
          priority: 'medium',
          implementation: {
            type: 'node_replacement',
            instructions: 'Consolidate these operations into a single, more efficient node',
