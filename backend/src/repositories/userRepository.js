/**
 * User Repository
 *
 * Handles data persistence for users in a JSON file.
 * Provides CRUD operations for user management.
 */

import { getPrisma } from "../utils/db.js";

const prisma = getPrisma();

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

/**
 * Get all users from the database
 * @returns {Promise<Array>} Array of all users
 * @status DEV ONLY - For development login selection
 */
async function getAllUsers() {
  const users = await prisma.user.findMany({
    select: {
      userUuid: true,
      email: true,
      firstName: true,
      lastName: true
    },
    orderBy: {
      email: "asc"
    }
  });
  return users;
}

/**
 * Get a user by UUID
 * @param {string} userUuid - User UUID to search for
 * @returns {Promise<Object|null>} User object or null if not found
 * @status DEV ONLY - For development login selection
 */
async function getUserByUuid(userUuid) {
  const user = await prisma.user.findUnique({
    where: { userUuid: userUuid }
  });
  return user;
}

/**
 * Get user staff status by UUID
 * @param {string} userUuid - User UUID to search for
 * @returns {Promise<Object>} Object containing isProf, isSystemAdmin, and isLeadAdmin flags
 * @status IN USE
 */
async function getUserStatusByUuid(userUuid) {
  const staff = await prisma.staff.findUnique({
    where: { userUuid: userUuid }
  });

  if (!staff) {
    return {
      isProf: false,
      isSystemAdmin: false,
      isLeadAdmin: false
    };
  }

  return {
    isProf: staff.isProf || false,
    isSystemAdmin: staff.isSystemAdmin || false,
    isLeadAdmin: staff.is_lead_admin || false
  };
}

export { addUser, getUserByEmail, getAllUsers, getUserByUuid, getUserStatusByUuid };
