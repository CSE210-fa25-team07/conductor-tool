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

export async function getCourseParticipants(courseUUID) {
  const response = await fetch(`${API_BASE}/participants/${courseUUID}`, {
    method: "GET",
    credentials: "include"
  });
  return handleResponse(response);
}

export async function createMeeting(meetingData) {
  const response = await fetch(`${API_BASE}/meeting/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(meetingData)
  });
  return handleResponse(response);
}

export async function deleteMeeting(meetingUUID, deleteFuture = false) {
  const response = await fetch(`${API_BASE}/meeting/${meetingUUID}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ deleteFuture })
  });
  return handleResponse(response);
}

export async function getMeetingList(courseUUID) {
  const response = await fetch(`${API_BASE}/meeting/list/${courseUUID}`, {
    method: "GET",
    credentials: "include"
  });
  return normalizeArrayResponse(await handleResponse(response));
}

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

export async function getCourseTeams(courseUUID) {
  const response = await fetch(`/v1/api/courses/${courseUUID}/teams`, {
    method: "GET",
    credentials: "include"
  });
  return normalizeArrayResponse(await handleResponse(response));
}

export async function getMeetingCode(meetingUUID) {
  const response = await fetch(`${API_BASE}/meeting_code/${meetingUUID}`, {
    method: "GET",
    credentials: "include"
  });
  return handleResponse(response);
}

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

export async function getCourseDetails(courseUUID) {
  const response = await fetch(`/v1/api/courses/${courseUUID}`, {
    method: "GET",
    credentials: "include"
  });
  const data = await handleResponse(response);
  return data?.course || data;
}

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

