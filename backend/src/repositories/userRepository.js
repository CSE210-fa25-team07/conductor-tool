/**
 * User Repository
 * 
 * Handles data persistence for users in a JSON file.
 * Provides CRUD operations for user management.
 */

import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const USERS_FILE = path.join(__dirname, "../../../database/users.json");

/**
 * Load all users from the JSON file
 * @returns {Promise<Array>} Array of user objects
 */
async function loadUsers() {
  try {
    const data = await fs.readFile(USERS_FILE, "utf8");
    return JSON.parse(data);
  } catch (error) {
    // If file doesn't exist or is empty, return empty array
    if (error.code === "ENOENT") {
      return [];
    }
    throw error;
  }
}

/**
 * Save users array to the JSON file
 * @param {Array} users - Array of user objects to save
 * @returns {Promise<void>}
 */
async function saveUsers(users) {
  await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2), "utf8");
}

/**
 * Add a new user to the database
 * @param {Object} user - User object with firstName, lastName, and email
 * @returns {Promise<Object>} The added user with generated ID
 */
async function addUser(user) {
  const users = await loadUsers();
  
  // Check if user with email already exists
  const existingUser = users.find(u => u.email === user.email);
  if (existingUser) {
    throw new Error("User with this email already exists");
  }
  
  // Add ID and timestamp
  const newUser = {
    id: Date.now().toString(),
    ...user,
    createdAt: new Date().toISOString()
  };
  
  users.push(newUser);
  await saveUsers(users);
  
  return newUser;
}

/**
 * Get a user by email address
 * @param {string} email - Email address to search for
 * @returns {Promise<Object|null>} User object or null if not found
 */
async function getUserByEmail(email) {
  const users = await loadUsers();
  return users.find(u => u.email === email) || null;
}

/**
 * Get all users
 * @returns {Promise<Array>} Array of all user objects
 */
async function getAllUsers() {
  return await loadUsers();
}

/**
 * Get a user by ID
 * @param {string} id - User ID to search for
 * @returns {Promise<Object|null>} User object or null if not found
 */
async function getUserById(id) {
  const users = await loadUsers();
  return users.find(u => u.id === id) || null;
}

export {
  addUser,
  getUserByEmail,
  getAllUsers,
  getUserById
};
