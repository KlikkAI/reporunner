const hasIncoming = edges.some((edge) => edge.target === node.id);
// const hasOutgoing = edges.some(edge => edge.source === node.id)
const isTrigger = node.type === 'trigger';

return !isTrigger && !hasIncoming;
})

if (disconnectedNodes.length > 0) {
  warnings.push(`${disconnectedNodes.length} nodes are not connected to the workflow`);
}

// Check credentials
const nodesWithoutCredentials = nodes.filter((node) => {
  const needsCredentials = ['gmail', 'ai-agent', 'ollama', 'pgvector'].includes(
    node.data.integration
  );
  return needsCredentials && !node.data.credentials;
});

if (nodesWithoutCredentials.length > 0) {
  errors.push('Some nodes are missing required credentials');
}

return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}
