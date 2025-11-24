/**
 * @fileoverview Group page logic (course teams)
 * @module pages/directory/group
 */

import * as directoryApi from "../../api/directoryApi.js";
import * as userContextApi from "../../api/userContextApi.js";
import { navigateToTeam } from "./main.js";

let currentCourseUuid = null;
let currentPage = 1;

/**
 * Initialize the teams page
 * @param {string} courseUuid - Course UUID
 */
export async function init(courseUuid) {
  currentCourseUuid = courseUuid;
  currentPage = 1;

  // Check if user is a student and should be redirected to their team profile
  await checkAndRedirectStudent();
}

/**
 * Check if user is a student and redirect to their team profile if applicable
 */
async function checkAndRedirectStudent() {
  try {
    showLoading();

    // Get user context to check role
    const userContext = await userContextApi.getUserContext(currentCourseUuid);
    const userRole = userContext.activeCourse?.role;

    // If user is a student (not Professor or TA), redirect to their team profile
    if (userRole === "Student") {
      // Fetch teams (backend will return only their team for students)
      const teamsData = await directoryApi.getCourseTeams(currentCourseUuid, {
        page: 1,
        limit: 1
      });

      // If student has exactly one team, redirect to team profile
      if (teamsData.teams && teamsData.teams.length === 1) {
        navigateToTeam(teamsData.teams[0].teamUuid);
        return;
      }

      // If student has no team or multiple teams, show the teams list
      await loadTeams();
    } else {
      // For instructors/TAs, show all teams
      await loadTeams();
    }
  } catch (error) {
    // If there's an error checking role, fall back to showing teams list
    await loadTeams();
  }
}

/**
 * Load teams data
 */
async function loadTeams() {
  try {
    showLoading();
    const data = await directoryApi.getCourseTeams(currentCourseUuid, {
      page: currentPage,
      limit: 12
    });

    renderTeams(data);
    renderPagination(data.pagination);
  } catch (error) {
    // Error loading teams
    showError("Failed to load teams: " + error.message);
  }
}

/**
 * Render teams grid
 * @param {Object} data - Teams data
 */
function renderTeams(data) {
  const grid = document.getElementById("teams-grid");
  const totalCount = document.getElementById("teams-total-count");

  if (!grid) return;

  if (data.teams.length === 0) {
    grid.innerHTML = "<div style=\"background: var(--color-light-matcha); border: var(--border-thick); padding: var(--space-2xl); text-align: center;\"><p style=\"font-family: var(--font-mono); color: var(--color-forest-green-medium);\">No teams found</p></div>";
    if (totalCount) totalCount.textContent = "0";
    return;
  }

  grid.innerHTML = data.teams.map(team => {
    const taInfo = team.teamTa
      ? "<div style=\"font-family: var(--font-mono); font-size: var(--text-sm); color: var(--color-forest-green-medium); margin-top: var(--space-sm);\"><strong>TA:</strong> " + team.teamTa.firstName + " " + team.teamTa.lastName + "</div>"
      : "<div style=\"font-family: var(--font-mono); font-size: var(--text-sm); color: var(--color-forest-green-medium); margin-top: var(--space-sm);\">No TA assigned</div>";

    return "<article style=\"background: white; border: var(--border-thick); padding: var(--space-lg); transition: all 0.2s;\"><h3 style=\"font-family: var(--font-heading); font-size: var(--text-xl); color: var(--color-forest-green); margin-bottom: var(--space-md);\">" + team.teamName + "</h3><div style=\"display: flex; align-items: center; gap: var(--space-md); margin-bottom: var(--space-md);\"><div style=\"padding: var(--space-sm) var(--space-md); background: var(--color-light-matcha); border: var(--border-thick); font-family: var(--font-mono); font-size: var(--text-sm); color: var(--color-forest-green);\"><strong>" + team.memberCount + "</strong> member" + (team.memberCount !== 1 ? "s" : "") + "</div></div>" + taInfo + "<div style=\"margin-top: var(--space-md);\"><button data-team-uuid=\"" + team.teamUuid + "\" class=\"view-team-btn\" style=\"font-family: var(--font-mono); font-size: var(--text-sm); padding: var(--space-sm) var(--space-md); background: var(--color-radioactive-lime); border: var(--border-thick); color: var(--color-forest-green); font-weight: 600; cursor: pointer;\">View Team →</button></div></article>";
  }).join("");

  // Add click handlers for view team buttons
  const viewTeamButtons = grid.querySelectorAll(".view-team-btn");
  viewTeamButtons.forEach(button => {
    button.addEventListener("click", () => {
      const teamUuid = button.getAttribute("data-team-uuid");
      navigateToTeam(teamUuid);
    });
  });

  if (totalCount) {
    totalCount.textContent = data.pagination.total;
  }
}

/**
 * Render pagination controls
 * @param {Object} pagination - Pagination data
 */
function renderPagination(pagination) {
  const container = document.getElementById("teams-pagination");
  if (!container) return;

  const page = pagination.page;
  const totalPages = pagination.totalPages;

  if (totalPages <= 1) {
    container.innerHTML = "";
    return;
  }

  const prevDisabled = page === 1;
  const nextDisabled = page === totalPages;

  container.innerHTML = "<button id=\"prev-page\" " + (prevDisabled ? "disabled" : "") + " style=\"font-family: var(--font-mono); padding: var(--space-sm) var(--space-md); background: " + (prevDisabled ? "var(--color-light-matcha)" : "white") + "; border: var(--border-thick); color: var(--color-forest-green); cursor: " + (prevDisabled ? "not-allowed" : "pointer") + "; opacity: " + (prevDisabled ? "0.5" : "1") + ";\">← Previous</button><span style=\"font-family: var(--font-mono); color: var(--color-forest-green);\">Page " + page + " of " + totalPages + "</span><button id=\"next-page\" " + (nextDisabled ? "disabled" : "") + " style=\"font-family: var(--font-mono); padding: var(--space-sm) var(--space-md); background: " + (nextDisabled ? "var(--color-light-matcha)" : "white") + "; border: var(--border-thick); color: var(--color-forest-green); cursor: " + (nextDisabled ? "not-allowed" : "pointer") + "; opacity: " + (nextDisabled ? "0.5" : "1") + ";\">Next →</button>";

  const prevBtn = document.getElementById("prev-page");
  const nextBtn = document.getElementById("next-page");

  if (prevBtn && !prevDisabled) {
    prevBtn.addEventListener("click", async () => {
      currentPage--;
      await loadTeams();
    });
  }

  if (nextBtn && !nextDisabled) {
    nextBtn.addEventListener("click", async () => {
      currentPage++;
      await loadTeams();
    });
  }
}

/**
 * Show loading state
 */
function showLoading() {
  const grid = document.getElementById("teams-grid");
  if (grid) {
    grid.innerHTML = "<div style=\"background: var(--color-light-matcha); border: var(--border-thick); padding: var(--space-2xl); text-align: center;\"><p style=\"font-family: var(--font-mono); color: var(--color-forest-green-medium);\">Loading teams...</p></div>";
  }
}

/**
 * Show error message
 * @param {string} message - Error message
 */
function showError(message) {
  const grid = document.getElementById("teams-grid");
  if (grid) {
    grid.innerHTML = "<div style=\"background: var(--color-light-matcha); border: var(--border-thick); padding: var(--space-2xl); text-align: center;\"><p style=\"font-family: var(--font-mono); color: var(--color-forest-green);\">" + message + "</p></div>";
  }
}
