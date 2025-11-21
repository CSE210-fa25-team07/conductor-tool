import { describe, it, expect, beforeAll, afterAll } from "@jest/globals";
import { getUserContext } from "../../../src/repositories/userContextRepository.js";
import { getPrisma } from "../../../src/utils/db.js";

const prisma = getPrisma();

describe("userContextRepository", () => {
  let testUser;

  beforeAll(async () => {
    testUser = await prisma.user.findFirst();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe("getUserContext", () => {
    it("should return user with staff info", async () => {
      const result = await getUserContext(testUser.userUuid);

      expect(result).toHaveProperty("user");
      expect(result).toHaveProperty("enrollments");
      expect(result).toHaveProperty("teamMemberships");
      expect(result.user.userUuid).toBe(testUser.userUuid);
    });

    it("should throw error for non-existent user", async () => {
      const fakeUuid = "00000000-0000-0000-0000-000000000000";
      await expect(getUserContext(fakeUuid)).rejects.toThrow("User not found");
    });

    it("should return active enrollments only", async () => {
      const result = await getUserContext(testUser.userUuid);

      result.enrollments.forEach(enrollment => {
        expect(enrollment.enrollmentStatus).toBe("active");
        expect(enrollment.course.term.isActive).toBe(true);
      });
    });

    it("should return active team memberships only", async () => {
      const result = await getUserContext(testUser.userUuid);

      result.teamMemberships.forEach(membership => {
        expect(membership.leftAt).toBeNull();
      });
    });
  });
});
