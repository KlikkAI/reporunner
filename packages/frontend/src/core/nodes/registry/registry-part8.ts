return adaptedNode;
}

  private filterPropertiesByContext(properties: any[], context: ResolvedContext): any[]
{
  // Filter and adapt properties based on mode and capabilities
  return properties.filter((prop) => {
      // Context-aware property filtering logic
      if (prop.displayOptions?.show?.mode) {
        return prop.displayOptions.show.mode.includes(context.mode);
      }
      return true;
    });
}

private
cleanupOldMetrics();
: void
{
  const cutoff = Date.now() - 24 * 60 * 60 * 1000; // 24 hours

  for (const [nodeId, metrics] of this.performanceMetrics) {
    if (metrics.lastExecuted < cutoff) {
      this.performanceMetrics.delete(nodeId);
    }
  }
}
}

// Export singleton instance
export const nodeRegistry = NodeRegistry.getInstance();

// Transform node is now registered automatically via core/nodes/definitions import in main.tsx

// Also export the class for testing purposes
export { NodeRegistry };
