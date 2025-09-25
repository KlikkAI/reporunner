return value;
}

  private initializeDefaultPolicies(): void
{
  // Standard retention policies for different compliance requirements
  this.policies.push(
    {
      id: 'default-security',
      name: 'Security Events',
      description: 'Retain security-related events for 7 years',
      retentionPeriodDays: 2555, // 7 years
      category: 'security',
      archiveBeforeDelete: true,
    },
    {
      id: 'default-access',
      name: 'Access Logs',
      description: 'Retain access logs for 1 year',
      retentionPeriodDays: 365,
      category: 'access',
      archiveBeforeDelete: true,
    },
    {
      id: 'default-operational',
      name: 'Operational Events',
      description: 'Retain operational events for 90 days',
      retentionPeriodDays: 90,
      category: 'operational',
      archiveBeforeDelete: false,
    }
  );
}

private
generateId();
: string
{
  return Math.random().toString(36).substr(2, 9);
}
}
