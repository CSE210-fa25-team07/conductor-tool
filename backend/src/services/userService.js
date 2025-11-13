/**
 * User Service
 * 
 * Business logic layer for user management.
 * Validates user data and coordinates with the repository.
 */

import * as userRepository from "../repositories/userRepository.js";

/**
 * Validate user data
 * @param {Object} userData - User data to validate
 * @throws {Error} If validation fails
 * @status IN USE
 */
function validateUserData(userData) {
  const { firstName, lastName, email } = userData;
  
  if (!firstName || typeof firstName !== "string" || firstName.trim().length === 0) {
    throw new Error("First name is required and must be a non-empty string");
  }
  
  if (!lastName || typeof lastName !== "string" || lastName.trim().length === 0) {
    throw new Error("Last name is required and must be a non-empty string");
  }
  
  if (!email || typeof email !== "string") {
    throw new Error("Email is required and must be a string");
  }
  
  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new Error("Invalid email format");
  }
}

/**
 * Add a new user
 * @param {Object} userData - User data with firstName, lastName, and email
 * @returns {Promise<Object>} The created user object
 * @status IN USE
 */
async function addUser(userData) {
  // Validate input
  validateUserData(userData);
  
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
 * Get all users
 * @returns {Promise<Array>} Array of all user objects
 * @status NOT IN USE
 */
async function getAllUsers() {
  return await userRepository.getAllUsers();
}

/**
 * Get a user by ID
 * @param {string} id - User ID to search for
 * @returns {Promise<Object|null>} User object or null if not found
 * @status NOT IN USE
 */
async function getUserById(id) {
  if (!id || typeof id !== "string") {
    throw new Error("User ID is required and must be a string");
  }
  
  return await userRepository.getUserById(id);
}

export {
  addUser,
  getUserByEmail,
  getAllUsers,
  getUserById
};
