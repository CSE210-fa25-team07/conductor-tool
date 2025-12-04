/**
 * @fileoverview Team Profile page logic
 * @module pages/directory/teamProfile
 */

import * as directoryApi from "../../api/directoryApi.js";
import * as userContextApi from "../../api/userContextApi.js";
import { navigateToGroup, navigateToUser } from "./main.js";

let currentTeamUuid = null;
let currentTeam = null;
let isTeamLeader = false;

/**
 * Initialize the team profile page
 * @param {string} teamUuid - Team UUID
 */
export async function init(teamUuid) {
  currentTeamUuid = teamUuid;
  await loadTeamProfile(teamUuid);
}

/**
 * Load team profile data
 * @param {string} teamUuid - Team UUID
 */
async function loadTeamProfile(teamUuid) {
  try {
    showLoading();
    const team = await directoryApi.getTeamProfile(teamUuid);
    currentTeam = team;

    // Setup back button visibility based on user role
    await setupBackButton(team.course.courseUuid);

    // Check if current user is team leader
    await checkTeamLeaderStatus(teamUuid, team.course.courseUuid);

    // Render the team profile
    renderTeamProfile(team);
  } catch (error) {
    // Error loading team profile
    showError("Failed to load team profile. Please try again.");
  }
}

/**
 * Setup back button visibility based on user role
 * @param {string} courseUuid - Course UUID
 */
async function setupBackButton(courseUuid) {
  const backBtnContainer = document.getElementById("back-to-teams")?.parentElement;
  const backBtn = document.getElementById("back-to-teams");

  if (backBtn && backBtnContainer) {
    try {
      // Get user context to check role
      const userContext = await userContextApi.getUserContext(courseUuid);
      const userRole = userContext.activeCourse?.role;

      // Show back button only for instructors/TAs (hidden by default in CSS)
      if (userRole !== "Student") {
        backBtnContainer.style.display = "block";
        backBtn.addEventListener("click", (e) => {
          e.preventDefault();
          navigateToGroup();
        });
      }
      // For students, button stays hidden (default CSS)
    } catch (error) {
      // If error, show the button by default
      backBtnContainer.style.display = "block";
      backBtn.addEventListener("click", (e) => {
        e.preventDefault();
        navigateToGroup();
      });
    }
  }
}

/**
 * Check if current user is a team leader for this team
 * @param {string} teamUuid - Team UUID
 * @param {string} courseUuid - Course UUID
 */
async function checkTeamLeaderStatus(teamUuid, courseUuid) {
  try {
    // Get current user from session
    const sessionResponse = await fetch("/v1/api/auth/session", {
      credentials: "include"
    });

    if (!sessionResponse.ok) {
      isTeamLeader = false;
      return;
    }

    const sessionData = await sessionResponse.json();
    const currentUserId = sessionData.user?.id;

    if (!currentUserId) {
      isTeamLeader = false;
      return;
    }

    // Get user context to check roles
    const userContext = await userContextApi.getUserContext(courseUuid);

    // Check ALL enrolled courses - users can have multiple roles for the same course
    // (e.g., both "Student" and "Team Leader" enrollments)
    // enrolledCourses should contain ALL enrollments, so check all entries
    const hasTeamLeaderRole = userContext.enrolledCourses?.some(
      course => String(course.courseUuid) === String(courseUuid) && course.role === "Team Leader"
    ) || false;

    // Check if current user is a member of this team (using team data we already loaded)
    const isTeamMember = currentTeam?.members?.some(
      member => String(member.userUuid) === String(currentUserId)
    ) || false;

    // User is team leader if they have "Team Leader" role AND are a member of this team
    // Backend will do the final verification to ensure they're actually the team leader
    isTeamLeader = hasTeamLeaderRole && isTeamMember;
  } catch (error) {
    isTeamLeader = false;
  }
}

/**
 * Render team profile
 * @param {Object} team - Team data
 */
