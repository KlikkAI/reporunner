}

  /**
   * Setup routes
   */
  private setupRoutes(): void
{
  this.app.all('*', (req: Request, res: Response) => {
    const key = `${req.method}:${req.path}`;
    const mockResponse = this.responses.get(key);

    if (mockResponse) {
      // Apply additional delay if specified
      const delay = mockResponse.delay || 0;

      setTimeout(() => {
        // Set headers
        if (mockResponse.headers) {
          Object.entries(mockResponse.headers).forEach(([name, value]) => {
            res.setHeader(name, value);
          });
        }

        // Send response
        res.status(mockResponse.status).json(mockResponse.body);
      }, delay);
    } else {
      res.status(404).json({ error: 'Mock response not configured' });
    }
  });
}

/**
 * Set mock response
 */
setResponse(method: string, path: string, response: MockResponse)
: void
{
  const key = `${method.toUpperCase()}:${path}`;
  this.responses.set(key, response);

  this.emit('response:set', { method, path, response });
}

/**
 * Start server
 */
async;
start();
: Promise<void>
{
  if (this.isRunning) {
    return;
  }

  return new Promise((resolve, reject) => {
      this.server = this.app.listen(this.config.port, this.config.host!, () => {
        this.isRunning = true;
        this.emit('server:started', {
          host: this.config.host,
          port: this.config.port,
        });
        resolve();
      });

      this.server.on('error', (error) => {
        this.isRunning = false;
        reject(error);
      });
    });
}

/**
 * Stop server
 */
async;
stop();
: Promise<void>
{
  if (!this.isRunning || !this.server) {
    return;
  }

  return new Promise((resolve) => {
      this.server?.close(() => {
        this.isRunning = false;
        this.emit('server:stopped');
        resolve();
      });
    });
}

/**
 * Get base URL
 */
getBaseUrl();
: string
{
  return `http://${this.config.host}:${this.config.port}${this.config.basePath}`;
}

/**
 * Get request logs
 */
getRequestLogs();
: RequestLog[]
{
  return [...this.requestLogs];
}

/**
 * Clear request logs
 */
