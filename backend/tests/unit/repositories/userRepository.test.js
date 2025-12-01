/**
 * Tests for userRepository
 */

import { describe, it, expect, afterAll } from "vitest";
import {
  addUser,
  getUserByEmail,
  deleteUserByUuid
} from "../../../src/repositories/userRepository.js";
import { getPrisma } from "../../../src/utils/db.js";

const prisma = getPrisma();

describe("userRepository", () => {
  let testUserUuid;
  const testUserEmail = `test-${Date.now()}@ucsd.edu`;

  afterAll(async () => {
    // Clean up any test data
    if (testUserUuid) {
      try {
        await deleteUserByUuid(testUserUuid);
      } catch {
        // User may already be deleted
      }
    }
    await prisma.$disconnect();
  });

  describe("addUser", () => {
    it("should create a user successfully", async () => {
      const userData = {
        email: testUserEmail,
        firstName: "Test",
        lastName: "User"
      };

      const user = await addUser(userData);

      expect(user).toBeDefined();
      expect(user.userUuid).toBeDefined();
      expect(user.email).toBe(testUserEmail);
      expect(user.firstName).toBe("Test");
      expect(user.lastName).toBe("User");

      testUserUuid = user.userUuid;
    });

    it("should reject duplicate email", async () => {
      const userData = {
        email: testUserEmail,
        firstName: "Test",
        lastName: "User"
      };

      await expect(addUser(userData)).rejects.toThrow();
    });

    it("should retrieve user by email", async () => {
      const retrievedUser = await getUserByEmail(testUserEmail);

      expect(retrievedUser).toBeDefined();
      expect(retrievedUser.userUuid).toBe(testUserUuid);
      expect(retrievedUser.email).toBe(testUserEmail);
    });
  });

  describe("deleteUserByUuid", () => {
    it("should delete user successfully", async () => {
      const result = await deleteUserByUuid(testUserUuid);

      expect(result).toBeDefined();
      expect(result.deletedUser).toBeDefined();
      expect(result.deletedUser.userUuid).toBe(testUserUuid);
      expect(result.deletedUser.email).toBe(testUserEmail);
      expect(result.deletedCoursesCount).toBeDefined();
      expect(result.deletedCourseUuids).toBeDefined();
    });

    it("should verify user no longer exists", async () => {
      const user = await getUserByEmail(testUserEmail);
      expect(user).toBeNull();
    });
  });
});
