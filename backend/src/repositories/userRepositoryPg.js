/**
 * User Repository (PostgreSQL)
 *
 * Handles database operations for users in PostgreSQL.
 * Provides CRUD operations for user management.
 */

import { query } from '../utils/db.js';

/**
 * Get all users
 * @returns {Promise<Array>} Array of user objects
 */
export async function getAllUsers() {
  const result = await query(
    `SELECT
      user_uuid,
      email,
      first_name,
      last_name,
      photo_url,
      pronouns,
      bio,
      phone_number,
      github_username,
      last_login,
      created_at,
      updated_at
    FROM users
    ORDER BY last_name, first_name`
  );
  return result.rows;
}

/**
 * Get a user by UUID
 * @param {string} userUuid - User UUID
 * @returns {Promise<Object|null>} User object or null if not found
 */
export async function getUserById(userUuid) {
  const result = await query(
    `SELECT
      user_uuid,
      email,
      first_name,
      last_name,
      photo_url,
      pronouns,
      bio,
      phone_number,
      github_username,
      last_login,
      created_at,
      updated_at
    FROM users
    WHERE user_uuid = $1`,
    [userUuid]
  );
  return result.rows[0] || null;
}

/**
 * Get a user by email
 * @param {string} email - User email
 * @returns {Promise<Object|null>} User object or null if not found
 */
export async function getUserByEmail(email) {
  const result = await query(
    `SELECT
      user_uuid,
      email,
      first_name,
      last_name,
      photo_url,
      pronouns,
      bio,
      phone_number,
      github_username,
      last_login,
      created_at,
      updated_at
    FROM users
    WHERE email = $1`,
    [email.toLowerCase()]
  );
  return result.rows[0] || null;
}

/**
 * Create a new user
 * @param {Object} userData - User data
 * @param {string} userData.email - User email
 * @param {string} userData.firstName - User first name
 * @param {string} userData.lastName - User last name
 * @param {string} [userData.photoUrl] - User photo URL
 * @param {string} [userData.pronouns] - User pronouns
 * @param {string} [userData.bio] - User bio
 * @param {string} [userData.phoneNumber] - User phone number
 * @param {string} [userData.githubUsername] - User GitHub username
 * @returns {Promise<Object>} Created user object
 */
export async function createUser(userData) {
  const {
    email,
    firstName,
    lastName,
    photoUrl,
    pronouns,
    bio,
    phoneNumber,
    githubUsername,
  } = userData;

  const result = await query(
    `INSERT INTO users (
      email, first_name, last_name, photo_url, pronouns, bio, phone_number, github_username
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING
      user_uuid,
      email,
      first_name,
      last_name,
      photo_url,
      pronouns,
      bio,
      phone_number,
      github_username,
      last_login,
      created_at,
      updated_at`,
    [email.toLowerCase(), firstName, lastName, photoUrl, pronouns, bio, phoneNumber, githubUsername]
  );
  return result.rows[0];
}

/**
 * Update a user
 * @param {string} userUuid - User UUID
 * @param {Object} userData - User data to update
 * @returns {Promise<Object>} Updated user object
 */
export async function updateUser(userUuid, userData) {
  const {
    firstName,
    lastName,
    photoUrl,
    pronouns,
    bio,
    phoneNumber,
    githubUsername,
  } = userData;

  const result = await query(
    `UPDATE users SET
      first_name = COALESCE($2, first_name),
      last_name = COALESCE($3, last_name),
      photo_url = COALESCE($4, photo_url),
      pronouns = COALESCE($5, pronouns),
      bio = COALESCE($6, bio),
      phone_number = COALESCE($7, phone_number),
      github_username = COALESCE($8, github_username),
      updated_at = CURRENT_TIMESTAMP
    WHERE user_uuid = $1
    RETURNING
      user_uuid,
      email,
      first_name,
      last_name,
      photo_url,
      pronouns,
      bio,
      phone_number,
      github_username,
      last_login,
      created_at,
      updated_at`,
    [userUuid, firstName, lastName, photoUrl, pronouns, bio, phoneNumber, githubUsername]
  );
  return result.rows[0];
}

/**
 * Update user's last login timestamp
 * @param {string} userUuid - User UUID
 * @returns {Promise<Object>} Updated user object
 */
export async function updateLastLogin(userUuid) {
  const result = await query(
    `UPDATE users SET
      last_login = CURRENT_TIMESTAMP
    WHERE user_uuid = $1
    RETURNING user_uuid, last_login`,
    [userUuid]
  );
  return result.rows[0];
}

/**
 * Delete a user
 * @param {string} userUuid - User UUID
 * @returns {Promise<boolean>} True if deleted
 */
export async function deleteUser(userUuid) {
  const result = await query(
    'DELETE FROM users WHERE user_uuid = $1',
    [userUuid]
  );
  return result.rowCount > 0;
}

/**
 * Get user with their enrollments and roles
 * @param {string} userUuid - User UUID
 * @returns {Promise<Object|null>} User object with enrollments array
 */
export async function getUserWithEnrollments(userUuid) {
  const user = await getUserById(userUuid);
  if (!user) return null;

  const enrollmentsResult = await query(
    `SELECT
      ce.course_uuid,
      ce.role_uuid,
      ce.enrollment_status,
      c.course_code,
      c.course_name,
      r.role as role_name,
      t.year as term_year,
      t.season as term_season
    FROM course_enrollment ce
    JOIN courses c ON ce.course_uuid = c.course_uuid
    JOIN role r ON ce.role_uuid = r.role_uuid
    JOIN term t ON c.term_uuid = t.term_uuid
    WHERE ce.user_uuid = $1 AND ce.enrollment_status = 'active'
    ORDER BY t.year DESC, t.season, c.course_code`,
    [userUuid]
  );

  return {
    ...user,
    enrollments: enrollmentsResult.rows,
  };
}

export default {
  getAllUsers,
  getUserById,
  getUserByEmail,
  createUser,
  updateUser,
  updateLastLogin,
  deleteUser,
  getUserWithEnrollments,
};
