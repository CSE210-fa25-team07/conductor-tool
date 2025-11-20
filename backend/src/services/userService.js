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

export {
  addUser,
  getUserByEmail
};
