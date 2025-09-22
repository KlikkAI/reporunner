// Test-friendly Express app configuration without server startup

import compression from 'compression';
import cors from 'cors';
import express, { type Application, type Request, type Response } from 'express';
import helmet from 'helmet';
import morgan from 'morgan';

// Import routes (domain-based structure)
import authRoutes from './domains/auth/routes/authRoutes.js';
import credentialRoutes from './domains/credentials/routes/credentialRoutes.js';
import nodeExecutionRoutes from './domains/executions/routes/nodeExecutionRoutes.js';
import oauthRoutes from './domains/oauth/routes/oauthRoutes.js';
import workflowRoutes from './domains/workflows/routes/workflowRoutes.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandlers.js';

const app: Application = express();

// Middleware
app.use(
  cors({
    origin: ['https://app.klikk.ai', 'http://localhost:3000', 'http://localhost:5173'],
    credentials: true,
  })
);
app.use(helmet());
app.use(compression());
// Increase payload limits for AI Agent executions with large context
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Only use morgan in non-test environments
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// API Routes
app.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'Workflow Automation Backend API is running',
    status: 'healthy',
    version: '1.0.0',
    endpoints: {
      auth: '/auth',
      workflows: '/workflows',
      credentials: '/credentials',
    },
  });
});

// API route handlers
app.use('/auth', authRoutes);
app.use('/workflows', workflowRoutes);
app.use('/credentials', credentialRoutes);
app.use('/oauth', oauthRoutes);
app.use('/nodes', nodeExecutionRoutes);

// Error Handling Middleware
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
