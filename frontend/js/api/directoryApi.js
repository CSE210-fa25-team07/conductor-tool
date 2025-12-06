/**
 * @fileoverview Directory API Client
 * @module api/directoryApi
 */

const API_BASE = "/v1/api/directory";

async function handleResponse(response) {
  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || "HTTP " + response.status + ": " + response.statusText);
  }

  return result.data;
}

/**
 * Get course overview
 * @param {string} courseUuid - Course UUID
 * @returns {Promise<Object>} Course overview data
 */
export async function getCourseOverview(courseUuid) {
  const response = await fetch(API_BASE + "/courses/" + courseUuid, {
    method: "GET",
    credentials: "include"
  });

  return handleResponse(response);
}

/**
 * Get course staff
 * @param {string} courseUuid - Course UUID
 * @returns {Promise<Array>} List of staff members
 */
export async function getCourseStaff(courseUuid) {
  const response = await fetch(API_BASE + "/courses/" + courseUuid + "/staff", {
    method: "GET",
    credentials: "include"
  });

  return handleResponse(response);
}


/**
 * Get course roster with pagination
 * @param {string} courseUuid - Course UUID
 * @param {Object} options - Query options
 * @param {number} options.page - Page number (default 1)
 * @param {number} options.limit - Items per page (default 20)
 * @param {string} options.filter - Role filter ("all", "student", "instructor", "ta")
 * @returns {Promise<Object>} Paginated roster data
 */
export async function getCourseRoster(courseUuid, options = {}) {
  const params = new URLSearchParams();

  if (options.page) params.append("page", options.page);
  if (options.limit) params.append("limit", options.limit);
  if (options.filter) params.append("filter", options.filter);

  const response = await fetch(API_BASE + "/courses/" + courseUuid + "/roster?" + params.toString(), {
    method: "GET",
    credentials: "include"
  });

  return handleResponse(response);
}

/**
 * Get course teams with pagination
 * @param {string} courseUuid - Course UUID
 * @param {Object} options - Query options
 * @param {number} options.page - Page number (default 1)
 * @param {number} options.limit - Items per page (default 20)
 * @returns {Promise<Object>} Paginated teams data
 */
export async function getCourseTeams(courseUuid, options = {}) {
  const params = new URLSearchParams();

  if (options.page) params.append("page", options.page);
  if (options.limit) params.append("limit", options.limit);

  const response = await fetch(API_BASE + "/courses/" + courseUuid + "/teams?" + params.toString(), {
    method: "GET",
    credentials: "include"
  });

  return handleResponse(response);
}

/**
 * Get user profile
 * @param {string} userUuid - User UUID
 * @returns {Promise<Object>} User profile data
 */
export async function getUserProfile(userUuid) {
  const response = await fetch(API_BASE + "/users/" + userUuid, {
    method: "GET",
    credentials: "include"
  });

  return handleResponse(response);
}

/**
 * Get team profile
 * @param {string} teamUuid - Team UUID
 * @returns {Promise<Object>} Team profile data
 */
export async function getTeamProfile(teamUuid) {
  const response = await fetch(API_BASE + "/teams/" + teamUuid, {
    method: "GET",
    credentials: "include"
  });

  return handleResponse(response);
}


/**
 * Update course links (professor only)
 * @param {string} courseUuid - Course UUID
 * @param {Object} linksData - Links data to update
 * @param {string} linksData.syllabusUrl - Syllabus URL
 * @param {string} linksData.canvasUrl - Canvas URL
 * @returns {Promise<Object>} Updated course data
 */
export async function updateCourseLinks(courseUuid, linksData) {
  const response = await fetch(API_BASE + "/courses/" + courseUuid + "/links", {
    method: "PUT",
    credentials: "include",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(linksData)
  });

  return handleResponse(response);
}

/**
 * Update team links (team leader only)
 * @param {string} teamUuid - Team UUID
 * @param {Object} linksData - Links data to update
 * @param {string} linksData.teamPageUrl - Team page URL
 * @param {string} linksData.repoUrl - Repository URL
 * @returns {Promise<Object>} Updated team data
 */
export async function updateTeamLinks(teamUuid, linksData) {
  const response = await fetch(API_BASE + "/teams/" + teamUuid + "/links", {
    method: "PUT",
    credentials: "include",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(linksData)
  });

  return handleResponse(response);
}
