/**
 * User Repository
 *
 * Handles data persistence for users in a JSON file.
 * Provides CRUD operations for user management.
 */

import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { getPrisma } from '../utils/db.js';

const prisma = getPrisma();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const USERS_FILE = path.join(__dirname, "../../../database/users.json");

/**
 * Add a new user to the database
 * @param {Object} user - User object with firstName, lastName, and email
 * @returns {Promise<Object>} The added user
 * @status IN USE
 */
async function addUser(user) {
  // Check if user with email already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: user.email }
  });
  
  if (existingUser) {
    throw new Error("User with this email already exists");
  }

  const newUser = await prisma.user.create({
    data: {
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName
    }
  });

  return newUser;
}

/**
 * Get a user by email address
 * @param {string} email - Email address to search for
 * @returns {Promise<Object|null>} User object or null if not found
 * @status IN USE
 */
async function getUserByEmail(email) {
  const user = await prisma.user.findUnique({
    where: { email: email }
  });
  return user;
}

export {
  addUser,
  getUserByEmail
};
