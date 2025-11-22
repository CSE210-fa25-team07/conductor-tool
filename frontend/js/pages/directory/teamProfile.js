/**
 * @fileoverview Team Profile page logic
 * @module pages/directory/teamProfile
 */

import * as directoryApi from "../../api/directoryApi.js";
import { navigateToGroup, navigateToUser } from "./main.js";

/**
 * Initialize the team profile page
 * @param {string} teamUuid - Team UUID
 */
export async function init(teamUuid) {
  setupEventListeners();
  await loadTeamProfile(teamUuid);
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
  const backBtn = document.getElementById("back-to-teams");
  if (backBtn) {
    backBtn.addEventListener("click", (e) => {
      e.preventDefault();
      navigateToGroup();
    });
  }
}

/**
 * Load team profile data
 * @param {string} teamUuid - Team UUID
 */
async function loadTeamProfile(teamUuid) {
  try {
    showLoading();
    const team = await directoryApi.getTeamProfile(teamUuid);
    renderTeamProfile(team);
  } catch (error) {
    // Error loading team profile
    showError("Failed to load team profile. Please try again.");
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
      membersGrid.innerHTML = "<div style=\"text-align: center; padding: var(--space-xl); grid-column: 1 / -1;\"><p style=\"font-family: var(--font-mono); color: var(--color-forest-green-medium);\">No team members</p></div>";
    } else {
      membersGrid.innerHTML = team.members.map(member => {
        const initials = (member.firstName[0] + member.lastName[0]).toUpperCase();
        const photoHtml = member.photoUrl
          ? "<img src=\"" + member.photoUrl + "\" alt=\"" + member.firstName + " " + member.lastName + "\" style=\"width: 60px; height: 60px; border-radius: 50%; border: var(--border-thick);\">"
          : "<div style=\"width: 60px; height: 60px; border-radius: 50%; background: var(--color-radioactive-lime); border: var(--border-thick); display: flex; align-items: center; justify-content: center; font-family: var(--font-mono); font-weight: 600; font-size: var(--text-xl); color: var(--color-forest-green);\">" + initials + "</div>";

        const githubHtml = member.githubUsername
          ? "<div style=\"font-family: var(--font-mono); font-size: var(--text-sm); color: var(--color-forest-green-medium); margin-top: var(--space-xs);\">@" + member.githubUsername + "</div>"
          : "";

        return "<div data-user-uuid=\"" + member.userUuid + "\" class=\"member-card\" style=\"background: var(--color-light-matcha); border: var(--border-thick); padding: var(--space-lg); text-align: center; cursor: pointer; transition: all 0.2s ease;\"><div style=\"display: flex; justify-content: center; margin-bottom: var(--space-md);\">" + photoHtml + "</div><div style=\"font-family: var(--font-mono); font-weight: 600; color: var(--color-forest-green); margin-bottom: var(--space-xs);\">" + member.firstName + " " + member.lastName + "</div>" + (member.pronouns ? "<div style=\"font-family: var(--font-mono); font-size: var(--text-sm); color: var(--color-forest-green-medium); margin-bottom: var(--space-xs);\">" + member.pronouns + "</div>" : "") + "<a href=\"mailto:" + member.email + "\" style=\"font-family: var(--font-mono); font-size: var(--text-sm); color: var(--color-forest-green); text-decoration: underline; display: block; margin-bottom: var(--space-xs);\">" + member.email + "</a>" + githubHtml + "</div>";
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

        // Add hover effect
        card.addEventListener("mouseenter", () => {
          card.style.transform = "translateY(-2px)";
          card.style.boxShadow = "0 4px 6px rgba(0, 0, 0, 0.1)";
        });

        card.addEventListener("mouseleave", () => {
          card.style.transform = "translateY(0)";
          card.style.boxShadow = "none";
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
    membersGrid.innerHTML = "<div style=\"text-align: center; padding: var(--space-xl); grid-column: 1 / -1;\"><p style=\"font-family: var(--font-mono); color: var(--color-forest-green-medium);\">Loading members...</p></div>";
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
    membersGrid.innerHTML = "<div style=\"background: var(--color-light-matcha); border: var(--border-thick); padding: var(--space-2xl); text-align: center; grid-column: 1 / -1;\"><p style=\"font-family: var(--font-mono); color: var(--color-forest-green);\">" + message + "</p></div>";
  }
}
