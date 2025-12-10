/**
 * Tests for userRepository
 * @module tests/unit/userRepository
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import {
  addUser,
  addUserWithStaffStatus,
  getUserByEmail,
  getAllUsers,
  getUserByUuid,
  getUsersByUuids,
  deleteUserByUuid,
  getUserStatusByUuid,
  updateUserGitHub,
  getAllUsersWithStaffStatus,
  updateStaffStatus,
  transferLeadAdmin
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
    /**
     * Test that a new user can be created with basic information (email, first name, last name).
     */
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

    /**
     * Test that attempting to create a user with a duplicate email throws an error.
     */
    it("should reject duplicate email", async () => {
      const userData = {
        email: testUserEmail,
        firstName: "Test",
        lastName: "User"
      };

      await expect(addUser(userData)).rejects.toThrow();
    });

    /**
     * Test that a user can be retrieved by their email address.
     */
    it("should retrieve user by email", async () => {
      const retrievedUser = await getUserByEmail(testUserEmail);

      expect(retrievedUser).toBeDefined();
      expect(retrievedUser.userUuid).toBe(testUserUuid);
      expect(retrievedUser.email).toBe(testUserEmail);
    });
  });

  describe("deleteUserByUuid", () => {
    /**
     * Test that a user can be deleted and returns information about deleted enrollments and courses.
     */
    it("should delete user successfully", async () => {
      const result = await deleteUserByUuid(testUserUuid);

      expect(result).toBeDefined();
      expect(result.deletedUser).toBeDefined();
      expect(result.deletedUser.userUuid).toBe(testUserUuid);
      expect(result.deletedUser.email).toBe(testUserEmail);
      expect(result.deletedCoursesCount).toBeDefined();
      expect(result.deletedCourseUuids).toBeDefined();
    });

    /**
     * Test that a deleted user no longer exists in the database.
     */
    it("should verify user no longer exists", async () => {
      const user = await getUserByEmail(testUserEmail);
      expect(user).toBeNull();
    });
  });

  describe("addUserWithStaffStatus", () => {
    let staffUserUuid;
    const staffUserEmail = `test-staff-${Date.now()}@ucsd.edu`;

    afterAll(async () => {
      if (staffUserUuid) {
        try {
          await prisma.staff.deleteMany({ where: { userUuid: staffUserUuid } });
          await prisma.user.delete({ where: { userUuid: staffUserUuid } });
        } catch {
          // Already deleted
        }
      }
    });

    /**
     * Test that a user can be created with professor staff status.
     */
    it("should create user with professor status", async () => {
      const userData = {
        email: staffUserEmail,
        firstName: "Test",
        lastName: "Professor"
      };
      const staffStatus = {
        isProf: true,
        isSystemAdmin: false
      };

      const user = await addUserWithStaffStatus(userData, staffStatus);

      expect(user).toBeDefined();
      expect(user.userUuid).toBeDefined();
      expect(user.email).toBe(staffUserEmail);

      staffUserUuid = user.userUuid;

      // Verify staff record was created
      const staff = await prisma.staff.findUnique({
        where: { userUuid: user.userUuid }
      });
      expect(staff).toBeDefined();
      expect(staff.isProf).toBe(true);
      expect(staff.isSystemAdmin).toBe(false);
    });

    /**
     * Test that a user can be created with system admin staff status.
     */
    it("should create user with system admin status", async () => {
      const adminEmail = `test-admin-${Date.now()}@ucsd.edu`;
      const userData = {
        email: adminEmail,
        firstName: "Test",
        lastName: "Admin"
      };
      const staffStatus = {
        isProf: false,
        isSystemAdmin: true
      };

      const user = await addUserWithStaffStatus(userData, staffStatus);

      expect(user).toBeDefined();

      const staff = await prisma.staff.findUnique({
        where: { userUuid: user.userUuid }
      });
      expect(staff).toBeDefined();
      expect(staff.isSystemAdmin).toBe(true);

      // Clean up
      await prisma.staff.delete({ where: { userUuid: user.userUuid } });
      await prisma.user.delete({ where: { userUuid: user.userUuid } });
    });

    /**
     * Test that attempting to create a staff user with a duplicate email throws an error.
     */
    it("should reject duplicate email", async () => {
      const userData = {
        email: staffUserEmail,
        firstName: "Test",
        lastName: "Duplicate"
      };
      const staffStatus = { isProf: true, isSystemAdmin: false };

      await expect(addUserWithStaffStatus(userData, staffStatus)).rejects.toThrow();
    });
  });

  describe("getAllUsers", () => {
    /**
     * Test that all users in the system can be retrieved with their basic information.
     */
    it("should retrieve all users", async () => {
      const users = await getAllUsers();

      expect(users).toBeDefined();
      expect(Array.isArray(users)).toBe(true);
      expect(users.length).toBeGreaterThan(0);

      users.forEach(user => {
        expect(user).toHaveProperty("userUuid");
        expect(user).toHaveProperty("email");
        expect(user).toHaveProperty("firstName");
        expect(user).toHaveProperty("lastName");
      });
    });

    /**
     * Test that users are returned in alphabetical order by email.
     */
    it("should return users in alphabetical order by email", async () => {
      const users = await getAllUsers();

      if (users.length > 1) {
        for (let i = 0; i < users.length - 1; i++) {
          expect(users[i].email.localeCompare(users[i + 1].email)).toBeLessThanOrEqual(0);
        }
      }
    });
  });

  describe("getUserByUuid", () => {
    let testUuid;

    beforeAll(async () => {
      const user = await prisma.user.findFirst();
      testUuid = user.userUuid;
    });

    /**
     * Test that a user can be retrieved by their UUID.
     */
    it("should retrieve user by UUID", async () => {
      const user = await getUserByUuid(testUuid);

      expect(user).toBeDefined();
      expect(user.userUuid).toBe(testUuid);
      expect(user).toHaveProperty("email");
      expect(user).toHaveProperty("firstName");
    });

    /**
     * Test that null is returned when attempting to retrieve a user with a non-existent UUID.
     */
    it("should return null for non-existent UUID", async () => {
      const user = await getUserByUuid("00000000-0000-0000-0000-000000000000");
      expect(user).toBeNull();
    });
  });

  describe("getUsersByUuids", () => {
    let testUuids;

    beforeAll(async () => {
      const users = await prisma.user.findMany({ take: 3 });
      testUuids = users.map(u => u.userUuid);
    });

    /**
     * Test that multiple users can be retrieved by their UUIDs with course enrollment information.
     */
    it("should retrieve multiple users by UUIDs", async () => {
      const users = await getUsersByUuids(testUuids);

      expect(users).toBeDefined();
      expect(Array.isArray(users)).toBe(true);
      expect(users.length).toBeGreaterThan(0);

      users.forEach(user => {
        expect(testUuids).toContain(user.userUuid);
        expect(user).toHaveProperty("courseEnrollments");
      });
    });

    /**
     * Test that an empty array is returned when attempting to retrieve users with non-existent UUIDs.
     */
    it("should return empty array for non-existent UUIDs", async () => {
      const users = await getUsersByUuids(["00000000-0000-0000-0000-000000000000"]);
      expect(users).toEqual([]);
    });
  });

  describe("getUserStatusByUuid", () => {
    let staffUserUuid;
    let regularUserUuid;

    beforeAll(async () => {
      const staffUser = await prisma.user.findFirst({
        where: { staff: { isNot: null } }
      });
      staffUserUuid = staffUser?.userUuid;

      const regularUser = await prisma.user.findFirst({
        where: { staff: null }
      });
      regularUserUuid = regularUser?.userUuid;
    });

    /**
     * Test that staff status flags are correctly returned for a staff user.
     */
    it("should return staff status for staff user", async () => {
      if (staffUserUuid) {
        const status = await getUserStatusByUuid(staffUserUuid);

        expect(status).toBeDefined();
        expect(status).toHaveProperty("isProf");
        expect(status).toHaveProperty("isSystemAdmin");
        expect(status).toHaveProperty("isLeadAdmin");
      }
    });

    /**
     * Test that all status flags return false for a non-staff user.
     */
    it("should return false flags for non-staff user", async () => {
      if (regularUserUuid) {
        const status = await getUserStatusByUuid(regularUserUuid);

        expect(status).toBeDefined();
        expect(status.isProf).toBe(false);
        expect(status.isSystemAdmin).toBe(false);
        expect(status.isLeadAdmin).toBe(false);
      }
    });
  });

  describe("updateUserGitHub", () => {
    let testUuid;

    beforeAll(async () => {
      const user = await prisma.user.findFirst();
      testUuid = user.userUuid;
    });

    /**
     * Test that a user's GitHub username and access token can be updated.
     */
    it("should update GitHub username and token", async () => {
      const githubData = {
        githubUsername: "testuser",
        githubAccessToken: "test_token_123"
      };

      const updatedUser = await updateUserGitHub(testUuid, githubData);

      expect(updatedUser).toBeDefined();
      expect(updatedUser.githubUsername).toBe("testuser");
      expect(updatedUser.githubAccessToken).toBe("test_token_123");

      // Clean up - reset to null
      await updateUserGitHub(testUuid, {
        githubUsername: null,
        githubAccessToken: null
      });
    });
  });

  describe("getAllUsersWithStaffStatus", () => {
    /**
     * Test that all users can be retrieved with their staff status flags included.
     */
    it("should retrieve all users with staff status", async () => {
      const users = await getAllUsersWithStaffStatus();

      expect(users).toBeDefined();
      expect(Array.isArray(users)).toBe(true);

      users.forEach(user => {
        expect(user).toHaveProperty("userUuid");
        expect(user).toHaveProperty("email");
        expect(user).toHaveProperty("firstName");
        expect(user).toHaveProperty("lastName");
        expect(user).toHaveProperty("isProf");
        expect(user).toHaveProperty("isSystemAdmin");
        expect(user).toHaveProperty("isLeadAdmin");
        expect(typeof user.isProf).toBe("boolean");
        expect(typeof user.isSystemAdmin).toBe("boolean");
        expect(typeof user.isLeadAdmin).toBe("boolean");
      });
    });

    /**
     * Test that users are returned in alphabetical order by last name.
     */
    it("should return users ordered by last name", async () => {
      const users = await getAllUsersWithStaffStatus();

      if (users.length > 1) {
        for (let i = 0; i < users.length - 1; i++) {
          expect(users[i].lastName.localeCompare(users[i + 1].lastName)).toBeLessThanOrEqual(0);
        }
      }
    });
  });

  describe("updateStaffStatus", () => {
    let testUserUuid;

    beforeAll(async () => {
      const user = await prisma.user.create({
        data: {
          email: `test-status-${Date.now()}@ucsd.edu`,
          firstName: "Test",
          lastName: "Status"
        }
      });
      testUserUuid = user.userUuid;
    });

    afterAll(async () => {
      if (testUserUuid) {
        try {
          await prisma.staff.deleteMany({ where: { userUuid: testUserUuid } });
          await prisma.user.delete({ where: { userUuid: testUserUuid } });
        } catch {
          // Already deleted
        }
      }
    });

    /**
     * Test that a staff record is created if it doesn't exist when updating staff status.
     */
    it("should create staff record if it doesn't exist", async () => {
      const staff = await updateStaffStatus(testUserUuid, {
        isProf: true,
        isSystemAdmin: false
      });

      expect(staff).toBeDefined();
      expect(staff.isProf).toBe(true);
      expect(staff.isSystemAdmin).toBe(false);
    });

    /**
     * Test that an existing staff record can be updated with new values.
     */
    it("should update existing staff record", async () => {
      const staff = await updateStaffStatus(testUserUuid, {
        isSystemAdmin: true
      });

      expect(staff).toBeDefined();
      expect(staff.isSystemAdmin).toBe(true);
    });
  });

  describe("transferLeadAdmin", () => {
    let currentLeadUuid;
    let newLeadUuid;

    beforeAll(async () => {
      // Create two admin users
      const user1 = await prisma.user.create({
        data: {
          email: `current-lead-${Date.now()}@ucsd.edu`,
          firstName: "Current",
          lastName: "Lead"
        }
      });
      currentLeadUuid = user1.userUuid;

      const user2 = await prisma.user.create({
        data: {
          email: `new-lead-${Date.now()}@ucsd.edu`,
          firstName: "New",
          lastName: "Lead"
        }
      });
      newLeadUuid = user2.userUuid;

      // Create staff records
      await prisma.staff.create({
        data: {
          userUuid: currentLeadUuid,
          isProf: false,
          isSystemAdmin: true,
          isLeadAdmin: true
        }
      });

      await prisma.staff.create({
        data: {
          userUuid: newLeadUuid,
          isProf: false,
          isSystemAdmin: true,
          isLeadAdmin: false
        }
      });
    });

    afterAll(async () => {
      try {
        await prisma.staff.deleteMany({
          where: { userUuid: { in: [currentLeadUuid, newLeadUuid] } }
        });
        await prisma.user.deleteMany({
          where: { userUuid: { in: [currentLeadUuid, newLeadUuid] } }
        });
      } catch {
        // Already deleted
      }
    });

    /**
     * Test that lead admin status can be transferred from one user to another.
     * Verifies that the old lead loses the status and the new lead gains it.
     */
    it("should transfer lead admin status", async () => {
      const result = await transferLeadAdmin(currentLeadUuid, newLeadUuid);

      expect(result).toBeDefined();
      expect(result.oldLead).toBeDefined();
      expect(result.newLead).toBeDefined();
      expect(result.oldLead.isLeadAdmin).toBe(false);
      expect(result.newLead.isLeadAdmin).toBe(true);

      // Verify in database
      const oldLeadStaff = await prisma.staff.findUnique({
        where: { userUuid: currentLeadUuid }
      });
      const newLeadStaff = await prisma.staff.findUnique({
        where: { userUuid: newLeadUuid }
      });

      expect(oldLeadStaff.isLeadAdmin).toBe(false);
      expect(newLeadStaff.isLeadAdmin).toBe(true);
    });
  });
});
