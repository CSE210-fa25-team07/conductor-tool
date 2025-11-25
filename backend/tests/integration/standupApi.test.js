import { describe, it, expect, beforeAll, afterAll } from "@jest/globals";
import request from "supertest";
import express from "express";
import session from "express-session";
import standupApi from "../../src/routes/api/standupApi.js";
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

app.use("/standups", checkApiSession, standupApi);

describe("Standup API", () => {
  let testUser;
  let testTeam;
  let testCourse;
  let createdStandupId;

  beforeAll(async () => {
    testUser = await prisma.user.findFirst();
    testTeam = await prisma.team.findFirst();
    testCourse = await prisma.course.findFirst();
  });

  afterAll(async () => {
    if (createdStandupId) {
      await prisma.standup.deleteMany({
        where: { standupUuid: createdStandupId }
      });
    }
    await prisma.$disconnect();
  });

  describe("POST /standups", () => {
    it("should return 401 without session", async () => {
      const response = await request(app).post("/standups").send({
        teamUuid: testTeam.teamUuid,
        courseUuid: testCourse.courseUuid,
        whatDone: "Test standup",
        whatNext: "More testing",
        blockers: "None"
      });

      expect(response.status).toBe(401);
    });

    it("should create standup with valid session", async () => {
      const agent = request.agent(app);

      await agent.post("/test/setup-session").send({
        user: {
          id: testUser.userUuid,
          email: testUser.email,
          name: `${testUser.firstName} ${testUser.lastName}`
        }
      });

      const response = await agent.post("/standups").send({
        teamUuid: testTeam.teamUuid,
        courseUuid: testCourse.courseUuid,
        whatDone: "Completed user authentication",
        whatNext: "Work on standup feature",
        blockers: "None",
        reflection: "Good progress today"
      });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty("standupUuid");
      expect(response.body.data.whatDone).toBe("Completed user authentication");

      createdStandupId = response.body.data.standupUuid;
    });
  });

  describe("GET /standups/me", () => {
    it("should return 401 without session", async () => {
      const response = await request(app).get("/standups/me");
      expect(response.status).toBe(401);
    });

    it("should return user standups with valid session", async () => {
      const agent = request.agent(app);

      await agent.post("/test/setup-session").send({
        user: {
          id: testUser.userUuid,
          email: testUser.email,
          name: `${testUser.firstName} ${testUser.lastName}`
        }
      });

      const response = await agent.get("/standups/me");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe("PUT /standups/:standupId", () => {
    it("should return 401 without session", async () => {
      const response = await request(app).put(`/standups/${createdStandupId}`).send({
        whatDone: "Updated content"
      });
      expect(response.status).toBe(401);
    });

    it("should update standup with valid session", async () => {
      const agent = request.agent(app);

      await agent.post("/test/setup-session").send({
        user: {
          id: testUser.userUuid,
          email: testUser.email,
          name: `${testUser.firstName} ${testUser.lastName}`
        }
      });

      const response = await agent.put(`/standups/${createdStandupId}`).send({
        whatDone: "Updated: Completed authentication and tests",
        whatNext: "Continue with standup dashboard",
        blockers: "Waiting for design feedback"
      });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.whatDone).toBe("Updated: Completed authentication and tests");
    });
  });

  describe("DELETE /standups/:standupId", () => {
    it("should return 401 without session", async () => {
      const response = await request(app).delete(`/standups/${createdStandupId}`);
      expect(response.status).toBe(401);
    });

    it("should delete standup with valid session", async () => {
      const agent = request.agent(app);

      await agent.post("/test/setup-session").send({
        user: {
          id: testUser.userUuid,
          email: testUser.email,
          name: `${testUser.firstName} ${testUser.lastName}`
        }
      });

      const response = await agent.delete(`/standups/${createdStandupId}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Standup deleted successfully");

      createdStandupId = null;
    });
  });

  describe("GET /standups/team/:teamId", () => {
    it("should return 401 without session", async () => {
      const response = await request(app).get(`/standups/team/${testTeam.teamUuid}`);
      expect(response.status).toBe(401);
    });

    it("should return 403 if user is not a team member", async () => {
      const otherUser = await prisma.user.findFirst({
        where: { userUuid: { not: testUser.userUuid } }
      });

      const agent = request.agent(app);
      await agent.post("/test/setup-session").send({
        user: {
          id: otherUser.userUuid,
          email: otherUser.email,
          name: `${otherUser.firstName} ${otherUser.lastName}`
        }
      });

      const response = await agent.get(`/standups/team/${testTeam.teamUuid}`);
      expect(response.status).toBe(403);
      expect(response.body.error).toBe("Not authorized to view this team's standups");
    });

    it("should return team standups for team member", async () => {
      const agent = request.agent(app);
      await agent.post("/test/setup-session").send({
        user: {
          id: testUser.userUuid,
          email: testUser.email,
          name: `${testUser.firstName} ${testUser.lastName}`
        }
      });

      const response = await agent.get(`/standups/team/${testTeam.teamUuid}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it("should support date filtering", async () => {
      const agent = request.agent(app);
      await agent.post("/test/setup-session").send({
        user: {
          id: testUser.userUuid,
          email: testUser.email,
          name: `${testUser.firstName} ${testUser.lastName}`
        }
      });

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);
      const endDate = new Date();

      const response = await agent.get(`/standups/team/${testTeam.teamUuid}?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe("GET /standups/ta/overview", () => {
    it("should return 401 without session", async () => {
      const response = await request(app).get(`/standups/ta/overview?courseId=${testCourse.courseUuid}`);
      expect(response.status).toBe(401);
    });

    it("should return 400 without courseId", async () => {
      const taUser = await prisma.user.findFirst({
        where: { email: "ta_alice@ucsd.edu" }
      });

      const agent = request.agent(app);
      await agent.post("/test/setup-session").send({
        user: {
          id: taUser.userUuid,
          email: taUser.email,
          name: `${taUser.firstName} ${taUser.lastName}`
        }
      });

      const response = await agent.get("/standups/ta/overview");
      expect(response.status).toBe(400);
      expect(response.body.error).toBe("courseId is required");
    });

    it("should return 403 if user is not Professor or TA", async () => {
      const studentUser = await prisma.user.findFirst({
        where: { email: "david@ucsd.edu" }
      });

      const agent = request.agent(app);
      await agent.post("/test/setup-session").send({
        user: {
          id: studentUser.userUuid,
          email: studentUser.email,
          name: `${studentUser.firstName} ${studentUser.lastName}`
        }
      });

      const response = await agent.get(`/standups/ta/overview?courseId=${testCourse.courseUuid}`);
      expect(response.status).toBe(403);
      expect(response.body.error).toBe("Not authorized to view course overview");
    });

    it("should return course overview for TA", async () => {
      const taUser = await prisma.user.findFirst({
        where: { email: "ta_alice@ucsd.edu" }
      });

      const agent = request.agent(app);
      await agent.post("/test/setup-session").send({
        user: {
          id: taUser.userUuid,
          email: taUser.email,
          name: `${taUser.firstName} ${taUser.lastName}`
        }
      });

      const response = await agent.get(`/standups/ta/overview?courseId=${testCourse.courseUuid}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it("should return course overview for Professor", async () => {
      const professorUser = await prisma.user.findFirst({
        where: { email: "powell@ucsd.edu" }
      });

      const agent = request.agent(app);
      await agent.post("/test/setup-session").send({
        user: {
          id: professorUser.userUuid,
          email: professorUser.email,
          name: `${professorUser.firstName} ${professorUser.lastName}`
        }
      });

      const response = await agent.get(`/standups/ta/overview?courseId=${testCourse.courseUuid}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it("should include standup details", async () => {
      const taUser = await prisma.user.findFirst({
        where: { email: "ta_alice@ucsd.edu" }
      });

      const agent = request.agent(app);
      await agent.post("/test/setup-session").send({
        user: {
          id: taUser.userUuid,
          email: taUser.email,
          name: `${taUser.firstName} ${taUser.lastName}`
        }
      });

      const response = await agent.get(`/standups/ta/overview?courseId=${testCourse.courseUuid}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      if (response.body.data.length > 0) {
        const standup = response.body.data[0];
        expect(standup).toHaveProperty("standupUuid");
        expect(standup).toHaveProperty("user");
        expect(standup).toHaveProperty("team");
        expect(standup).toHaveProperty("course");
      }
    });

    it("should support date filtering", async () => {
      const taUser = await prisma.user.findFirst({
        where: { email: "ta_alice@ucsd.edu" }
      });

      const agent = request.agent(app);
      await agent.post("/test/setup-session").send({
        user: {
          id: taUser.userUuid,
          email: taUser.email,
          name: `${taUser.firstName} ${taUser.lastName}`
        }
      });

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);
      const endDate = new Date();

      const response = await agent.get(`/standups/ta/overview?courseId=${testCourse.courseUuid}&startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });
});
