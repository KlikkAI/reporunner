import express from 'express';
import { AuthMiddleware } from '../middleware/auth/AuthMiddleware';

const app = express();

// Basic authentication - just verify JWT token
const basicAuth = new AuthMiddleware({
  auth: {
    token: {
      secret: process.env.JWT_SECRET || 'your-secret-key',
      expiresIn: '1h',
      refreshExpiresIn: '7d'
    }
  }
});

// Session-based authentication with Redis
const sessionAuth = new AuthMiddleware({
  auth: {
    session: {
      store: 'redis',
      secret: process.env.SESSION_SECRET || 'session-secret',
      ttl: 24 * 60 * 60, // 24 hours
      redisConfig: {
        host: 'localhost',
        port: 6379
      }
    }
  }
});

// Role-based authentication
const adminAuth = new AuthMiddleware({
  auth: {
    token: {
      secret: process.env.JWT_SECRET || 'your-secret-key',
      expiresIn: '1h',
      refreshExpiresIn: '7d'
    }
  },
  rbac: {
    roles: ['admin']
  }
});

// Permission-based authentication
const editorAuth = new AuthMiddleware({
  auth: {
    token: {
      secret: process.env.JWT_SECRET || 'your-secret-key',
      expiresIn: '1h',
      refreshExpiresIn: '7d'
    }
  },
  rbac: {
    permissions: ['create:post', 'edit:post']
  }
});

// Resource ownership check
const ownerAuth = new AuthMiddleware({
  auth: {
    token: {
      secret: process.env.JWT_SECRET || 'your-secret-key',
      expiresIn: '1h',
      refreshExpiresIn: '7d'
    }
  },
  rbac: {
    requireOwnership: true
  }
});

// Complex auth with multiple requirements
const complexAuth = new AuthMiddleware({
  auth: {
    token: {
      secret: process.env.JWT_SECRET || 'your-secret-key',
      expiresIn: '1h',
      refreshExpiresIn: '7d'
    }
  },
  rbac: {
    roles: ['editor'],
    permissions: ['publish:post'],
    requireOwnership: true,
    // Custom check - e.g., verify user has completed profile
    async customCheck(req) {
      return req.user?.profileCompleted === true;
    }
  },
  enableLogging: true,
  debug: process.env.NODE_ENV !== 'production'
});

// API routes with different auth requirements
app.use('/api', basicAuth.handle); // Basic auth for all API routes

app.get('/api/profile', sessionAuth.handle, (req, res) => {
  res.json({ user: req.user });
});

app.get('/api/admin', adminAuth.handle, (_req, res) => {
  res.json({ message: 'Admin access granted' });
});

app.post('/api/posts', editorAuth.handle, (_req, res) => {
  res.json({ message: 'Post created' });
});

app.put('/api/posts/:id', ownerAuth.handle, (_req, res) => {
  res.json({ message: 'Post updated' });
});

app.post('/api/posts/:id/publish', complexAuth.handle, (_req, res) => {
  res.json({ message: 'Post published' });
});

// Route-specific auth configuration
app.get('/api/sensitive-data', 
  new AuthMiddleware({
    auth: {
      token: {
        secret: process.env.JWT_SECRET || 'your-secret-key',
        expiresIn: '15m', // Shorter expiry for sensitive routes
        refreshExpiresIn: '1d'
      }
    },
    rbac: {
      roles: ['admin'],
      permissions: ['read:sensitive-data']
    }
  }).handle,
  (_req, res) => {
    res.json({ data: 'sensitive content' });
  }
);

// Dynamic role checking based on resource type
app.get('/api/:resourceType/:id',
  async (req, res, next) => {
    const { resourceType } = req.params;
    const resourceRoles = {
      'documents': ['document:reader'],
      'reports': ['report:viewer'],
      'analytics': ['analytics:user']
    };

    const auth = new AuthMiddleware({
      auth: {
        token: {
          secret: process.env.JWT_SECRET || 'your-secret-key',
          expiresIn: '1h',
          refreshExpiresIn: '7d'
        }
      },
      rbac: {
        roles: resourceRoles[resourceType as keyof typeof resourceRoles] || [],
        requireOwnership: true
      }
    });

    return auth.handle(req, res, next);
  },
  (_req, res) => {
    res.json({ message: 'Resource accessed' });
  }
);

// Conditional authentication based on request
app.get('/api/content/:id',
  (req, res, next) => {
    const isPublic = req.query.access === 'public';
    
    if (isPublic) {
      return next();
    }

    const auth = new AuthMiddleware({
      auth: {
        token: {
          secret: process.env.JWT_SECRET || 'your-secret-key',
          expiresIn: '1h',
          refreshExpiresIn: '7d'
        }
      }
    });

    return auth.handle(req, res, next);
  },
  (_req, res) => {
    res.json({ message: 'Content accessed' });
  }
);

export default app;