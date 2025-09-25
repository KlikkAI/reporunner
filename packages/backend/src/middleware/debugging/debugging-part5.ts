query: JSON.stringify(query), component;
: 'database',
    })

// In a real implementation, you'd measure actual query duration
const duration = Date.now() - startTime;
if (duration > 100) {
  logger.warn('Slow database query', {
    collection: collectionName,
    method,
    duration,
    query: JSON.stringify(query),
    component: 'database',
  });
}

performanceMonitor.recordMetric({
  name: 'database_query_duration',
  value: duration,
  unit: 'ms',
  timestamp: Date.now(),
  tags: {
    collection: collectionName,
    method,
  },
});
})
}

/**
 * WebSocket debugging middleware
 */
export function createWebSocketDebugging(io: any): void {
  io.use((socket: any, next: any) => {
    // Add debugging to socket
    socket.debugSession = debugTools.startDebugSession({
      socketId: socket.id,
      component: 'websocket',
      handshake: socket.handshake,
    });

    logger.debug('WebSocket connection established', {
      socketId: socket.id,
      component: 'websocket',
    });

    socket.on('disconnect', () => {
      logger.debug('WebSocket connection closed', {
        socketId: socket.id,
        component: 'websocket',
      });

      if (socket.debugSession) {
        debugTools.endDebugSession(socket.debugSession);
      }
    });

    // Monitor socket events
    const originalEmit = socket.emit;
    socket.emit = function (...args: any[]) {
      if (socket.debugSession) {
        debugTools.addDebugEvent(socket.debugSession, {
          timestamp: Date.now(),
          type: 'log',
          level: 'debug',
          message: 'Socket event emitted',
          data: {
            event: args[0],
            data: args.slice(1),
          },
        });
      }

      return originalEmit.apply(this, args);
    };

    next();
  });
}

export default {
  createDebuggingMiddleware,
  errorTrackingMiddleware,
  setupDatabaseMonitoring,
  createWebSocketDebugging,
};
