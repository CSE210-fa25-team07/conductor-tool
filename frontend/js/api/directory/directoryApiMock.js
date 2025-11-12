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

/**
 * Get user profile information including teams and staff info
 * @param {string} userUuid - User UUID
 * @returns {Promise<Object>} User profile with teams and staff information
 */
export async function getUserProfile(userUuid) {
  await delay(450);

  // Return specific profile based on UUID
  const profileMap = {
    "staff-1-uuid": mockData.userProfileStaff1,
    "staff-2-uuid": mockData.userProfileStaff2,
    "staff-3-uuid": mockData.userProfileStaff3,
    "student-1-uuid": mockData.userProfileStudent,
    "student-2-uuid": mockData.userProfileStudent2,
    "student-3-uuid": mockData.userProfileStudent3,
    "student-4-uuid": mockData.userProfileStudent4,
    "student-5-uuid": mockData.userProfileStudent5,
    "student-6-uuid": mockData.userProfileStudent6,
    "student-7-uuid": mockData.userProfileStudent7,
    "student-8-uuid": mockData.userProfileStudent8,
    "student-9-uuid": mockData.userProfileStudent9,
    "student-10-uuid": mockData.userProfileStudent10,
    "student-11-uuid": mockData.userProfileStudent11,
    "student-12-uuid": mockData.userProfileStudent12,
    "student-13-uuid": mockData.userProfileStudent13,
    "student-14-uuid": mockData.userProfileStudent14,
    "student-15-uuid": mockData.userProfileStudent15
  };

  // Return specific profile if exists, otherwise return default based on type
  if (profileMap[userUuid]) {
    return profileMap[userUuid];
  }

  // Fallback: return default profile based on UUID pattern
  if (userUuid.includes("staff")) {
    return mockData.userProfileStaff1;
  }

  return mockData.userProfileStudent;
}

/**
 * Get course roster with pagination and filtering
 * @param {string} _courseUuid - Course UUID
 * @param {number} page - Page number (1-indexed)
 * @param {number} limit - Items per page
 * @param {string} filter - Role filter ("all", "student", "instructor", "ta")
 * @returns {Promise<Object>} Paginated roster data with counts
 */
export async function getCourseRoster(_courseUuid, page = 1, limit = 12, filter = "all") {
  await delay(400);

  // Get all users from roster
  let allUsers = [...mockData.courseRoster.users];

  // Apply filter
  let filteredUsers = allUsers;
  if (filter !== "all") {
    filteredUsers = allUsers.filter(user => user.role === filter);
  }

  // Calculate counts for filter buttons
  const counts = {
    all: allUsers.length,
    students: allUsers.filter(u => u.role === "student").length,
    instructors: allUsers.filter(u => u.role === "instructor").length,
    tas: allUsers.filter(u => u.role === "ta").length
  };

  // Calculate pagination
  const totalCount = filteredUsers.length;
  const totalPages = Math.ceil(totalCount / limit);
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;

  // Get page of users
  const pageUsers = filteredUsers.slice(startIndex, endIndex);

  return {
    course_name: mockData.courseRoster.course_name,
    course_uuid: mockData.courseRoster.course_uuid,
    users: pageUsers,
    page: page,
    limit: limit,
    total_count: totalCount,
    total_pages: totalPages,
    counts: counts
  };
}
