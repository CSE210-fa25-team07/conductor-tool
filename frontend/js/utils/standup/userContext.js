/**
 * @fileoverview User Context and Session Management
 * @module utils/userContext
 */

import { getUserContext as fetchUserContext } from "../../api/userContextApi.js";

let userContext = null;

export async function loadUserContext(courseId = null) {
  try {
    const data = await fetchUserContext(courseId);
    userContext = data;
    return userContext;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Failed to load user context:", error);
    throw error;
  }
}

export function getCurrentUser() {
  return userContext?.user || null;
}

export function getActiveCourse() {
  return userContext?.activeCourse || null;
}

export function getEnrolledCourses() {
  return userContext?.enrolledCourses || [];
}

export function getUserTeams() {
  return userContext?.teams || [];
}

export function getUserRoleInCourse(courseId) {
  const course = userContext?.enrolledCourses?.find(c => c.courseUuid === courseId);
  return course?.role || null;
}

export function isStaff() {
  return userContext?.user?.isStaff || false;
}

export function isSystemAdmin() {
  return userContext?.user?.isSystemAdmin || false;
}

export function isProfessorOrTA(courseId = null) {
  const targetCourseId = courseId || userContext?.activeCourse?.courseUuid;

  if (!targetCourseId) {
    return false;
  }

  const role = getUserRoleInCourse(targetCourseId);
  return role === "Professor" || role === "TA";
}

export function isStudent(courseId = null) {
  const targetCourseId = courseId || userContext?.activeCourse?.courseUuid;

  if (!targetCourseId) {
    return false;
  }

  const role = getUserRoleInCourse(targetCourseId);
  return role === "Student";
}

export function getTeamForCourse(courseId) {
  return userContext?.teams?.find(t => t.courseUuid === courseId) || null;
}

export function hasLoadedContext() {
  return userContext !== null;
}

export function clearUserContext() {
  userContext = null;
}
