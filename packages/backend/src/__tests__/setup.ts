import { beforeAll, afterAll, beforeEach, afterEach } from "vitest";
import mongoose from "mongoose";
import { config } from "dotenv";

// Load environment variables
config();

// Test database configuration
const TEST_DB_NAME = "reporunner_test";
const TEST_MONGODB_URI =
  process.env.TEST_MONGODB_URI || `mongodb://localhost:27017/${TEST_DB_NAME}`;

// Global test setup
beforeAll(async () => {
  // Clear any existing models to avoid compilation errors
  // @ts-ignore - mongoose.models is read-only but we need to clear it for tests
  mongoose.models = {};
  // @ts-ignore - modelSchemas doesn't exist but some versions use it
  mongoose.modelSchemas = {};

  // Connect to test database
  await mongoose.connect(TEST_MONGODB_URI);
  console.log(`Connected to test database: ${TEST_DB_NAME}`);
});

// Clean database before each test
beforeEach(async () => {
  // Get all collections
  const collections = mongoose.connection.collections;

  // Drop all collections to ensure clean state
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

// Clean up after each test (optional, beforeEach already cleans)
afterEach(async () => {
  // Additional cleanup if needed
});

// Global test teardown
afterAll(async () => {
  // Close database connection
  await mongoose.connection.close();
  console.log("Disconnected from test database");
});

// Test utilities
export const testUtils = {
  /**
   * Create a test user in the database
   */
  createTestUser: async (userData: any = {}) => {
    const { User } = await import("../models/User.js");

    const defaultUser = {
      firstName: "Test",
      lastName: "User",
      email: "test@example.com",
      password: "TestPass123", // Strong password that meets validation requirements
      isActive: true,
      ...userData,
    };

    return User.create(defaultUser);
  },

  /**
   * Create a test user with specific hashed password (bypasses auto-hashing)
   */
  createTestUserWithHashedPassword: async (userData: any = {}) => {
    const { User } = await import("../models/User.js");

    const user = new User({
      firstName: "Test",
      lastName: "User",
      email: "test@example.com",
      isActive: true,
      ...userData,
    });

    // Save without triggering the pre-save hook for password hashing
    return user.save({ validateBeforeSave: true });
  },

  /**
   * Generate JWT token for testing
   */
  generateTestToken: async (userId: string) => {
    const jwt = await import("jsonwebtoken");
    const JWT_SECRET = process.env.JWT_SECRET || "test-secret";

    return jwt.sign({ userId }, JWT_SECRET, { expiresIn: "1h" });
  },

  /**
   * Clean all collections manually if needed
   */
  cleanDatabase: async () => {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }
  },
};

// Export database connection for tests that need direct access
export { mongoose as testDatabase };
