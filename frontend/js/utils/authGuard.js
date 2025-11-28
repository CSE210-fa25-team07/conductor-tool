/**
 * Frontend authentication guard
 * Ensures user is redirected to login if session is invalid
 * @module utils/authGuard
 */

/**
 * Check if user has a valid session, redirect to "/" if not
 * Call this on protected page load
 */
export async function requireAuth() {
  try {
    const response = await fetch("/v1/api/auth/session", {
      credentials: "include"
    });
    if (!response.ok) {
      window.location.href = "/";
      return false;
    }
    return true;
  } catch {
    window.location.href = "/";
    return false;
  }
}

/**
 * Wrapper for fetch that redirects to "/" on auth failure
 * Use this instead of fetch() for API calls on protected pages
 * @param {string} url
 * @param {RequestInit} options
 */
export async function authFetch(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    credentials: "include"
  });

  // Detect redirect to login page (session expired)
  if (response.redirected && response.url.endsWith("/")) {
    window.location.href = "/";
    return null;
  }

  return response;
}
