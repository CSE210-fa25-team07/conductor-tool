/**
 * @fileoverview Team Profile page logic
 * @module pages/directory/teamProfile
 */

import * as directoryApi from "../../api/directoryApi.js";
import * as userContextApi from "../../api/userContextApi.js";
import { navigateToGroup, navigateToUser } from "./main.js";

/**
 * Initialize the team profile page
 * @param {string} teamUuid - Team UUID
 */
export async function init(teamUuid) {
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

    // Setup back button visibility based on user role
    await setupBackButton(team.course.courseUuid);

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
    teamLinks.innerHTML = links.length > 0 ? links.join(" | ") : "";
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
