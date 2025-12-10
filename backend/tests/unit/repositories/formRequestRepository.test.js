/**
 * Tests for formRequestRepository
 * @module tests/unit/formRequestRepository
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import {
  createFormRequest,
  getAllFormRequests,
  getFormRequestByUuid,
  deleteFormRequest,
  approveFormRequestTransaction
} from "../../../src/repositories/formRequestRepository.js";
import { getPrisma } from "../../../src/utils/db.js";

const prisma = getPrisma();

describe("formRequestRepository", () => {
  let testFormRequestUuid;
  let testVerificationCode;
  let testCourseUuid;
  let testTermUuid;
  let testRoleUuid;
  const testEmail = "test-form-2099@ucsd.edu";

  beforeAll(async () => {
    // Create test data: term, course, role, and verification code
    const term = await prisma.classTerm.create({
      data: {
        season: "Fall",
        year: 2099,
        startDate: new Date("2099-09-01"),
        endDate: new Date("2099-12-31"),
        isActive: true
      }
    });
    testTermUuid = term.termUuid;

    const course = await prisma.course.create({
      data: {
        courseCode: "TEST2099",
        courseName: "Test Course",
        termUuid: testTermUuid,
        description: "Test course description"
      }
    });
    testCourseUuid = course.courseUuid;

    const role = await prisma.role.findFirst({
      where: { role: "Student" }
    });
    testRoleUuid = role.roleUuid;

    const veriCode = await prisma.verificationCode.create({
      data: {
        courseUuid: testCourseUuid,
        roleUuid: testRoleUuid,
        veriCode: `TESTCODE${Date.now()}`,
        isActive: true
      }
    });
    testVerificationCode = veriCode.veriCode;
  });

  afterAll(async () => {
    // Clean up test data
    try {
      if (testFormRequestUuid) {
        await prisma.formRequest.deleteMany({
          where: { requestUuid: testFormRequestUuid }
        });
      }
      await prisma.formRequest.deleteMany({
        where: { email: testEmail }
      });
      await prisma.verificationCode.deleteMany({
        where: { veriCode: testVerificationCode }
      });
      await prisma.course.deleteMany({
        where: { courseUuid: testCourseUuid }
      });
      await prisma.classTerm.deleteMany({
        where: { termUuid: testTermUuid }
      });
    } catch {
      // Ignore cleanup errors
    }
    await prisma.$disconnect();
  });

  describe("createFormRequest", () => {
    /**
     * Test that a form request can be created with user information and a verification code.
     * Verifies all fields are stored correctly.
     */
    it("should create a form request successfully", async () => {
      const formRequest = await createFormRequest(
        "Test",
        "User",
        testEmail,
        "UCSD",
        testVerificationCode
      );

      expect(formRequest).toBeDefined();
      expect(formRequest.requestUuid).toBeDefined();
      expect(formRequest.firstName).toBe("Test");
      expect(formRequest.lastName).toBe("User");
      expect(formRequest.email).toBe(testEmail);
      expect(formRequest.relatedInstitution).toBe("UCSD");
      expect(formRequest.verificationCode).toBe(testVerificationCode);

      testFormRequestUuid = formRequest.requestUuid;
    });

    /**
     * Test that attempting to create a form request with a duplicate email returns null.
     */
    it("should return null for duplicate email", async () => {
      const formRequest = await createFormRequest(
        "Test",
        "User",
        testEmail,
        "UCSD",
        testVerificationCode
      );

      expect(formRequest).toBeNull();
    });
  });

  describe("getFormRequestByUuid", () => {
    /**
     * Test that a form request can be retrieved by its UUID.
     */
    it("should retrieve a form request by UUID", async () => {
      const formRequest = await getFormRequestByUuid(testFormRequestUuid);

      expect(formRequest).toBeDefined();
      expect(formRequest.requestUuid).toBe(testFormRequestUuid);
      expect(formRequest.email).toBe(testEmail);
    });

    /**
     * Test that null is returned when attempting to retrieve a form request with a non-existent UUID.
     */
    it("should return null for non-existent UUID", async () => {
      const formRequest = await getFormRequestByUuid("00000000-0000-0000-0000-000000000000");
      expect(formRequest).toBeNull();
    });
  });

  describe("getAllFormRequests", () => {
    /**
     * Test that all form requests can be retrieved with their associated course and role information.
     */
    it("should retrieve all form requests with course info", async () => {
      const formRequests = await getAllFormRequests();

      expect(formRequests).toBeDefined();
      expect(Array.isArray(formRequests)).toBe(true);

      const testRequest = formRequests.find(req => req.requestUuid === testFormRequestUuid);
      expect(testRequest).toBeDefined();
      expect(testRequest.courseInfo).toBeDefined();
      expect(testRequest.courseInfo.role).toBe("Student");
    });
  });

  describe("deleteFormRequest", () => {
    /**
     * Test that a form request can be successfully deleted by its UUID.
     */
    it("should delete a form request successfully", async () => {
      const deletedRequest = await deleteFormRequest(testFormRequestUuid);

      expect(deletedRequest).toBeDefined();
      expect(deletedRequest.requestUuid).toBe(testFormRequestUuid);
    });

    /**
     * Test that null is returned when attempting to delete a non-existent form request.
     */
    it("should return null when deleting non-existent request", async () => {
      const deletedRequest = await deleteFormRequest("00000000-0000-0000-0000-000000000000");
      expect(deletedRequest).toBeNull();
    });

    /**
     * Test that a deleted form request no longer exists in the database.
     */
    it("should verify request no longer exists", async () => {
      const formRequest = await getFormRequestByUuid(testFormRequestUuid);
      expect(formRequest).toBeNull();
    });
  });

  describe("approveFormRequestTransaction", () => {
    /**
     * Test that approving a form request creates a new user, enrolls them in the course,
     * and deletes the form request in a single transaction.
     */
    it("should approve a form request and create user enrollment", async () => {
      const newEmail = "test-approve-2099@ucsd.edu";

      // Create a new form request to approve
      const formRequest = await createFormRequest(
        "Approve",
        "Test",
        newEmail,
        "UCSD",
        testVerificationCode
      );

      expect(formRequest).toBeDefined();

      const userData = {
        firstName: "Approve",
        lastName: "Test",
        email: newEmail
      };

      const result = await approveFormRequestTransaction(
        formRequest.requestUuid,
        userData,
        testCourseUuid,
        testRoleUuid
      );

      expect(result).toBeDefined();
      expect(result.userUuid).toBeDefined();
      expect(result.email).toBe(newEmail);

      // Verify user was created
      const createdUser = await prisma.user.findUnique({
        where: { email: newEmail }
      });
      expect(createdUser).toBeDefined();

      // Verify enrollment was created
      const enrollment = await prisma.courseEnrollment.findFirst({
        where: {
          userUuid: createdUser.userUuid,
          courseUuid: testCourseUuid
        }
      });
      expect(enrollment).toBeDefined();

      // Verify form request was deleted
      const deletedRequest = await getFormRequestByUuid(formRequest.requestUuid);
      expect(deletedRequest).toBeNull();

      // Clean up
      await prisma.courseEnrollment.deleteMany({
        where: { userUuid: createdUser.userUuid }
      });
      await prisma.user.delete({
        where: { userUuid: createdUser.userUuid }
      });
    });
  });
});
