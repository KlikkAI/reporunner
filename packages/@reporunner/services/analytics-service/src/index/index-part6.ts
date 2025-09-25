this.applyFilter(query, filter);
}
      }

let pipeline: any[] = [{ $match: query }];

// Add grouping if specified
if (options.groupBy) {
  const groupBy: any = {};
  for (const field of options.groupBy) {
    groupBy[field] = `$${field}`;
  }

  pipeline.push({
    $group: {
      _id: groupBy,
      count: { $sum: 1 },
      firstEvent: { $first: '$$ROOT' },
    },
  });
}

// Add sorting
if (options.sort) {
  pipeline.push({ $sort: options.sort });
} else {
  pipeline.push({ $sort: { timestamp: -1 } });
}

// Add limit
if (options.limit) {
  pipeline.push({ $limit: options.limit });
}

const results = await this.events.aggregate(pipeline).toArray();
return results.map(r => options.groupBy ? r.firstEvent : r);
} catch (error)
{
  logger.error('Failed to query events', error);
  throw error;
}
}

  async queryMetrics(
    organizationId: string,
    metricId: string,
    options: QueryOptions
  ): Promise<AggregatedMetric[]>
{
    try {
      const query: any = {
        organizationId,
        metricId,
        timestamp: {
          $gte: options.startTime,
          $lte: options.endTime
        }
      };

      if (options.interval) {
        query.interval = options.interval;
      }

      // Apply filters for labels
      if (options.filters) {
        for (const filter of options.filters) {
          if (filter.field.startsWith('labels.')) {
            this.applyFilter(query, filter);
          }
        }
      }

      let pipeline: any[] = [{ $match: query }];

      // Group by specified fields
      if (options.groupBy) {
        const groupBy: any = {};
        for (const field of options.groupBy) {
          groupBy[field] = field.startsWith('labels.')
            ? `$${field}`
            : `$${field}`;
        }

        pipeline.push({
          $group: {
            _id: groupBy,
            count: { $sum: '$aggregations.count' },
            sum: { $sum: '$aggregations.sum' },
            avg: { $avg: '$aggregations.avg' },
            min: { $min: '$aggregations.min' },
            max: { $max: '$aggregations.max' },
            timestamp: { $first: '$timestamp' }
          }
        });
      }

      // Add sorting
      pipeline.push({ $sort: options.sort || { timestamp: 1 } });

      // Add limit
      if (options.limit) {
        pipeline.push({ $limit: options.limit });
