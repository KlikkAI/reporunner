})
}

// Apply edge additions and removals
if (previewChanges.addEdges) {
  previewChanges.addEdges.forEach((edgeData) => {
    const newEdge: WorkflowEdge = {
      id: `opt-edge-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      source: edgeData.source || '',
      target: edgeData.target || '',
      sourceHandle: edgeData.sourceHandle,
      targetHandle: edgeData.targetHandle,
      data: edgeData.data,
    };
    optimizedEdges.push(newEdge);
  });
}

if (previewChanges.removeEdges) {
  optimizedEdges = optimizedEdges.filter((edge) => !previewChanges.removeEdges?.includes(edge.id));
}
}

return { nodes: optimizedNodes, edges: optimizedEdges };
}

  private generateOptimizationSummary(
    appliedIds: string[],
    suggestions: OptimizationSuggestion[]
  ): string
{
  const appliedSuggestions = suggestions.filter((s) => appliedIds.includes(s.id));
  const categories = appliedSuggestions.reduce(
    (acc, s) => {
      acc[s.rule.category] = (acc[s.rule.category] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const summary = Object.entries(categories)
    .map(([category, count]) => `${count} ${category} optimization${count > 1 ? 's' : ''}`)
    .join(', ');

  return `Applied ${appliedSuggestions.length} optimization${appliedSuggestions.length > 1 ? 's' : ''}: ${summary}`;
}
}

// Export singleton instance
export const workflowOptimizer = new WorkflowOptimizer();
