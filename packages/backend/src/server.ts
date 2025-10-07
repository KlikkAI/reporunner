import compression from 'compression';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import 'express-async-errors';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

import { DatabaseConfig } from './config/database.js';
// Import routes
import authRoutes from './domains/auth/routes/authRoutes.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
const dbConfig = DatabaseConfig.getInstance();
dbConfig
  .connect()
  .then(() => {})
  .catch((_error) => {
    process.exit(1);
  });

// Middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN?.split(',') || [
      'http://localhost:3000',
      'http://localhost:3002',
    ],
    credentials: true,
  })
);
app.use(compression());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: '@reporunner/backend',
  });
});

// Register auth routes
app.use('/auth', authRoutes);

// API routes placeholder
app.get('/api', (_req, res) => {
  res.json({ message: 'Reporunner Backend API' });
});

// Error handling middleware
app.use((err: any, _req: any, res: any, _next: any) => {
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong!',
  });
});

// 404 handler
app.use('*', (_req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

// Start server
app.listen(PORT, () => {});

export default app;