function renderTeamProfile(team) {
  const teamName = document.getElementById("team-name");
  const teamCourse = document.getElementById("team-course");
  const teamTaInfo = document.getElementById("team-ta-info");
  const teamLinks = document.getElementById("team-links");
  const memberCount = document.getElementById("team-member-count");
  const standupCount = document.getElementById("team-standup-count");
  const membersGrid = document.getElementById("team-members-grid");

  if (teamName) {
    teamName.textContent = team.teamName;
  }

  if (teamCourse && team.course) {
    teamCourse.textContent = team.course.courseCode + ": " + team.course.courseName;
  }

  if (teamTaInfo) {
    if (team.teamTa) {
      teamTaInfo.innerHTML = "<div style=\"font-family: var(--font-mono); color: var(--color-forest-green);\"><strong>Team TA:</strong> " + team.teamTa.firstName + " " + team.teamTa.lastName + "<br><a href=\"mailto:" + team.teamTa.email + "\" style=\"color: var(--color-forest-green); text-decoration: underline;\">" + team.teamTa.email + "</a></div>";
    } else {
      teamTaInfo.innerHTML = "<div style=\"font-family: var(--font-mono); color: var(--color-forest-green-medium);\">No TA assigned</div>";
    }
  }

  if (teamLinks) {
    const links = [];
    if (team.teamPageUrl) {
      links.push("<a href=\"" + team.teamPageUrl + "\" target=\"_blank\" style=\"font-family: var(--font-mono); color: var(--color-forest-green); text-decoration: underline;\">Team Page →</a>");
    }
    if (team.repoUrl) {
      links.push("<a href=\"" + team.repoUrl + "\" target=\"_blank\" style=\"font-family: var(--font-mono); color: var(--color-forest-green); text-decoration: underline;\">Repository →</a>");
    }

    let linksHtml = links.length > 0 ? links.join(" | ") : "";

    // Add edit button if user is team leader
    if (isTeamLeader) {
      const buttonHtml = "<button id=\"edit-team-links-btn\" style=\"margin-left: " + (linksHtml ? "var(--space-md)" : "0") + "; font-family: var(--font-mono); font-size: var(--text-sm); padding: var(--space-xs) var(--space-sm); background: var(--color-radioactive-lime); border: var(--border-thick); color: var(--color-forest-green); cursor: pointer;\">Edit Links</button>";
      linksHtml += buttonHtml;
    }

    teamLinks.innerHTML = linksHtml || (isTeamLeader ? "" : "<span style=\"font-family: var(--font-mono); color: var(--color-forest-green-medium);\">No links set</span>");

    // Setup edit button event listener if it exists
    const editBtn = document.getElementById("edit-team-links-btn");
    if (editBtn) {
      editBtn.addEventListener("click", () => enterEditMode());
    }
  }

  if (memberCount) {
    memberCount.textContent = team.stats.memberCount;
  }

  if (standupCount) {
    standupCount.textContent = team.stats.standupCount;
  }

  if (membersGrid) {
    if (team.members.length === 0) {
      membersGrid.innerHTML = "<div class=\"loading-message\" style=\"grid-column: 1 / -1;\"><p>No team members</p></div>";
    } else {
      membersGrid.innerHTML = team.members.map(member => {
        const initials = (member.firstName[0] + member.lastName[0]).toUpperCase();
        const photoHtml = member.photoUrl
          ? "<div class=\"member-avatar\"><img src=\"" + member.photoUrl + "\" alt=\"" + member.firstName + " " + member.lastName + "\"></div>"
          : "<div class=\"member-avatar-initials\">" + initials + "</div>";

        const pronounsHtml = member.pronouns
          ? "<div class=\"member-pronouns\">" + member.pronouns + "</div>"
          : "";

        const githubHtml = member.githubUsername
          ? "<div class=\"member-github\">@" + member.githubUsername + "</div>"
          : "";

        return "<div data-user-uuid=\"" + member.userUuid + "\" class=\"member-card\"><div class=\"member-avatar-wrapper\">" + photoHtml + "</div><div class=\"member-name\">" + member.firstName + " " + member.lastName + "</div>" + pronounsHtml + "<a href=\"mailto:" + member.email + "\" class=\"member-email\">" + member.email + "</a>" + githubHtml + "</div>";
      }).join("");

      // Add click handlers for member cards
      const memberCards = membersGrid.querySelectorAll(".member-card");
      memberCards.forEach(card => {
        card.addEventListener("click", (e) => {
          // Don't navigate if clicking on email link
          if (e.target.tagName === "A") {
            return;
          }
          const userUuid = card.getAttribute("data-user-uuid");
          navigateToUser(userUuid);
        });
      });
    }
  }
}

/**
 * Enter edit mode for team links
 */
