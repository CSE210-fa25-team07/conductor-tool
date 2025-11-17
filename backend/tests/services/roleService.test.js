/**
 * Role Service Tests
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import * as roleService from "../../src/services/roleService.js";
import * as roleRepository from "../../src/repositories/roleRepository.js";

// Mock the repository
vi.mock("../../src/repositories/roleRepository.js");

describe("RoleService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getAllRoles", () => {
    it("should return all roles from repository", async () => {
      const mockRoles = [
        { role_uuid: "1", role: "student" },
        { role_uuid: "2", role: "ta" }
      ];
      vi.mocked(roleRepository.getAllRoles).mockResolvedValue(mockRoles);

      const result = await roleService.getAllRoles();

      expect(result).toEqual(mockRoles);
      expect(roleRepository.getAllRoles).toHaveBeenCalledOnce();
    });
  });

  describe("getRoleById", () => {
    it("should return role when found", async () => {
      const mockRole = { role_uuid: "1", role: "student" };
      vi.mocked(roleRepository.getRoleById).mockResolvedValue(mockRole);

      const result = await roleService.getRoleById("1");

      expect(result).toEqual(mockRole);
      expect(roleRepository.getRoleById).toHaveBeenCalledWith("1");
    });

    it("should throw error when role not found", async () => {
      vi.mocked(roleRepository.getRoleById).mockResolvedValue(null);

      await expect(roleService.getRoleById("999")).rejects.toThrow("Role with ID 999 not found");
    });

    it("should throw error when roleId is invalid", async () => {
      await expect(roleService.getRoleById(null)).rejects.toThrow("Role ID is required");
      await expect(roleService.getRoleById(123)).rejects.toThrow("must be a string");
    });
  });

  describe("getRoleByName", () => {
    it("should return role when valid name provided", async () => {
      const mockRole = { role_uuid: "1", role: "student" };
      vi.mocked(roleRepository.getRoleByName).mockResolvedValue(mockRole);

      const result = await roleService.getRoleByName("student");

      expect(result).toEqual(mockRole);
      expect(roleRepository.getRoleByName).toHaveBeenCalledWith("student");
    });

    it("should normalize role name (lowercase, trim)", async () => {
      const mockRole = { role_uuid: "2", role: "ta" };
      vi.mocked(roleRepository.getRoleByName).mockResolvedValue(mockRole);

      await roleService.getRoleByName("  TA  ");

      expect(roleRepository.getRoleByName).toHaveBeenCalledWith("ta");
    });

    it("should throw error for invalid role name", async () => {
      await expect(roleService.getRoleByName("invalid_role")).rejects.toThrow("Invalid role name");
    });

    it("should throw error when role not found", async () => {
      vi.mocked(roleRepository.getRoleByName).mockResolvedValue(null);

      await expect(roleService.getRoleByName("student")).rejects.toThrow("Role 'student' not found");
    });

    it("should accept all valid role names", async () => {
      const validRoles = ["student", "ta", "professor", "admin", "lead"];
      const mockRole = { role_uuid: "1", role: "test" };
      vi.mocked(roleRepository.getRoleByName).mockResolvedValue(mockRole);

      for (const roleName of validRoles) {
        await roleService.getRoleByName(roleName);
        expect(roleRepository.getRoleByName).toHaveBeenCalledWith(roleName);
      }
    });
  });

  describe("isValidRoleName", () => {
    it("should return true for valid role names", () => {
      expect(roleService.isValidRoleName("student")).toBe(true);
      expect(roleService.isValidRoleName("ta")).toBe(true);
      expect(roleService.isValidRoleName("professor")).toBe(true);
      expect(roleService.isValidRoleName("admin")).toBe(true);
      expect(roleService.isValidRoleName("lead")).toBe(true);
    });

    it("should return false for invalid role names", () => {
      expect(roleService.isValidRoleName("invalid")).toBe(false);
      expect(roleService.isValidRoleName("")).toBe(false);
      expect(roleService.isValidRoleName(null)).toBe(false);
      expect(roleService.isValidRoleName(undefined)).toBe(false);
    });

    it("should be case insensitive", () => {
      expect(roleService.isValidRoleName("STUDENT")).toBe(true);
      expect(roleService.isValidRoleName("Ta")).toBe(true);
      expect(roleService.isValidRoleName("PROFESSOR")).toBe(true);
    });
  });

  describe("getRolePriority", () => {
    it("should return correct priorities", () => {
      expect(roleService.getRolePriority("professor")).toBe(1);
      expect(roleService.getRolePriority("ta")).toBe(2);
      expect(roleService.getRolePriority("lead")).toBe(3);
      expect(roleService.getRolePriority("student")).toBe(4);
      expect(roleService.getRolePriority("admin")).toBe(5);
    });

    it("should return 999 for unknown roles", () => {
      expect(roleService.getRolePriority("unknown")).toBe(999);
      expect(roleService.getRolePriority(null)).toBe(999);
      expect(roleService.getRolePriority(undefined)).toBe(999);
    });

    it("should be case insensitive", () => {
      expect(roleService.getRolePriority("PROFESSOR")).toBe(1);
      expect(roleService.getRolePriority("Ta")).toBe(2);
    });
  });
});
