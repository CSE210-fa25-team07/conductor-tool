/**
 * Dashboard API functions
 * Handles class dashboard data fetching for both student and instructor views
 */

import { apiClient } from './apiClient.js';

/**
 * Get course overview information
 * @param {string} courseUuid - Course UUID
 * @returns {Promise<Object>} Course details with term information
 */
export async function getCourseOverview(courseUuid) {
  return apiClient.get(`/api/courses/${courseUuid}/overview`);
}

/**
 * Get student's overall grade for a course
 * @param {string} courseUuid - Course UUID
 * @returns {Promise<Object>} Current and final grades
 */
export async function getStudentGrade(courseUuid) {
  return apiClient.get(`/api/courses/${courseUuid}/my-grade`);
}

/**
 * Get student's assignment grades for a course
 * @param {string} courseUuid - Course UUID
 * @returns {Promise<Array>} List of assignments with grades
 */
export async function getStudentAssignments(courseUuid) {
  return apiClient.get(`/api/courses/${courseUuid}/my-assignments`);
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
 * Get assignment statistics for a course (instructor only)
 * @param {string} courseUuid - Course UUID
 * @returns {Promise<Array>} List of assignments with submission/grade statistics
 */
export async function getAssignmentStats(courseUuid) {
  return apiClient.get(`/api/courses/${courseUuid}/assignment-stats`);
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
