/**
 * Auth API Client Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  getCurrentUser,
  getUserEnrollments,
  getUserRoleInCourse,
  getAllRoles
} from "../api/authApi.js";

global.fetch = vi.fn();

describe("AuthApi", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("getCurrentUser", () => {
    it("should fetch current user successfully", async () => {
      const mockUser = {
        user_uuid: "user123",
        email: "test@example.com",
        first_name: "Test",
        last_name: "User"
      };

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, data: mockUser })
      });

      const result = await getCurrentUser();

      expect(fetch).toHaveBeenCalledWith("/api/auth/me");
      expect(result).toEqual(mockUser);
    });

    it("should fetch user with userId parameter", async () => {
      const mockUser = { user_uuid: "user123" };

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, data: mockUser })
      });

      await getCurrentUser("user123");

      expect(fetch).toHaveBeenCalledWith("/api/auth/me?userId=user123");
    });

    it("should throw error on 401 unauthorized", async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 401
      });

      await expect(getCurrentUser()).rejects.toThrow("Not authenticated");
    });

    it("should throw error on HTTP error", async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 500
      });

      await expect(getCurrentUser()).rejects.toThrow("HTTP error! status: 500");
    });

    it("should throw error when success is false", async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ success: false, error: "User not found" })
      });

      await expect(getCurrentUser()).rejects.toThrow("User not found");
    });

    it("should throw error when fetch fails", async () => {
      vi.mocked(fetch).mockRejectedValue(new Error("Network error"));

      await expect(getCurrentUser()).rejects.toThrow("Network error");
    });
  });

  describe("getUserEnrollments", () => {
    it("should fetch user enrollments successfully", async () => {
      const mockEnrollments = {
        userUuid: "user123",
        rolesByCourse: {
          course1: {
            courseCode: "CSE210",
            roles: [{ roleName: "student" }]
          }
        }
      };

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, data: mockEnrollments })
      });

      const result = await getUserEnrollments("user123");

      expect(fetch).toHaveBeenCalledWith("/api/users/user123/enrollments");
      expect(result).toEqual(mockEnrollments);
    });

    it("should throw error on HTTP error", async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 404
      });

      await expect(getUserEnrollments("user123")).rejects.toThrow("HTTP error! status: 404");
    });

    it("should throw error when success is false", async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ success: false, error: "No enrollments found" })
      });

      await expect(getUserEnrollments("user123")).rejects.toThrow("No enrollments found");
    });
  });

  describe("getUserRoleInCourse", () => {
    it("should fetch user role in course successfully", async () => {
      const mockRole = {
        role_uuid: "role123",
        role_name: "ta"
      };

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, data: mockRole })
      });

      const result = await getUserRoleInCourse("user123", "course456");

      expect(fetch).toHaveBeenCalledWith("/api/users/user123/courses/course456/role");
      expect(result).toEqual(mockRole);
    });

    it("should return null on 404 not found", async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 404
      });

      const result = await getUserRoleInCourse("user123", "course456");

      expect(result).toBeNull();
    });

    it("should return null when success is false", async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ success: false, error: "Not enrolled" })
      });

      const result = await getUserRoleInCourse("user123", "course456");

      expect(result).toBeNull();
    });

    it("should return null on fetch error", async () => {
      vi.mocked(fetch).mockRejectedValue(new Error("Network error"));

      const result = await getUserRoleInCourse("user123", "course456");

      expect(result).toBeNull();
    });
  });

  describe("getAllRoles", () => {
    it("should fetch all roles successfully", async () => {
      const mockRoles = [
        { role_uuid: "r1", role: "student" },
        { role_uuid: "r2", role: "ta" },
        { role_uuid: "r3", role: "professor" }
      ];

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, data: mockRoles })
      });

      const result = await getAllRoles();

      expect(fetch).toHaveBeenCalledWith("/api/roles");
      expect(result).toEqual(mockRoles);
      expect(result).toHaveLength(3);
    });

    it("should throw error on HTTP error", async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 500
      });

      await expect(getAllRoles()).rejects.toThrow("HTTP error! status: 500");
    });

    it("should throw error when success is false", async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ success: false, error: "Database error" })
      });

      await expect(getAllRoles()).rejects.toThrow("Database error");
    });
  });
});
