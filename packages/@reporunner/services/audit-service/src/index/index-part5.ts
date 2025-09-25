async;
queryEvents(filter: AuditFilter)
: Promise<
{
  events: AuditEvent[], total
  : number
}
>
{
  try {
    const cacheKey = `audit:query:${this.hashFilter(filter)}`;
    const cached = await this.redis.get(cacheKey);

    if (cached) {
      return JSON.parse(cached);
    }

    const mongoFilter = this.buildMongoFilter(filter);
    const sortOptions = this.buildSortOptions(filter);

    const [events, total] = await Promise.all([
      this.database.findMany(this.AUDIT_COLLECTION, mongoFilter, {
        sort: sortOptions,
        limit: filter.limit || 100,
        skip: filter.offset || 0,
      }),
      this.database.countDocuments(this.AUDIT_COLLECTION, mongoFilter),
    ]);

    const result = { events, total };

    // Cache for 5 minutes
    await this.redis.setex(cacheKey, this.CACHE_TTL, JSON.stringify(result));

    return result;
  } catch (error) {
    logger.error('Failed to query audit events:', error);
    throw new Error(`Failed to query audit events: ${error.message}`);
  }
}

async;
exportEvents(filter: AuditFilter, format: 'json' | 'csv' | 'xml' | 'xlsx')
: Promise<Buffer | string>
{
  try {
    const { events } = await this.queryEvents({
      ...filter,
      limit: undefined, // Remove limit for export
      offset: undefined,
    });

    switch (format) {
      case 'json':
        return JSON.stringify(events, null, 2);
      case 'csv':
        return this.convertToCSV(events);
      case 'xml':
        return this.convertToXML(events);
      case 'xlsx':
        return await this.convertToXLSX(events);
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  } catch (error) {
    logger.error('Failed to export audit events:', error);
    throw new Error(`Failed to export audit events: ${error.message}`);
  }
}

async;
addComplianceRule(rule: Omit<ComplianceRule, 'id' | 'created_at' | 'updated_at'>)
: Promise<string>
{
  try {
    const complianceRule: ComplianceRule = {
      ...rule,
      id: this.generateId(),
      created_at: new Date(),
      updated_at: new Date(),
    };

    await this.database.create(this.RULES_COLLECTION, complianceRule);
    await this.redis.del('compliance:rules:*'); // Invalidate cache

    logger.info(`Compliance rule ${complianceRule.id} added successfully`);
    this.eventBus.emit('compliance.rule.added', complianceRule);

    return complianceRule.id;
  } catch (error) {
    logger.error('Failed to add compliance rule:', error);
    throw new Error(`Failed to add compliance rule: ${error.message}`);
  }
}

async;
updateComplianceRule(id: string, updates: Partial<ComplianceRule>)
: Promise<void>
{
    try {
      await this.database.updateOne(
        this.RULES_COLLECTION,
        { id },
        { ...updates, updated_at: new Date() }
      );

      await this.redis.del('compliance:rules:*');
      this.eventBus.emit('compliance.rule.updated', { id, updates });

      logger.info(`Compliance rule ${id} updated successfully`);
    } catch (error) {
      logger.error('Failed to update compliance rule:', error);
