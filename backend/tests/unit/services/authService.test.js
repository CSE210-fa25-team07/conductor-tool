/**
 * Tests for authService
 * @module tests/unit/authService
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import * as authService from "../../../src/services/authService.js";
import * as userService from "../../../src/services/userService.js";
import * as userRepository from "../../../src/repositories/userRepository.js";
import * as verificationCodeRepository from "../../../src/repositories/verificationCodeRepository.js";
import * as courseRepository from "../../../src/repositories/courseRepository.js";
import * as formRequestRepository from "../../../src/repositories/formRequestRepository.js";

// Mock all dependencies
vi.mock("../../../src/services/userService.js");
vi.mock("../../../src/repositories/userRepository.js");
vi.mock("../../../src/repositories/verificationCodeRepository.js");
vi.mock("../../../src/repositories/courseRepository.js");
vi.mock("../../../src/repositories/formRequestRepository.js");

const createMockRequest = () => ({
  params: {},
  body: {},
  session: {
    user: null
  }
});

const createMockResponse = () => ({
  status: vi.fn(function() { return this; }),
  json: vi.fn(function(data) { this.data = data; return this; })
});

describe("authService", () => {
  let req, res;

  beforeEach(() => {
    req = createMockRequest();
    res = createMockResponse();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("getSession", () => {
    /**
     * Test that an unauthenticated request returns 401 status.
     */
    it("should return 401 when user is not authenticated", async () => {
      req.session.user = null;

      await authService.getSession(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: "Not authenticated"
      });
    });

    /**
     * Test that an authenticated request returns 200 status with user data.
     */
    it("should return 200 with user data when authenticated", async () => {
      req.session.user = {
        id: "user-uuid-123",
        email: "test@ucsd.edu",
        name: "Test User"
      };

      await authService.getSession(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        user: req.session.user
      });
    });
  });

  describe("verifyCode", () => {
    /**
     * Test that an invalid verification code returns 400 status.
     */
    it("should return 400 for invalid verification code", async () => {
      req.body.code = "INVALID-CODE";
      verificationCodeRepository.findCourseByVerificationCode.mockResolvedValue(null);

      await authService.verifyCode(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: "Verification code is invalid"
      });
    });

    /**
     * Test that a valid code for an inactive course returns 400 status.
     */
    it("should return 400 for inactive course", async () => {
      req.body.code = "VALID-CODE";
      const courseEnrollmentInfo = {
        courseUuid: "course-uuid-123",
        roleUuid: "role-uuid-123"
      };
      verificationCodeRepository.findCourseByVerificationCode.mockResolvedValue(courseEnrollmentInfo);
      courseRepository.getCourseByUuid.mockResolvedValue({
        courseUuid: "course-uuid-123",
        term: { isActive: false }
      });

      await authService.verifyCode(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: "Course is not active"
      });
    });

    /**
     * Test that a valid code for an active course returns 200 status with course information.
     */
    it("should return 200 for valid code and active course", async () => {
      req.body.code = "VALID-CODE";
      const courseEnrollmentInfo = {
        courseUuid: "course-uuid-123",
        roleUuid: "role-uuid-123"
      };
      verificationCodeRepository.findCourseByVerificationCode.mockResolvedValue(courseEnrollmentInfo);
      courseRepository.getCourseByUuid.mockResolvedValue({
        courseUuid: "course-uuid-123",
        term: { isActive: true }
      });

      await authService.verifyCode(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        courseInfo: courseEnrollmentInfo
      });
    });
  });

  describe("enrollUserByCode", () => {
    /**
     * Test that enrollment with an invalid verification code returns 400 status.
     */
    it("should return 400 for invalid verification code", async () => {
      req.body.code = "INVALID-CODE";
      req.session.user = { id: "user-uuid-123", email: "test@ucsd.edu" };
      verificationCodeRepository.findCourseByVerificationCode.mockResolvedValue(null);

      await authService.enrollUserByCode(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: "Verification code is invalid"
      });
    });

    /**
     * Test that enrollment in an inactive course returns 400 status.
     */
    it("should return 400 for inactive course", async () => {
      req.body.code = "VALID-CODE";
      req.session.user = { id: "user-uuid-123", email: "test@ucsd.edu" };
      const courseEnrollmentInfo = {
        courseUuid: "course-uuid-123",
        roleUuid: "role-uuid-123"
      };
      verificationCodeRepository.findCourseByVerificationCode.mockResolvedValue(courseEnrollmentInfo);
      courseRepository.getCourseByUuid.mockResolvedValue({
        courseUuid: "course-uuid-123",
        term: { isActive: false }
      });

      await authService.enrollUserByCode(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: "Course is not active"
      });
    });

    /**
     * Test that a new user is created and enrolled when they don't exist in the system.
     * Verifies user creation, enrollment, and session update.
     */
    it("should create new user and enroll when user does not exist", async () => {
      req.body.code = "VALID-CODE";
      req.session.user = {
        email: "newuser@ucsd.edu",
        name: "New User",
        firstName: "New",
        lastName: "User"
      };
      const courseEnrollmentInfo = {
        courseUuid: "course-uuid-123",
        roleUuid: "role-uuid-123"
      };
      const newUser = {
        userUuid: "new-user-uuid",
        email: "newuser@ucsd.edu"
      };

      verificationCodeRepository.findCourseByVerificationCode.mockResolvedValue(courseEnrollmentInfo);
      courseRepository.getCourseByUuid.mockResolvedValue({
        courseUuid: "course-uuid-123",
        term: { isActive: true }
      });
      userService.addUser.mockResolvedValue(newUser);
      courseRepository.enrollUserToCourse.mockResolvedValue({
        userUuid: "new-user-uuid",
        courseUuid: "course-uuid-123"
      });

      await authService.enrollUserByCode(req, res);

      expect(userService.addUser).toHaveBeenCalledWith({
        firstName: "New",
        lastName: "User",
        email: "newuser@ucsd.edu"
      });
      expect(req.session.user.id).toBe(newUser.userUuid);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "User verified and enrolled successfully"
      });
    });

    /**
     * Test that attempting to enroll in a course the user is already enrolled in returns 400 status.
     */
    it("should return 400 for duplicate enrollment", async () => {
      req.body.code = "VALID-CODE";
      req.session.user = { id: "user-uuid-123", email: "test@ucsd.edu", name: "Test User" };
      const courseEnrollmentInfo = {
        courseUuid: "course-uuid-123",
        roleUuid: "role-uuid-123"
      };

      verificationCodeRepository.findCourseByVerificationCode.mockResolvedValue(courseEnrollmentInfo);
      courseRepository.getCourseByUuid.mockResolvedValue({
        courseUuid: "course-uuid-123",
        term: { isActive: true }
      });
      courseRepository.enrollUserToCourse.mockResolvedValue(null);

      await authService.enrollUserByCode(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: "User is already enrolled in this course"
      });
    });
  });

  describe("requestAccess", () => {
    /**
     * Test that access request for an existing user email returns 400 status.
     */
    it("should return 400 if user already exists", async () => {
      req.body = {
        firstName: "Test",
        lastName: "User",
        email: "existing@ucsd.edu",
        institution: "UCSD",
        verificationCode: "CODE-2099"
      };
      userRepository.getUserByEmail.mockResolvedValue({
        userUuid: "existing-user-uuid",
        email: "existing@ucsd.edu"
      });

      await authService.requestAccess(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: "User with this email already exists"
      });
    });

    /**
     * Test that a duplicate access request returns 500 status.
     */
    it("should return 500 if request already exists", async () => {
      req.body = {
        firstName: "Test",
        lastName: "User",
        email: "test@ucsd.edu",
        institution: "UCSD",
        verificationCode: "CODE-2099"
      };
      userRepository.getUserByEmail.mockResolvedValue(null);
      formRequestRepository.createFormRequest.mockResolvedValue(null);

      await authService.requestAccess(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: "Request with this email already exists"
      });
    });

    /**
     * Test that a valid access request is successfully submitted and returns 200 status.
     */
    it("should return 200 for successful request submission", async () => {
      req.body = {
        firstName: "Test",
        lastName: "User",
        email: "test@ucsd.edu",
        institution: "UCSD",
        verificationCode: "CODE-2099"
      };
      userRepository.getUserByEmail.mockResolvedValue(null);
      formRequestRepository.createFormRequest.mockResolvedValue({
        requestUuid: "request-uuid-123"
      });

      await authService.requestAccess(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Access request submitted successfully"
      });
    });
  });

  describe("getDevUsers", () => {
    /**
     * Test that the development endpoint returns a list of all users.
     */
    it("should return 200 with list of users", async () => {
      const users = [
        { userUuid: "user-1", email: "user1@ucsd.edu" },
        { userUuid: "user-2", email: "user2@ucsd.edu" }
      ];
      userRepository.getAllUsers.mockResolvedValue(users);

      await authService.getDevUsers(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(users);
    });

    /**
     * Test that database errors are handled with 500 status.
     */
    it("should return 500 on error", async () => {
      userRepository.getAllUsers.mockRejectedValue(new Error("Database error"));

      await authService.getDevUsers(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: "Failed to fetch users"
      });
    });
  });

  describe("devLogin", () => {
    /**
     * Test that login without a userId returns 400 status.
     */
    it("should return 400 if userId is missing", async () => {
      req.body = {};

      await authService.devLogin(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: "User ID is required"
      });
    });

    /**
     * Test that login with a non-existent userId returns 404 status.
     */
    it("should return 404 if user not found", async () => {
      req.body = { userId: "non-existent-uuid" };
      userRepository.getUserByUuid.mockResolvedValue(null);

      await authService.devLogin(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: "User not found"
      });
    });

    /**
     * Test that a valid userId logs in the user, sets the session, and returns 200 status.
     */
    it("should return 200 and set session on successful login", async () => {
      req.body = { userId: "user-uuid-123" };
      const user = {
        userUuid: "user-uuid-123",
        email: "test@ucsd.edu",
        firstName: "Test",
        lastName: "User"
      };
      userRepository.getUserByUuid.mockResolvedValue(user);

      await authService.devLogin(req, res);

      expect(req.session.user).toEqual({
        id: "user-uuid-123",
        email: "test@ucsd.edu",
        name: "Test User"
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        redirectUrl: "/dashboard"
      });
    });

    /**
     * Test that database errors during login are handled with 500 status.
     */
    it("should return 500 on error", async () => {
      req.body = { userId: "user-uuid-123" };
      userRepository.getUserByUuid.mockRejectedValue(new Error("Database error"));

      await authService.devLogin(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: "Login failed"
      });
    });
  });
});
