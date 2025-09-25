status: this.state.status, lastActivity;
: this.state.lastActivity,
      errorCount: this.state.errorCount,
      capabilities: this.getCapabilities(),
    }
}

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void>
{
  this.stopHeartbeat();
  await this.disconnect();
  this.removeAllListeners();

  this.emit('cleanup', { name: this.config.name });
}
}

export default BaseIntegration;
