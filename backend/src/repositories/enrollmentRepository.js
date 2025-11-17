/**
 * Enrollment Repository
 *
 * Handles database operations for course enrollments.
 * Manages the relationship between users, courses, and roles.
 */

import { query } from "../utils/db.js";

/**
 * Get all enrollments for a user
 * @param {string} userUuid - User UUID
 * @returns {Promise<Array>} Array of enrollment objects with course and role details
 */
export async function getEnrollmentsByUser(userUuid) {
  const result = await query(
    `SELECT
      ce.user_uuid,
      ce.course_uuid,
      ce.role_uuid,
      ce.enrollment_status,
      ce.enrolled_at,
      ce.dropped_at,
      c.course_code,
      c.course_name,
      c.description as course_description,
      r.role as role_name,
      t.year as term_year,
      t.season as term_season,
      t.is_active as term_is_active
    FROM course_enrollment ce
    JOIN courses c ON ce.course_uuid = c.course_uuid
    JOIN role r ON ce.role_uuid = r.role_uuid
    JOIN term t ON c.term_uuid = t.term_uuid
    WHERE ce.user_uuid = $1
    ORDER BY t.year DESC, t.season, c.course_code`,
    [userUuid]
  );
  return result.rows;
}

/**
 * Get all enrollments for a course
 * @param {string} courseUuid - Course UUID
 * @returns {Promise<Array>} Array of enrollment objects with user and role details
 */
export async function getEnrollmentsByCourse(courseUuid) {
  const result = await query(
    `SELECT
      ce.user_uuid,
      ce.course_uuid,
      ce.role_uuid,
      ce.enrollment_status,
      ce.enrolled_at,
      u.email,
      u.first_name,
      u.last_name,
      u.photo_url,
      u.github_username,
      r.role as role_name
    FROM course_enrollment ce
    JOIN users u ON ce.user_uuid = u.user_uuid
    JOIN role r ON ce.role_uuid = r.role_uuid
    WHERE ce.course_uuid = $1 AND ce.enrollment_status = 'active'
    ORDER BY r.role, u.last_name, u.first_name`,
    [courseUuid]
  );
  return result.rows;
}

/**
 * Get a specific enrollment
 * @param {string} userUuid - User UUID
 * @param {string} courseUuid - Course UUID
 * @param {string} roleUuid - Role UUID
 * @returns {Promise<Object|null>} Enrollment object or null if not found
 */
export async function getEnrollment(userUuid, courseUuid, roleUuid) {
  const result = await query(
    `SELECT
      ce.*,
      c.course_code,
      c.course_name,
      r.role as role_name
    FROM course_enrollment ce
    JOIN courses c ON ce.course_uuid = c.course_uuid
    JOIN role r ON ce.role_uuid = r.role_uuid
    WHERE ce.user_uuid = $1 AND ce.course_uuid = $2 AND ce.role_uuid = $3`,
    [userUuid, courseUuid, roleUuid]
  );
  return result.rows[0] || null;
}

/**
 * Create a new enrollment
 * @param {Object} enrollmentData - Enrollment data
 * @param {string} enrollmentData.userUuid - User UUID
 * @param {string} enrollmentData.courseUuid - Course UUID
 * @param {string} enrollmentData.roleUuid - Role UUID
 * @param {string} [enrollmentData.enrollmentStatus='active'] - Enrollment status
 * @returns {Promise<Object>} Created enrollment object
 */
export async function createEnrollment(enrollmentData) {
  const { userUuid, courseUuid, roleUuid, enrollmentStatus = "active" } = enrollmentData;

  const result = await query(
    `INSERT INTO course_enrollment (user_uuid, course_uuid, role_uuid, enrollment_status)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [userUuid, courseUuid, roleUuid, enrollmentStatus]
  );
  return result.rows[0];
}

/**
 * Update enrollment status
 * @param {string} userUuid - User UUID
 * @param {string} courseUuid - Course UUID
 * @param {string} roleUuid - Role UUID
 * @param {string} status - New status
 * @returns {Promise<Object>} Updated enrollment object
 */
export async function updateEnrollmentStatus(userUuid, courseUuid, roleUuid, status) {
  const droppedAt = status === "dropped" ? "CURRENT_TIMESTAMP" : "NULL";

  const result = await query(
    `UPDATE course_enrollment
     SET enrollment_status = $4, dropped_at = ${droppedAt}
     WHERE user_uuid = $1 AND course_uuid = $2 AND role_uuid = $3
     RETURNING *`,
    [userUuid, courseUuid, roleUuid, status]
  );
  return result.rows[0];
}

/**
 * Get user's role for a specific course
 * Returns the highest priority role if user has multiple roles in the course
 * Priority: professor > ta > lead > student
 * @param {string} userUuid - User UUID
 * @param {string} courseUuid - Course UUID
 * @returns {Promise<Object|null>} Role object or null if not enrolled
 */
export async function getUserRoleInCourse(userUuid, courseUuid) {
  const result = await query(
    `SELECT
      ce.role_uuid,
      r.role as role_name,
      ce.enrollment_status
    FROM course_enrollment ce
    JOIN role r ON ce.role_uuid = r.role_uuid
    WHERE ce.user_uuid = $1 AND ce.course_uuid = $2 AND ce.enrollment_status = 'active'
    ORDER BY
      CASE r.role
        WHEN 'professor' THEN 1
        WHEN 'ta' THEN 2
        WHEN 'lead' THEN 3
        WHEN 'student' THEN 4
        WHEN 'admin' THEN 5
        ELSE 6
      END
    LIMIT 1`,
    [userUuid, courseUuid]
  );
  return result.rows[0] || null;
}

/**
 * Get all roles for a user in a course (e.g., student AND lead)
 * @param {string} userUuid - User UUID
 * @param {string} courseUuid - Course UUID
 * @returns {Promise<Array>} Array of role objects
 */
export async function getUserRolesInCourse(userUuid, courseUuid) {
  const result = await query(
    `SELECT
      ce.role_uuid,
      r.role as role_name,
      ce.enrollment_status
    FROM course_enrollment ce
    JOIN role r ON ce.role_uuid = r.role_uuid
    WHERE ce.user_uuid = $1 AND ce.course_uuid = $2 AND ce.enrollment_status = 'active'
    ORDER BY
      CASE r.role
        WHEN 'professor' THEN 1
        WHEN 'ta' THEN 2
        WHEN 'lead' THEN 3
        WHEN 'student' THEN 4
        WHEN 'admin' THEN 5
        ELSE 6
      END`,
    [userUuid, courseUuid]
  );
  return result.rows;
}

export default {
  getEnrollmentsByUser,
  getEnrollmentsByCourse,
  getEnrollment,
  createEnrollment,
  updateEnrollmentStatus,
  getUserRoleInCourse,
  getUserRolesInCourse
};
