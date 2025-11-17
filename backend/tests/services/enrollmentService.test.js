/**
 * Enrollment Service Tests
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import * as enrollmentService from "../../src/services/enrollmentService.js";
import * as enrollmentRepository from "../../src/repositories/enrollmentRepository.js";
import * as userRepository from "../../src/repositories/userRepositoryPg.js";
import * as roleRepository from "../../src/repositories/roleRepository.js";

// Mock repositories
vi.mock("../../src/repositories/enrollmentRepository.js");
vi.mock("../../src/repositories/userRepositoryPg.js");
vi.mock("../../src/repositories/roleRepository.js");

describe("EnrollmentService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getUserEnrollments", () => {
    it("should return organized enrollments by course", async () => {
      const mockEnrollments = [
        {
          course_uuid: "c1",
          course_code: "CSE210",
          course_name: "Software Engineering",
          course_description: "Intro to SE",
          term_year: 2025,
          term_season: "Winter",
          term_is_active: true,
          role_uuid: "r1",
          role_name: "student",
          enrollment_status: "active",
          enrolled_at: "2025-01-01"
        }
      ];

      vi.mocked(enrollmentRepository.getEnrollmentsByUser).mockResolvedValue(mockEnrollments);

      const result = await enrollmentService.getUserEnrollments("user1");

      expect(result.userUuid).toBe("user1");
      expect(result.rolesByCourse.c1).toBeDefined();
      expect(result.rolesByCourse.c1.courseCode).toBe("CSE210");
      expect(result.rolesByCourse.c1.roles).toHaveLength(1);
      expect(result.rolesByCourse.c1.roles[0].roleName).toBe("student");
    });

    it("should handle multiple roles in same course", async () => {
      const mockEnrollments = [
        {
          course_uuid: "c1",
          course_code: "CSE210",
          course_name: "Software Engineering",
          role_uuid: "r1",
          role_name: "student",
          term_year: 2025,
          term_season: "Winter",
          term_is_active: true
        },
        {
          course_uuid: "c1",
          course_code: "CSE210",
          course_name: "Software Engineering",
          role_uuid: "r2",
          role_name: "lead",
          term_year: 2025,
          term_season: "Winter",
          term_is_active: true
        }
      ];

      vi.mocked(enrollmentRepository.getEnrollmentsByUser).mockResolvedValue(mockEnrollments);

      const result = await enrollmentService.getUserEnrollments("user1");

      expect(result.rolesByCourse.c1.roles).toHaveLength(2);
    });

    it("should throw error for invalid user ID", async () => {
      await expect(enrollmentService.getUserEnrollments(null)).rejects.toThrow("User ID is required");
      await expect(enrollmentService.getUserEnrollments(123)).rejects.toThrow("must be a string");
    });
  });

  describe("getUserRoleInCourse", () => {
    it("should return user role in course", async () => {
      const mockRole = { role_uuid: "r1", role_name: "ta" };
      vi.mocked(enrollmentRepository.getUserRoleInCourse).mockResolvedValue(mockRole);

      const result = await enrollmentService.getUserRoleInCourse("user1", "course1");

      expect(result).toEqual(mockRole);
    });

    it("should throw error for missing parameters", async () => {
      await expect(enrollmentService.getUserRoleInCourse(null, "course1")).rejects.toThrow("required");
      await expect(enrollmentService.getUserRoleInCourse("user1", null)).rejects.toThrow("required");
    });
  });

  describe("getCourseStudents", () => {
    it("should filter and return only students", async () => {
      const mockEnrollments = [
        { user_uuid: "u1", role_name: "student", first_name: "John" },
        { user_uuid: "u2", role_name: "ta", first_name: "Jane" },
        { user_uuid: "u3", role_name: "student", first_name: "Bob" }
      ];

      vi.mocked(enrollmentRepository.getEnrollmentsByCourse).mockResolvedValue(mockEnrollments);

      const result = await enrollmentService.getCourseStudents("course1");

      expect(result).toHaveLength(2);
      expect(result[0].role_name).toBe("student");
      expect(result[1].role_name).toBe("student");
    });
  });

  describe("getCourseTAs", () => {
    it("should filter and return only TAs", async () => {
      const mockEnrollments = [
        { user_uuid: "u1", role_name: "student", first_name: "John" },
        { user_uuid: "u2", role_name: "ta", first_name: "Jane" },
        { user_uuid: "u3", role_name: "ta", first_name: "Bob" }
      ];

      vi.mocked(enrollmentRepository.getEnrollmentsByCourse).mockResolvedValue(mockEnrollments);

      const result = await enrollmentService.getCourseTAs("course1");

      expect(result).toHaveLength(2);
      expect(result.every(e => e.role_name === "ta")).toBe(true);
    });
  });

  describe("enrollUser", () => {
    it("should successfully enroll user", async () => {
      const mockUser = { user_uuid: "u1", email: "test@example.com" };
      const mockRole = { role_uuid: "r1", role: "student" };
      const mockEnrollment = { user_uuid: "u1", course_uuid: "c1", role_uuid: "r1" };

      vi.mocked(userRepository.getUserById).mockResolvedValue(mockUser);
      vi.mocked(roleRepository.getRoleByName).mockResolvedValue(mockRole);
      vi.mocked(enrollmentRepository.getEnrollment).mockResolvedValue(null);
      vi.mocked(enrollmentRepository.createEnrollment).mockResolvedValue(mockEnrollment);

      const result = await enrollmentService.enrollUser({
        userUuid: "u1",
        courseUuid: "c1",
        roleName: "student"
      });

      expect(result).toEqual(mockEnrollment);
      expect(enrollmentRepository.createEnrollment).toHaveBeenCalledWith({
        userUuid: "u1",
        courseUuid: "c1",
        roleUuid: "r1"
      });
    });

    it("should throw error if user not found", async () => {
      vi.mocked(userRepository.getUserById).mockResolvedValue(null);

      await expect(
        enrollmentService.enrollUser({
          userUuid: "u1",
          courseUuid: "c1",
          roleName: "student"
        })
      ).rejects.toThrow("User with ID u1 not found");
    });

    it("should throw error if role not found", async () => {
      const mockUser = { user_uuid: "u1", email: "test@example.com" };
      vi.mocked(userRepository.getUserById).mockResolvedValue(mockUser);
      vi.mocked(roleRepository.getRoleByName).mockResolvedValue(null);

      await expect(
        enrollmentService.enrollUser({
          userUuid: "u1",
          courseUuid: "c1",
          roleName: "student"
        })
      ).rejects.toThrow("Role 'student' not found");
    });

    it("should throw error if already enrolled", async () => {
      const mockUser = { user_uuid: "u1", email: "test@example.com" };
      const mockRole = { role_uuid: "r1", role: "student" };
      const existingEnrollment = { user_uuid: "u1", course_uuid: "c1" };

      vi.mocked(userRepository.getUserById).mockResolvedValue(mockUser);
      vi.mocked(roleRepository.getRoleByName).mockResolvedValue(mockRole);
      vi.mocked(enrollmentRepository.getEnrollment).mockResolvedValue(existingEnrollment);

      await expect(
        enrollmentService.enrollUser({
          userUuid: "u1",
          courseUuid: "c1",
          roleName: "student"
        })
      ).rejects.toThrow("already enrolled");
    });
  });

  describe("userHasRole", () => {
    it("should return true when user has single required role", async () => {
      vi.mocked(enrollmentRepository.getUserRoleInCourse).mockResolvedValue({
        role_name: "ta"
      });

      const result = await enrollmentService.userHasRole("u1", "c1", "ta");

      expect(result).toBe(true);
    });

    it("should return true when user has one of multiple required roles", async () => {
      vi.mocked(enrollmentRepository.getUserRoleInCourse).mockResolvedValue({
        role_name: "ta"
      });

      const result = await enrollmentService.userHasRole("u1", "c1", ["ta", "professor"]);

      expect(result).toBe(true);
    });

    it("should return false when user does not have required role", async () => {
      vi.mocked(enrollmentRepository.getUserRoleInCourse).mockResolvedValue({
        role_name: "student"
      });

      const result = await enrollmentService.userHasRole("u1", "c1", "ta");

      expect(result).toBe(false);
    });

    it("should return false when user not enrolled", async () => {
      vi.mocked(enrollmentRepository.getUserRoleInCourse).mockResolvedValue(null);

      const result = await enrollmentService.userHasRole("u1", "c1", "student");

      expect(result).toBe(false);
    });
  });

  describe("userIsInstructor", () => {
    it("should return true for professor", async () => {
      vi.mocked(enrollmentRepository.getUserRoleInCourse).mockResolvedValue({
        role_name: "professor"
      });

      const result = await enrollmentService.userIsInstructor("u1", "c1");

      expect(result).toBe(true);
    });

    it("should return true for TA", async () => {
      vi.mocked(enrollmentRepository.getUserRoleInCourse).mockResolvedValue({
        role_name: "ta"
      });

      const result = await enrollmentService.userIsInstructor("u1", "c1");

      expect(result).toBe(true);
    });

    it("should return false for student", async () => {
      vi.mocked(enrollmentRepository.getUserRoleInCourse).mockResolvedValue({
        role_name: "student"
      });

      const result = await enrollmentService.userIsInstructor("u1", "c1");

      expect(result).toBe(false);
    });
  });
});
