import { describe, it, expect, beforeEach } from "vitest";
import { Comment } from "../../models/Comment.js";
import { CollaborationSession } from "../../models/CollaborationSession.js";
import { Operation } from "../../models/Operation.js";
import { testUtils } from "../setup.js";

describe("Collaboration Performance Tests", () => {
  let testUser: any;
  let testWorkflowId: string;

  beforeEach(async () => {
    testUser = await testUtils.createTestUser({
      email: "performance@test.com",
    });
    testWorkflowId = "507f1f77bcf86cd799439011";
  });

  describe("Comment Performance", () => {
    it("should handle bulk comment creation efficiently", async () => {
      const startTime = Date.now();
      const commentCount = 1000;

      // Create comments in batches for better performance
      const batchSize = 100;
      const batches = Math.ceil(commentCount / batchSize);

      for (let i = 0; i < batches; i++) {
        const batchComments = [];
        const start = i * batchSize;
        const end = Math.min(start + batchSize, commentCount);

        for (let j = start; j < end; j++) {
          batchComments.push({
            workflowId: testWorkflowId,
            authorId: testUser._id,
            content: `Performance test comment ${j}`,
            status: "open",
            position: { x: j % 100, y: Math.floor(j / 100) * 50 },
            tags: ["performance", "test", `batch-${i}`],
          });
        }

        await Comment.insertMany(batchComments);
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should create 1000 comments in under 5 seconds
      expect(duration).toBeLessThan(5000);

      // Verify all comments were created
      const createdComments = await Comment.countDocuments({
        workflowId: testWorkflowId,
      });
      expect(createdComments).toBe(commentCount);

      console.log(
        `Created ${commentCount} comments in ${duration}ms (${((commentCount / duration) * 1000).toFixed(2)} comments/sec)`,
      );
    }, 10000);

    it("should handle comment queries with large datasets efficiently", async () => {
      // Create a large dataset first
      const commentCount = 5000;
      const comments = [];

      for (let i = 0; i < commentCount; i++) {
        comments.push({
          workflowId: testWorkflowId,
          authorId: testUser._id,
          content: `Query test comment ${i}`,
          status: i % 3 === 0 ? "resolved" : "open",
          position: { x: i % 200, y: Math.floor(i / 200) * 30 },
          tags: [`tag-${i % 10}`, "performance"],
          createdAt: new Date(
            Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000,
          ), // Random date within last 30 days
        });
      }

      await Comment.insertMany(comments);

      // Test various query patterns
      const startTime = Date.now();

      // Test 1: Pagination query
      const page1 = await Comment.find({ workflowId: testWorkflowId })
        .sort({ createdAt: -1 })
        .limit(50)
        .skip(0);

      // Test 2: Status filter query
      const openComments = await Comment.find({
        workflowId: testWorkflowId,
        status: "open",
      }).limit(100);

      // Test 3: Tag filter query
      const taggedComments = await Comment.find({
        workflowId: testWorkflowId,
        tags: "tag-5",
      }).limit(100);

      // Test 4: Position-based query (spatial)
      const spatialComments = await Comment.find({
        workflowId: testWorkflowId,
        "position.x": { $gte: 50, $lte: 150 },
        "position.y": { $gte: 100, $lte: 200 },
      }).limit(100);

      const endTime = Date.now();
      const queryDuration = endTime - startTime;

      // All queries should complete within 2 seconds
      expect(queryDuration).toBeLessThan(2000);

      // Verify query results
      expect(page1).toHaveLength(50);
      expect(openComments.length).toBeGreaterThan(0);
      expect(taggedComments.length).toBeGreaterThan(0);
      expect(spatialComments.length).toBeGreaterThan(0);

      console.log(
        `Executed complex queries on ${commentCount} comments in ${queryDuration}ms`,
      );
    }, 15000);

    it("should handle comment aggregation efficiently", async () => {
      // Create diverse test data
      const commentCount = 2000;
      const users = [];

      // Create multiple users
      for (let i = 0; i < 10; i++) {
        const user = await testUtils.createTestUser({
          email: `perf-user-${i}@test.com`,
        });
        users.push(user);
      }

      const comments = [];
      for (let i = 0; i < commentCount; i++) {
        const user = users[i % users.length];
        comments.push({
          workflowId: testWorkflowId,
          authorId: user._id,
          content: `Aggregation test comment ${i}`,
          status: ["open", "resolved", "closed"][i % 3],
          reactions: Array.from(
            { length: Math.floor(Math.random() * 5) },
            (_, j) => ({
              userId: users[j % users.length]._id.toString(),
              type: ["👍", "👎", "❤️", "😂"][j % 4],
              timestamp: new Date(),
            }),
          ),
          thread: Array.from(
            { length: Math.floor(Math.random() * 3) },
            (_, j) => ({
              authorId: users[j % users.length]._id,
              content: `Reply ${j}`,
              timestamp: new Date(),
            }),
          ),
          createdAt: new Date(
            Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000,
          ),
        });
      }

      await Comment.insertMany(comments);

      const startTime = Date.now();

      // Complex aggregation pipeline
      const analytics = await Comment.aggregate([
        {
          $match: {
            workflowId: testWorkflowId,
            createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
          },
        },
        {
          $group: {
            _id: null,
            totalComments: { $sum: 1 },
            openComments: {
              $sum: { $cond: [{ $eq: ["$status", "open"] }, 1, 0] },
            },
            resolvedComments: {
              $sum: { $cond: [{ $eq: ["$status", "resolved"] }, 1, 0] },
            },
            totalReplies: { $sum: { $size: "$thread" } },
            totalReactions: { $sum: { $size: "$reactions" } },
            averageRepliesPerComment: { $avg: { $size: "$thread" } },
          },
        },
      ]);

      // Daily activity aggregation
      const dailyActivity = await Comment.aggregate([
        {
          $match: {
            workflowId: testWorkflowId,
            createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]);

      // Top commenters aggregation
      const topCommenters = await Comment.aggregate([
        {
          $match: {
            workflowId: testWorkflowId,
            createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
          },
        },
        {
          $group: {
            _id: "$authorId",
            commentCount: { $sum: 1 },
          },
        },
        { $sort: { commentCount: -1 } },
        { $limit: 5 },
      ]);

      const endTime = Date.now();
      const aggregationDuration = endTime - startTime;

      // Aggregations should complete within 3 seconds
      expect(aggregationDuration).toBeLessThan(3000);

      // Verify aggregation results
      expect(analytics[0]).toMatchObject({
        totalComments: expect.any(Number),
        openComments: expect.any(Number),
        resolvedComments: expect.any(Number),
        totalReplies: expect.any(Number),
        totalReactions: expect.any(Number),
        averageRepliesPerComment: expect.any(Number),
      });

      expect(dailyActivity).toBeInstanceOf(Array);
      expect(topCommenters).toBeInstanceOf(Array);

      console.log(
        `Executed complex aggregations on ${commentCount} comments in ${aggregationDuration}ms`,
      );
    }, 20000);
  });

  describe("Session Performance", () => {
    it("should handle multiple concurrent sessions efficiently", async () => {
      const sessionCount = 100;
      const startTime = Date.now();

      // Create multiple sessions
      const sessions = [];
      for (let i = 0; i < sessionCount; i++) {
        sessions.push({
          sessionId: `perf-session-${i}`,
          workflowId: `workflow-${i % 10}`, // 10 different workflows
          createdBy: testUser._id,
          participants: Array.from(
            { length: Math.floor(Math.random() * 5) + 1 },
            (_, j) => ({
              userId: `user-${j}`,
              joinedAt: new Date(),
              socketId: `socket-${i}-${j}`,
              isActive: Math.random() > 0.3,
              role: ["owner", "editor", "viewer"][j % 3],
            }),
          ),
          isActive: Math.random() > 0.2,
          settings: {
            allowedRoles: ["editor", "viewer"],
            maxParticipants: 10,
            autoSave: true,
          },
        });
      }

      await CollaborationSession.insertMany(sessions);

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should create sessions quickly
      expect(duration).toBeLessThan(3000);

      // Test session queries
      const queryStart = Date.now();

      // Active sessions query
      const activeSessions = await CollaborationSession.find({
        isActive: true,
      });

      // User sessions query
      const userSessions = await CollaborationSession.find({
        "participants.userId": "user-1",
      });

      // Workflow sessions query
      const workflowSessions = await CollaborationSession.find({
        workflowId: "workflow-1",
      });

      const queryEnd = Date.now();
      const queryDuration = queryEnd - queryStart;

      expect(queryDuration).toBeLessThan(1000);

      console.log(
        `Created ${sessionCount} sessions in ${duration}ms, queried in ${queryDuration}ms`,
      );
    }, 10000);
  });

  describe("Operation Performance", () => {
    it("should handle high-frequency operations efficiently", async () => {
      const operationCount = 5000;
      const sessionId = "perf-session-operations";
      const startTime = Date.now();

      // Create operations in batches
      const batchSize = 200;
      const batches = Math.ceil(operationCount / batchSize);

      for (let i = 0; i < batches; i++) {
        const batchOperations = [];
        const start = i * batchSize;
        const end = Math.min(start + batchSize, operationCount);

        for (let j = start; j < end; j++) {
          const operationType = [
            "node_add",
            "node_update",
            "node_delete",
            "edge_add",
            "edge_update",
            "edge_delete",
          ][j % 6];

          batchOperations.push({
            sessionId,
            workflowId: testWorkflowId,
            authorId: testUser._id,
            type: operationType,
            target: {
              type: operationType.startsWith("node") ? "node" : "edge",
              id: `${operationType.startsWith("node") ? "node" : "edge"}-${j}`,
            },
            data: {
              name: `Operation ${j}`,
              position: { x: j % 100, y: Math.floor(j / 100) * 50 },
            },
            status: ["pending", "applied", "failed"][j % 3],
            version: j + 1,
            timestamp: new Date(Date.now() - Math.random() * 60000), // Random timestamp within last minute
          });
        }

        await Operation.insertMany(batchOperations);
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should handle high-frequency operations efficiently
      expect(duration).toBeLessThan(10000);

      // Test operation queries
      const queryStart = Date.now();

      // Recent operations
      const recentOps = await Operation.find({
        sessionId,
        timestamp: { $gte: new Date(Date.now() - 30000) },
      })
        .sort({ timestamp: -1 })
        .limit(100);

      // Operations by type
      const nodeOps = await Operation.find({
        sessionId,
        type: { $regex: "^node_" },
      }).limit(1000);

      // Operations by status
      const appliedOps = await Operation.find({
        sessionId,
        status: "applied",
      }).limit(1000);

      const queryEnd = Date.now();
      const queryDuration = queryEnd - queryStart;

      expect(queryDuration).toBeLessThan(2000);

      console.log(
        `Created ${operationCount} operations in ${duration}ms (${((operationCount / duration) * 1000).toFixed(2)} ops/sec)`,
      );
      console.log(`Queried operations in ${queryDuration}ms`);
    }, 15000);

    it("should handle operation conflict resolution efficiently", async () => {
      const conflictOperations = 1000;
      const sessionId = "conflict-resolution-session";
      const startTime = Date.now();

      // Create operations that might conflict (same targets)
      const operations = [];
      const nodeIds = Array.from(
        { length: 10 },
        (_, i) => `conflict-node-${i}`,
      );

      for (let i = 0; i < conflictOperations; i++) {
        const nodeId = nodeIds[i % nodeIds.length];
        operations.push({
          sessionId,
          workflowId: testWorkflowId,
          authorId: testUser._id,
          type: "node_update",
          target: { type: "node", id: nodeId },
          data: {
            name: `Updated name ${i}`,
            properties: { value: i },
          },
          status: "pending",
          version: i + 1,
          timestamp: new Date(Date.now() + i * 10), // Sequential timestamps
        });
      }

      await Operation.insertMany(operations);

      // Simulate conflict resolution by finding and updating conflicting operations
      const conflictResolutionStart = Date.now();

      for (const nodeId of nodeIds) {
        const conflictingOps = await Operation.find({
          sessionId,
          "target.id": nodeId,
          status: "pending",
        }).sort({ timestamp: 1 });

        if (conflictingOps.length > 1) {
          // Apply operational transform simulation
          const lastOp = conflictingOps[conflictingOps.length - 1];

          // Mark earlier operations as transformed
          await Operation.updateMany(
            {
              _id: { $in: conflictingOps.slice(0, -1).map((op) => op._id) },
            },
            {
              $set: { status: "transformed" },
            },
          );

          // Mark last operation as applied
          await Operation.updateOne(
            { _id: lastOp._id },
            { $set: { status: "applied" } },
          );
        }
      }

      const endTime = Date.now();
      const totalDuration = endTime - startTime;
      const resolutionDuration = endTime - conflictResolutionStart;

      expect(totalDuration).toBeLessThan(8000);
      expect(resolutionDuration).toBeLessThan(3000);

      // Verify conflict resolution
      const appliedOps = await Operation.countDocuments({
        sessionId,
        status: "applied",
      });
      const transformedOps = await Operation.countDocuments({
        sessionId,
        status: "transformed",
      });

      expect(appliedOps).toBe(nodeIds.length); // One applied operation per node
      expect(transformedOps).toBe(conflictOperations - nodeIds.length); // Rest are transformed

      console.log(
        `Resolved ${conflictOperations} potentially conflicting operations in ${resolutionDuration}ms`,
      );
    }, 12000);
  });
});
