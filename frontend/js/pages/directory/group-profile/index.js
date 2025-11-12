/**
 * Group Profile Page Entry Point
 */

import { renderGroupProfile } from "./profileView.js";
import { mockData } from "../../../api/directory/mockData.js";

/**
 * Extract team UUID from URL params
 * @returns {string|null} Team UUID
 */
function getTeamUuidFromUrl() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get("team");
}

/**
 * Update navigation links (My Profile) based on mock role data
 */
function updateNavigationLinks() {
  const myProfileLink = document.getElementById("myProfileLink");

  if (!myProfileLink) {
    return;
  }

  const roleData = mockData.userRole;
  const userUuid = roleData.user_uuid || (roleData.role === "student" ? "student-1-uuid" : "staff-1-uuid");
  myProfileLink.href = `user-profile.html?user=${userUuid}`;
}

/**
 * Update dashboard/roster links once course UUID is known
 * @param {string} courseUuid
 */
function updateCourseLinks(courseUuid) {
  if (!courseUuid) {
    return;
  }

  const brandLink = document.querySelector(".nav-brand a");
  const dashboardLink = document.querySelector('.nav-links a[href^="class-dashboard"]');
  const rosterLink = document.querySelector('.nav-links a[href^="user-directory"]');

  if (brandLink) {
    brandLink.href = `class-dashboard.html?course=${courseUuid}`;
  }
  if (dashboardLink) {
    dashboardLink.href = `class-dashboard.html?course=${courseUuid}`;
  }
  if (rosterLink) {
    rosterLink.href = `user-directory.html?course=${courseUuid}`;
  }
}

/**
 * Initialize group profile page
 */
async function init() {
  const container = document.getElementById("teamProfileContainer");

  if (!container) {
    return;
  }

  updateNavigationLinks();

  const teamUuid = getTeamUuidFromUrl();

  if (!teamUuid) {
    container.innerHTML = `
      <div class="error-message">
        <h2>No Team Selected</h2>
        <p>The team identifier is missing from the URL.</p>
        <a href="class-dashboard.html?course=test-course" class="btn btn-primary">Back to Dashboard</a>
      </div>
    `;
    return;
  }

  const profile = await renderGroupProfile(teamUuid, container);

  if (profile && profile.team_info) {
    updateCourseLinks(profile.team_info.course_uuid);
  }
}

document.addEventListener("DOMContentLoaded", init);

