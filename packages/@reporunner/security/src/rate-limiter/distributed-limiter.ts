await this.redisClient.disconnect();
}
  }
}

// Export singleton instance
export const rateLimiter = new AdvancedRateLimiter();

export default AdvancedRateLimiter;
