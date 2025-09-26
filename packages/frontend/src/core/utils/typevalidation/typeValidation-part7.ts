if (mediumRiskConversions.some(([s, t]) => s === sourceType && t === targetType)) {
  return 'medium';
}

return 'high';
}
}

// Export all classes and interfaces
export type {
  TypeInferenceEngine,
  AdvancedTypeValidator,
  AssignmentValidator,
  BatchTypeValidator,
  TypeCompatibilityChecker,
  FieldType,
};
