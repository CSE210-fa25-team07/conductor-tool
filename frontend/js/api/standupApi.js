/**
 * @fileoverview Standup API Client
 * @module api/standupApi
 */

const API_BASE = "/v1/api/standups";

async function handleResponse(response) {
  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || `HTTP ${response.status}: ${response.statusText}`);
  }

  // Extract data property from response
  return result.data;
}

export async function createStandup(standupData) {
  const response = await fetch(API_BASE, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(standupData)
  });

  return handleResponse(response);
}

export async function getUserStandups(filters = {}) {
  const params = new URLSearchParams();

  if (filters.courseUuid) params.append("courseUuid", filters.courseUuid);
  if (filters.teamUuid) params.append("teamUuid", filters.teamUuid);
  if (filters.startDate) params.append("startDate", filters.startDate);
  if (filters.endDate) params.append("endDate", filters.endDate);

  const url = `${API_BASE}/me?${params.toString()}`;

  const response = await fetch(url, {
    method: "GET",
    credentials: "include"
  });

  return handleResponse(response);
}

export async function updateStandup(standupId, standupData) {
  const response = await fetch(`${API_BASE}/${standupId}`, {
    method: "PUT",
    credentials: "include",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(standupData)
  });

  return handleResponse(response);
}

export async function deleteStandup(standupId) {
  const response = await fetch(`${API_BASE}/${standupId}`, {
    method: "DELETE",
    credentials: "include"
  });

  return handleResponse(response);
}

export async function getTeamStandups(teamId, filters = {}) {
  const params = new URLSearchParams();

  if (filters.startDate) params.append("startDate", filters.startDate);
  if (filters.endDate) params.append("endDate", filters.endDate);

  const url = `${API_BASE}/team/${teamId}?${params.toString()}`;

  const response = await fetch(url, {
    method: "GET",
    credentials: "include"
  });

  return handleResponse(response);
}

export async function getTAOverview(courseId, filters = {}) {
  const params = new URLSearchParams();
  params.append("courseId", courseId);

  if (filters.startDate) params.append("startDate", filters.startDate);
  if (filters.endDate) params.append("endDate", filters.endDate);

  const url = `${API_BASE}/ta/overview?${params.toString()}`;

  const response = await fetch(url, {
    method: "GET",
    credentials: "include"
  });

  return handleResponse(response);
}
