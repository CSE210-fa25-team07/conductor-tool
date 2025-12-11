/**
 * @fileoverview Attendance API Client
 * @module api/attendanceApi
 */

const API_BASE = "/v1/api/attendance";

async function handleResponse(response) {
  const contentType = response.headers.get("content-type");
  if (!contentType || !contentType.includes("application/json")) {
    if (response.ok) return { success: true };
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  let result;
  try {
    const text = await response.text();
    if (!text || text.trim() === "") {
      if (response.ok) return { success: true };
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    result = JSON.parse(text);
  } catch (error) {
    if (response.ok) return { success: true };
    throw new Error(`Failed to parse response: ${error.message}`);
  }

  if (!response.ok) {
    throw new Error(result.error || `HTTP ${response.status}: ${response.statusText}`);
  }

  // Extract data property from response
  return result.data || result;
}

function normalizeArrayResponse(data) {
  if (Array.isArray(data)) return data;
  if (data?.data && Array.isArray(data.data)) return data.data;
  if (data?.users && Array.isArray(data.users)) return data.users;
  if (data?.teams && Array.isArray(data.teams)) return data.teams;
  if (data?.participants && Array.isArray(data.participants)) return data.participants;
  if (data?.meetings && Array.isArray(data.meetings)) return data.meetings;
  return [];
}

/**
 * Get all users enrolled in a course
 * @param {string} courseUUID - Course UUID
 * @returns {Promise<Array>} Array of user objects with userUuid, firstName, lastName, email
 * @throws {Error} If the endpoint doesn't exist or request fails
 *
 * Expected endpoint: GET /v1/api/attendance/participants/:courseUUID
 * Expected response format:
 * {
 *   success: true,
 *   data: [
 *     {
 *       userUuid: string,
 *       firstName: string,
 *       lastName: string,
 *       email: string
 *     }
 *   ]
 * }
 */
export async function getCourseParticipants(courseUUID) {
  const response = await fetch(`${API_BASE}/participants/${courseUUID}`, {
    method: "GET",
    credentials: "include"
  });
  return handleResponse(response);
}

/**
 * Create a meeting in the database
 * @param {Object} meetingData - Meeting data object
 * @returns {Promise<Object>} Created meeting object with UUID
 * @throws {Error} If the request fails
 */
export async function createMeeting(meetingData) {
  const response = await fetch(`${API_BASE}/meeting/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(meetingData)
  });
  return handleResponse(response);
}

/**
 * Delete a meeting from the database
 * @param {string} meetingUUID - Meeting UUID to delete
 * @param {boolean} deleteFuture - Whether to delete future recurring meetings
 * @returns {Promise<Object>} Success response
 * @throws {Error} If the request fails
 */
export async function deleteMeeting(meetingUUID, deleteFuture = false) {
  const response = await fetch(`${API_BASE}/meeting/${meetingUUID}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ deleteFuture })
  });
  return handleResponse(response);
}

/**
 * Get all meetings for a course
 * Returns meetings where the current user is either:
 * - The creator of the meeting, OR
 * - A participant in the meeting
 * This ensures all invited participants see meetings on their calendars.
 *
 * @param {string} courseUUID - Course UUID
 * @returns {Promise<Array>} Array of meeting objects
 * @throws {Error} If the request fails
 *
 * Expected endpoint: GET /v1/api/attendance/meeting/list/:courseUUID
 * Backend filters meetings to show only those where user is creator or participant
 */
export async function getMeetingList(courseUUID) {
  const response = await fetch(`${API_BASE}/meeting/list/${courseUUID}`, {
    method: "GET",
    credentials: "include"
  });
  return normalizeArrayResponse(await handleResponse(response));
}

/**
 * Get all users in a course (abstracted - endpoint doesn't exist yet)
 * @param {string} courseUUID - Course UUID
 * @returns {Promise<Array>} Array of user objects with userUuid, firstName, lastName, email, teamUuid (optional)
 * @throws {Error} If the endpoint doesn't exist or request fails
 *
 * Expected endpoint: GET /v1/api/courses/:courseUUID/users
 * Expected response format:
 * {
 *   success: true,
 *   data: [
 *     {
 *       userUuid: string,
 *       firstName: string,
 *       lastName: string,
 *       email: string,
 *       teamUuid: string | null,
 *       teamName: string | null
 *     }
 *   ]
 * }
 */
