/**
 * Enrollment Service
 *
 * Business logic layer for course enrollment management.
 * Manages user enrollments, roles, and permissions.
 */

import * as enrollmentRepository from '../repositories/enrollmentRepository.js';
import * as userRepository from '../repositories/userRepositoryPg.js';
import * as roleRepository from '../repositories/roleRepository.js';

/**
 * Get all enrollments for a user with their roles
 * @param {string} userUuid - User UUID
 * @returns {Promise<Object>} User with enrollments organized by course
 */
export async function getUserEnrollments(userUuid) {
  if (!userUuid || typeof userUuid !== 'string') {
    throw new Error('User ID is required and must be a string');
  }

  const enrollments = await enrollmentRepository.getEnrollmentsByUser(userUuid);

  // Organize enrollments by course
  const rolesByCourse = {};

  for (const enrollment of enrollments) {
    if (!rolesByCourse[enrollment.course_uuid]) {
      rolesByCourse[enrollment.course_uuid] = {
        courseUuid: enrollment.course_uuid,
        courseCode: enrollment.course_code,
        courseName: enrollment.course_name,
        courseDescription: enrollment.course_description,
        termYear: enrollment.term_year,
        termSeason: enrollment.term_season,
        isActiveTerm: enrollment.term_is_active,
        roles: [],
      };
    }

    rolesByCourse[enrollment.course_uuid].roles.push({
      roleUuid: enrollment.role_uuid,
      roleName: enrollment.role_name,
      enrollmentStatus: enrollment.enrollment_status,
      enrolledAt: enrollment.enrolled_at,
    });
  }

  return {
    userUuid,
    rolesByCourse,
  };
}

/**
 * Get user's active role for a specific course
 * Returns highest priority role if user has multiple roles
 * @param {string} userUuid - User UUID
 * @param {string} courseUuid - Course UUID
 * @returns {Promise<Object|null>} Role object or null if not enrolled
 */
export async function getUserRoleInCourse(userUuid, courseUuid) {
  if (!userUuid || !courseUuid) {
    throw new Error('User ID and Course ID are required');
  }

  return await enrollmentRepository.getUserRoleInCourse(userUuid, courseUuid);
}

/**
 * Get all roles for a user in a course
 * @param {string} userUuid - User UUID
 * @param {string} courseUuid - Course UUID
 * @returns {Promise<Array>} Array of role objects
 */
export async function getUserRolesInCourse(userUuid, courseUuid) {
  if (!userUuid || !courseUuid) {
    throw new Error('User ID and Course ID are required');
  }

  return await enrollmentRepository.getUserRolesInCourse(userUuid, courseUuid);
}

/**
 * Get all students enrolled in a course
 * @param {string} courseUuid - Course UUID
 * @returns {Promise<Array>} Array of student user objects
 */
export async function getCourseStudents(courseUuid) {
  if (!courseUuid) {
    throw new Error('Course ID is required');
  }

  const enrollments = await enrollmentRepository.getEnrollmentsByCourse(courseUuid);
  return enrollments.filter(e => e.role_name === 'student');
}

/**
 * Get all TAs for a course
 * @param {string} courseUuid - Course UUID
 * @returns {Promise<Array>} Array of TA user objects
 */
export async function getCourseTAs(courseUuid) {
  if (!courseUuid) {
    throw new Error('Course ID is required');
  }

  const enrollments = await enrollmentRepository.getEnrollmentsByCourse(courseUuid);
  return enrollments.filter(e => e.role_name === 'ta');
}

/**
 * Get all professors for a course
 * @param {string} courseUuid - Course UUID
 * @returns {Promise<Array>} Array of professor user objects
 */
export async function getCourseProfessors(courseUuid) {
  if (!courseUuid) {
    throw new Error('Course ID is required');
  }

  const enrollments = await enrollmentRepository.getEnrollmentsByCourse(courseUuid);
  return enrollments.filter(e => e.role_name === 'professor');
}

/**
 * Get all team leads for a course
 * @param {string} courseUuid - Course UUID
 * @returns {Promise<Array>} Array of lead user objects
 */
export async function getCourseLeads(courseUuid) {
  if (!courseUuid) {
    throw new Error('Course ID is required');
  }

  const enrollments = await enrollmentRepository.getEnrollmentsByCourse(courseUuid);
  return enrollments.filter(e => e.role_name === 'lead');
}

/**
 * Enroll a user in a course with a specific role
 * @param {Object} enrollmentData - Enrollment data
 * @param {string} enrollmentData.userUuid - User UUID
 * @param {string} enrollmentData.courseUuid - Course UUID
 * @param {string} enrollmentData.roleName - Role name
 * @returns {Promise<Object>} Created enrollment
 */
export async function enrollUser(enrollmentData) {
  const { userUuid, courseUuid, roleName } = enrollmentData;

  if (!userUuid || !courseUuid || !roleName) {
    throw new Error('User ID, Course ID, and Role Name are required');
  }

  // Verify user exists
  const user = await userRepository.getUserById(userUuid);
  if (!user) {
    throw new Error(`User with ID ${userUuid} not found`);
  }

  // Get role by name
  const role = await roleRepository.getRoleByName(roleName);
  if (!role) {
    throw new Error(`Role '${roleName}' not found`);
  }

  // Check if enrollment already exists
  const existing = await enrollmentRepository.getEnrollment(userUuid, courseUuid, role.role_uuid);
  if (existing) {
    throw new Error('User is already enrolled in this course with this role');
  }

  // Create enrollment
  return await enrollmentRepository.createEnrollment({
    userUuid,
    courseUuid,
    roleUuid: role.role_uuid,
  });
}

/**
 * Check if user has permission for a specific role in a course
 * @param {string} userUuid - User UUID
 * @param {string} courseUuid - Course UUID
 * @param {string} requiredRole - Required role name (or array of names)
 * @returns {Promise<boolean>} True if user has permission
 */
export async function userHasRole(userUuid, courseUuid, requiredRole) {
  const userRole = await getUserRoleInCourse(userUuid, courseUuid);
  if (!userRole) return false;

  if (Array.isArray(requiredRole)) {
    return requiredRole.includes(userRole.role_name);
  }

  return userRole.role_name === requiredRole;
}

/**
 * Check if user is a professor or TA in a course
 * @param {string} userUuid - User UUID
 * @param {string} courseUuid - Course UUID
 * @returns {Promise<boolean>} True if user is professor or TA
 */
export async function userIsInstructor(userUuid, courseUuid) {
  return await userHasRole(userUuid, courseUuid, ['professor', 'ta']);
}

export default {
  getUserEnrollments,
  getUserRoleInCourse,
  getUserRolesInCourse,
  getCourseStudents,
  getCourseTAs,
  getCourseProfessors,
  getCourseLeads,
  enrollUser,
  userHasRole,
  userIsInstructor,
};
