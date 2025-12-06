/**
 * @fileoverview GitHub API Client
 * @module api/githubApi
 */

const API_BASE = "/v1/api/github";

/**
 * Handle API response
 * @param {Response} response - Fetch response
 * @returns {Promise<Object>} Response data
 */
async function handleResponse(response) {
  const result = await response.json();

  if (!response.ok) {
    const error = new Error(result.error?.message || `HTTP ${response.status}`);
    error.code = result.error?.code;
    throw error;
  }

  return result.data;
}

/**
 * Get GitHub connection status for current user
 * @returns {Promise<{connected: boolean, username: string|null}>}
 */
export async function getGitHubStatus() {
  const response = await fetch(`${API_BASE}/status`, {
    method: "GET",
    credentials: "include"
  });

  return handleResponse(response);
}

/**
 * Get formatted GitHub activity for standup auto-populate
 * @param {number} hours - Number of hours to look back (default: 24)
 * @returns {Promise<{formattedText: string}>}
 */
export async function getAutoPopulateText(hours = 24) {
  const response = await fetch(`${API_BASE}/auto-populate?hours=${hours}`, {
    method: "GET",
    credentials: "include"
  });

  return handleResponse(response);
}

/**
 * Get raw GitHub activity data
 * @param {number} hours - Number of hours to look back
 * @returns {Promise<Object>} Activity data with commits, PRs, reviews, issues
 */
export async function getGitHubActivity(hours = 24) {
  const response = await fetch(`${API_BASE}/activity?hours=${hours}`, {
    method: "GET",
    credentials: "include"
  });

  return handleResponse(response);
}

/**
 * Get the URL to connect GitHub account
 * @param {string} courseUuid - Optional course UUID to redirect back to after auth
 * @returns {string} GitHub OAuth URL
 */
export function getConnectUrl(courseUuid = "") {
  if (courseUuid) {
    return `/github/auth?courseUuid=${encodeURIComponent(courseUuid)}`;
  }
  return "/github/auth";
}

/**
 * Disconnect GitHub account
 * @returns {Promise<{success: boolean, message: string}>}
 */
export async function disconnectGitHub() {
  const response = await fetch("/github/disconnect", {
    method: "POST",
    credentials: "include"
  });

  return handleResponse(response);
}
