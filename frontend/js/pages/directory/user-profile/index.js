/**
 * @module userProfile
 * User Profile Page Entry Point
 */

import { renderUserProfile } from "./profileView.js";
import { mockData } from "../../../api/directory/mockData.js";

/**
 * Get user UUID from URL parameters
 * @returns {string|null} User UUID or null if not found
 */
function getUserUuidFromUrl() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get("user");
}

/**
 * Update navigation bar "My Profile" link based on user role
 * Uses direct mockData access for immediate update without delay
 */
function updateNavigationLinks() {
  const myProfileLink = document.getElementById("myProfileLink");

  if (myProfileLink) {
    // Get role data directly from mockData (no async delay)
    const roleData = mockData.userRole;
    const userUuid = roleData.user_uuid || (roleData.role === "student" ? "student-1-uuid" : "staff-1-uuid");
    myProfileLink.href = `user-profile.html?user=${userUuid}`;
  }
}

/**
 * Initialize user profile page
 */
async function init() {
  const container = document.getElementById("profileContainer");

  if (!container) {
    return;
  }

  // Update navigation immediately without async delay
  updateNavigationLinks();

  // Get user UUID from URL
  const userUuid = getUserUuidFromUrl();

  if (!userUuid) {
    container.innerHTML = `
      <div class="error-message">
        <h2>No User Specified</h2>
        <p>Please provide a user ID in the URL.</p>
        <a href="/directory" class="btn btn-primary">Go to Directory</a>
      </div>
    `;
    return;
  }

  // Render the profile
  await renderUserProfile(userUuid, container);
}

// Initialize when DOM is ready
document.addEventListener("DOMContentLoaded", init);
