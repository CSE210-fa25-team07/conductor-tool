/**
 * Dashboard API functions
 * Handles class dashboard data fetching for both student and instructor views
 */

import { apiClient } from "./apiClient.js";

/**
 * Get course overview information
 * @param {string} courseUuid - Course UUID
 * @returns {Promise<Object>} Course details with term information
 */
export async function getCourseOverview(courseUuid) {
  return apiClient.get(`/api/courses/${courseUuid}/overview`);
}

/**
 * Get teaching staff and their office hours for a course
 * @param {string} courseUuid - Course UUID
 * @returns {Promise<Array>} List of staff with office hours
 */
export async function getCourseStaff(courseUuid) {
  return apiClient.get(`/api/courses/${courseUuid}/staff`);
}

/**
 * Get enrollment statistics for a course (instructor only)
 * @param {string} courseUuid - Course UUID
 * @returns {Promise<Object>} Enrollment stats (total, active, dropped, avg grade)
 */
export async function getEnrollmentStats(courseUuid) {
  return apiClient.get(`/api/courses/${courseUuid}/enrollment-stats`);
}

/**
 * Get recent student enrollments (instructor only)
 * @param {string} courseUuid - Course UUID
 * @param {number} limit - Number of recent enrollments to fetch (default 10)
 * @returns {Promise<Array>} List of recent enrollments
 */
export async function getRecentEnrollments(courseUuid, limit = 10) {
  return apiClient.get(`/api/courses/${courseUuid}/recent-enrollments?limit=${limit}`);
}

/**
 * Get current user's role in the course
 * @param {string} courseUuid - Course UUID
 * @returns {Promise<Object>} User role information
 */
export async function getUserRole(courseUuid) {
  return apiClient.get(`/api/courses/${courseUuid}/my-role`);
}

/**
 * Get user profile information including teams and staff info
 * @param {string} userUuid - User UUID
 * @returns {Promise<Object>} User profile with teams and staff information
 */
export async function getUserProfile(userUuid) {
  return apiClient.get(`/api/users/${userUuid}/profile`);
}

/**
 * Get course roster with pagination and filtering
 * @param {string} courseUuid - Course UUID
 * @param {number} page - Page number (1-indexed)
 * @param {number} limit - Items per page
 * @param {string} filter - Role filter ("all", "student", "instructor", "ta")
 * @returns {Promise<Object>} Paginated roster data
 */
export async function getCourseRoster(courseUuid, page = 1, limit = 12, filter = "all") {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    filter: filter
  });
  return apiClient.get(`/api/courses/${courseUuid}/roster?${params.toString()}`);
}