export async function getAllCourseUsers(courseUUID) {
  const response = await fetch(`/v1/api/courses/${courseUUID}/users`, {
    method: "GET",
    credentials: "include"
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch users: ${response.status} ${response.statusText}`);
  }

  const data = await handleResponse(response);
  return normalizeArrayResponse(data);
}

/**
 * Get all teams in a course (abstracted - endpoint doesn't exist yet)
 * @param {string} courseUUID - Course UUID
 * @returns {Promise<Array>} Array of team objects with teamUuid, teamName, members
 * @throws {Error} If the endpoint doesn't exist or request fails
 *
 * Expected endpoint: GET /v1/api/courses/:courseUUID/teams
 * Expected response format:
 * {
 *   success: true,
 *   data: [
 *     {
 *       teamUuid: string,
 *       teamName: string,
 *       members: [
 *         {
 *           userUuid: string,
 *           firstName: string,
 *           lastName: string,
 *           email: string
 *         }
 *       ]
 *     }
 *   ]
 * }
 */
export async function getCourseTeams(courseUUID) {
  const response = await fetch(`/v1/api/courses/${courseUUID}/teams`, {
    method: "GET",
    credentials: "include"
  });
  return normalizeArrayResponse(await handleResponse(response));
}

/**
 * Get meeting code and QR code for a meeting (creator only)
 * @param {string} meetingUUID - Meeting UUID
 * @returns {Promise<Object>} Meeting code object with qrUrl, meetingCode, etc.
 * @throws {Error} If the request fails
 *
 * Expected endpoint: GET /v1/api/attendance/meeting_code/:meetingUUID
 * Expected response format:
 * {
 *   success: true,
 *   data: {
 *     meetingCode: string,
 *     qrUrl: string,
 *     meetingUuid: string,
 *     validStartDatetime: string,
 *     validEndDatetime: string
 *   }
 * }
 */
export async function getMeetingCode(meetingUUID) {
  const response = await fetch(`${API_BASE}/meeting_code/${meetingUUID}`, {
    method: "GET",
    credentials: "include"
  });
  return handleResponse(response);
}

/**
 * Record attendance using meeting code (participant)
 * @param {string} meetingUUID - Meeting UUID
 * @param {string} code - Meeting code (alphanumeric)
 * @returns {Promise<Object>} Success response with participant data
 * @throws {Error} If the request fails or time window is invalid
 *
 * Expected endpoint: GET /v1/api/attendance/meeting_code/record/:code
 * Backend expects meetingUUID in req.params.meeting (may need to be in path or query)
 * Backend validates:
 * - User is a participant of the meeting
 * - Code is valid for the meeting
 * - Current time is within meeting start/end time window
 *
 * Expected response format:
 * {
 *   success: true,
 *   data: {
 *     participantUUID: string,
 *     meetingUUID: string,
 *     userUUID: string,
 *     status: string,
 *     checkInTime: string,
 *     ...
 *   }
 * }
 */
export async function recordAttendanceByCode(meetingUUID, code) {
  if (!meetingUUID || !code) {
    throw new Error("Meeting UUID and code are required");
  }

  const response = await fetch(`${API_BASE}/meeting_code/record/${meetingUUID}/${code}`, {
    method: "GET",
    credentials: "include"
  });
  return handleResponse(response);
}

/**
 * Get course details including term start and end dates (abstracted - endpoint doesn't exist yet)
 * @param {string} courseUUID - Course UUID
 * @returns {Promise<Object>} Course object with term dates
 * @throws {Error} If the request fails
 *
 * Expected endpoint: GET /v1/api/courses/:courseUUID
 * Expected response format:
 * {
 *   success: true,
 *   data: {
 *     courseUuid: string,
 *     courseCode: string,
 *     courseName: string,
 *     term: {
 *       startDate: string (ISO date),
 *       endDate: string (ISO date)
 *     }
 *   }
 * }
 */
export async function getCourseDetails(courseUUID) {
  const response = await fetch(`/v1/api/courses/${courseUUID}`, {
    method: "GET",
    credentials: "include"
  });
  const data = await handleResponse(response);
  return data?.course || data;
}

/**
 * Get participants for a meeting
 * @param {string} meetingUUID - Meeting UUID
 * @param {string} courseUUID - Course UUID (optional, but recommended for authorization)
 * @returns {Promise<Array>} Array of participant objects with user info
 */
export async function getMeetingParticipants(meetingUUID, courseUUID = null) {
  const requestBody = { meetingUUID };
  if (courseUUID) requestBody.courseUUID = courseUUID;

  const response = await fetch("/v1/api/attendance/participant/list/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(requestBody)
  });

  if (response.status === 404) return [];
  return normalizeArrayResponse(await handleResponse(response));
}
