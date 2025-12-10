/**
 * Tests for verificationCodeRepository
 * @module tests/unit/verificationCodeRepository
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import {
  findCourseByVerificationCode,
  areVerificationCodesUnique,
  areVerificationCodesUniqueForUpdate,
  getVerificationCodesByCourseUuid,
  createVerificationCodes,
  updateVerificationCodes
} from "../../../src/repositories/verificationCodeRepository.js";
import { getPrisma } from "../../../src/utils/db.js";

const prisma = getPrisma();

describe("verificationCodeRepository", () => {
  let testCourseUuid;
  let testCourse2Uuid;
  let testTermUuid;
  let testTaRoleUuid;
  let testTutorRoleUuid;
  let testStudentRoleUuid;
  let testTaCode;
  let testTutorCode;
  let testStudentCode;

  beforeAll(async () => {
    // Create test term
    const term = await prisma.classTerm.create({
      data: {
        season: "Spring",
        year: 2099,
        startDate: new Date("2099-01-01"),
        endDate: new Date("2099-06-30"),
        isActive: true
      }
    });
    testTermUuid = term.termUuid;

    // Get role UUIDs
    const taRole = await prisma.role.findFirst({ where: { role: "TA" } });
    const tutorRole = await prisma.role.findFirst({ where: { role: "Tutor" } });
    const studentRole = await prisma.role.findFirst({ where: { role: "Student" } });

    testTaRoleUuid = taRole.roleUuid;
    testTutorRoleUuid = tutorRole.roleUuid;
    testStudentRoleUuid = studentRole.roleUuid;

    // Create test courses
    const course1 = await prisma.course.create({
      data: {
        courseCode: "TEST2099-1",
        courseName: "Test Course 1",
        termUuid: testTermUuid,
        description: "Test course 1"
      }
    });
    testCourseUuid = course1.courseUuid;

    const course2 = await prisma.course.create({
      data: {
        courseCode: "TEST2099-2",
        courseName: "Test Course 2",
        termUuid: testTermUuid,
        description: "Test course 2"
      }
    });
    testCourse2Uuid = course2.courseUuid;

    // Generate unique codes
    testTaCode = "TA-2099";
    testTutorCode = "TUTOR-2099";
    testStudentCode = "STUDENT-2099";
  });

  afterAll(async () => {
    // Clean up test data
    try {
      await prisma.verificationCode.deleteMany({
        where: {
          courseUuid: {
            in: [testCourseUuid, testCourse2Uuid]
          }
        }
      });
      await prisma.course.deleteMany({
        where: {
          courseUuid: {
            in: [testCourseUuid, testCourse2Uuid]
          }
        }
      });
      await prisma.classTerm.deleteMany({
        where: { termUuid: testTermUuid }
      });
    } catch {
      // Ignore cleanup errors
    }
    await prisma.$disconnect();
  });

  describe("areVerificationCodesUnique", () => {
    /**
     * Test that the function returns true when checking codes that don't exist in the database.
     */
    it("should return true for unique codes", async () => {
      const codes = [testTaCode, testTutorCode, testStudentCode];
      const isUnique = await areVerificationCodesUnique(codes);
      expect(isUnique).toBe(true);
    });

    /**
     * Test that the function returns false when checking codes that already exist in the database.
     */
    it("should return false for duplicate codes", async () => {
      // First create codes
      await prisma.$transaction(async (tx) => {
        await createVerificationCodes(tx, testCourseUuid, {
          taCode: testTaCode,
          tutorCode: testTutorCode,
          studentCode: testStudentCode
        });
      });

      const codes = [testTaCode, testTutorCode, testStudentCode];
      const isUnique = await areVerificationCodesUnique(codes);
      expect(isUnique).toBe(false);
    });
  });

  describe("createVerificationCodes", () => {
    /**
     * Test that verification codes for TA, Tutor, and Student roles can be created for a course.
     */
    it("should create verification codes for a course", async () => {
      const newCodes = {
        taCode: "TA-NEW-2099",
        tutorCode: "TUTOR-NEW-2099",
        studentCode: "STUDENT-NEW-2099"
      };

      await prisma.$transaction(async (tx) => {
        await createVerificationCodes(tx, testCourse2Uuid, newCodes);
      });

      // Verify codes were created
      const veriCodes = await prisma.verificationCode.findMany({
        where: { courseUuid: testCourse2Uuid }
      });

      expect(veriCodes).toBeDefined();
      expect(veriCodes.length).toBe(3);

      const codes = veriCodes.map(vc => vc.veriCode);
      expect(codes).toContain(newCodes.taCode);
      expect(codes).toContain(newCodes.tutorCode);
      expect(codes).toContain(newCodes.studentCode);
    });
  });

  describe("getVerificationCodesByCourseUuid", () => {
    /**
     * Test that all verification codes for a course can be retrieved and mapped to role types.
     */
    it("should retrieve verification codes for a course", async () => {
      const codes = await getVerificationCodesByCourseUuid(testCourseUuid);

      expect(codes).toBeDefined();
      expect(codes.taCode).toBe(testTaCode);
      expect(codes.tutorCode).toBe(testTutorCode);
      expect(codes.studentCode).toBe(testStudentCode);
    });

    /**
     * Test that empty strings are returned for courses without any verification codes.
     */
    it("should return empty codes for course without verification codes", async () => {
      const newCourse = await prisma.course.create({
        data: {
          courseCode: "NOCODES2099",
          courseName: "No Codes Course",
          termUuid: testTermUuid,
          description: "Course without codes"
        }
      });

      const codes = await getVerificationCodesByCourseUuid(newCourse.courseUuid);

      expect(codes).toBeDefined();
      expect(codes.taCode).toBe("");
      expect(codes.tutorCode).toBe("");
      expect(codes.studentCode).toBe("");

      // Clean up
      await prisma.course.delete({
        where: { courseUuid: newCourse.courseUuid }
      });
    });
  });

  describe("findCourseByVerificationCode", () => {
    /**
     * Test that a course can be found using a valid, active verification code.
     */
    it("should find a course by verification code", async () => {
      const result = await findCourseByVerificationCode(testTaCode);

      expect(result).toBeDefined();
      expect(result.courseUuid).toBe(testCourseUuid);
      expect(result.veriCode).toBe(testTaCode);
      expect(result.isActive).toBe(true);
    });

    /**
     * Test that null is returned when searching with a verification code that doesn't exist.
     */
    it("should return null for non-existent code", async () => {
      const result = await findCourseByVerificationCode("NON-EXISTENT-CODE");
      expect(result).toBeNull();
    });

    /**
     * Test that null is returned when searching with an inactive verification code.
     */
    it("should return null for inactive code", async () => {
      // Create a test course for this inactive code
      const inactiveCourse = await prisma.course.create({
        data: {
          courseCode: "INACTIVE-COURSE-2099",
          courseName: "Inactive Code Test Course",
          termUuid: testTermUuid,
          description: "Course for testing inactive codes"
        }
      });

      // Create an inactive code
      const inactiveCode = "INACTIVE-2099";
      await prisma.verificationCode.create({
        data: {
          courseUuid: inactiveCourse.courseUuid,
          roleUuid: testTaRoleUuid,
          veriCode: inactiveCode,
          isActive: false
        }
      });

      const result = await findCourseByVerificationCode(inactiveCode);
      expect(result).toBeNull();

      // Clean up
      await prisma.verificationCode.delete({
        where: { veriCode: inactiveCode }
      });
      await prisma.course.delete({
        where: { courseUuid: inactiveCourse.courseUuid }
      });
    });
  });

  describe("areVerificationCodesUniqueForUpdate", () => {
    /**
     * Test that new codes are considered unique when updating a course if they don't exist elsewhere.
     */
    it("should return true for unique codes excluding current course", async () => {
      const newCodes = [
        "TA-UPDATE-2099",
        "TUTOR-UPDATE-2099",
        "STUDENT-UPDATE-2099"
      ];

      const isUnique = await areVerificationCodesUniqueForUpdate(testCourseUuid, newCodes);
      expect(isUnique).toBe(true);
    });

    /**
     * Test that a course can reuse its own existing verification codes during an update.
     */
    it("should return true for same course codes", async () => {
      // Using the same codes for the same course should be allowed
      const codes = [testTaCode, testTutorCode, testStudentCode];
      const isUnique = await areVerificationCodesUniqueForUpdate(testCourseUuid, codes);
      expect(isUnique).toBe(true);
    });

    /**
     * Test that false is returned when attempting to use codes that belong to a different course.
     */
    it("should return false for codes used by other courses", async () => {
      // Get codes from testCourse2Uuid
      const course2Codes = await getVerificationCodesByCourseUuid(testCourse2Uuid);
      const codes = [course2Codes.taCode, course2Codes.tutorCode, course2Codes.studentCode];

      // Try to use those codes for testCourseUuid
      const isUnique = await areVerificationCodesUniqueForUpdate(testCourseUuid, codes);
      expect(isUnique).toBe(false);
    });
  });

  describe("updateVerificationCodes", () => {
    /**
     * Test that existing verification codes for a course can be updated to new values.
     */
    it("should update verification codes for a course", async () => {
      const updatedCodes = {
        taCode: "TA-UPDATED-2099",
        tutorCode: "TUTOR-UPDATED-2099",
        studentCode: "STUDENT-UPDATED-2099"
      };

      await prisma.$transaction(async (tx) => {
        await updateVerificationCodes(tx, testCourseUuid, updatedCodes);
      });

      // Verify codes were updated
      const codes = await getVerificationCodesByCourseUuid(testCourseUuid);

      expect(codes.taCode).toBe(updatedCodes.taCode);
      expect(codes.tutorCode).toBe(updatedCodes.tutorCode);
      expect(codes.studentCode).toBe(updatedCodes.studentCode);
    });
  });
});
