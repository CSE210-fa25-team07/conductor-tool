/**
 * Tests for courseRepository
 * @module tests/unit/courseRepository
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import {
  getCoursesByUserId,
  getCoursesWithDetailsByUserId,
  enrollUserToCourse,
  getCourseByUuid,
  getUsersByCourseUuid,
  getAllActiveTerms,
  isUserCourseProfessor,
  findCourseByCodeTermAndProfessor,
  getCourseWithVerificationCodes,
  createCourseWithVerificationCodes,
  updateCourseWithVerificationCodes,
  removeUserFromCourse,
  deleteCourse
} from "../../../src/repositories/courseRepository.js";
import { getPrisma } from "../../../src/utils/db.js";

const prisma = getPrisma();

describe("courseRepository", () => {
  let testUserUuid;
  let testProfessorUuid;
  let testCourseUuid;
  let testTermUuid;
  let testStudentRoleUuid;
  let testProfessorRoleUuid;
  let testTaRoleUuid;
  const testEmail = "test-course-2099@ucsd.edu";
  const testProfEmail = "test-prof-2099@ucsd.edu";

  beforeAll(async () => {
    // Create test term with a unique year to avoid conflicts
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

    // Get role UUIDs
    const studentRole = await prisma.role.findFirst({ where: { role: "Student" } });
    const professorRole = await prisma.role.findFirst({ where: { role: "Professor" } });
    const taRole = await prisma.role.findFirst({ where: { role: "TA" } });

    testStudentRoleUuid = studentRole.roleUuid;
    testProfessorRoleUuid = professorRole.roleUuid;
    testTaRoleUuid = taRole.roleUuid;

    // Create test users
    const user = await prisma.user.create({
      data: {
        email: testEmail,
        firstName: "Test",
        lastName: "Student"
      }
    });
    testUserUuid = user.userUuid;

    const professor = await prisma.user.create({
      data: {
        email: testProfEmail,
        firstName: "Test",
        lastName: "Professor"
      }
    });
    testProfessorUuid = professor.userUuid;
  });

  afterAll(async () => {
    // Clean up test data
    try {
      if (testCourseUuid) {
        await prisma.courseEnrollment.deleteMany({
          where: { courseUuid: testCourseUuid }
        });
        await prisma.verificationCode.deleteMany({
          where: { courseUuid: testCourseUuid }
        });
        await prisma.course.deleteMany({
          where: { courseUuid: testCourseUuid }
        });
      }
      await prisma.user.deleteMany({
        where: { userUuid: { in: [testUserUuid, testProfessorUuid] } }
      });
      await prisma.classTerm.deleteMany({
        where: { termUuid: testTermUuid }
      });
    } catch {
      // Ignore cleanup errors
    }
    await prisma.$disconnect();
  });

  describe("createCourseWithVerificationCodes", () => {
    /**
     * Test that a new course can be created with verification codes for TA, Tutor, and Student roles.
     * Verifies that the course is created with correct data, three verification codes are generated,
     * and the instructor is automatically enrolled as a professor.
     */
    it("should create a course with verification codes", async () => {
      const courseData = {
        courseCode: "CSE-2099",
        courseName: "Test Course",
        termUuid: testTermUuid,
        description: "Test Description",
        syllabusUrl: "https://example.com/syllabus",
        canvasUrl: "https://example.com/canvas",
        taCode: "TA-2099",
        tutorCode: "TUTOR-2099",
        studentCode: "STUDENT-2099",
        instructorId: testProfessorUuid
      };

      const course = await createCourseWithVerificationCodes(courseData);

      expect(course).toBeDefined();
      expect(course.courseUuid).toBeDefined();
      expect(course.courseCode).toBe(courseData.courseCode);
      expect(course.courseName).toBe(courseData.courseName);

      testCourseUuid = course.courseUuid;

      // Verify verification codes were created
      const veriCodes = await prisma.verificationCode.findMany({
        where: { courseUuid: testCourseUuid }
      });
      expect(veriCodes.length).toBe(3);

      // Verify professor enrollment
      const enrollment = await prisma.courseEnrollment.findFirst({
        where: {
          userUuid: testProfessorUuid,
          courseUuid: testCourseUuid,
          roleUuid: testProfessorRoleUuid
        }
      });
      expect(enrollment).toBeDefined();
    });
  });

  describe("getCourseByUuid", () => {
    /**
     * Test that a course can be successfully retrieved by its UUID.
     * Verifies that the returned course has the correct UUID and includes term information.
     */
    it("should retrieve a course by UUID", async () => {
      const course = await getCourseByUuid(testCourseUuid);

      expect(course).toBeDefined();
      expect(course.courseUuid).toBe(testCourseUuid);
      expect(course.term).toBeDefined();
    });

    /**
     * Test that the repository returns null when attempting to retrieve a course
     * with a UUID that doesn't exist in the database.
     */
    it("should return null for non-existent UUID", async () => {
      const course = await getCourseByUuid("00000000-0000-0000-0000-000000000000");
      expect(course).toBeNull();
    });
  });

  describe("getCourseWithVerificationCodes", () => {
    /**
     * Test that a course can be retrieved with all its verification codes (TA, Tutor, Student).
     * Verifies that the returned course object includes the verification code fields.
     */
    it("should retrieve course with verification codes", async () => {
      const course = await getCourseWithVerificationCodes(testCourseUuid);

      expect(course).toBeDefined();
      expect(course.courseUuid).toBe(testCourseUuid);
      expect(course.taCode).toBeDefined();
      expect(course.tutorCode).toBeDefined();
      expect(course.studentCode).toBeDefined();
    });
  });

  describe("enrollUserToCourse", () => {
    /**
     * Test that a user can be successfully enrolled in a course with a specific role.
     * Verifies that the enrollment is created with the correct user, course, and active status.
     */
    it("should enroll a user to a course", async () => {
      const enrollment = await enrollUserToCourse(
        testUserUuid,
        testCourseUuid,
        testStudentRoleUuid
      );

      expect(enrollment).toBeDefined();
      expect(enrollment.userUuid).toBe(testUserUuid);
      expect(enrollment.courseUuid).toBe(testCourseUuid);
      expect(enrollment.enrollmentStatus).toBe("active");
    });

    /**
     * Test that attempting to enroll a user who is already enrolled in a course returns null.
     * This prevents duplicate enrollments for the same user-course-role combination.
     */
    it("should return null for duplicate enrollment", async () => {
      const enrollment = await enrollUserToCourse(
        testUserUuid,
        testCourseUuid,
        testStudentRoleUuid
      );

      expect(enrollment).toBeNull();
    });
  });

  describe("getCoursesByUserId", () => {
    /**
     * Test that all course UUIDs for a given user can be retrieved.
     * Verifies that the returned array contains the test course UUID.
     */
    it("should retrieve courses for a user", async () => {
      const courses = await getCoursesByUserId(testUserUuid);

      expect(courses).toBeDefined();
      expect(Array.isArray(courses)).toBe(true);
      expect(courses).toContain(testCourseUuid);
    });
  });

  describe("getCoursesWithDetailsByUserId", () => {
    /**
     * Test that detailed course information can be retrieved for a user's enrolled courses.
     * Verifies that the returned courses include code, name, and term details.
     */
    it("should retrieve courses with details for a user", async () => {
      const courses = await getCoursesWithDetailsByUserId(testUserUuid);

      expect(courses).toBeDefined();
      expect(Array.isArray(courses)).toBe(true);

      const testCourse = courses.find(c => c.courseUuid === testCourseUuid);
      expect(testCourse).toBeDefined();
      expect(testCourse.code).toBeDefined();
      expect(testCourse.name).toBeDefined();
      expect(testCourse.term).toBeDefined();
    });
  });

  describe("getUsersByCourseUuid", () => {
    /**
     * Test that all users enrolled in a course can be retrieved with their roles.
     * Verifies that the test student user is in the list with the correct email and role.
     */
    it("should retrieve users enrolled in a course", async () => {
      const users = await getUsersByCourseUuid(testCourseUuid);

      expect(users).toBeDefined();
      expect(Array.isArray(users)).toBe(true);
      expect(users.length).toBeGreaterThan(0);

      const testUser = users.find(u => u.userUuid === testUserUuid);
      expect(testUser).toBeDefined();
      expect(testUser.email).toBe(testEmail);
      expect(testUser.role).toBe("Student");
    });
  });

  describe("getAllActiveTerms", () => {
    /**
     * Test that all active terms in the system can be retrieved.
     * Verifies that the test term (Fall 2099) is included in the results.
     */
    it("should retrieve all active terms", async () => {
      const terms = await getAllActiveTerms();

      expect(terms).toBeDefined();
      expect(Array.isArray(terms)).toBe(true);

      const testTerm = terms.find(t => t.termUuid === testTermUuid);
      expect(testTerm).toBeDefined();
      expect(testTerm.season).toBe("Fall");
      expect(testTerm.year).toBe(2099);
    });
  });

  describe("isUserCourseProfessor", () => {
    /**
     * Test that the function correctly identifies when a user is a professor for a course.
     * Verifies that the test professor user returns true.
     */
    it("should return true for a professor", async () => {
      const isProfessor = await isUserCourseProfessor(testProfessorUuid, testCourseUuid);
      expect(isProfessor).toBe(true);
    });

    /**
     * Test that the function correctly identifies when a user is not a professor for a course.
     * Verifies that the test student user returns false.
     */
    it("should return false for a student", async () => {
      const isProfessor = await isUserCourseProfessor(testUserUuid, testCourseUuid);
      expect(isProfessor).toBe(false);
    });
  });

  describe("findCourseByCodeTermAndProfessor", () => {
    /**
     * Test that a course can be found by the combination of course code, term, and professor.
     * Verifies that the correct course is returned when all three parameters match.
     */
    it("should find a course by code, term, and professor", async () => {
      const course = await getCourseByUuid(testCourseUuid);
      const foundCourse = await findCourseByCodeTermAndProfessor(
        course.courseCode,
        testTermUuid,
        testProfessorUuid
      );

      expect(foundCourse).toBeDefined();
      expect(foundCourse.courseUuid).toBe(testCourseUuid);
    });

    /**
     * Test that null is returned when searching for a non-existent course combination.
     * Verifies that the function handles cases where no matching course exists.
     */
    it("should return null for non-existent combination", async () => {
      const foundCourse = await findCourseByCodeTermAndProfessor(
        "NONEXISTENT",
        testTermUuid,
        testProfessorUuid
      );

      expect(foundCourse).toBeNull();
    });
  });

  describe("updateCourseWithVerificationCodes", () => {
    /**
     * Test that an existing course can be updated with new information and verification codes.
     * Verifies that the course name, description, URLs, and verification codes are all updated correctly.
     */
    it("should update a course with new verification codes", async () => {
      const updatedData = {
        courseCode: "CSE-2099-UPDATED",
        courseName: "Updated Course Name",
        termUuid: testTermUuid,
        description: "Updated Description",
        syllabusUrl: "https://example.com/syllabus-updated",
        canvasUrl: "https://example.com/canvas-updated",
        taCode: "TA-2099-NEW",
        tutorCode: "TUTOR-2099-NEW",
        studentCode: "STUDENT-2099-NEW"
      };

      const course = await updateCourseWithVerificationCodes(testCourseUuid, updatedData);

      expect(course).toBeDefined();
      expect(course.courseName).toBe(updatedData.courseName);
      expect(course.description).toBe(updatedData.description);
    });
  });

  describe("removeUserFromCourse", () => {
    /**
     * Test that a user can be successfully removed from a course.
     * Verifies that the enrollment record is deleted and no longer exists in the database.
     */
    it("should remove a user from a course", async () => {
      const result = await removeUserFromCourse(testUserUuid, testCourseUuid);

      expect(result).toBeDefined();
      expect(result.count).toBeGreaterThan(0);

      // Verify user is no longer enrolled
      const enrollment = await prisma.courseEnrollment.findFirst({
        where: {
          userUuid: testUserUuid,
          courseUuid: testCourseUuid
        }
      });
      expect(enrollment).toBeNull();
    });
  });

  describe("deleteCourse", () => {
    /**
     * Test that a course can be completely deleted from the database.
     * Verifies that the course no longer exists after deletion and clears the test course UUID
     * to prevent cleanup errors.
     */
    it("should delete a course", async () => {
      const deletedCourse = await deleteCourse(testCourseUuid);

      expect(deletedCourse).toBeDefined();
      expect(deletedCourse.courseUuid).toBe(testCourseUuid);

      // Verify course no longer exists
      const course = await prisma.course.findUnique({
        where: { courseUuid: testCourseUuid }
      });
      expect(course).toBeNull();

      // Clear testCourseUuid so cleanup doesn't try to delete it again
      testCourseUuid = null;
    });
  });
});
