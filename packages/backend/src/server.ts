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
import { errorHandler, notFoundHandler } from "./middleware/errorHandlers.js";

// Import hybrid database service
import { HybridDatabaseService } from "./services/DatabaseService.js";

// Initialize hybrid database service
const hybridDb = HybridDatabaseService.getInstance();

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
// In-memory collaboration session tracking (dev only)
type CollaborationUser = { id: string; name?: string };
const workflowParticipants = new Map<string, Set<string>>(); // workflowId -> socketIds
const socketToWorkflow = new Map<string, string>(); // socketId -> workflowId

io.on("connection", (socket) => {
  console.log("A client connected", socket.id);

  // Execution room join/leave for real-time execution monitoring
  socket.on("execution_join", ({ executionId }: { executionId: string }) => {
    if (!executionId) return;
    socket.join(`execution:${executionId}`);
  });

  socket.on("execution_leave", ({ executionId }: { executionId: string }) => {
    if (!executionId) return;
    socket.leave(`execution:${executionId}`);
  });

  // Collaboration: join a workflow room
  socket.on(
    "join_workflow",
    (
      { workflowId, user }: { workflowId: string; user: CollaborationUser },
      ack?: (response: any) => void,
    ) => {
      if (!workflowId) {
        return ack?.({ success: false, error: "workflowId is required" });
      }
      socket.join(`workflow:${workflowId}`);
      socketToWorkflow.set(socket.id, workflowId);
      const set = workflowParticipants.get(workflowId) || new Set<string>();
      set.add(socket.id);
      workflowParticipants.set(workflowId, set);
      // Notify others
      socket
        .to(`workflow:${workflowId}`)
        .emit("user_joined", user || { id: socket.id });
      ack?.({
        success: true,
        session: { id: `session:${workflowId}`, workflowId },
      });
    },
  );

  // Collaboration: leave workflow
  socket.on(
    "leave_workflow",
    ({ workflowId, userId }: { workflowId: string; userId?: string }) => {
      if (!workflowId) return;
      socket.leave(`workflow:${workflowId}`);
      const set = workflowParticipants.get(workflowId);
      if (set) {
        set.delete(socket.id);
        if (set.size === 0) workflowParticipants.delete(workflowId);
      }
      socket
        .to(`workflow:${workflowId}`)
        .emit("user_left", userId || socket.id);
    },
  );

  // Collaboration: presence updates
  socket.on("user_presence", (presence: any) => {
    const workflowId = socketToWorkflow.get(socket.id);
    if (!workflowId) return;
    socket.to(`workflow:${workflowId}`).emit("presence_update", presence);
  });

  // Collaboration: operations
  socket.on("collaboration_operation", (operation: any) => {
    const workflowId = operation?.workflowId || socketToWorkflow.get(socket.id);
    if (!workflowId) return;
    socket.to(`workflow:${workflowId}`).emit("operation_received", operation);
  });

  // Collaboration: comments
  socket.on("add_comment", (comment: any, ack?: (response: any) => void) => {
    const workflowId = comment?.workflowId || socketToWorkflow.get(socket.id);
    if (!workflowId) return ack?.({ success: false, error: "No workflow" });
    io.to(`workflow:${workflowId}`).emit("comment_added", comment);
    ack?.({ success: true, comment });
  });

  socket.on(
    "add_reply",
    ({ commentId, reply }: any, ack?: (response: any) => void) => {
      const workflowId = socketToWorkflow.get(socket.id);
      if (!workflowId) return ack?.({ success: false, error: "No workflow" });
      io.to(`workflow:${workflowId}`).emit("reply_added", { commentId, reply });
      ack?.({ success: true, reply });
    },
  );

  socket.on("resolve_conflict", ({ conflictId, resolution }: any) => {
    const workflowId = socketToWorkflow.get(socket.id);
    if (!workflowId) return;
    io.to(`workflow:${workflowId}`).emit("conflict_detected", {
      id: conflictId,
      operations: [],
      type: "manual",
      affectedNodes: [],
      timestamp: new Date().toISOString(),
      resolution,
    });
  });

  socket.on("disconnect", () => {
    const workflowId = socketToWorkflow.get(socket.id);
    if (workflowId) {
      socket.to(`workflow:${workflowId}`).emit("user_left", socket.id);
      const set = workflowParticipants.get(workflowId);
      if (set) {
        set.delete(socket.id);
        if (set.size === 0) workflowParticipants.delete(workflowId);
      }
      socketToWorkflow.delete(socket.id);
    }
    console.log("Client disconnected", socket.id);
  });
});

server.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
