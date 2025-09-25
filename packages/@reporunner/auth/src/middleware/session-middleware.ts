import type { Request, Response, NextFunction } from 'express';
import * as crypto from 'node:crypto';

export interface Session {
  id: string;
  userId: string;
  createdAt: Date;
  expiresAt: Date;
  data: Record<string, any>;
}

export interface SessionConfig {
  secret: string;
  maxAge?: number; // in milliseconds
  rolling?: boolean; // extend session on activity
  store?: SessionStore;
}

export interface SessionStore {
  get(sessionId: string): Promise<Session | null>;
  set(sessionId: string, session: Session): Promise<void>;
  destroy(sessionId: string): Promise<void>;
  touch(sessionId: string, expiresAt: Date): Promise<void>;
}

// In-memory session store (for development/testing)
export class InMemorySessionStore implements SessionStore {
  private sessions: Map<string, Session> = new Map();

  async get(sessionId: string): Promise<Session | null> {
    const session = this.sessions.get(sessionId);
    if (!session) return null;
    
    if (session.expiresAt < new Date()) {
      this.sessions.delete(sessionId);
      return null;
    }
    
    return session;
  }

  async set(sessionId: string, session: Session): Promise<void> {
    this.sessions.set(sessionId, session);
  }

  async destroy(sessionId: string): Promise<void> {
    this.sessions.delete(sessionId);
  }

  async touch(sessionId: string, expiresAt: Date): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.expiresAt = expiresAt;
    }
  }

  // Cleanup expired sessions
  cleanup(): void {
    const now = new Date();
    for (const [id, session] of this.sessions.entries()) {
      if (session.expiresAt < now) {
        this.sessions.delete(id);
      }
    }
  }
}

export interface SessionRequest extends Request {
  session?: Session;
  sessionId?: string;
}

export function createSessionMiddleware(config: SessionConfig) {
  const store = config.store || new InMemorySessionStore();
  const maxAge = config.maxAge || 24 * 60 * 60 * 1000; // 24 hours default

  return async (req: SessionRequest, res: Response, next: NextFunction) => {
    try {
      // Extract session ID from cookie or header
      const sessionId = req.cookies?.sessionId || req.headers['x-session-id'] as string;

      if (sessionId) {
        const session = await store.get(sessionId);
        
        if (session) {
          req.session = session;
          req.sessionId = sessionId;

          // Rolling sessions: extend expiry on activity
          if (config.rolling) {
            const newExpiresAt = new Date(Date.now() + maxAge);
            await store.touch(sessionId, newExpiresAt);
            session.expiresAt = newExpiresAt;
          }
        }
      }

      // Add session management functions to request
      (req as any).createSession = async (userId: string, data: Record<string, any> = {}) => {
        const newSessionId = generateSessionId();
        const session: Session = {
          id: newSessionId,
          userId,
          createdAt: new Date(),
          expiresAt: new Date(Date.now() + maxAge),
          data,
        };

        await store.set(newSessionId, session);
        
        // Set cookie
        res.cookie('sessionId', newSessionId, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge,
        });

        req.session = session;
        req.sessionId = newSessionId;
        
        return session;
      };

      (req as any).destroySession = async () => {
        if (req.sessionId) {
          await store.destroy(req.sessionId);
          res.clearCookie('sessionId');
          delete req.session;
          delete req.sessionId;
        }
      };

      next();
    } catch (error) {
      next(error);
    }
  };
}

function generateSessionId(): string {
  return crypto.randomBytes(32).toString('hex');
}