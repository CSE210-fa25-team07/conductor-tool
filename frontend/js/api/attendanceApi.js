/**
 * @fileoverview Attendance API Client
 * @module api/attendanceApi
 */

const API_BASE = "/v1/api/attendance";

async function handleResponse(response) {
  // Handle empty responses (204 No Content or empty 201)
  const contentType = response.headers.get("content-type");
  if (!contentType || !contentType.includes("application/json")) {
    if (response.ok) {
      // If status is OK but no JSON, return success
      return { success: true };
    }
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  let result;
  try {
    const text = await response.text();
    if (!text || text.trim() === "") {
      if (response.ok) {
        return { success: true };
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    result = JSON.parse(text);
  } catch (error) {
    // If parsing fails but status is OK, the meeting was likely created
    if (response.ok) {
      console.warn("Response parsing failed but status is OK:", error);
      return { success: true };
    }
    throw new Error(`Failed to parse response: ${error.message}`);
  }

  if (!response.ok) {
    throw new Error(result.error || `HTTP ${response.status}: ${response.statusText}`);
  }

  // Extract data property from response
  return result.data || result;
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
  const url = `${API_BASE}/participants/${courseUUID}`;

  const response = await fetch(url, {
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
  const url = `${API_BASE}/meeting/`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
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
  const url = `${API_BASE}/meeting/${meetingUUID}`;

  const response = await fetch(url, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json"
    },
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
  const url = `${API_BASE}/meeting/list/${courseUUID}`;

  const response = await fetch(url, {
    method: "GET",
    credentials: "include"
  });

  const data = await handleResponse(response);

  // Backend may return:
  // - An array of meetings directly
  // - An object with .data (array)
  // - An object with .meetings (array)
  if (Array.isArray(data)) {
    return data;
  }
  if (data && Array.isArray(data.data)) {
    return data.data;
  }
  if (data && Array.isArray(data.meetings)) {
    return data.meetings;
  }

  console.warn("getMeetingList: unexpected response shape", data);
  return [];
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
  const url = `/v1/api/courses/${courseUUID}/users`;

  const response = await fetch(url, {
    method: "GET",
    credentials: "include"
  });

  // Check response status before parsing
  if (!response.ok) {
    const errorText = await response.text().catch(() => "Unknown error");
    console.error("getAllCourseUsers: HTTP error", response.status, errorText);
    throw new Error(`Failed to fetch users: ${response.status} ${response.statusText}`);
  }

  const data = await handleResponse(response);

  console.log("getAllCourseUsers raw response:", data);
  console.log("getAllCourseUsers data type:", typeof data, "isArray:", Array.isArray(data));

  // Backend returns: { success: true, data: [users array] }
  // handleResponse extracts: result.data || result
  // So we should get the users array directly, or it might be wrapped
  
  // Backend may return:
  // - An array of users directly (from handleResponse extracting .data)
  // - An object with .users
  // - An object with .data (array) - if handleResponse didn't extract it
  if (Array.isArray(data)) {
    console.log("getAllCourseUsers: returning array of", data.length, "users");
    return data;
  }
  if (data && Array.isArray(data.users)) {
    console.log("getAllCourseUsers: returning data.users array of", data.users.length, "users");
    return data.users;
  }
  if (data && Array.isArray(data.data)) {
    console.log("getAllCourseUsers: returning data.data array of", data.data.length, "users");
    return data.data;
  }

  // If data is an empty object, it might mean the backend returned { success: true } without data
  if (data && typeof data === "object" && Object.keys(data).length === 0) {
    console.warn("getAllCourseUsers: received empty object, backend may have returned { success: true } without data field");
    return [];
  }

  console.warn("getAllCourseUsers: unexpected response shape", data);
  return [];
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
  const url = `/v1/api/courses/${courseUUID}/teams`;

  const response = await fetch(url, {
    method: "GET",
    credentials: "include"
  });

  const data = await handleResponse(response);

  // Backend may return:
  // - An array of teams directly
  // - An object with .teams
  // - An object with .data (array)
  if (Array.isArray(data)) {
    return data;
  }
  if (data && Array.isArray(data.teams)) {
    return data.teams;
  }
  if (data && Array.isArray(data.data)) {
    return data.data;
  }

  console.warn("getCourseTeams: unexpected response shape", data);
  return [];
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
  const url = `${API_BASE}/meeting_code/${meetingUUID}`;

  const response = await fetch(url, {
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

  // Backend route is /meeting_code/record/:code
  // Backend service expects req.params.meeting and req.params.code
  // Try query param first, backend may need it in path
  const url = `${API_BASE}/meeting_code/record/${code}?meeting=${meetingUUID}`;

  const response = await fetch(url, {
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
  const API_BASE_COURSES = "/v1/api/courses";
  const url = `${API_BASE_COURSES}/${courseUUID}`;

  const response = await fetch(url, {
    method: "GET",
    credentials: "include"
  });

  const data = await handleResponse(response);

  // Backend course API currently returns:
  // { success: true, course: { ...courseDto } }
  // Normalize to always return the course DTO object
  if (data && data.course) {
    return data.course;
  }

  // Fallback: if the DTO is returned directly, just return it
  return data;
}

/**
 * Get participants for a meeting
 * @param {string} meetingUUID - Meeting UUID
 * @param {string} courseUUID - Course UUID (optional, but recommended for authorization)
 * @returns {Promise<Array>} Array of participant objects with user info
 */
export async function getMeetingParticipants(meetingUUID, courseUUID = null) {
  const url = `/v1/api/attendance/participant/list/`;

  const requestBody = {
    meetingUUID: meetingUUID
  };
  
  // Add courseUUID if provided (helps with authorization)
  if (courseUUID) {
    requestBody.courseUUID = courseUUID;
  }

  console.log("getMeetingParticipants: requesting participants for meeting:", meetingUUID, "course:", courseUUID);
  console.log("getMeetingParticipants: request body:", requestBody);

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    credentials: "include",
    body: JSON.stringify(requestBody)
  });

  console.log("getMeetingParticipants: response status:", response.status);

  // Handle 404 gracefully (no participants found is not necessarily an error)
  if (response.status === 404) {
    console.log("getMeetingParticipants: no participants found for meeting:", meetingUUID);
    return [];
  }

  const data = await handleResponse(response);
  console.log("getMeetingParticipants: response data:", data);
  console.log("getMeetingParticipants: data type:", typeof data, "isArray:", Array.isArray(data));
  
  // Backend returns: { success: true, data: [participants] }
  // handleResponse extracts: result.data || result
  if (Array.isArray(data)) {
    console.log("getMeetingParticipants: returning array of", data.length, "participants");
    return data;
  }
  if (data && Array.isArray(data.data)) {
    console.log("getMeetingParticipants: returning data.data array of", data.data.length, "participants");
    return data.data;
  }
  if (data && Array.isArray(data.participants)) {
    console.log("getMeetingParticipants: returning data.participants array of", data.participants.length, "participants");
    return data.participants;
  }
  
  console.warn("getMeetingParticipants: unexpected response shape", data);
  return [];
}

