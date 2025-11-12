/**
 * Dashboard Page Controller
 * Main entry point for the class dashboard page
 * Determines user role and renders appropriate view (student or instructor)
 */

// USING MOCK DATA - Switch to directoryApi.js when backend is ready
import { getUserRole } from "../../../api/directory/directoryApiMock.js";
import { mockData } from "../../../api/directory/mockData.js";
import { renderStudentDashboard } from "./studentView.js";
import { renderInstructorDashboard } from "./instructorView.js";

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
 * Initialize the dashboard page
 * Fetches user role and renders appropriate dashboard view
 */
async function initDashboard() {
  const container = document.getElementById("dashboard-container");

  if (!container) {
    return;
  }

  // Get course UUID from URL
  const courseUuid = getCourseUuidFromUrl();

  if (!courseUuid) {
    container.innerHTML = `
      <div class="error-message">
        <h2>Invalid Course</h2>
        <p>No course specified. Please select a course from the <a href="/courses">course list</a>.</p>
      </div>
    `;
    return;
  }

  try {
    // Show initial loading state
    container.innerHTML = "<div class=\"loading\">Loading dashboard...</div>";

    // Update navigation bar immediately without delay
    updateNavigationLinks();

    // Fetch user role for this course
    const roleData = await getUserRole(courseUuid);

    // Determine which view to render based on role
    const isInstructor = roleData.role === "instructor" || roleData.role === "ta";

    if (isInstructor) {
      // Render instructor view
      await renderInstructorDashboard(courseUuid, container);
    } else {
      // Render student view
      await renderStudentDashboard(courseUuid, container);
    }

  } catch (error) {
    container.innerHTML = `
      <div class="error-message">
        <h2>Error Loading Dashboard</h2>
        <p>${error.message || "Failed to load dashboard. Please try again later."}</p>
        <a href="/courses" class="btn btn-primary">Back to Course List</a>
      </div>
    `;
  }
}

// Initialize dashboard when DOM is ready
document.addEventListener("DOMContentLoaded", initDashboard);