function enterEditMode() {
  if (!currentTeam) return;

  const teamLinks = document.getElementById("team-links");
  if (!teamLinks) return;

  // Create edit form
  const formHtml = `
    <form id="team-links-form" style="display: flex; flex-direction: column; gap: var(--space-md);">
      <div>
        <label style="font-family: var(--font-mono); font-size: var(--text-sm); color: var(--color-forest-green); display: block; margin-bottom: var(--space-xs);">Team Page URL:</label>
        <input type="url" id="edit-teamPageUrl" value="${currentTeam.teamPageUrl || ""}" 
               style="width: 100%; padding: var(--space-sm); font-family: var(--font-mono); border: var(--border-thick); color: var(--color-forest-green);"
               placeholder="https://example.com/team-page">
      </div>
      <div>
        <label style="font-family: var(--font-mono); font-size: var(--text-sm); color: var(--color-forest-green); display: block; margin-bottom: var(--space-xs);">Repository URL:</label>
        <input type="url" id="edit-repoUrl" value="${currentTeam.repoUrl || ""}" 
               style="width: 100%; padding: var(--space-sm); font-family: var(--font-mono); border: var(--border-thick); color: var(--color-forest-green);"
               placeholder="https://github.com/username/repo">
      </div>
      <div style="display: flex; gap: var(--space-sm);">
        <button type="submit" id="save-team-links-btn" 
                style="font-family: var(--font-mono); font-size: var(--text-sm); padding: var(--space-sm) var(--space-md); background: var(--color-radioactive-lime); border: var(--border-thick); color: var(--color-forest-green); cursor: pointer;">
          Save Changes
        </button>
        <button type="button" id="cancel-edit-team-links-btn" 
                style="font-family: var(--font-mono); font-size: var(--text-sm); padding: var(--space-sm) var(--space-md); background: white; border: var(--border-thick); color: var(--color-forest-green); cursor: pointer;">
          Cancel
        </button>
      </div>
    </form>
  `;

  teamLinks.innerHTML = formHtml;

  // Setup form event listeners
  const form = document.getElementById("team-links-form");
  const cancelBtn = document.getElementById("cancel-edit-team-links-btn");

  if (form) {
    form.addEventListener("submit", saveTeamLinks);
  }

  if (cancelBtn) {
    cancelBtn.addEventListener("click", exitEditMode);
  }
}

/**
 * Exit edit mode and restore view
 */
function exitEditMode() {
  if (!currentTeam) return;
  renderTeamProfile(currentTeam);
}

/**
 * Save team links
 * @param {Event} event - Form submit event
 */
async function saveTeamLinks(event) {
  event.preventDefault();

  const saveBtn = document.getElementById("save-team-links-btn");
  if (!saveBtn) return;

  saveBtn.disabled = true;
  saveBtn.textContent = "Saving...";

  try {
    const teamPageUrl = document.getElementById("edit-teamPageUrl").value.trim() || null;
    const repoUrl = document.getElementById("edit-repoUrl").value.trim() || null;

    const updatedTeam = await directoryApi.updateTeamLinks(currentTeamUuid, {
      teamPageUrl,
      repoUrl
    });

    // Update current team data
    currentTeam = updatedTeam;

    // Reload team profile to show updated links
    await loadTeamProfile(currentTeamUuid);

  } catch (error) {
    alert("Failed to update team links: " + error.message);
    saveBtn.disabled = false;
    saveBtn.textContent = "Save Changes";
  }
}

/**
 * Show loading state
 */
function showLoading() {
  const teamName = document.getElementById("team-name");
  if (teamName) {
    teamName.textContent = "Loading team...";
  }
  const membersGrid = document.getElementById("team-members-grid");
  if (membersGrid) {
    membersGrid.innerHTML = "<div class=\"loading-message\" style=\"grid-column: 1 / -1;\"><p>Loading members...</p></div>";
  }
}

/**
 * Show error message
 * @param {string} message - Error message
 */
function showError(message) {
  const teamName = document.getElementById("team-name");
  if (teamName) {
    teamName.textContent = "Error";
    teamName.style.color = "var(--color-forest-green)";
  }

  const membersGrid = document.getElementById("team-members-grid");
  if (membersGrid) {
    membersGrid.innerHTML = "<div class=\"loading-message\" style=\"grid-column: 1 / -1;\"><p>" + message + "</p></div>";
  }
}
