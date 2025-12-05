/**
 * @module user-management/service
 * User Service
 *
 * Business logic layer for user management.
 */

import * as userRepository from "../repositories/userRepository.js";
import * as userValidator from "../validators/userValidator.js";

/**
 * Add a new user
 * @param {Object} userData - User data with firstName, lastName, and email
 * @returns {Promise<Object>} The created user object
 * @status IN USE
 */
async function addUser(userData) {
  // Validate input
  userValidator.validateUserData(userData);

  // Normalize data
  const normalizedUser = {
    firstName: userData.firstName.trim(),
    lastName: userData.lastName.trim(),
    email: userData.email.trim().toLowerCase()
  };

  // Delegate to repository
  return await userRepository.addUser(normalizedUser);
}

/**
 * Get a user by email
 * @param {string} email - Email address to search for
 * @returns {Promise<Object|null>} User object or null if not found
 * @status IN USE
 */
async function getUserByEmail(email) {
  if (!email || typeof email !== "string") {
    throw new Error("Email is required and must be a string");
  }

  const normalizedEmail = email.trim().toLowerCase();
  return await userRepository.getUserByEmail(normalizedEmail);
}


/**
 * Get user photo URL by UUID
 * @param {string} userUuid - User UUID to search for
 * @returns {Promise<string|null>} Photo URL or null if not found
 * @status IN USE
 */
async function getUserPhotoUrl(userUuid) {
  if (!userUuid || typeof userUuid !== "string") {
    throw new Error("User UUID is required");
  }

  const user = await userRepository.getUserByUuid(userUuid);
  return user?.photoUrl || null;
}

/**
 * Add a new user with staff status (admin function)
 * @param {Object} userData - User data with firstName, lastName, email, isProf, isSystemAdmin
 * @returns {Promise<Object>} The created user object
 * @status IN USE
 */
async function addUserWithStaffStatus(userData) {
  // Validate input
  userValidator.validateUserData(userData);

  // Normalize data
  const normalizedUser = {
    firstName: userData.firstName.trim(),
    lastName: userData.lastName.trim(),
    email: userData.email.trim().toLowerCase()
  };

  const staffStatus = {
    isProf: userData.isProf || false,
    isSystemAdmin: userData.isSystemAdmin || false
  };

  // Delegate to repository
  return await userRepository.addUserWithStaffStatus(normalizedUser, staffStatus);
}

export {
  addUser,
  getUserByEmail,
  getUserPhotoUrl,
  addUserWithStaffStatus
};
