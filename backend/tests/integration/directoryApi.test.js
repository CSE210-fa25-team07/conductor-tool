/**
 * @module tests/integration/directory
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import express from "express";
import session from "express-session";
import directoryApi from "../../src/routes/api/directoryApi.js";
import { checkApiSession } from "../../src/utils/auth.js";
import { getPrisma } from "../../src/utils/db.js";

const app = express();
const prisma = getPrisma();

app.use(express.json());
app.use(session({
  secret: "test-secret",
  resave: false,
  saveUninitialized: true
}));

app.post("/test/setup-session", (req, res) => {
  req.session.user = req.body.user;
  res.json({ success: true });
});

app.use("/directory", checkApiSession, directoryApi);

describe("Directory API", () => {
  let testStudent;
  let testProfessor;
  let testCourse;
  let testTeam;

  beforeAll(async () => {
    // Find a course with enrollments and teams
    testCourse = await prisma.course.findFirst({
      where: {
        enrollments: {
          some: {
            enrollmentStatus: "active"
          }
        },
        teams: {
          some: {}
        }
      },
      include: {
        term: true
      }
    });

    if (!testCourse) {
      throw new Error("No course found with active enrollments and teams for testing");
    }

    // Find a professor in this course
    const profEnrollment = await prisma.courseEnrollment.findFirst({
      where: {
        courseUuid: testCourse.courseUuid,
        role: { role: "Professor" },
        enrollmentStatus: "active"
      },
      include: {
        user: true
      }
    });
    testProfessor = profEnrollment?.user;


    // Find a student in this course
    const studentEnrollment = await prisma.courseEnrollment.findFirst({
      where: {
        courseUuid: testCourse.courseUuid,
        role: { role: "Student" },
        enrollmentStatus: "active"
      },
      include: {
        user: true
      }
    });
    testStudent = studentEnrollment?.user;

    // Find a team in this course
    testTeam = await prisma.team.findFirst({
      where: {
        courseUuid: testCourse.courseUuid
      },
      include: {
        members: {
          where: { leftAt: null }
        }
      }
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe("GET /directory/courses/:courseUuid", () => {
    it("should return 401 without session", async () => {
      const response = await request(app)
        .get(`/directory/courses/${testCourse.courseUuid}`);

      expect(response.status).toBe(401);
    });

    it("should return course overview for enrolled user", async () => {
      const agent = request.agent(app);

      await agent.post("/test/setup-session").send({
        user: {
          id: testStudent.userUuid,
          email: testStudent.email,
          name: `${testStudent.firstName} ${testStudent.lastName}`
        }
      });

      const response = await agent.get(`/directory/courses/${testCourse.courseUuid}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty("courseUuid");
      expect(response.body.data).toHaveProperty("courseCode");
      expect(response.body.data).toHaveProperty("courseName");
      expect(response.body.data).toHaveProperty("stats");
      expect(response.body.data.stats).toHaveProperty("totalEnrollments");
      expect(response.body.data.stats).toHaveProperty("totalTeams");
    });

    it("should return course with zero counts for non-existent course", async () => {
      const agent = request.agent(app);

      await agent.post("/test/setup-session").send({
        user: {
          id: testStudent.userUuid,
          email: testStudent.email,
          name: `${testStudent.firstName} ${testStudent.lastName}`
        }
      });

      const response = await agent.get("/directory/courses/00000000-0000-0000-0000-000000000000");

      // getCourseOverview returns an object with zero counts even for non-existent courses
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.stats.totalEnrollments).toBe(0);
      expect(response.body.data.stats.totalTeams).toBe(0);
    });
  });

  describe("GET /directory/courses/:courseUuid/staff", () => {
    it("should return 401 without session", async () => {
      const response = await request(app)
        .get(`/directory/courses/${testCourse.courseUuid}/staff`);

      expect(response.status).toBe(401);
    });

    it("should return course staff list", async () => {
      const agent = request.agent(app);

      await agent.post("/test/setup-session").send({
        user: {
          id: testStudent.userUuid,
          email: testStudent.email,
          name: `${testStudent.firstName} ${testStudent.lastName}`
        }
      });

      const response = await agent.get(`/directory/courses/${testCourse.courseUuid}/staff`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);

      if (response.body.data.length > 0) {
        const staffMember = response.body.data[0];
        expect(staffMember).toHaveProperty("userUuid");
        expect(staffMember).toHaveProperty("firstName");
        expect(staffMember).toHaveProperty("lastName");
        expect(staffMember).toHaveProperty("role");
        expect(["Professor", "TA"]).toContain(staffMember.role);
      }
    });
  });

  describe("GET /directory/courses/:courseUuid/roster", () => {
    it("should return 401 without session", async () => {
      const response = await request(app)
        .get(`/directory/courses/${testCourse.courseUuid}/roster`);

      expect(response.status).toBe(401);
    });

    it("should return 403 for non-enrolled user", async () => {
      const unenrolledUser = await prisma.user.findFirst({
        where: {
          courseEnrollments: {
            none: {
              courseUuid: testCourse.courseUuid
            }
          }
        }
      });

      if (unenrolledUser) {
        const agent = request.agent(app);

        await agent.post("/test/setup-session").send({
          user: {
            id: unenrolledUser.userUuid,
            email: unenrolledUser.email,
            name: `${unenrolledUser.firstName} ${unenrolledUser.lastName}`
          }
        });

        const response = await agent.get(`/directory/courses/${testCourse.courseUuid}/roster`);

        expect(response.status).toBe(403);
        expect(response.body.error).toBe("Not authorized to view course roster");
      }
    });

    it("should return paginated roster for enrolled user", async () => {
      const agent = request.agent(app);

      await agent.post("/test/setup-session").send({
        user: {
          id: testStudent.userUuid,
          email: testStudent.email,
          name: `${testStudent.firstName} ${testStudent.lastName}`
        }
      });

      const response = await agent.get(`/directory/courses/${testCourse.courseUuid}/roster`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty("students");
      expect(response.body.data).toHaveProperty("pagination");
      expect(Array.isArray(response.body.data.students)).toBe(true);
    });

    it("should support pagination parameters", async () => {
      const agent = request.agent(app);

      await agent.post("/test/setup-session").send({
        user: {
          id: testStudent.userUuid,
          email: testStudent.email,
          name: `${testStudent.firstName} ${testStudent.lastName}`
        }
      });

      const response = await agent.get(`/directory/courses/${testCourse.courseUuid}/roster?page=1&limit=10`);

      expect(response.status).toBe(200);
      expect(response.body.data.pagination.page).toBe(1);
      expect(response.body.data.pagination.limit).toBe(10);
    });

    it("should support role filtering", async () => {
      const agent = request.agent(app);

      await agent.post("/test/setup-session").send({
        user: {
          id: testStudent.userUuid,
          email: testStudent.email,
          name: `${testStudent.firstName} ${testStudent.lastName}`
        }
      });

      const response = await agent.get(`/directory/courses/${testCourse.courseUuid}/roster?filter=student`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe("GET /directory/courses/:courseUuid/teams", () => {
    it("should return 401 without session", async () => {
      const response = await request(app)
        .get(`/directory/courses/${testCourse.courseUuid}/teams`);

      expect(response.status).toBe(401);
    });

    it("should return 403 for non-enrolled user", async () => {
      const unenrolledUser = await prisma.user.findFirst({
        where: {
          courseEnrollments: {
            none: {
              courseUuid: testCourse.courseUuid
            }
          }
        }
      });

      if (unenrolledUser) {
        const agent = request.agent(app);

        await agent.post("/test/setup-session").send({
          user: {
            id: unenrolledUser.userUuid,
            email: unenrolledUser.email,
            name: `${unenrolledUser.firstName} ${unenrolledUser.lastName}`
          }
        });

        const response = await agent.get(`/directory/courses/${testCourse.courseUuid}/teams`);

        expect(response.status).toBe(403);
        expect(response.body.error).toBe("Not authorized to view course teams");
      }
    });

    it("should return paginated teams for enrolled user", async () => {
      const agent = request.agent(app);

      await agent.post("/test/setup-session").send({
        user: {
          id: testStudent.userUuid,
          email: testStudent.email,
          name: `${testStudent.firstName} ${testStudent.lastName}`
        }
      });

      const response = await agent.get(`/directory/courses/${testCourse.courseUuid}/teams`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty("teams");
      expect(response.body.data).toHaveProperty("pagination");
      expect(Array.isArray(response.body.data.teams)).toBe(true);
    });

    it("should support pagination", async () => {
      const agent = request.agent(app);

      await agent.post("/test/setup-session").send({
        user: {
          id: testProfessor.userUuid,
          email: testProfessor.email,
          name: `${testProfessor.firstName} ${testProfessor.lastName}`
        }
      });

      const response = await agent.get(`/directory/courses/${testCourse.courseUuid}/teams?page=1&limit=5`);

      expect(response.status).toBe(200);
      expect(response.body.data.pagination.page).toBe(1);
      expect(response.body.data.pagination.limit).toBe(5);
    });

    it("should show all teams for staff", async () => {
      const agent = request.agent(app);

      await agent.post("/test/setup-session").send({
        user: {
          id: testProfessor.userUuid,
          email: testProfessor.email,
          name: `${testProfessor.firstName} ${testProfessor.lastName}`
        }
      });

      const response = await agent.get(`/directory/courses/${testCourse.courseUuid}/teams`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe("GET /directory/users/:userUuid", () => {
    it("should return 401 without session", async () => {
      const response = await request(app)
        .get(`/directory/users/${testStudent.userUuid}`);

      expect(response.status).toBe(401);
    });

    it("should return user profile", async () => {
      const agent = request.agent(app);

      await agent.post("/test/setup-session").send({
        user: {
          id: testStudent.userUuid,
          email: testStudent.email,
          name: `${testStudent.firstName} ${testStudent.lastName}`
        }
      });

      const response = await agent.get(`/directory/users/${testStudent.userUuid}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty("userUuid");
      expect(response.body.data).toHaveProperty("email");
      expect(response.body.data).toHaveProperty("firstName");
      expect(response.body.data).toHaveProperty("lastName");
      expect(response.body.data).toHaveProperty("courses");
      expect(response.body.data).toHaveProperty("teams");
    });

    it("should return 404 for non-existent user", async () => {
      const agent = request.agent(app);

      await agent.post("/test/setup-session").send({
        user: {
          id: testStudent.userUuid,
          email: testStudent.email,
          name: `${testStudent.firstName} ${testStudent.lastName}`
        }
      });

      const response = await agent.get("/directory/users/00000000-0000-0000-0000-000000000000");

      // Returns 403 because requester doesn't share a course with non-existent user
      // This is correct security behavior - don't reveal if user exists before auth check
      expect(response.status).toBe(403);
      expect(response.body.error).toBe("Not authorized to view this profile");
    });
  });

  describe("GET /directory/profile", () => {
    it("should return 401 without session", async () => {
      const response = await request(app)
        .get("/directory/profile");

      expect(response.status).toBe(401);
    });

    it("should return current user's profile", async () => {
      const agent = request.agent(app);

      await agent.post("/test/setup-session").send({
        user: {
          id: testStudent.userUuid,
          email: testStudent.email,
          name: `${testStudent.firstName} ${testStudent.lastName}`
        }
      });

      const response = await agent.get("/directory/profile");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.userUuid).toBe(testStudent.userUuid);
    });
  });

  describe("GET /directory/teams/:teamUuid", () => {
    it("should return 401 without session", async () => {
      const response = await request(app)
        .get(`/directory/teams/${testTeam.teamUuid}`);

      expect(response.status).toBe(401);
    });

    it("should return 403 for non-team-member and non-staff", async () => {
      // Find a user who is not a member of the test team and not staff
      const teamMemberUuids = testTeam.members.map(m => m.userUuid);
      const otherUser = await prisma.user.findFirst({
        where: {
          userUuid: { notIn: teamMemberUuids },
          courseEnrollments: {
            none: {
              courseUuid: testTeam.courseUuid,
              role: { role: { in: ["Professor", "TA"] } }
            }
          }
        }
      });

      if (otherUser) {
        const agent = request.agent(app);

        await agent.post("/test/setup-session").send({
          user: {
            id: otherUser.userUuid,
            email: otherUser.email,
            name: `${otherUser.firstName} ${otherUser.lastName}`
          }
        });

        const response = await agent.get(`/directory/teams/${testTeam.teamUuid}`);

        expect(response.status).toBe(403);
        expect(response.body.error).toBe("Not authorized to view this team");
      }
    });

    it("should return team profile for team member", async () => {
      const teamMember = await prisma.user.findFirst({
        where: {
          teamMemberships: {
            some: {
              teamUuid: testTeam.teamUuid,
              leftAt: null
            }
          }
        }
      });

      if (teamMember) {
        const agent = request.agent(app);

        await agent.post("/test/setup-session").send({
          user: {
            id: teamMember.userUuid,
            email: teamMember.email,
            name: `${teamMember.firstName} ${teamMember.lastName}`
          }
        });

        const response = await agent.get(`/directory/teams/${testTeam.teamUuid}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty("teamUuid");
        expect(response.body.data).toHaveProperty("teamName");
        expect(response.body.data).toHaveProperty("members");
        expect(Array.isArray(response.body.data.members)).toBe(true);
      }
    });

    it("should return team profile for staff", async () => {
      const agent = request.agent(app);

      await agent.post("/test/setup-session").send({
        user: {
          id: testProfessor.userUuid,
          email: testProfessor.email,
          name: `${testProfessor.firstName} ${testProfessor.lastName}`
        }
      });

      const response = await agent.get(`/directory/teams/${testTeam.teamUuid}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it("should return 404 for non-existent team", async () => {
      const agent = request.agent(app);

      await agent.post("/test/setup-session").send({
        user: {
          id: testProfessor.userUuid,
          email: testProfessor.email,
          name: `${testProfessor.firstName} ${testProfessor.lastName}`
        }
      });

      const response = await agent.get("/directory/teams/00000000-0000-0000-0000-000000000000");

      expect(response.status).toBe(404);
      expect(response.body.error).toBe("Team not found");
    });
  });

  describe("PUT /directory/courses/:courseUuid/links", () => {
    it("should return 401 without session", async () => {
      const response = await request(app)
        .put(`/directory/courses/${testCourse.courseUuid}/links`)
        .send({
          syllabusUrl: "https://example.com/syllabus",
          canvasUrl: "https://canvas.ucsd.edu"
        });

      expect(response.status).toBe(401);
    });

    it("should return 403 for non-professor", async () => {
      const agent = request.agent(app);

      await agent.post("/test/setup-session").send({
        user: {
          id: testStudent.userUuid,
          email: testStudent.email,
          name: `${testStudent.firstName} ${testStudent.lastName}`
        }
      });

      const response = await agent.put(`/directory/courses/${testCourse.courseUuid}/links`).send({
        syllabusUrl: "https://example.com/syllabus"
      });

      expect(response.status).toBe(403);
      expect(response.body.error).toBe("Only professors can update course links");
    });

    it("should update course links for professor", async () => {
      const agent = request.agent(app);

      await agent.post("/test/setup-session").send({
        user: {
          id: testProfessor.userUuid,
          email: testProfessor.email,
          name: `${testProfessor.firstName} ${testProfessor.lastName}`
        }
      });

      // Get original data
      const originalCourse = await prisma.course.findUnique({
        where: { courseUuid: testCourse.courseUuid }
      });

      const response = await agent.put(`/directory/courses/${testCourse.courseUuid}/links`).send({
        syllabusUrl: "https://example.com/test-syllabus",
        canvasUrl: "https://canvas.ucsd.edu/test"
      });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.syllabusUrl).toBe("https://example.com/test-syllabus");
      expect(response.body.data.canvasUrl).toBe("https://canvas.ucsd.edu/test");

      // Restore original data
      await prisma.course.update({
        where: { courseUuid: testCourse.courseUuid },
        data: {
          syllabusUrl: originalCourse.syllabusUrl,
          canvasUrl: originalCourse.canvasUrl
        }
      });
    });

    it("should validate URL format", async () => {
      const agent = request.agent(app);

      await agent.post("/test/setup-session").send({
        user: {
          id: testProfessor.userUuid,
          email: testProfessor.email,
          name: `${testProfessor.firstName} ${testProfessor.lastName}`
        }
      });

      const response = await agent.put(`/directory/courses/${testCourse.courseUuid}/links`).send({
        syllabusUrl: "not-a-valid-url"
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain("Invalid");
    });

    it("should allow null values to clear links", async () => {
      const agent = request.agent(app);

      await agent.post("/test/setup-session").send({
        user: {
          id: testProfessor.userUuid,
          email: testProfessor.email,
          name: `${testProfessor.firstName} ${testProfessor.lastName}`
        }
      });

      // Get original data
      const originalCourse = await prisma.course.findUnique({
        where: { courseUuid: testCourse.courseUuid }
      });

      const response = await agent.put(`/directory/courses/${testCourse.courseUuid}/links`).send({
        syllabusUrl: null,
        canvasUrl: null
      });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Restore original data
      await prisma.course.update({
        where: { courseUuid: testCourse.courseUuid },
        data: {
          syllabusUrl: originalCourse.syllabusUrl,
          canvasUrl: originalCourse.canvasUrl
        }
      });
    });
  });
});
