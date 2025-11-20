import { describe, it, expect, beforeAll } from "@jest/globals";
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

describe("GET /standups/context", () => {
  let testUser;

  beforeAll(async () => {
    testUser = await prisma.user.findFirst();
  });

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
