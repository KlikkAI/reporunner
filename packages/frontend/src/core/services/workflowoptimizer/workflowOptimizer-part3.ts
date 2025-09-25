appliedOptimizations: string[];
summary: string;
}>
{
  const report = await this.analyzeWorkflow(nodes, edges);
  const applicableSuggestions = report.optimizationSuggestions.filter(
    (s) => suggestionIds.includes(s.id) && s.rule.automatable
  );

  let optimizedNodes = [...nodes];
  let optimizedEdges = [...edges];
  const appliedOptimizations: string[] = [];

  for (const suggestion of applicableSuggestions) {
    try {
      const result = await this.applySingleOptimization(optimizedNodes, optimizedEdges, suggestion);

      optimizedNodes = result.nodes;
      optimizedEdges = result.edges;
      appliedOptimizations.push(suggestion.id);
    } catch (_error) {}
  }

  return {
      optimizedNodes,
      optimizedEdges,
      appliedOptimizations,
      summary: this.generateOptimizationSummary(appliedOptimizations, applicableSuggestions),
    };
}

private
calculateWorkflowStats(nodes: WorkflowNodeInstance[], edges: WorkflowEdge[])
{
  const totalNodes = nodes.length;
  const totalEdges = edges.length;

  // Calculate complexity based on nodes, edges, and branching
  const branchingFactor = this.calculateBranchingFactor(nodes, edges);
  const complexity = this.determineComplexity(totalNodes, totalEdges, branchingFactor);

  // Estimate execution time (simplified)
  const estimatedExecutionTime = this.estimateExecutionTime(nodes, edges);

  // Find parallelization opportunities
  const parallelizationOpportunities = this.findParallelizationOpportunities(nodes, edges);

  return {
      totalNodes,
      totalEdges,
      complexity,
      estimatedExecutionTime,
      parallelizationOpportunities,
    };
}

private
async;
generateOptimizationSuggestions(
    nodes: WorkflowNodeInstance[],
    edges: WorkflowEdge[]
  )
: Promise<OptimizationSuggestion[]>
{
  const suggestions: OptimizationSuggestion[] = [];

  // Analyze for parallel execution opportunities
  const parallelSuggestions = this.analyzeParallelExecution(nodes, edges);
  suggestions.push(...parallelSuggestions);

  // Analyze for error handling improvements
  const errorHandlingSuggestions = this.analyzeErrorHandling(nodes, edges);
  suggestions.push(...errorHandlingSuggestions);

  // Analyze for duplicate operations
  const duplicateSuggestions = this.analyzeDuplicateOperations(nodes, edges);
  suggestions.push(...duplicateSuggestions);

  // Analyze for API optimization opportunities
  const apiSuggestions = this.analyzeApiOptimizations(nodes, edges);
  suggestions.push(...apiSuggestions);

  // Analyze for security improvements
  const securitySuggestions = this.analyzeSecurityImprovements(nodes, edges);
  suggestions.push(...securitySuggestions);

  return suggestions.filter((s) => s.confidence > 0.5); // Only high-confidence suggestions
}

private
analyzeParallelExecution(
    nodes: WorkflowNodeInstance[],
    edges: WorkflowEdge[]
  )
: OptimizationSuggestion[]
{
    const suggestions: OptimizationSuggestion[] = [];

    // Find nodes that could be parallelized
    const independentNodeGroups = this.findIndependentNodeGroups(nodes, edges);

    for (const group of independentNodeGroups) {
      if (group.length > 1) {
        const rule = this.optimizationRules.find((r) => r.id === 'parallel-execution')!;

        suggestions.push({
