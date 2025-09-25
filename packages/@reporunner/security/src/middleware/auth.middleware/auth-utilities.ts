message: `One of the following permissions is required: ${requiredPermissions.join(', ')}`,
},
      })
return;
}

    next()
}
}

/**
 * Optional authentication middleware (doesn't fail if no token)
 */
export function optionalAuth(sessionManager: JWTSessionManager) {
  return createAuthMiddleware(sessionManager, { required: false });
}
