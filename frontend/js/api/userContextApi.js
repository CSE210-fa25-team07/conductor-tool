/**
 * @fileoverview User Context API Client
 * @module api/userContextApi
 */

const API_BASE = "/v1/api/user-context";

async function handleResponse(response) {
  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || `HTTP ${response.status}: ${response.statusText}`);
  }

  // Extract data property from response
  return result.data;
}

export async function getUserContext(courseId = null) {
  const url = courseId
    ? `${API_BASE}?courseId=${courseId}`
    : API_BASE;

  const response = await fetch(url, {
    method: "GET",
    credentials: "include"
  });

  return handleResponse(response);
}
