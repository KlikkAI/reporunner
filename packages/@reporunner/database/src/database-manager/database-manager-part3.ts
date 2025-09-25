const [mongoStats, pgStats, redisStats] = await Promise.all([
  this.mongodb.getStats(),
  this.postgresql.getStats(),
  this.redis.getStats(),
]);

return {
      mongodb: mongoStats,
      postgresql: pgStats,
      redis: redisStats,
    };
}
}
