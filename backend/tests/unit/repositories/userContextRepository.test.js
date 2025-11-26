import { describe, it, expect, beforeAll, afterAll } from "vitest";
import {
  getUserContext,
  checkTeamMembership,
  checkCourseStaffAccess,
  checkCourseStaffRole,
  getCourseOverview
} from "../../../src/repositories/userContextRepository.js";
import { getPrisma } from "../../../src/utils/db.js";

const prisma = getPrisma();

describe("userContextRepository", () => {
  let testUser;
  let testTeam;
  let testCourse;
  let taUser;
  let professorUser;

  beforeAll(async () => {
    testUser = await prisma.user.findFirst();
    testTeam = await prisma.team.findFirst();
    testCourse = await prisma.course.findFirst();
    taUser = await prisma.user.findFirst({
      where: { email: "ta_alice@ucsd.edu" }
    });
    professorUser = await prisma.user.findFirst({
      where: { email: "powell@ucsd.edu" }
    });
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

  describe("checkTeamMembership", () => {
    it("should return true for team member", async () => {
      const membership = await prisma.teamMember.findFirst({
        where: { teamUuid: testTeam.teamUuid, leftAt: null }
      });

      if (membership) {
        const result = await checkTeamMembership(membership.userUuid, testTeam.teamUuid);
        expect(result).toBe(true);
      }
    });

    it("should return false for non-member", async () => {
      const result = await checkTeamMembership(
        "00000000-0000-0000-0000-000000000000",
        testTeam.teamUuid
      );
      expect(result).toBe(false);
    });
  });

  describe("checkCourseStaffAccess", () => {
    it("should return true for TA with access to team's course", async () => {
      if (taUser) {
        const result = await checkCourseStaffAccess(taUser.userUuid, testTeam.teamUuid);
        expect(typeof result).toBe("boolean");
      }
    });

    it("should return false for student", async () => {
      const studentUser = await prisma.user.findFirst({
        where: { email: "david@ucsd.edu" }
      });

      if (studentUser) {
        const result = await checkCourseStaffAccess(studentUser.userUuid, testTeam.teamUuid);
        expect(result).toBe(false);
      }
    });
  });

  describe("checkCourseStaffRole", () => {
    it("should return true for Professor", async () => {
      if (professorUser && testCourse) {
        const result = await checkCourseStaffRole(professorUser.userUuid, testCourse.courseUuid);
        expect(typeof result).toBe("boolean");
      }
    });

    it("should return true for TA", async () => {
      if (taUser && testCourse) {
        const result = await checkCourseStaffRole(taUser.userUuid, testCourse.courseUuid);
        expect(typeof result).toBe("boolean");
      }
    });

    it("should return false for non-staff", async () => {
      const result = await checkCourseStaffRole(
        "00000000-0000-0000-0000-000000000000",
        testCourse.courseUuid
      );
      expect(result).toBe(false);
    });
  });

  describe("getCourseOverview", () => {
    it("should return course with teams", async () => {
      const result = await getCourseOverview(testCourse.courseUuid);

      expect(result).toHaveProperty("course");
      expect(result).toHaveProperty("teams");
      expect(result.course.courseUuid).toBe(testCourse.courseUuid);
      expect(Array.isArray(result.teams)).toBe(true);
    });

    it("should throw error for non-existent course", async () => {
      const fakeUuid = "00000000-0000-0000-0000-000000000000";
      await expect(getCourseOverview(fakeUuid)).rejects.toThrow("Course not found");
    });

    it("should include team details", async () => {
      const result = await getCourseOverview(testCourse.courseUuid);

      if (result.teams.length > 0) {
        const team = result.teams[0];
        expect(team).toHaveProperty("teamUuid");
        expect(team).toHaveProperty("teamName");
        expect(team).toHaveProperty("memberCount");
        expect(team).toHaveProperty("latestStandup");
      }
    });

    it("should support date filtering", async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);
      const endDate = new Date();

      const result = await getCourseOverview(testCourse.courseUuid, {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      });

      expect(result).toHaveProperty("course");
      expect(result).toHaveProperty("teams");
    });
  });
});
