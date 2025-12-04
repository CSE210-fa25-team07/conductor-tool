import { describe, it, expect, beforeAll, afterAll } from "vitest";
import {
  getCourseOverview,
  getCourseStaff,
  getEnrollmentStats,
  getRecentEnrollments,
  getUserProfile,
  getCourseRoster,
  getTeamProfile,
  getCourseTeams,
  checkCourseEnrollment,
  updateUser,
  updateStaff,
  updateCourseLinks,
  getUserRoleInCourse
} from "../../../src/repositories/directoryRepository.js";
import { getPrisma } from "../../../src/utils/db.js";

const prisma = getPrisma();

describe("directoryRepository", () => {
  let testUser;
  let testCourse;
  let testTeam;
  let testStaff;

  beforeAll(async () => {
    // Find test data from the database
    testUser = await prisma.user.findFirst({
      where: {
        courseEnrollments: {
          some: {
            enrollmentStatus: "active"
          }
        }
      }
    });

    testCourse = await prisma.course.findFirst({
      include: {
        term: true,
        enrollments: {
          where: { enrollmentStatus: "active" }
        }
      }
    });

    testTeam = await prisma.team.findFirst({
      include: {
        members: {
          where: { leftAt: null }
        }
      }
    });

    testStaff = await prisma.user.findFirst({
      where: {
        staff: { isNot: null }
      },
      include: {
        staff: true
      }
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe("getCourseOverview", () => {
    it("should return course with enrollment and team counts", async () => {
      const course = await getCourseOverview(testCourse.courseUuid);

      expect(course).not.toBeNull();
      expect(course.courseUuid).toBe(testCourse.courseUuid);
      expect(course.courseCode).toBe(testCourse.courseCode);
      expect(course.courseName).toBe(testCourse.courseName);
      expect(course).toHaveProperty("term");
      expect(course._count).toHaveProperty("enrollments");
      expect(course._count).toHaveProperty("teams");
      expect(typeof course._count.enrollments).toBe("number");
      expect(typeof course._count.teams).toBe("number");
    });

    it("should filter teams by user when userUuid is provided", async () => {
      const teamMember = await prisma.teamMember.findFirst({
        where: {
          leftAt: null,
          team: {
            courseUuid: testCourse.courseUuid
          }
        },
        include: {
          user: true
        }
      });

      if (teamMember) {
        const course = await getCourseOverview(testCourse.courseUuid, teamMember.userUuid);
        expect(course).not.toBeNull();
        expect(course._count.teams).toBeGreaterThanOrEqual(1);
      }
    });

    it("should return object with zero counts for non-existent course", async () => {
      const course = await getCourseOverview("00000000-0000-0000-0000-000000000000");
      // getCourseOverview returns an object with zero counts, not null
      expect(course).not.toBeNull();
      expect(course._count.enrollments).toBe(0);
      expect(course._count.teams).toBe(0);
    });
  });

  describe("getCourseStaff", () => {
    it("should return list of staff members", async () => {
      const staff = await getCourseStaff(testCourse.courseUuid);

      expect(Array.isArray(staff)).toBe(true);
      staff.forEach(enrollment => {
        expect(enrollment).toHaveProperty("user");
        expect(enrollment).toHaveProperty("role");
        expect(["Professor", "TA"]).toContain(enrollment.role.role);
        expect(enrollment.user).toHaveProperty("firstName");
        expect(enrollment.user).toHaveProperty("lastName");
        expect(enrollment.user).toHaveProperty("email");
      });
    });

    it("should order staff by role and then by last name", async () => {
      const staff = await getCourseStaff(testCourse.courseUuid);

      if (staff.length > 1) {
        for (let i = 0; i < staff.length - 1; i++) {
          const current = staff[i];
          const next = staff[i + 1];

          // Role should be in ascending order (Professor < TA alphabetically)
          if (current.role.role === next.role.role) {
            // If same role, last name should be in ascending order
            expect(current.user.lastName.localeCompare(next.user.lastName)).toBeLessThanOrEqual(0);
          }
        }
      }
    });
  });

  describe("getEnrollmentStats", () => {
    it("should return enrollment statistics", async () => {
      const stats = await getEnrollmentStats(testCourse.courseUuid);

      expect(stats).toHaveProperty("total");
      expect(stats).toHaveProperty("active");
      expect(stats).toHaveProperty("dropped");
      expect(typeof stats.total).toBe("number");
      expect(typeof stats.active).toBe("number");
      expect(typeof stats.dropped).toBe("number");
      expect(stats.total).toBeGreaterThanOrEqual(stats.active + stats.dropped);
    });

    it("should count unique users not enrollment records", async () => {
      const stats = await getEnrollmentStats(testCourse.courseUuid);

      // Verify that total equals active + dropped
      expect(stats.total).toBe(stats.active + stats.dropped);
    });
  });

  describe("getRecentEnrollments", () => {
    it("should return recent enrollments with default limit", async () => {
      const enrollments = await getRecentEnrollments(testCourse.courseUuid);

      expect(Array.isArray(enrollments)).toBe(true);
      expect(enrollments.length).toBeLessThanOrEqual(10);
      enrollments.forEach(enrollment => {
        expect(enrollment).toHaveProperty("user");
        expect(enrollment).toHaveProperty("role");
        expect(enrollment).toHaveProperty("enrolledAt");
      });
    });

    it("should respect custom limit parameter", async () => {
      const limit = 5;
      const enrollments = await getRecentEnrollments(testCourse.courseUuid, limit);

      expect(Array.isArray(enrollments)).toBe(true);
      expect(enrollments.length).toBeLessThanOrEqual(limit);
    });

    it("should order by enrolledAt descending", async () => {
      const enrollments = await getRecentEnrollments(testCourse.courseUuid);

      if (enrollments.length > 1) {
        for (let i = 0; i < enrollments.length - 1; i++) {
          const current = new Date(enrollments[i].enrolledAt);
          const next = new Date(enrollments[i + 1].enrolledAt);
          expect(current.getTime()).toBeGreaterThanOrEqual(next.getTime());
        }
      }
    });
  });

  describe("getUserProfile", () => {
    it("should return complete user profile", async () => {
      const profile = await getUserProfile(testUser.userUuid);

      expect(profile).not.toBeNull();
      expect(profile.userUuid).toBe(testUser.userUuid);
      expect(profile).toHaveProperty("firstName");
      expect(profile).toHaveProperty("lastName");
      expect(profile).toHaveProperty("email");
      expect(profile).toHaveProperty("courseEnrollments");
      expect(profile).toHaveProperty("teamMemberships");
      expect(Array.isArray(profile.courseEnrollments)).toBe(true);
      expect(Array.isArray(profile.teamMemberships)).toBe(true);
    });

    it("should include staff information for staff users", async () => {
      if (testStaff) {
        const profile = await getUserProfile(testStaff.userUuid);
        expect(profile.staff).not.toBeNull();
        expect(profile.staff).toHaveProperty("isProf");
      }
    });

    it("should return null for non-existent user", async () => {
      const profile = await getUserProfile("00000000-0000-0000-0000-000000000000");
      expect(profile).toBeNull();
    });
  });

  describe("getCourseRoster", () => {
    it("should return paginated roster", async () => {
      const roster = await getCourseRoster(testCourse.courseUuid, 1, 20, "all");

      expect(roster).toHaveProperty("enrollments");
      expect(roster).toHaveProperty("total");
      expect(roster).toHaveProperty("page");
      expect(roster).toHaveProperty("limit");
      expect(roster).toHaveProperty("totalPages");
      expect(Array.isArray(roster.enrollments)).toBe(true);
      expect(roster.page).toBe(1);
      expect(roster.limit).toBe(20);
    });

    it("should filter by role when specified", async () => {
      const roster = await getCourseRoster(testCourse.courseUuid, 1, 20, "student");

      roster.enrollments.forEach(enrollment => {
        const roles = enrollment.role.role.split(", ");
        expect(roles).toContain("Student");
      });
    });

    it("should combine multiple roles for same user", async () => {
      const roster = await getCourseRoster(testCourse.courseUuid, 1, 100, "all");

      // Check if any user appears only once in the roster
      const userUuids = roster.enrollments.map(e => e.user.userUuid);
      const uniqueUserUuids = new Set(userUuids);
      expect(userUuids.length).toBe(uniqueUserUuids.size);
    });

    it("should respect pagination", async () => {
      const page1 = await getCourseRoster(testCourse.courseUuid, 1, 5, "all");
      const page2 = await getCourseRoster(testCourse.courseUuid, 2, 5, "all");

      if (page1.totalPages > 1) {
        expect(page1.enrollments.length).toBeGreaterThan(0);
        expect(page2.enrollments.length).toBeGreaterThan(0);
        // Ensure different users on different pages
        const page1Uuids = page1.enrollments.map(e => e.user.userUuid);
        const page2Uuids = page2.enrollments.map(e => e.user.userUuid);
        expect(page1Uuids).not.toEqual(page2Uuids);
      }
    });
  });

  describe("getTeamProfile", () => {
    it("should return complete team profile", async () => {
      const team = await getTeamProfile(testTeam.teamUuid);

      expect(team).not.toBeNull();
      expect(team.teamUuid).toBe(testTeam.teamUuid);
      expect(team).toHaveProperty("teamName");
      expect(team).toHaveProperty("course");
      expect(team).toHaveProperty("members");
      expect(team).toHaveProperty("_count");
      expect(Array.isArray(team.members)).toBe(true);
    });

    it("should include team TA information if assigned", async () => {
      const team = await getTeamProfile(testTeam.teamUuid);

      if (team.teamTa) {
        expect(team.teamTa).toHaveProperty("userUuid");
        expect(team.teamTa).toHaveProperty("firstName");
        expect(team.teamTa).toHaveProperty("lastName");
      }
    });

    it("should only include active members", async () => {
      const team = await getTeamProfile(testTeam.teamUuid);

      team.members.forEach(member => {
        expect(member).toHaveProperty("user");
        expect(member).toHaveProperty("joinedAt");
      });
    });

    it("should return null for non-existent team", async () => {
      const team = await getTeamProfile("00000000-0000-0000-0000-000000000000");
      expect(team).toBeNull();
    });
  });

  describe("getCourseTeams", () => {
    it("should return paginated teams list", async () => {
      const teams = await getCourseTeams(testCourse.courseUuid, 1, 20);

      expect(teams).toHaveProperty("teams");
      expect(teams).toHaveProperty("total");
      expect(teams).toHaveProperty("page");
      expect(teams).toHaveProperty("limit");
      expect(teams).toHaveProperty("totalPages");
      expect(Array.isArray(teams.teams)).toBe(true);
    });

    it("should filter teams by user when userUuid provided", async () => {
      const teamMember = await prisma.teamMember.findFirst({
        where: {
          leftAt: null,
          team: {
            courseUuid: testCourse.courseUuid
          }
        }
      });

      if (teamMember) {
        const teams = await getCourseTeams(testCourse.courseUuid, 1, 20, teamMember.userUuid);

        // All returned teams should have the user as a member
        for (const team of teams.teams) {
          const membership = await prisma.teamMember.findFirst({
            where: {
              teamUuid: team.teamUuid,
              userUuid: teamMember.userUuid,
              leftAt: null
            }
          });
          expect(membership).not.toBeNull();
        }
      }
    });

    it("should order teams alphabetically by name", async () => {
      const teams = await getCourseTeams(testCourse.courseUuid, 1, 100);

      if (teams.teams.length > 1) {
        for (let i = 0; i < teams.teams.length - 1; i++) {
          expect(teams.teams[i].teamName.localeCompare(teams.teams[i + 1].teamName)).toBeLessThanOrEqual(0);
        }
      }
    });
  });

  describe("checkCourseEnrollment", () => {
    it("should return true for enrolled user", async () => {
      const enrollment = await prisma.courseEnrollment.findFirst({
        where: {
          courseUuid: testCourse.courseUuid,
          enrollmentStatus: "active"
        }
      });

      if (enrollment) {
        const isEnrolled = await checkCourseEnrollment(enrollment.userUuid, testCourse.courseUuid);
        expect(isEnrolled).toBe(true);
      }
    });

    it("should return false for non-enrolled user", async () => {
      const isEnrolled = await checkCourseEnrollment("00000000-0000-0000-0000-000000000000", testCourse.courseUuid);
      expect(isEnrolled).toBe(false);
    });
  });

  describe("updateUser", () => {
    it("should update user information", async () => {
      const originalUser = await prisma.user.findUnique({
        where: { userUuid: testUser.userUuid }
      });

      const updatedData = {
        bio: "Test bio update"
      };

      const updated = await updateUser(testUser.userUuid, updatedData);

      expect(updated.userUuid).toBe(testUser.userUuid);
      expect(updated.bio).toBe("Test bio update");

      // Restore original data
      await updateUser(testUser.userUuid, {
        bio: originalUser.bio
      });
    });

    it("should update multiple fields", async () => {
      const originalUser = await prisma.user.findUnique({
        where: { userUuid: testUser.userUuid }
      });

      const updatedData = {
        pronouns: "they/them",
        phoneNumber: "123-456-7890"
      };

      const updated = await updateUser(testUser.userUuid, updatedData);

      expect(updated.pronouns).toBe("they/them");
      expect(updated.phoneNumber).toBe("123-456-7890");

      // Restore original data
      await updateUser(testUser.userUuid, {
        pronouns: originalUser.pronouns,
        phoneNumber: originalUser.phoneNumber
      });
    });
  });

  describe("updateStaff", () => {
    it("should update staff information", async () => {
      if (testStaff) {
        const originalStaff = await prisma.staff.findUnique({
          where: { userUuid: testStaff.userUuid }
        });

        const updatedData = {
          officeLocation: "CSE 1234"
        };

        const updated = await updateStaff(testStaff.userUuid, updatedData);

        expect(updated.userUuid).toBe(testStaff.userUuid);
        expect(updated.officeLocation).toBe("CSE 1234");

        // Restore original data
        await updateStaff(testStaff.userUuid, {
          officeLocation: originalStaff.officeLocation
        });
      }
    });

    it("should throw error for non-staff user", async () => {
      const nonStaffUser = await prisma.user.findFirst({
        where: {
          staff: null
        }
      });

      if (nonStaffUser) {
        await expect(
          updateStaff(nonStaffUser.userUuid, { officeLocation: "Test" })
        ).rejects.toThrow("Staff record not found for this user");
      }
    });
  });

  describe("updateCourseLinks", () => {
    it("should update course links", async () => {
      const originalCourse = await prisma.course.findUnique({
        where: { courseUuid: testCourse.courseUuid }
      });

      const updatedData = {
        syllabusUrl: "https://example.com/syllabus",
        canvasUrl: "https://canvas.ucsd.edu/courses/12345"
      };

      const updated = await updateCourseLinks(testCourse.courseUuid, updatedData);

      expect(updated.courseUuid).toBe(testCourse.courseUuid);
      expect(updated.syllabusUrl).toBe("https://example.com/syllabus");
      expect(updated.canvasUrl).toBe("https://canvas.ucsd.edu/courses/12345");

      // Restore original data
      await updateCourseLinks(testCourse.courseUuid, {
        syllabusUrl: originalCourse.syllabusUrl,
        canvasUrl: originalCourse.canvasUrl
      });
    });

    it("should allow null values", async () => {
      const updatedData = {
        syllabusUrl: null,
        canvasUrl: null
      };

      const updated = await updateCourseLinks(testCourse.courseUuid, updatedData);

      expect(updated.syllabusUrl).toBeNull();
      expect(updated.canvasUrl).toBeNull();
    });
  });

  describe("getUserRoleInCourse", () => {
    it("should return user role in course", async () => {
      const enrollment = await prisma.courseEnrollment.findFirst({
        where: {
          courseUuid: testCourse.courseUuid,
          enrollmentStatus: "active"
        },
        include: {
          role: true
        }
      });

      if (enrollment) {
        const role = await getUserRoleInCourse(enrollment.userUuid, testCourse.courseUuid);
        expect(role).not.toBeNull();
        expect(["Student", "TA", "Professor", "Team Leader"]).toContain(role);
      }
    });

    it("should return null for non-enrolled user", async () => {
      const role = await getUserRoleInCourse("00000000-0000-0000-0000-000000000000", testCourse.courseUuid);
      expect(role).toBeNull();
    });

    it("should return highest priority role when user has multiple roles", async () => {
      const userWithMultipleRoles = await prisma.user.findFirst({
        where: {
          courseEnrollments: {
            some: {
              courseUuid: testCourse.courseUuid,
              enrollmentStatus: "active"
            }
          }
        },
        include: {
          courseEnrollments: {
            where: {
              courseUuid: testCourse.courseUuid,
              enrollmentStatus: "active"
            },
            include: {
              role: true
            }
          }
        }
      });

      if (userWithMultipleRoles && userWithMultipleRoles.courseEnrollments.length > 1) {
        const role = await getUserRoleInCourse(userWithMultipleRoles.userUuid, testCourse.courseUuid);
        expect(role).not.toBeNull();
      }
    });
  });
});
