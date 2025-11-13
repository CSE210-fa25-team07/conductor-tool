/**
 * Group Directory Page Controller
 * Main entry point for the group directory page
 * Displays paginated list of teams/groups with filtering
 */

import { renderGroupDirectory } from "./directoryView.js";
import { mockData } from "../../../api/directory/mockData.js";

/**
 * Get course UUID from URL parameters
 * @returns {string|null} Course UUID or null if not found
 */
function getCourseUuidFromUrl() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get("course");
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
 * Initialize the group directory page
 * Sets up pagination and filtering
 */
async function initDirectory() {
  const container = document.getElementById("directory-container");

  if (!container) {
    return;
  }

  // Update navigation bar immediately without delay
  updateNavigationLinks();

  // Get course UUID from URL
  const courseUuid = getCourseUuidFromUrl();

  if (!courseUuid) {
    container.innerHTML = `
      <div class="error-message">
        <h2>Invalid Course</h2>
        <p>No course specified. Please select a course from the <a href="class-dashboard.html?course=test-course">dashboard</a>.</p>
      </div>
    `;
    return;
  }

  try {
    // Render the directory with initial state (page 1, filter all)
    await renderGroupDirectory(courseUuid, container);

  } catch (error) {
    container.innerHTML = `
      <div class="error-message">
        <h2>Error Loading Groups</h2>
        <p>${error.message || "Failed to load groups. Please try again later."}</p>
        <a href="class-dashboard.html?course=${courseUuid}" class="btn btn-primary">Back to Dashboard</a>
      </div>
    `;
  }
}

// Initialize directory when DOM is ready
document.addEventListener("DOMContentLoaded", initDirectory);
