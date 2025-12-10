/**
 * API Integration Tests (Supertest)
 * @module tests/integration/authAndUserApi
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import express from "express";
import session from "express-session";
import { getPrisma } from "../../src/utils/db.js";

// Import your API Routes
import authApi from "../../src/routes/api/authApi.js";
import adminApi from "../../src/routes/api/adminApi.js";
import courseApi from "../../src/routes/api/courseApi.js";

// Helper to check session
import { checkApiSession } from "../../src/utils/auth.js";

const prisma = getPrisma();
const app = express();

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

app.use("/v1/api/auth", authApi);

app.use("/v1/api/admin", checkApiSession, (req, res, next) => {
  if (req.session && req.session.user) {
    req.user = req.session.user;
  }
  next();
}, adminApi);

app.use("/v1/api/courses", checkApiSession, courseApi);

describe("Auth and User Management Integration Tests", () => {
  let activeTerm, inactiveTerm;
  let studentRole;
  const createdCourseUuids = [];
  const createdUserEmails = [];

  beforeAll(async () => {
    activeTerm = await prisma.classTerm.create({
      data: {
        year: 2025,
        season: "Fall",
        startDate: new Date(),
        endDate: new Date(new Date().setMonth(new Date().getMonth() + 3)),
        isActive: true
      }
    });

    inactiveTerm = await prisma.classTerm.create({
      data: {
        year: 2024,
        season: "Spring",
        startDate: new Date("2024-01-01"),
        endDate: new Date("2024-05-01"),
        isActive: false
      }
    });

    studentRole = await prisma.role.upsert({
      where: { role: "Student" },
      update: {},
      create: { role: "Student" }
    });
  });

  afterAll(async () => {
    if (createdCourseUuids.length > 0) {
      await prisma.course.deleteMany({ where: { courseUuid: { in: createdCourseUuids } } });
    }
    if (createdUserEmails.length > 0) {
      await prisma.user.deleteMany({ where: { email: { in: createdUserEmails } } });
    }
    if (activeTerm) await prisma.classTerm.delete({ where: { termUuid: activeTerm.termUuid } });
    if (inactiveTerm) await prisma.classTerm.delete({ where: { termUuid: inactiveTerm.termUuid } });

    await prisma.$disconnect();
  });

  describe("Auth API", () => {
    /**
     * Test that a user can successfully enroll in a course using a valid verification code.
     * Verifies user creation and enrollment.
     */
    it("should enroll a user when provided a valid code", async () => {
      const course = await prisma.course.create({
        data: { courseName: "Auth Success", courseCode: "AUTH-1", termUuid: activeTerm.termUuid }
      });
      createdCourseUuids.push(course.courseUuid);

      const validCode = `VALID-${Date.now()}`;
      await prisma.verificationCode.create({
        data: { veriCode: validCode, courseUuid: course.courseUuid, roleUuid: studentRole.roleUuid }
      });

      const email = `auth-success-${Date.now()}@test.com`;
      createdUserEmails.push(email);

      const agent = request.agent(app);
      await agent.post("/test/setup-session").send({ user: { email, name: "Auth User" } });

      const response = await agent.post("/v1/api/auth/enroll").send({ code: validCode });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      const user = await prisma.user.findUnique({ where: { email } });
      expect(user).toBeTruthy();
    });

    /**
     * Test that enrollment with an invalid verification code returns 400 status.
     */
    it("should return 400 for invalid code", async () => {
      const agent = request.agent(app);
      await agent.post("/test/setup-session").send({ user: { email: "fail@test.com", name: "Fail" } });

      const response = await agent.post("/v1/api/auth/enroll").send({ code: "WRONG-CODE" });

      expect(response.status).toBe(400);
      expect(response.body.error).toMatch(/invalid/i);
    });

    /**
     * Test that enrollment in a course with an inactive term returns 400 status.
     */
    it("should return 400 if trying to enroll in inactive course", async () => {
      const course = await prisma.course.create({
        data: { courseName: "Old Course", courseCode: "OLD-1", termUuid: inactiveTerm.termUuid }
      });
      createdCourseUuids.push(course.courseUuid);

      const oldCode = `OLD-${Date.now()}`;
      await prisma.verificationCode.create({
        data: { veriCode: oldCode, courseUuid: course.courseUuid, roleUuid: studentRole.roleUuid }
      });

      const agent = request.agent(app);
      await agent.post("/test/setup-session").send({ user: { email: "late@test.com", name: "Late" } });

      const response = await agent.post("/v1/api/auth/enroll").send({ code: oldCode });

      expect(response.status).toBe(400);
      expect(response.body.error).toMatch(/not active/i);
    });

    /**
     * Test that non-ucsd users can submit access requests without being logged in.
     */
    it("should allow non-ucsd email Request Access", async () => {
      const email = `visitor-${Date.now()}@test.com`;
      createdUserEmails.push(email);

      const agent = request.agent(app);
      const response = await agent.post("/v1/api/auth/request-access").send({
        firstName: "Vis", lastName: "Itor", email, verificationCode: "ABC"
      });

      expect(response.status).toBe(200);
      await prisma.formRequest.deleteMany({ where: { email } });
    });

    /**
     * Test that access requests for existing user emails are rejected with 400 status.
     */
    it("should fail Request Access if User already exists", async () => {
      const email = `exists-${Date.now()}@test.com`;
      createdUserEmails.push(email);
      await prisma.user.create({ data: { email, firstName: "Exists", lastName: "User" } });

      const agent = request.agent(app);
      const response = await agent.post("/v1/api/auth/request-access").send({
        firstName: "Vis", lastName: "Itor", email, verificationCode: "ABC"
      });

      expect(response.status).toBe(400);
      expect(response.body.error).toMatch(/already exists/i);
    });
  });

  describe("Course API", () => {
    /**
     * Test that a professor can successfully create a new course with verification codes.
     */
    it("should allow Professor to create a course", async () => {
      const email = `prof-create-${Date.now()}@test.com`;
      createdUserEmails.push(email);
      const prof = await prisma.user.create({ data: { email, firstName: "Dr", lastName: "Create" } });
      await prisma.staff.create({ data: { userUuid: prof.userUuid, isProf: true } });

      const agent = request.agent(app);
      await agent.post("/test/setup-session").send({ user: { id: prof.userUuid, email } });

      const response = await agent.post("/v1/api/courses/create").send({
        courseCode: `CS-NEW-${Date.now()}`,
        courseName: "New Course",
        termUuid: activeTerm.termUuid,
        taCode: `TA-${Date.now()}`,
        tutorCode: `TUT-${Date.now()}`,
        studentCode: `STU-${Date.now()}`
      });

      expect(response.status).toBe(201);
      createdCourseUuids.push(response.body.course.courseUuid);
    });

    /**
     * Test that course creation without required fields returns 400 status.
     */
    it("should return 400 if Missing Required Fields", async () => {
      const email = `prof-fail-${Date.now()}@test.com`;
      createdUserEmails.push(email);
      const prof = await prisma.user.create({ data: { email, firstName: "Dr", lastName: "Fail" } });
      await prisma.staff.create({ data: { userUuid: prof.userUuid, isProf: true } });

      const agent = request.agent(app);
      await agent.post("/test/setup-session").send({ user: { id: prof.userUuid, email } });

      const response = await agent.post("/v1/api/courses/create").send({
        courseName: "Missing Code"
      });

      expect(response.status).toBe(400);
    });

    /**
     * Test that creating a course with a duplicate code in the same term returns 409 status.
     */
    it("should return 409 for Duplicate Course Code in same term", async () => {
      const email = `prof-dup-${Date.now()}@test.com`;
      createdUserEmails.push(email);
      const prof = await prisma.user.create({ data: { email, firstName: "Dr", lastName: "Dup" } });
      await prisma.staff.create({ data: { userUuid: prof.userUuid, isProf: true } });

      const dupeCode = `DUP-${Date.now()}`;
      const course = await prisma.course.create({
        data: { courseName: "Original", courseCode: dupeCode, termUuid: activeTerm.termUuid }
      });
      createdCourseUuids.push(course.courseUuid);

      const profRole = await prisma.role.upsert({
        where: { role: "Professor" }, update: {}, create: { role: "Professor" }
      });

      await prisma.courseEnrollment.create({
        data: {
          userUuid: prof.userUuid,
          courseUuid: course.courseUuid,
          roleUuid: profRole.roleUuid
        }
      });

      const agent = request.agent(app);
      await agent.post("/test/setup-session").send({ user: { id: prof.userUuid, email } });

      const response = await agent.post("/v1/api/courses/create").send({
        courseCode: dupeCode,
        courseName: "Copycat",
        termUuid: activeTerm.termUuid,
        taCode: `TA-D-${Date.now()}`,
        tutorCode: `TUT-D-${Date.now()}`,
        studentCode: `STU-D-${Date.now()}`
      });

      expect(response.status).toBe(409);
    });

    /**
     * Test that students cannot create courses and receive 403 status.
     */
    it("should return 403 if Student tries to Create Course", async () => {
      const email = `std-hacker-${Date.now()}@test.com`;
      createdUserEmails.push(email);
      const student = await prisma.user.create({ data: { email, firstName: "Std", lastName: "Hacker" } });

      const agent = request.agent(app);
      await agent.post("/test/setup-session").send({ user: { id: student.userUuid, email } });

      const response = await agent.post("/v1/api/courses/create").send({
        courseCode: "HACK-101", courseName: "Hacker", termUuid: activeTerm.termUuid
      });

      expect(response.status).toBe(403);
    });

    /**
     * Test that a student can successfully leave a course they are enrolled in.
     */
    it("should allow Student to leave a course", async () => {
      const email = `leaver-${Date.now()}@test.com`;
      createdUserEmails.push(email);
      const student = await prisma.user.create({ data: { email, firstName: "Leaver", lastName: "Std" } });

      const course = await prisma.course.create({
        data: { courseName: "Leave Test", courseCode: `L-${Date.now()}`, termUuid: activeTerm.termUuid }
      });
      createdCourseUuids.push(course.courseUuid);

      await prisma.courseEnrollment.create({
        data: { userUuid: student.userUuid, courseUuid: course.courseUuid, roleUuid: studentRole.roleUuid }
      });

      const agent = request.agent(app);
      await agent.post("/test/setup-session").send({ user: { id: student.userUuid, email } });

      const response = await agent.delete(`/v1/api/courses/${course.courseUuid}/leave`);
      expect(response.status).toBe(200);
    });

    /**
     * Test that attempting to leave a course the student is not enrolled in returns 404 status.
     */
    it("should return 404 if Student tries to leave course they are not in", async () => {
      const email = `lost-${Date.now()}@test.com`;
      createdUserEmails.push(email);
      const student = await prisma.user.create({ data: { email, firstName: "Lost", lastName: "Std" } });

      const course = await prisma.course.create({
        data: { courseName: "Stranger Course", courseCode: `S-${Date.now()}`, termUuid: activeTerm.termUuid }
      });
      createdCourseUuids.push(course.courseUuid);

      const agent = request.agent(app);
      await agent.post("/test/setup-session").send({ user: { id: student.userUuid, email } });

      const response = await agent.delete(`/v1/api/courses/${course.courseUuid}/leave`);
      expect(response.status).toBe(404);
    });

    /**
     * Test that a professor can successfully delete their own course.
     */
    it("should allow Professor to delete their course", async () => {
      const email = `deleter-${Date.now()}@test.com`;
      createdUserEmails.push(email);
      const prof = await prisma.user.create({ data: { email, firstName: "Del", lastName: "Prof" } });
      await prisma.staff.create({ data: { userUuid: prof.userUuid, isProf: true } });

      const course = await prisma.course.create({
        data: { courseName: "Delete Me", courseCode: `DEL-${Date.now()}`, termUuid: activeTerm.termUuid }
      });

      const profRole = await prisma.role.upsert({ where: { role: "Professor" }, update: {}, create: { role: "Professor" } });
      await prisma.courseEnrollment.create({
        data: { userUuid: prof.userUuid, courseUuid: course.courseUuid, roleUuid: profRole.roleUuid }
      });

      const agent = request.agent(app);
      await agent.post("/test/setup-session").send({ user: { id: prof.userUuid, email } });

      const response = await agent.delete(`/v1/api/courses/${course.courseUuid}/delete`);
      expect(response.status).toBe(200);
    });
  });

  describe("Admin API", () => {
    /**
     * Test that an admin can successfully promote a professor to admin status.
     */
    it("should allow Admin to promote a professor", async () => {
      const adminEmail = `admin-${Date.now()}@test.com`;
      createdUserEmails.push(adminEmail);
      const admin = await prisma.user.create({ data: { email: adminEmail, firstName: "Adm", lastName: "User" } });
      await prisma.staff.create({ data: { userUuid: admin.userUuid, isSystemAdmin: true } });

      const targetEmail = `target-prof-${Date.now()}@test.com`;
      createdUserEmails.push(targetEmail);
      const target = await prisma.user.create({ data: { email: targetEmail, firstName: "Tar", lastName: "Get" } });
      await prisma.staff.create({ data: { userUuid: target.userUuid, isProf: true, isSystemAdmin: false } });

      const agent = request.agent(app);
      await agent.post("/test/setup-session").send({ user: { id: admin.userUuid, userUuid: admin.userUuid, email: adminEmail } });

      const response = await agent.post(`/v1/api/admin/users/${target.userUuid}/promote`);
      expect(response.status).toBe(200);

      const updated = await prisma.staff.findUnique({ where: { userUuid: target.userUuid } });
      expect(updated.isSystemAdmin).toBe(true);
    });

    /**
     * Test that attempting to promote a non-professor returns 400 status.
     */
    it("should return 400 if Admin tries to Promote a Non-Professor", async () => {
      const adminEmail = `admin-p2-${Date.now()}@test.com`;
      createdUserEmails.push(adminEmail);
      const admin = await prisma.user.create({ data: { email: adminEmail, firstName: "Adm", lastName: "User" } });
      await prisma.staff.create({ data: { userUuid: admin.userUuid, isSystemAdmin: true } });

      const studentEmail = `std-nopromote-${Date.now()}@test.com`;
      createdUserEmails.push(studentEmail);
      const student = await prisma.user.create({ data: { email: studentEmail, firstName: "No", lastName: "Promote" } });

      const agent = request.agent(app);
      await agent.post("/test/setup-session").send({ user: { id: admin.userUuid, userUuid: admin.userUuid, email: adminEmail } });

      const response = await agent.post(`/v1/api/admin/users/${student.userUuid}/promote`);

      expect(response.status).toBe(400);
    });

    /**
     * Test that an admin can successfully remove a student user from the system.
     */
    it("should allow Admin to remove a student", async () => {
      const adminEmail = `remover-${Date.now()}@test.com`;
      createdUserEmails.push(adminEmail);
      const admin = await prisma.user.create({ data: { email: adminEmail, firstName: "Adm", lastName: "Rem" } });
      await prisma.staff.create({ data: { userUuid: admin.userUuid, isSystemAdmin: true } });

      const targetEmail = `remove-std-${Date.now()}@test.com`;
      const target = await prisma.user.create({ data: { email: targetEmail, firstName: "Bye", lastName: "Std" } });

      const agent = request.agent(app);
      await agent.post("/test/setup-session").send({ user: { id: admin.userUuid, userUuid: admin.userUuid, email: adminEmail } });

      const response = await agent.delete(`/v1/api/admin/users/${target.userUuid}`);
      expect(response.status).toBe(200);

      const deleted = await prisma.user.findUnique({ where: { userUuid: target.userUuid } });
      expect(deleted).toBeNull();
    });

    /**
     * Test that admins cannot remove other admins and receive 400 status.
     */
    it("should return 400 if Admin tries to remove another Admin", async () => {
      const adminEmail = `admin-boss-${Date.now()}@test.com`;
      createdUserEmails.push(adminEmail);
      const admin = await prisma.user.create({ data: { email: adminEmail, firstName: "Boss", lastName: "Adm" } });
      await prisma.staff.create({ data: { userUuid: admin.userUuid, isSystemAdmin: true } });

      const targetEmail = `admin-peer-${Date.now()}@test.com`;
      createdUserEmails.push(targetEmail);
      const target = await prisma.user.create({ data: { email: targetEmail, firstName: "Peer", lastName: "Adm" } });
      await prisma.staff.create({ data: { userUuid: target.userUuid, isSystemAdmin: true } });

      const agent = request.agent(app);
      await agent.post("/test/setup-session").send({ user: { id: admin.userUuid, userUuid: admin.userUuid, email: adminEmail } });

      const response = await agent.delete(`/v1/api/admin/users/${target.userUuid}`);

      expect(response.status).toBe(400);
      expect(response.body.error).toMatch(/cannot remove admin/i);
    });

    /**
     * Test that an admin can successfully approve an access request, creating the user and enrollment.
     */
    it("should allow Admin to approve access request", async () => {
      const adminEmail = `approver-${Date.now()}@test.com`;
      createdUserEmails.push(adminEmail);
      const admin = await prisma.user.create({ data: { email: adminEmail, firstName: "Adm", lastName: "App" } });
      await prisma.staff.create({ data: { userUuid: admin.userUuid, isSystemAdmin: true } });

      const course = await prisma.course.create({
        data: { courseName: "Approve Test", courseCode: `APP-${Date.now()}`, termUuid: activeTerm.termUuid }
      });
      createdCourseUuids.push(course.courseUuid);

      const code = `APP-CODE-${Date.now()}`;
      await prisma.verificationCode.create({
        data: { veriCode: code, courseUuid: course.courseUuid, roleUuid: studentRole.roleUuid }
      });

      const reqEmail = `req-${Date.now()}@gmail.com`;
      createdUserEmails.push(reqEmail);
      const formReq = await prisma.formRequest.create({
        data: { firstName: "R", lastName: "Q", email: reqEmail, verificationCode: code }
      });

      const agent = request.agent(app);
      await agent.post("/test/setup-session").send({ user: { id: admin.userUuid, userUuid: admin.userUuid, email: adminEmail } });

      const response = await agent.post(`/v1/api/admin/requests/${formReq.requestUuid}/approve`);

      expect(response.status).toBe(200);

      const newUser = await prisma.user.findUnique({ where: { email: reqEmail } });
      expect(newUser).toBeTruthy();
    });
  });
});
