/**
 * Role Service
 *
 * Business logic layer for role management.
 * Coordinates with roleRepository to provide role operations.
 */

import * as roleRepository from '../repositories/roleRepository.js';

/**
 * Get all available roles
 * @returns {Promise<Array>} Array of role objects
 */
export async function getAllRoles() {
  return await roleRepository.getAllRoles();
}

/**
 * Get a role by ID
 * @param {string} roleId - Role UUID
 * @returns {Promise<Object>} Role object
 * @throws {Error} If role not found
 */
export async function getRoleById(roleId) {
  if (!roleId || typeof roleId !== 'string') {
    throw new Error('Role ID is required and must be a string');
  }

  const role = await roleRepository.getRoleById(roleId);
  if (!role) {
    throw new Error(`Role with ID ${roleId} not found`);
  }

  return role;
}

/**
 * Get a role by name
 * @param {string} roleName - Role name (student, ta, professor, admin, lead)
 * @returns {Promise<Object>} Role object
 * @throws {Error} If role not found or invalid name
 */
export async function getRoleByName(roleName) {
  if (!roleName || typeof roleName !== 'string') {
    throw new Error('Role name is required and must be a string');
  }

  const validRoles = ['student', 'ta', 'professor', 'admin', 'lead'];
  const normalizedRole = roleName.toLowerCase().trim();

  if (!validRoles.includes(normalizedRole)) {
    throw new Error(`Invalid role name. Must be one of: ${validRoles.join(', ')}`);
  }

  const role = await roleRepository.getRoleByName(normalizedRole);
  if (!role) {
    throw new Error(`Role '${normalizedRole}' not found`);
  }

  return role;
}

/**
 * Validate role name
 * @param {string} roleName - Role name to validate
 * @returns {boolean} True if valid
 */
export function isValidRoleName(roleName) {
  const validRoles = ['student', 'ta', 'professor', 'admin', 'lead'];
  return validRoles.includes(roleName?.toLowerCase()?.trim());
}

/**
 * Get role hierarchy priority
 * Lower number = higher priority
 * @param {string} roleName - Role name
 * @returns {number} Priority number
 */
export function getRolePriority(roleName) {
  const priorities = {
    professor: 1,
    ta: 2,
    lead: 3,
    student: 4,
    admin: 5,
  };
  return priorities[roleName?.toLowerCase()] || 999;
}

export default {
  getAllRoles,
  getRoleById,
  getRoleByName,
  isValidRoleName,
  getRolePriority,
};
