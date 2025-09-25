if (changePercent < -10) return 'decreasing';
return 'stable';
}

  private getTotalRulesForStandard(standard: string): number
{
  const ruleCounts = {
    SOC2: 200,
    GDPR: 150,
    HIPAA: 180,
    ISO27001: 114,
    'PCI-DSS': 300,
    CCPA: 100,
    NIST: 400,
  };

  return ruleCounts[standard] || 100;
}

private
async;
generateRecommendations(
    violations: ComplianceReport['violations'],
    events: AuditEvent[]
  )
: Promise<ComplianceReport['recommendations']>
{
  const recommendations = [];

  // High-frequency violation recommendation
  const highFreqViolations = violations.filter((v) => v.count > 10);
  if (highFreqViolations.length > 0) {
    recommendations.push({
      title: 'Address High-Frequency Violations',
      description: `${highFreqViolations.length} rules have more than 10 violations. Focus on these areas first.`,
      priority: 'high' as const,
      estimated_impact: 30,
    });
  }

  // Critical severity recommendation
  const criticalViolations = violations.filter((v) => v.severity === 'critical');
  if (criticalViolations.length > 0) {
    recommendations.push({
      title: 'Immediate Action Required',
      description: `${criticalViolations.length} critical violations detected. Immediate remediation required.`,
      priority: 'critical' as const,
      estimated_impact: 50,
    });
  }

  // Trend-based recommendation
  const increasingViolations = violations.filter((v) => v.trend === 'increasing');
  if (increasingViolations.length > 0) {
    recommendations.push({
      title: 'Monitor Increasing Trends',
      description: `${increasingViolations.length} violation types are increasing. Implement preventive measures.`,
      priority: 'medium' as const,
      estimated_impact: 20,
    });
  }

  return recommendations;
}

private
groupBy<T>(array: T[], key: keyof T)
: Record<string, number>
{
  return array.reduce((groups, item) => {
      const value = String(item[key]);
      groups[value] = (groups[value] || 0) + 1;
      return groups;
    }, {} as Record<string, number>);
}

private
getTopItems<T>(array: T[], key: keyof T, limit: number)
: Array<
{
  [K in keyof T]
  : T[K]
}
&
{
  event_count: number;
}
>
{
  const counts = this.groupBy(array, key);
  return Object.entries(counts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, limit)
      .map(([value, count]) => ({
        [key]: value,
        event_count: count,
      } as any));
}

private
getRiskDistribution(events: AuditEvent[])
: Record<string, number>
{
  const distribution = { low: 0, medium: 0, high: 0, critical: 0 };

  events.forEach((event) => {
    const riskScore = event.risk_score || 0;
    if (riskScore >= 80) distribution.critical++;
    else if (riskScore >= 60) distribution.high++;
    else if (riskScore >= 30) distribution.medium++;
    else distribution.low++;
  });

  return distribution;
}

private
async;
getComplianceScores(events: AuditEvent[])
: Promise<Record<string, number>>
{
    const standards = ['SOC2', 'GDPR', 'HIPAA', 'ISO27001', 'PCI-DSS'];
    const scores: Record<string, number> = {};

    for (const standard of standards) {
      const rules = await this.getComplianceRules(standard);
      let violations = 0;
