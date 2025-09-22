// Load environment variables FIRST, before any other imports
import dotenv from "dotenv";
import path from "path";

// Debug working directory and .env file path
console.log("Current working directory:", process.cwd());
console.log("Looking for .env file at:", path.resolve(process.cwd(), ".env"));

dotenv.config();

// Debug: Check if environment variables are loaded
console.log("Environment variables loaded:");
console.log("NODE_ENV:", process.env.NODE_ENV);
console.log("MONGODB_URI:", process.env.MONGODB_URI ? "[SET]" : "[NOT SET]");
console.log(
  "CREDENTIAL_ENCRYPTION_KEY:",
  process.env.CREDENTIAL_ENCRYPTION_KEY ? "[SET]" : "[NOT SET]",
);
console.log("JWT_SECRET:", process.env.JWT_SECRET ? "[SET]" : "[NOT SET]");

import express, { Application, Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import { createServer } from "http";
import { Server } from "socket.io";

// Import routes (domain-based structure)
import authRoutes from "./domains/auth/routes/authRoutes.js";
import workflowRoutes from "./domains/workflows/routes/workflowRoutes.js";
import credentialRoutes from "./domains/credentials/routes/credentialRoutes.js";
import oauthRoutes from "./domains/oauth/routes/oauthRoutes.js";
import nodeExecutionRoutes from "./domains/executions/routes/nodeExecutionRoutes.js";
import collaborationRoutes from "./domains/collaboration/routes/collaborationRoutes.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandlers.js";

// Import hybrid database service
import { HybridDatabaseService } from "./services/DatabaseService.js";
import { CollaborationService } from "./services/CollaborationService.js";
import { CursorTrackingService } from "./services/CursorTrackingService.js";

// Initialize hybrid database service
const hybridDb = HybridDatabaseService.getInstance();

// Initialize collaboration service
const collaborationService = CollaborationService.getInstance();

// Initialize cursor tracking service
const cursorTrackingService = CursorTrackingService.getInstance();

// Connect to hybrid database (MongoDB + PostgreSQL)
hybridDb
  .initialize()
  .then(() => console.log("Hybrid database system connected successfully"))
  .catch((err) => console.error("Hybrid database connection error:", err));

const app: Application = express();

// Middleware
app.use(
  cors({
    origin: [
      "https://app.klikk.ai",
      "http://localhost:3000",
      "http://localhost:5173",
    ],
    credentials: true,
  }),
);
app.use(helmet());
app.use(compression());
// Increase payload limits for AI Agent executions with large context
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(morgan("dev"));

// API Routes
app.get("/", (req: Request, res: Response) => {
  res.json({
    message: "Workflow Automation Backend API is running",
    status: "healthy",
    version: "1.0.0",
    endpoints: {
      auth: "/auth",
      workflows: "/workflows",
      credentials: "/credentials",
      collaboration: "/collaboration",
      oauth: "/oauth",
      nodes: "/nodes",
    },
  });
});

// Health check endpoint for frontend ApiClient
app.get("/health", async (_req: Request, res: Response) => {
  try {
    const healthStatus = await hybridDb.healthCheck();
    res.json({
      status: healthStatus.overall ? "ok" : "degraded",
      timestamp: new Date().toISOString(),
      databases: {
        mongodb: healthStatus.mongo ? "healthy" : "unhealthy",
        postgresql: healthStatus.postgres ? "healthy" : "unhealthy",
      },
    });
  } catch (error) {
    res.status(503).json({
      status: "error",
      timestamp: new Date().toISOString(),
      error: "Database health check failed",
    });
  }
});

// API route handlers
app.use("/auth", authRoutes);
app.use("/workflows", workflowRoutes);
app.use("/credentials", credentialRoutes);
app.use("/oauth", oauthRoutes);
app.use("/nodes", nodeExecutionRoutes);
app.use("/collaboration", collaborationRoutes);

// Error Handling Middleware
app.use(notFoundHandler);
app.use(errorHandler);

const port = process.env.PORT || 5000;
const server = createServer(app);

// Initialize WebSocket server
export const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN,
    methods: ["GET", "POST"],
  },
});

// Initialize collaboration service with Socket.IO
collaborationService.initialize(io);

// Initialize cursor tracking service with Socket.IO
cursorTrackingService.initialize(io);

io.on("connection", (socket) => {
  console.log("A client connected", socket.id);

  // Execution room join/leave for real-time execution monitoring
  socket.on("execution_join", ({ executionId }: { executionId: string }) => {
    if (!executionId) return;
    socket.join(`execution:${executionId}`);
    console.log(`Socket ${socket.id} joined execution room: ${executionId}`);
  });

  socket.on("execution_leave", ({ executionId }: { executionId: string }) => {
    if (!executionId) return;
    socket.leave(`execution:${executionId}`);
    console.log(`Socket ${socket.id} left execution room: ${executionId}`);
  });

  // Enhanced collaboration handlers are managed by CollaborationService
  // The service automatically sets up all collaboration event handlers

  socket.on("disconnect", () => {
    console.log("Client disconnected", socket.id);
    // CollaborationService handles cleanup automatically via its event handlers
  });
});

server.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
