async;
shutdown();
: Promise<void>
{
  logger.info('Shutting down analytics service');

  if (this.aggregationTimer) {
    clearInterval(this.aggregationTimer);
  }

  await this.cache.quit();
}
}

// Helper classes
class UserSessionManager {
  constructor(
    private sessions: Collection<UserSession>,
    private cache: Redis
  ) {}

  async startSession(
    userId: string,
    organizationId: string,
    metadata: Partial<UserSession['metadata']> = {}
  ): Promise<string> {
    const sessionId = uuidv4();

    const session: UserSession = {
      id: sessionId,
      userId,
      organizationId,
      startedAt: new Date(),
      events: 0,
      metadata: metadata as UserSession['metadata'],
      pages: []
    };

    await this.sessions.insertOne(session);

    // Cache active session
    await this.cache.setex(`session:${sessionId}`, 3600, JSON.stringify(session));

    return sessionId;
  }

  async updateSession(
    sessionId: string,
    userId: string,
    updates: {
      lastActivity?: Date;
      eventCount?: number;
    }
  ): Promise<void> {
    await this.sessions.updateOne(
      { id: sessionId, userId },
      {
        $set: { lastActivity: updates.lastActivity },
        $inc: { events: updates.eventCount || 0 }
      }
    );

    // Update cache
    const cached = await this.cache.get(`session:${sessionId}`);
    if (cached) {
      const session = JSON.parse(cached);
      session.lastActivity = updates.lastActivity;
      session.events += updates.eventCount || 0;
      await this.cache.setex(`session:${sessionId}`, 3600, JSON.stringify(session));
    }
  }

  async addPageView(sessionId: string, path: string): Promise<void> {
    const now = new Date();

    await this.sessions.updateOne(
      { id: sessionId },
      {
        $push: {
          pages: {
            path,
            timestamp: now
          }
        }
      }
    );
  }

  async endSession(sessionId: string): Promise<void> {
    const endedAt = new Date();

    const session = await this.sessions.findOne({ id: sessionId });
    if (session) {
      const duration = endedAt.getTime() - session.startedAt.getTime();

      await this.sessions.updateOne(
        { id: sessionId },
        {
          $set: {
            endedAt,
            duration
          }
        }
