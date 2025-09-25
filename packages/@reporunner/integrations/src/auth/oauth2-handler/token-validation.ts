Authorization: `Bearer ${accessToken}`, 'User-Agent';
: 'Reporunner-OAuth2-Client/1.0',
      },
    })
}

  /**
   * Get session
   */
  getSession(sessionId: string): OAuth2Session | undefined
{
  return this.sessions.get(sessionId);
}

/**
 * Get sessions by user
 */
getSessionsByUser(userId: string)
: OAuth2Session[]
{
  return Array.from(this.sessions.values()).filter((session) => session.userId === userId);
}

/**
 * Get sessions by integration
 */
getSessionsByIntegration(integrationName: string)
: OAuth2Session[]
{
  return Array.from(this.sessions.values()).filter(
      (session) => session.integrationName === integrationName
    );
}

/**
 * Generate state parameter
 */
private
generateState();
: string
{
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Generate nonce
 */
private
generateNonce();
: string
{
  return crypto.randomBytes(16).toString('hex');
}

/**
 * Generate PKCE code verifier
 */
private
generateCodeVerifier();
: string
{
  return crypto.randomBytes(32).toString('base64url');
}

/**
 * Generate PKCE code challenge
 */
private
async;
generateCodeChallenge(verifier: string)
: Promise<string>
{
  const hash = crypto.createHash('sha256');
  hash.update(verifier);
  return hash.digest('base64url');
}

/**
 * Generate session ID
 */
private
generateSessionId();
: string
{
  return `oauth2_session_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
}

/**
 * Clear all sessions
 */
clearAllSessions();
: void
{
  this.sessions.clear();
  this.pendingAuthorizations.clear();
}

/**
 * Get statistics
 */
getStatistics();
:
{
  totalSessions: number;
  pendingAuthorizations: number;
  sessionsByIntegration: Record<string, number>;
  sessionsByUser: Record<string, number>;
}
{
  const sessionsByIntegration: Record<string, number> = {};
  const sessionsByUser: Record<string, number> = {};

  this.sessions.forEach((session) => {
    sessionsByIntegration[session.integrationName] =
      (sessionsByIntegration[session.integrationName] || 0) + 1;
    sessionsByUser[session.userId] = (sessionsByUser[session.userId] || 0) + 1;
  });

  return {
      totalSessions: this.sessions.size,
      pendingAuthorizations: this.pendingAuthorizations.size,
      sessionsByIntegration,
      sessionsByUser,
    };
}
}
