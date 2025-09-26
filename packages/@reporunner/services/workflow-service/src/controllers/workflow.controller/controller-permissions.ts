workflow.permissions.roles[userId]?.includes('editor');
)
}

  private hasSharePermission(workflow: WorkflowDefinition, userId: string): boolean
{
  return (
      workflow.createdBy === userId ||
      workflow.permissions.roles[userId]?.includes('admin')
    );
}

private
incrementMajorVersion(version: string)
: string
{
  const parts = version.split('.');
  const major = parseInt(parts[0]) + 1;
  return `${major}.0.0`;
}
}
