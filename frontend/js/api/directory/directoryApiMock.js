/**
 * Mock Directory API - For Development Without Backend
 * Returns mock data with simulated network delays
 */

import { mockData } from "./mockData.js";

/**
 * Simulate network delay
 * @param {number} ms - Milliseconds to delay
 * @returns {Promise}
 */
function delay(ms = 300) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Get course overview information
 * @param {string} _courseUuid - Course UUID
 * @returns {Promise<Object>} Course details with term information
 */
export async function getCourseOverview(_courseUuid) {
  await delay(400);
  return mockData.courseOverview;
}

/**
 * Get teaching staff and their office hours for a course
 * @param {string} _courseUuid - Course UUID
 * @returns {Promise<Array>} List of staff with office hours
 */
export async function getCourseStaff(_courseUuid) {
  await delay(450);
  return mockData.courseStaff;
}

/**
 * Get enrollment statistics for a course (instructor only)
 * @param {string} _courseUuid - Course UUID
 * @returns {Promise<Object>} Enrollment stats (total, active, dropped, avg grade)
 */
export async function getEnrollmentStats(_courseUuid) {
  await delay(400);
  return mockData.enrollmentStats;
}

/**
 * Get recent student enrollments (instructor only)
 * @param {string} courseUuid - Course UUID
 * @param {number} limit - Number of recent enrollments to fetch (default 10)
 * @returns {Promise<Array>} List of recent enrollments
 */
export async function getRecentEnrollments(courseUuid, limit = 10) {
  await delay(380);
  return mockData.recentEnrollments.slice(0, limit);
}

/**
 * Get current user's role in the course
 * @param {string} _courseUuid - Course UUID
 * @returns {Promise<Object>} User role information
 */
export async function getUserRole(_courseUuid) {
  await delay(300);
  return mockData.userRole;
}
