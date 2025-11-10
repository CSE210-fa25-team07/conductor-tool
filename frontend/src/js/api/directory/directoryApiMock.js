/**
 * Mock Directory API - For Development Without Backend
 * Returns mock data with simulated network delays
 */

import { mockData } from './mockData.js';

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
 * @param {string} courseUuid - Course UUID
 * @returns {Promise<Object>} Course details with term information
 */
export async function getCourseOverview(courseUuid) {
  await delay(400);
  return mockData.courseOverview;
}

/**
 * Get student's overall grade for a course
 * @param {string} courseUuid - Course UUID
 * @returns {Promise<Object>} Current and final grades
 */
export async function getStudentGrade(courseUuid) {
  await delay(350);
  return mockData.studentGrade;
}

/**
 * Get student's assignment grades for a course
 * @param {string} courseUuid - Course UUID
 * @returns {Promise<Array>} List of assignments with grades
 */
export async function getStudentAssignments(courseUuid) {
  await delay(500);
  return mockData.studentAssignments;
}

/**
 * Get teaching staff and their office hours for a course
 * @param {string} courseUuid - Course UUID
 * @returns {Promise<Array>} List of staff with office hours
 */
export async function getCourseStaff(courseUuid) {
  await delay(450);
  return mockData.courseStaff;
}

/**
 * Get enrollment statistics for a course (instructor only)
 * @param {string} courseUuid - Course UUID
 * @returns {Promise<Object>} Enrollment stats (total, active, dropped, avg grade)
 */
export async function getEnrollmentStats(courseUuid) {
  await delay(400);
  return mockData.enrollmentStats;
}

/**
 * Get assignment statistics for a course (instructor only)
 * @param {string} courseUuid - Course UUID
 * @returns {Promise<Array>} List of assignments with submission/grade statistics
 */
export async function getAssignmentStats(courseUuid) {
  await delay(550);
  return mockData.assignmentStats;
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
 * @param {string} courseUuid - Course UUID
 * @returns {Promise<Object>} User role information
 */
export async function getUserRole(courseUuid) {
  await delay(300);
  return mockData.userRole;
}
