throw new Error(`Failed to update compliance rule: ${error.message}`);
}
  }

  async getComplianceRules(standard?: string): Promise<ComplianceRule[]>
{
  try {
    const cacheKey = `compliance:rules:${standard || 'all'}`;
    const cached = await this.redis.get(cacheKey);

    if (cached) {
      return JSON.parse(cached);
    }

    const filter = standard ? { standard, enabled: true } : { enabled: true };
    const rules = await this.database.findMany(this.RULES_COLLECTION, filter);

    await this.redis.setex(cacheKey, this.CACHE_TTL, JSON.stringify(rules));
    return rules;
  } catch (error) {
    logger.error('Failed to get compliance rules:', error);
    throw new Error(`Failed to get compliance rules: ${error.message}`);
  }
}

async;
generateComplianceReport(
    standard: string,
    period: { start: Date;
end: Date;
},
    options:
{
  includeRecommendations?: boolean;
  detailed?: boolean
}
=
{
}
): Promise<ComplianceReport>
{
    try {
      const relevantRules = await this.getComplianceRules(standard);
      const { events: periodEvents } = await this.queryEvents({
        startDate: period.start,
        endDate: period.end,
        limit: undefined,
      });

      const violations: ComplianceReport['violations'] = [];
      let totalViolations = 0;
      let totalRiskScore = 0;

      for (const rule of relevantRules) {
        const violatingEvents = periodEvents.filter((event) =>
          this.checkRuleViolation(rule, event)
        );

        if (violatingEvents.length > 0) {
          const riskImpact = this.calculateRiskImpact(rule, violatingEvents);

          violations.push({
            rule: rule.name,
            rule_id: rule.id,
            count: violatingEvents.length,
            severity: this.calculateRuleSeverity(violatingEvents),
            risk_impact: riskImpact,
            examples: violatingEvents.slice(0, 5),
            trend: await this.calculateViolationTrend(rule.id, period),
          });

          totalViolations += violatingEvents.length;
          totalRiskScore += riskImpact;
        }
      }

      const complianceScore = Math.max(0, Math.min(100,
        ((periodEvents.length - totalViolations) / Math.max(1, periodEvents.length)) * 100
      ));

      const coveragePercentage = (relevantRules.length / this.getTotalRulesForStandard(standard)) * 100;

      const report: ComplianceReport = {
        id: this.generateId(),
        standard,
        generatedAt: new Date(),
        period,
        status: complianceScore >= 95 ? 'compliant' : complianceScore >= 80 ? 'partial' : 'non-compliant',
        violations,
        summary: {
          totalEvents: periodEvents.length,
          violations: totalViolations,
          complianceScore: Math.round(complianceScore),
          risk_score: Math.round(totalRiskScore),
          coverage_percentage: Math.round(coveragePercentage),
        },
        recommendations: options.includeRecommendations ?
          await this.generateRecommendations(violations, periodEvents) : [],
        generated_by: 'system',
      };

      // Store report
      await this.database.create(this.REPORTS_COLLECTION, report);

      logger.info(`Compliance report generated for ${standard}: ${report.status}`);
      this.eventBus.emit('compliance.report.generated', report);

      return report;
    } catch (error) {
      logger.error('Failed to generate compliance report:', error);
      throw new Error(`Failed to generate compliance report: ${error.message}`);
    }
