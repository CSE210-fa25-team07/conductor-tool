/**
 * Role Repository
 *
 * Handles database operations for roles.
 * Provides CRUD operations for role management.
 */

import { query } from "../utils/db.js";

/**
 * Get all roles
 * @returns {Promise<Array>} Array of role objects
 */
export async function getAllRoles() {
  const result = await query(
    "SELECT role_uuid, role, created_at FROM role ORDER BY role"
  );
  return result.rows;
}

/**
 * Get a role by UUID
 * @param {string} roleUuid - Role UUID
 * @returns {Promise<Object|null>} Role object or null if not found
 */
export async function getRoleById(roleUuid) {
  const result = await query(
    "SELECT role_uuid, role, created_at FROM role WHERE role_uuid = $1",
    [roleUuid]
  );
  return result.rows[0] || null;
}

/**
 * Get a role by name
 * @param {string} roleName - Role name (student, ta, professor, admin, lead)
 * @returns {Promise<Object|null>} Role object or null if not found
 */
export async function getRoleByName(roleName) {
  const result = await query(
    "SELECT role_uuid, role, created_at FROM role WHERE role = $1",
    [roleName]
  );
  return result.rows[0] || null;
}

/**
 * Create a new role
 * @param {string} roleName - Role name
 * @returns {Promise<Object>} Created role object
 */
export async function createRole(roleName) {
  const result = await query(
    "INSERT INTO role (role) VALUES ($1) RETURNING role_uuid, role, created_at",
    [roleName]
  );
  return result.rows[0];
}

export default {
  getAllRoles,
  getRoleById,
  getRoleByName,
  createRole
};
