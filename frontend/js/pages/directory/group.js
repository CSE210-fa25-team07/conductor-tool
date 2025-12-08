/**
 * @fileoverview Group page logic (course teams)
 * @module directory/group
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

  // Load teams (role check now happens in main.js before this is called)
  await loadTeams();
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
    grid.innerHTML = "<div class=\"loading-card\"><p class=\"loading-text\">No teams found</p></div>";
    if (totalCount) totalCount.textContent = "0";
    return;
  }

  grid.innerHTML = data.teams.map(team => {
    const taInfo = team.teamTa
      ? "<div class=\"team-ta-info\"><strong>TA:</strong> " + team.teamTa.firstName + " " + team.teamTa.lastName + "</div>"
      : "<div class=\"team-ta-info\">No TA assigned</div>";

    return "<article class=\"team-card-content\"><h3 class=\"team-card-title\">" + team.teamName + "</h3><div class=\"team-info-badges\"><div class=\"member-count-badge\">" + team.memberCount + " member" + (team.memberCount !== 1 ? "s" : "") + "</div></div>" + taInfo + "<button data-team-uuid=\"" + team.teamUuid + "\" class=\"team-view-btn view-team-btn\">View Team →</button></article>";
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

  const buttonStyle = "font-family: var(--font-mono); font-size: var(--text-base); font-weight: 600; padding: var(--space-sm) var(--space-md); border: var(--border-thick); color: var(--color-forest-green); transition: background-color 0.2s ease;";

  const prevStyle = buttonStyle + " background: " + (prevDisabled ? "var(--color-light-matcha)" : "white") + "; cursor: " + (prevDisabled ? "not-allowed" : "pointer") + "; opacity: " + (prevDisabled ? "0.5" : "1") + ";";
  const nextStyle = buttonStyle + " background: " + (nextDisabled ? "var(--color-light-matcha)" : "white") + "; cursor: " + (nextDisabled ? "not-allowed" : "pointer") + "; opacity: " + (nextDisabled ? "0.5" : "1") + ";";

  container.innerHTML = "<button id=\"prev-page\" " + (prevDisabled ? "disabled" : "") + " style=\"" + prevStyle + "\">Previous</button><span style=\"font-family: var(--font-mono); font-weight: 600; color: var(--color-forest-green); padding: 0 var(--space-md);\">Page " + page + " of " + totalPages + "</span><button id=\"next-page\" " + (nextDisabled ? "disabled" : "") + " style=\"" + nextStyle + "\">Next</button>";

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
    grid.innerHTML = "<div class=\"loading-card\"><p class=\"loading-text\">Loading teams...</p></div>";
  }
}

/**
 * Show error message
 * @param {string} message - Error message
 */
function showError(message) {
  const grid = document.getElementById("teams-grid");
  if (grid) {
    grid.innerHTML = "<div class=\"loading-card\"><p class=\"loading-text\">" + message + "</p></div>";
  }
}
