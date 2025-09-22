import { describe, it, expect, beforeEach } from "vitest";
import { Comment } from "../../models/Comment.js";
import { testUtils } from "../setup.js";

describe("Testing Infrastructure", () => {
  let testUser: any;

  beforeEach(async () => {
    testUser = await testUtils.createTestUser({
      email: "infrastructure@test.com",
    });
  });

  describe("Database Operations", () => {
    it("should create and retrieve comments", async () => {
      const testWorkflowId = "507f1f77bcf86cd799439011";

      // Create a comment
      const comment = await Comment.create({
        workflowId: testWorkflowId,
        authorId: testUser._id,
        content: "Infrastructure test comment",
        status: "open",
      });

      expect(comment).toBeTruthy();
      expect(comment.content).toBe("Infrastructure test comment");
      expect(comment.workflowId).toBe(testWorkflowId);
      expect(comment.status).toBe("open");

      // Retrieve the comment
      const retrievedComment = await Comment.findById(comment._id);
      expect(retrievedComment).toBeTruthy();
      expect(retrievedComment?.content).toBe("Infrastructure test comment");
    });

    it("should handle comment queries with pagination", async () => {
      const testWorkflowId = "507f1f77bcf86cd799439011";

      // Create multiple comments
      const comments = [];
      for (let i = 0; i < 15; i++) {
        comments.push({
          workflowId: testWorkflowId,
          authorId: testUser._id,
          content: `Test comment ${i}`,
          status: i % 2 === 0 ? "open" : "resolved",
        });
      }

      await Comment.insertMany(comments);

      // Test pagination
      const page1 = await Comment.find({ workflowId: testWorkflowId })
        .sort({ createdAt: -1 })
        .limit(10)
        .skip(0);

      const page2 = await Comment.find({ workflowId: testWorkflowId })
        .sort({ createdAt: -1 })
        .limit(10)
        .skip(10);

      expect(page1).toHaveLength(10);
      expect(page2).toHaveLength(5);

      // Test status filtering
      const openComments = await Comment.find({
        workflowId: testWorkflowId,
        status: "open",
      });

      expect(openComments).toHaveLength(8); // 0, 2, 4, 6, 8, 10, 12, 14 = 8 comments
    });

    it("should handle comment updates and edit history", async () => {
      const testWorkflowId = "507f1f77bcf86cd799439011";

      // Create a comment
      const comment = await Comment.create({
        workflowId: testWorkflowId,
        authorId: testUser._id,
        content: "Original content",
        status: "open",
      });

      // Update the comment content (simulating edit)
      comment.editHistory.push({
        timestamp: new Date(),
        previousContent: comment.content,
        editedBy: testUser._id.toString(),
      });
      comment.content = "Updated content";

      await comment.save();

      // Verify update
      const updatedComment = await Comment.findById(comment._id);
      expect(updatedComment?.content).toBe("Updated content");
      expect(updatedComment?.editHistory).toHaveLength(1);
      expect(updatedComment?.editHistory[0].previousContent).toBe(
        "Original content",
      );
    });

    it("should handle comment reactions", async () => {
      const testWorkflowId = "507f1f77bcf86cd799439011";

      // Create a comment
      const comment = await Comment.create({
        workflowId: testWorkflowId,
        authorId: testUser._id,
        content: "Comment with reactions",
        status: "open",
      });

      // Add reactions
      comment.reactions.push({
        userId: testUser._id.toString(),
        type: "👍",
        timestamp: new Date(),
      });

      comment.reactions.push({
        userId: "another-user-id",
        type: "❤️",
        timestamp: new Date(),
      });

      await comment.save();

      // Verify reactions
      const commentWithReactions = await Comment.findById(comment._id);
      expect(commentWithReactions?.reactions).toHaveLength(2);
      expect(commentWithReactions?.reactions[0].type).toBe("👍");
      expect(commentWithReactions?.reactions[1].type).toBe("❤️");
    });

    it("should handle comment threads (replies)", async () => {
      const testWorkflowId = "507f1f77bcf86cd799439011";

      // Create a comment
      const comment = await Comment.create({
        workflowId: testWorkflowId,
        authorId: testUser._id,
        content: "Parent comment",
        status: "open",
      });

      // Add replies to thread
      comment.thread.push({
        authorId: testUser._id.toString(),
        content: "First reply",
        timestamp: new Date(),
      });

      comment.thread.push({
        authorId: "another-user-id",
        content: "Second reply",
        timestamp: new Date(),
      });

      await comment.save();

      // Verify thread
      const commentWithThread = await Comment.findById(comment._id);
      expect(commentWithThread?.thread).toHaveLength(2);
      expect(commentWithThread?.thread[0].content).toBe("First reply");
      expect(commentWithThread?.thread[1].content).toBe("Second reply");
    });
  });

  describe("Test Utilities", () => {
    it("should create test users successfully", async () => {
      const user1 = await testUtils.createTestUser({
        email: "user1@test.com",
        firstName: "User",
        lastName: "One",
      });

      const user2 = await testUtils.createTestUser({
        email: "user2@test.com",
        firstName: "User",
        lastName: "Two",
      });

      expect(user1.email).toBe("user1@test.com");
      expect(user1.firstName).toBe("User");
      expect(user1.lastName).toBe("One");

      expect(user2.email).toBe("user2@test.com");
      expect(user2.firstName).toBe("User");
      expect(user2.lastName).toBe("Two");

      // Verify users are different
      expect(user1._id.toString()).not.toBe(user2._id.toString());
    });

    it("should generate JWT tokens", async () => {
      const token = await testUtils.generateTestToken(testUser._id.toString());

      expect(token).toBeTruthy();
      expect(typeof token).toBe("string");
      expect(token.split(".")).toHaveLength(3); // JWT has 3 parts separated by dots
    });

    it("should clean database between tests", async () => {
      const testWorkflowId = "507f1f77bcf86cd799439011";

      // Create some data
      await Comment.create({
        workflowId: testWorkflowId,
        authorId: testUser._id,
        content: "Data to be cleaned",
        status: "open",
      });

      // Verify data exists
      const beforeClean = await Comment.countDocuments({
        workflowId: testWorkflowId,
      });
      expect(beforeClean).toBe(1);

      // Clean database
      await testUtils.cleanDatabase();

      // Verify data is cleaned
      const afterClean = await Comment.countDocuments({
        workflowId: testWorkflowId,
      });
      expect(afterClean).toBe(0);

      // But test user should still exist (created in beforeEach after clean)
      const userExists = await testUtils.createTestUser({
        email: "after-clean@test.com",
      });
      expect(userExists).toBeTruthy();
    });
  });

  describe("Performance Validation", () => {
    it("should handle bulk operations efficiently", async () => {
      const testWorkflowId = "507f1f77bcf86cd799439011";
      const commentCount = 100;

      const startTime = Date.now();

      // Create comments in batch
      const comments = Array.from({ length: commentCount }, (_, i) => ({
        workflowId: testWorkflowId,
        authorId: testUser._id,
        content: `Bulk comment ${i}`,
        status: i % 2 === 0 ? "open" : "resolved",
        tags: [`tag-${i % 5}`, "bulk-test"],
      }));

      await Comment.insertMany(comments);

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should be fast (under 2 seconds for 100 comments)
      expect(duration).toBeLessThan(2000);

      // Verify all comments were created
      const createdCount = await Comment.countDocuments({
        workflowId: testWorkflowId,
      });
      expect(createdCount).toBe(commentCount);

      console.log(`Bulk created ${commentCount} comments in ${duration}ms`);
    });

    it("should handle complex queries efficiently", async () => {
      const testWorkflowId = "507f1f77bcf86cd799439011";

      // Create diverse test data
      const comments = Array.from({ length: 200 }, (_, i) => ({
        workflowId: testWorkflowId,
        authorId: testUser._id,
        content: `Query test comment ${i}`,
        status: ["open", "resolved", "closed"][i % 3],
        position: { x: i % 100, y: Math.floor(i / 100) * 50 },
        tags: [`category-${i % 5}`, `priority-${i % 3}`, "query-test"],
        createdAt: new Date(
          Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000,
        ), // Last 7 days
      }));

      await Comment.insertMany(comments);

      const queryStart = Date.now();

      // Execute multiple complex queries
      const [statusQuery, tagQuery, spatialQuery, recentQuery, aggregateQuery] =
        await Promise.all([
          Comment.find({ workflowId: testWorkflowId, status: "open" }).limit(
            50,
          ),
          Comment.find({
            workflowId: testWorkflowId,
            tags: "category-2",
          }).limit(50),
          Comment.find({
            workflowId: testWorkflowId,
            "position.x": { $gte: 20, $lte: 80 },
          }).limit(50),
          Comment.find({
            workflowId: testWorkflowId,
            createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
          })
            .sort({ createdAt: -1 })
            .limit(50),
          Comment.aggregate([
            { $match: { workflowId: testWorkflowId } },
            { $group: { _id: "$status", count: { $sum: 1 } } },
          ]),
        ]);

      const queryEnd = Date.now();
      const queryDuration = queryEnd - queryStart;

      // Queries should be fast (under 1 second)
      expect(queryDuration).toBeLessThan(1000);

      // Verify query results
      expect(statusQuery.length).toBeGreaterThan(0);
      expect(tagQuery.length).toBeGreaterThan(0);
      expect(spatialQuery.length).toBeGreaterThan(0);
      expect(recentQuery.length).toBeGreaterThan(0);
      expect(aggregateQuery).toHaveLength(3); // 3 status types

      console.log(`Executed complex queries in ${queryDuration}ms`);
    });
  });
});
