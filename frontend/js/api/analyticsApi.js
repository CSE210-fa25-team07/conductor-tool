/**
 * @fileoverview Analytics API Client
 * @module api/analyticsApi
 */

const API_BASE = "/v1/api/attendance/analytics";

async function handleResponse(response) {
  const contentType = response.headers.get("content-type");
  if (!contentType || !contentType.includes("application/json")) {
    if (response.ok) {
      return { success: true };
    }
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  let result;
  const text = await response.text();
  try {
    if (!text || text.trim() === "") {
      if (response.ok) {
        return { success: true };
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    result = JSON.parse(text);
  } catch (error) {
    if (response.ok) {
      return { success: true };
    }
    throw new Error(`Failed to parse response: ${error.message}`);
  }

  if (!response.ok) {
    throw new Error(result.error || `HTTP ${response.status}: ${response.statusText}`);
  }

  return result.data || result;
}

/**
 * Get student analytics (user analytics)
 * @param {Object} params - { courseUuid, userUuid?, startDate?, endDate? }
 * @returns {Promise<Object>} Student analytics DTO
 * DTO: { userUuid, courseUuid, attendanceByType: [{meetingType, totalMeetings, attended, percentage}] }
 */
export async function getUserAnalytics({ courseUuid, userUuid, startDate, endDate }) {
  const urlParams = new URLSearchParams({ courseUuid });
  if (userUuid) urlParams.append("userUuid", userUuid);
  if (startDate) urlParams.append("startDate", startDate);
  if (endDate) urlParams.append("endDate", endDate);

  const response = await fetch(`${API_BASE}/student?${urlParams.toString()}`, {
    method: "GET",
    credentials: "include"
  });

  return handleResponse(response);
}

/**
 * Get instructor analytics (class analytics)
 * @param {Object} params - { courseUuid, startDate?, endDate?, meetingType?, teamUuid? }
 * @returns {Promise<Object>} Instructor analytics DTO
 * DTO: { courseUuid, timeline: [{date, meetingType, meetingTitle, totalParticipants, attended, attendancePercentage}] }
 */
export async function getInstructorAnalytics({ courseUuid, startDate, endDate, meetingType, teamUuid }) {
  const urlParams = new URLSearchParams({ courseUuid });
  if (startDate) urlParams.append("startDate", startDate);
  if (endDate) urlParams.append("endDate", endDate);
  if (meetingType) urlParams.append("meetingType", meetingType);
  if (teamUuid) urlParams.append("teamUuid", teamUuid);

  const response = await fetch(`${API_BASE}/instructor?${urlParams.toString()}`, {
    method: "GET",
    credentials: "include"
  });

  return handleResponse(response);
}

export async function getCourseTeams(courseUuid) {
  const url = `/v1/api/courses/${courseUuid}/teams`;
  const response = await fetch(url, {
    method: "GET",
    credentials: "include"
  });
  const data = await handleResponse(response);
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.teams)) return data.teams;
  if (data && Array.isArray(data.data)) return data.data;
  return [];
}
