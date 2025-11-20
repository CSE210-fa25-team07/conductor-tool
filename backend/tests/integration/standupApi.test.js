import { describe, it, expect, beforeAll, afterAll } from "@jest/globals";
import request from "supertest";
import express from "express";
import session from "express-session";
import standupApi from "../../src/routes/api/standupApi.js";
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

app.use("/standups", standupApi);

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

  describe("GET /standups/context", () => {
    it("should return 401 without session", async () => {
      const response = await request(app).get("/standups/context");

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe("Not authenticated");
    });

    it("should return user context with valid session", async () => {
      const agent = request.agent(app);

      await agent.post("/test/setup-session").send({
        user: {
          id: testUser.userUuid,
          email: testUser.email,
          name: `${testUser.firstName} ${testUser.lastName}`
        }
      });

      const response = await agent.get("/standups/context");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty("user");
      expect(response.body.data).toHaveProperty("activeCourse");
      expect(response.body.data).toHaveProperty("enrolledCourses");
      expect(response.body.data).toHaveProperty("teams");
    });
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
});
