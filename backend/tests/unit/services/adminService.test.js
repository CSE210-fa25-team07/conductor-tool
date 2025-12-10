/**
 * Tests for adminService
 * @module tests/unit/adminService
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import * as adminService from "../../../src/services/adminService.js";
import * as userRepository from "../../../src/repositories/userRepository.js";
import * as courseRepository from "../../../src/repositories/courseRepository.js";
import * as formRequestRepository from "../../../src/repositories/formRequestRepository.js";
import * as verificationCodeRepository from "../../../src/repositories/verificationCodeRepository.js";
import * as userValidator from "../../../src/validators/userValidator.js";

vi.mock("../../../src/repositories/userRepository.js");
vi.mock("../../../src/repositories/courseRepository.js");
vi.mock("../../../src/repositories/formRequestRepository.js");
vi.mock("../../../src/repositories/verificationCodeRepository.js");
vi.mock("../../../src/validators/userValidator.js");

describe("adminService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("addUserWithStaffStatus", () => {
    /**
     * Test that a regular user (non-staff) can be added without any staff flags.
     */
    it("should add regular user when no staff flags are set", async () => {
      const userData = {
        firstName: "Test",
        lastName: "User",
        email: "test@ucsd.edu",
        isProf: false,
        isSystemAdmin: false
      };
      const expectedUser = {
        userUuid: "user-uuid-123",
        firstName: "test",
        lastName: "user",
        email: "test@ucsd.edu"
      };

      userValidator.validateUserData.mockReturnValue(true);
      userRepository.addUser.mockResolvedValue(expectedUser);

      const result = await adminService.addUserWithStaffStatus(userData);

      expect(userValidator.validateUserData).toHaveBeenCalledWith(userData);
      expect(userRepository.addUser).toHaveBeenCalledWith({
        firstName: "Test",
        lastName: "User",
        email: "test@ucsd.edu"
      });
      expect(result).toEqual(expectedUser);
    });

    /**
     * Test that a user can be added with professor staff status.
     */
    it("should add user with professor status", async () => {
      const userData = {
        firstName: "Test",
        lastName: "Professor",
        email: "prof@ucsd.edu",
        isProf: true,
        isSystemAdmin: false
      };
      const expectedUser = {
        userUuid: "user-uuid-123",
        email: "prof@ucsd.edu"
      };

      userValidator.validateUserData.mockReturnValue(true);
      userRepository.addUserWithStaffStatus.mockResolvedValue(expectedUser);

      const result = await adminService.addUserWithStaffStatus(userData);

      expect(userRepository.addUserWithStaffStatus).toHaveBeenCalledWith(
        {
          firstName: "Test",
          lastName: "Professor",
          email: "prof@ucsd.edu"
        },
        {
          isProf: true,
          isSystemAdmin: false
        }
      );
      expect(result).toEqual(expectedUser);
    });

    /**
     * Test that a user can be added with system admin staff status.
     */
    it("should add user with system admin status", async () => {
      const userData = {
        firstName: "Test",
        lastName: "Admin",
        email: "admin@ucsd.edu",
        isProf: false,
        isSystemAdmin: true
      };
      const expectedUser = {
        userUuid: "user-uuid-123",
        email: "admin@ucsd.edu"
      };

      userValidator.validateUserData.mockReturnValue(true);
      userRepository.addUserWithStaffStatus.mockResolvedValue(expectedUser);

      const result = await adminService.addUserWithStaffStatus(userData);

      expect(userRepository.addUserWithStaffStatus).toHaveBeenCalledWith(
        expect.any(Object),
        {
          isProf: false,
          isSystemAdmin: true
        }
      );
      expect(result).toEqual(expectedUser);
    });
  });

  describe("getAllFormRequests", () => {
    /**
     * Test that all pending form requests can be retrieved for admin review.
     */
    it("should return all form requests", async () => {
      const mockRequests = [
        { requestUuid: "req-1", email: "user1@ucsd.edu" },
        { requestUuid: "req-2", email: "user2@ucsd.edu" }
      ];

      formRequestRepository.getAllFormRequests.mockResolvedValue(mockRequests);

      const result = await adminService.getAllFormRequests();

      expect(result).toEqual(mockRequests);
      expect(formRequestRepository.getAllFormRequests).toHaveBeenCalled();
    });
  });

  describe("approveFormRequest", () => {
    /**
     * Test that approving a non-existent form request throws an error.
     */
    it("should throw error if request not found", async () => {
      formRequestRepository.getFormRequestByUuid.mockResolvedValue(null);

      await expect(adminService.approveFormRequest("non-existent-uuid"))
        .rejects.toThrow("Request not found");
    });

    /**
     * Test that approving a request for an existing user email throws an error.
     */
    it("should throw error if user already exists", async () => {
      const request = {
        requestUuid: "req-uuid-123",
        email: "existing@ucsd.edu",
        firstName: "Test",
        lastName: "User"
      };

      formRequestRepository.getFormRequestByUuid.mockResolvedValue(request);
      userRepository.getUserByEmail.mockResolvedValue({
        userUuid: "existing-user-uuid",
        email: "existing@ucsd.edu"
      });

      await expect(adminService.approveFormRequest("req-uuid-123"))
        .rejects.toThrow("User with this email already exists");
    });

    /**
     * Test that approving a request with an invalid verification code throws an error.
     */
    it("should throw error for invalid verification code", async () => {
      const request = {
        requestUuid: "req-uuid-123",
        email: "new@ucsd.edu",
        firstName: "Test",
        lastName: "User",
        verificationCode: "INVALID-CODE"
      };

      formRequestRepository.getFormRequestByUuid.mockResolvedValue(request);
      userRepository.getUserByEmail.mockResolvedValue(null);
      verificationCodeRepository.findCourseByVerificationCode.mockResolvedValue(null);

      await expect(adminService.approveFormRequest("req-uuid-123"))
        .rejects.toThrow("Invalid verification code");
    });

    /**
     * Test that approving a request for an inactive course throws an error.
     */
    it("should throw error for inactive course", async () => {
      const request = {
        requestUuid: "req-uuid-123",
        email: "new@ucsd.edu",
        firstName: "Test",
        lastName: "User",
        verificationCode: "VALID-CODE"
      };
      const courseEnrollmentInfo = {
        courseUuid: "course-uuid-123",
        roleUuid: "role-uuid-123"
      };

      formRequestRepository.getFormRequestByUuid.mockResolvedValue(request);
      userRepository.getUserByEmail.mockResolvedValue(null);
      verificationCodeRepository.findCourseByVerificationCode.mockResolvedValue(courseEnrollmentInfo);
      courseRepository.getCourseByUuid.mockResolvedValue({
        courseUuid: "course-uuid-123",
        term: { isActive: false }
      });

      await expect(adminService.approveFormRequest("req-uuid-123"))
        .rejects.toThrow("Course is not active");
    });

    /**
     * Test that a valid form request is successfully approved, creating a new user and enrollment.
     */
    it("should successfully approve request and create user", async () => {
      const request = {
        requestUuid: "req-uuid-123",
        email: "new@ucsd.edu",
        firstName: "Test",
        lastName: "User",
        verificationCode: "VALID-CODE"
      };
      const courseEnrollmentInfo = {
        courseUuid: "course-uuid-123",
        roleUuid: "role-uuid-123"
      };
      const newUser = {
        userUuid: "new-user-uuid",
        email: "new@ucsd.edu"
      };

      formRequestRepository.getFormRequestByUuid.mockResolvedValue(request);
      userRepository.getUserByEmail.mockResolvedValue(null);
      verificationCodeRepository.findCourseByVerificationCode.mockResolvedValue(courseEnrollmentInfo);
      courseRepository.getCourseByUuid.mockResolvedValue({
        courseUuid: "course-uuid-123",
        term: { isActive: true }
      });
      formRequestRepository.approveFormRequestTransaction.mockResolvedValue(newUser);

      const result = await adminService.approveFormRequest("req-uuid-123");

      expect(result).toEqual({
        user: newUser,
        course: courseEnrollmentInfo
      });
      expect(formRequestRepository.approveFormRequestTransaction).toHaveBeenCalledWith(
        "req-uuid-123",
        {
          firstName: "Test",
          lastName: "User",
          email: "new@ucsd.edu"
        },
        "course-uuid-123",
        "role-uuid-123"
      );
    });
  });

  describe("denyFormRequest", () => {
    /**
     * Test that denying a non-existent form request throws an error.
     */
    it("should throw error if request not found", async () => {
      formRequestRepository.deleteFormRequest.mockResolvedValue(null);

      await expect(adminService.denyFormRequest("non-existent-uuid"))
        .rejects.toThrow("Request not found");
    });

    /**
     * Test that a form request can be successfully denied and deleted.
     */
    it("should successfully deny request", async () => {
      const deletedRequest = {
        requestUuid: "req-uuid-123",
        email: "denied@ucsd.edu"
      };

      formRequestRepository.deleteFormRequest.mockResolvedValue(deletedRequest);

      const result = await adminService.denyFormRequest("req-uuid-123");

      expect(result).toEqual(deletedRequest);
      expect(formRequestRepository.deleteFormRequest).toHaveBeenCalledWith("req-uuid-123");
    });
  });

  describe("getAllUsersWithStaffStatus", () => {
    /**
     * Test that all users with their staff status information can be retrieved.
     */
    it("should return all users with staff status", async () => {
      const users = [
        { userUuid: "user-1", isProf: true, isSystemAdmin: false },
        { userUuid: "user-2", isProf: false, isSystemAdmin: true }
      ];

      userRepository.getAllUsersWithStaffStatus.mockResolvedValue(users);

      const result = await adminService.getAllUsersWithStaffStatus();

      expect(result).toEqual(users);
      expect(userRepository.getAllUsersWithStaffStatus).toHaveBeenCalled();
    });
  });

  describe("removeUser", () => {
    /**
     * Test that a non-admin user cannot remove other users.
     */
    it("should throw error if requesting user is not admin", async () => {
      userRepository.getUserStatusByUuid.mockResolvedValue({
        isSystemAdmin: false
      });

      await expect(adminService.removeUser("user-uuid", "requester-uuid"))
        .rejects.toThrow("Only admins can remove users");
    });

    /**
     * Test that admin users cannot be removed directly and must be demoted first.
     */
    it("should throw error when trying to remove admin user", async () => {
      userRepository.getUserStatusByUuid
        .mockResolvedValueOnce({ isSystemAdmin: true }) // requesting user
        .mockResolvedValueOnce({ isSystemAdmin: true }); // target user

      await expect(adminService.removeUser("admin-uuid", "requester-uuid"))
        .rejects.toThrow("Cannot remove admin users. Demote to professor first.");
    });

    /**
     * Test that a non-admin user can be successfully removed by an admin.
     */
    it("should successfully remove non-admin user", async () => {
      const deletedResult = {
        deletedUser: { userUuid: "user-uuid" },
        deletedCoursesCount: 2
      };

      userRepository.getUserStatusByUuid
        .mockResolvedValueOnce({ isSystemAdmin: true }) // requesting user
        .mockResolvedValueOnce({ isSystemAdmin: false }); // target user
      userRepository.deleteUserByUuid.mockResolvedValue(deletedResult);

      const result = await adminService.removeUser("user-uuid", "requester-uuid");

      expect(result).toEqual(deletedResult);
      expect(userRepository.deleteUserByUuid).toHaveBeenCalledWith("user-uuid");
    });
  });

  describe("promoteProfessorToAdmin", () => {
    /**
     * Test that only admins can promote professors to admin status.
     */
    it("should throw error if requesting user is not admin", async () => {
      userRepository.getUserStatusByUuid.mockResolvedValue({
        isSystemAdmin: false
      });

      await expect(adminService.promoteProfessorToAdmin("prof-uuid", "requester-uuid"))
        .rejects.toThrow("Only admins can promote professors to admins");
    });

    /**
     * Test that only professors can be promoted to admin status.
     */
    it("should throw error if user is not a professor", async () => {
      userRepository.getUserStatusByUuid
        .mockResolvedValueOnce({ isSystemAdmin: true }) // requesting user
        .mockResolvedValueOnce({ isProf: false, isSystemAdmin: false }); // target user

      await expect(adminService.promoteProfessorToAdmin("user-uuid", "requester-uuid"))
        .rejects.toThrow("User must be a professor to be promoted to admin");
    });

    /**
     * Test that promoting a user who is already an admin throws an error.
     */
    it("should throw error if user is already an admin", async () => {
      userRepository.getUserStatusByUuid
        .mockResolvedValueOnce({ isSystemAdmin: true }) // requesting user
        .mockResolvedValueOnce({ isProf: true, isSystemAdmin: true }); // target user

      await expect(adminService.promoteProfessorToAdmin("prof-uuid", "requester-uuid"))
        .rejects.toThrow("User is already an admin");
    });

    /**
     * Test that a professor can be successfully promoted to admin status.
     */
    it("should successfully promote professor to admin", async () => {
      const updatedStaff = {
        userUuid: "prof-uuid",
        isProf: true,
        isSystemAdmin: true
      };

      userRepository.getUserStatusByUuid
        .mockResolvedValueOnce({ isSystemAdmin: true }) // requesting user
        .mockResolvedValueOnce({ isProf: true, isSystemAdmin: false }); // target user
      userRepository.updateStaffStatus.mockResolvedValue(updatedStaff);

      const result = await adminService.promoteProfessorToAdmin("prof-uuid", "requester-uuid");

      expect(result).toEqual(updatedStaff);
      expect(userRepository.updateStaffStatus).toHaveBeenCalledWith("prof-uuid", {
        isSystemAdmin: true
      });
    });
  });

  describe("demoteAdminToProfessor", () => {
    /**
     * Test that only the lead admin can demote admins to professor status.
     */
    it("should throw error if requesting user is not lead admin", async () => {
      userRepository.getUserStatusByUuid.mockResolvedValue({
        isLeadAdmin: false
      });

      await expect(adminService.demoteAdminToProfessor("admin-uuid", "requester-uuid"))
        .rejects.toThrow("Only the lead admin can demote admins to professors");
    });

    /**
     * Test that attempting to demote a non-admin user throws an error.
     */
    it("should throw error if target user is not an admin", async () => {
      userRepository.getUserStatusByUuid
        .mockResolvedValueOnce({ isLeadAdmin: true }) // requesting user
        .mockResolvedValueOnce({ isSystemAdmin: false }); // target user

      await expect(adminService.demoteAdminToProfessor("user-uuid", "requester-uuid"))
        .rejects.toThrow("User is not an admin");
    });

    /**
     * Test that the lead admin cannot be demoted without transferring the role first.
     */
    it("should throw error when trying to demote lead admin", async () => {
      userRepository.getUserStatusByUuid
        .mockResolvedValueOnce({ isLeadAdmin: true }) // requesting user
        .mockResolvedValueOnce({ isSystemAdmin: true, isLeadAdmin: true }); // target user

      await expect(adminService.demoteAdminToProfessor("admin-uuid", "requester-uuid"))
        .rejects.toThrow("Cannot demote lead admin. Transfer lead admin status first.");
    });

    /**
     * Test that an admin can be successfully demoted to professor status by the lead admin.
     */
    it("should successfully demote admin to professor", async () => {
      const updatedStaff = {
        userUuid: "admin-uuid",
        isProf: true,
        isSystemAdmin: false
      };

      userRepository.getUserStatusByUuid
        .mockResolvedValueOnce({ isLeadAdmin: true }) // requesting user
        .mockResolvedValueOnce({ isSystemAdmin: true, isLeadAdmin: false }); // target user
      userRepository.updateStaffStatus.mockResolvedValue(updatedStaff);

      const result = await adminService.demoteAdminToProfessor("admin-uuid", "requester-uuid");

      expect(result).toEqual(updatedStaff);
      expect(userRepository.updateStaffStatus).toHaveBeenCalledWith("admin-uuid", {
        isSystemAdmin: false
      });
    });
  });

  describe("transferLeadAdmin", () => {
    /**
     * Test that only the current lead admin can transfer the lead admin role.
     */
    it("should throw error if current user is not lead admin", async () => {
      userRepository.getUserStatusByUuid.mockResolvedValue({
        isLeadAdmin: false
      });

      await expect(adminService.transferLeadAdmin("new-lead-uuid", "current-lead-uuid"))
        .rejects.toThrow("Only the lead admin can transfer lead admin status");
    });

    /**
     * Test that the lead admin role can only be transferred to another admin.
     */
    it("should throw error if new lead is not an admin", async () => {
      userRepository.getUserStatusByUuid
        .mockResolvedValueOnce({ isLeadAdmin: true }) // current lead
        .mockResolvedValueOnce({ isSystemAdmin: false }); // new lead

      await expect(adminService.transferLeadAdmin("new-lead-uuid", "current-lead-uuid"))
        .rejects.toThrow("Target user must be an admin to become lead admin");
    });

    /**
     * Test that transferring to a user who is already the lead admin throws an error.
     */
    it("should throw error if new lead is already lead admin", async () => {
      userRepository.getUserStatusByUuid
        .mockResolvedValueOnce({ isLeadAdmin: true }) // current lead
        .mockResolvedValueOnce({ isSystemAdmin: true, isLeadAdmin: true }); // new lead

      await expect(adminService.transferLeadAdmin("new-lead-uuid", "current-lead-uuid"))
        .rejects.toThrow("User is already the lead admin");
    });

    /**
     * Test that lead admin status can be successfully transferred to another admin.
     */
    it("should successfully transfer lead admin status", async () => {
      const result = {
        oldLead: { userUuid: "current-lead-uuid", isLeadAdmin: false },
        newLead: { userUuid: "new-lead-uuid", isLeadAdmin: true }
      };

      userRepository.getUserStatusByUuid
        .mockResolvedValueOnce({ isLeadAdmin: true }) // current lead
        .mockResolvedValueOnce({ isSystemAdmin: true, isLeadAdmin: false }); // new lead
      userRepository.transferLeadAdmin.mockResolvedValue(result);

      const transferResult = await adminService.transferLeadAdmin("new-lead-uuid", "current-lead-uuid");

      expect(transferResult).toEqual(result);
      expect(userRepository.transferLeadAdmin).toHaveBeenCalledWith("current-lead-uuid", "new-lead-uuid");
    });
  });
});
