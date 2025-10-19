import dotenv from 'dotenv';
import { DatabaseConfig } from './config/database';

// Load environment variables
dotenv.config();

console.log('🚀 Starting Reporunner Worker...');

// Connect to databases
const dbConfig = DatabaseConfig.getInstance();
dbConfig
  .connect()
  .then(() => {
    console.log('✅ Worker: Database connected successfully');
    console.log('👷 Worker: Ready to process workflow executions');
  })
  .catch((error) => {
    console.error('❌ Worker: Database connection failed:', error);
    process.exit(1);
  });

// Placeholder for BullMQ worker initialization
// TODO: Initialize BullMQ worker for workflow execution
console.log('⏳ Worker: Waiting for workflow execution jobs...');

// Keep process alive
process.on('SIGTERM', () => {
  console.log('Worker shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('Worker interrupted...');
  process.exit(0);
});

// Heartbeat to keep container alive
setInterval(() => {
  console.log(`Worker heartbeat: ${new Date().toISOString()}`);
}, 60000); // Log every minute
