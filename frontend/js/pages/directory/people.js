/**
 * @fileoverview People page logic (course roster)
 * @module pages/directory/people
 */

import * as directoryApi from "../../api/directoryApi.js";
import { navigateToUser } from "./main.js";

let currentCourseUuid = null;
let currentPage = 1;
let currentFilter = "all";

/**
 * Initialize the roster page
 * @param {string} courseUuid - Course UUID
 */
export async function init(courseUuid) {
  currentCourseUuid = courseUuid;
  currentPage = 1;
  currentFilter = "all";

  setupEventListeners();
  await loadRoster();
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
  const roleFilter = document.getElementById("role-filter");
  if (roleFilter) {
    roleFilter.addEventListener("change", async (e) => {
      currentFilter = e.target.value;
      currentPage = 1;
      await loadRoster();
    });
  }
}

/**
 * Load roster data
 */
async function loadRoster() {
  try {
    showLoading();

    const data = await directoryApi.getCourseRoster(currentCourseUuid, {
      page: currentPage,
      limit: 5,
      filter: currentFilter
    });

    renderRoster(data);
    renderPagination(data.pagination);
  } catch (error) {
    // Error loading roster
    showError("Failed to load roster: " + error.message);
  }
}

/**
 * Render roster table
 * @param {Object} data - Roster data
 */
function renderRoster(data) {
  const tbody = document.getElementById("roster-table-body");
  const totalCount = document.getElementById("roster-total-count");

  if (!tbody) return;

  if (data.students.length === 0) {
    tbody.innerHTML = "<tr><td colspan=\"4\" style=\"padding: var(--space-2xl); text-align: center; font-family: var(--font-mono); color: var(--color-forest-green-medium);\">No students found</td></tr>";
    if (totalCount) totalCount.textContent = "0";
    return;
  }

  tbody.innerHTML = data.students.map(student => {
    const initials = (student.firstName[0] + student.lastName[0]).toUpperCase();
    const photoHtml = student.photoUrl
      ? "<img src=\"" + student.photoUrl + "\" alt=\"" + student.firstName + " " + student.lastName + "\" style=\"width: 40px; height: 40px; border-radius: 50%; border: var(--border-thick);\">"
      : "<div style=\"width: 40px; height: 40px; border-radius: 50%; background: var(--color-radioactive-lime); border: var(--border-thick); display: flex; align-items: center; justify-content: center; font-family: var(--font-mono); font-weight: 600; color: var(--color-forest-green);\">" + initials + "</div>";

    const pronounsHtml = student.pronouns
      ? "<div style=\"font-family: var(--font-mono); font-size: var(--text-sm); color: var(--color-forest-green-medium);\">" + student.pronouns + "</div>"
      : "";

    return "<tr style=\"border-bottom: 1px solid var(--color-light-matcha);\"><td style=\"padding: var(--space-md);\"><div style=\"display: flex; align-items: center; gap: var(--space-md);\">" + photoHtml + "<div><div style=\"font-family: var(--font-mono); font-weight: 600; color: var(--color-forest-green);\">" + student.firstName + " " + student.lastName + "</div>" + pronounsHtml + "</div></div></td><td style=\"padding: var(--space-md); font-family: var(--font-mono); color: var(--color-forest-green);\">" + student.email + "</td><td style=\"padding: var(--space-md);\"><span style=\"font-family: var(--font-mono); font-size: var(--text-sm); padding: var(--space-xs) var(--space-sm); background: var(--color-light-matcha); border: var(--border-thick); color: var(--color-forest-green); text-transform: capitalize;\">" + student.role + "</span></td><td style=\"padding: var(--space-md); text-align: center;\"><button data-user-uuid=\"" + student.userUuid + "\" class=\"view-profile-btn\" style=\"font-family: var(--font-mono); font-size: var(--text-sm); color: var(--color-forest-green); text-decoration: underline; background: none; border: none; cursor: pointer;\">View Profile</button></td></tr>";
  }).join("");

  // Add click handlers for view profile buttons
  const viewProfileButtons = tbody.querySelectorAll(".view-profile-btn");
  viewProfileButtons.forEach(button => {
    button.addEventListener("click", () => {
      const userUuid = button.getAttribute("data-user-uuid");
      navigateToUser(userUuid);
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
  const container = document.getElementById("roster-pagination");
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
      await loadRoster();
    });
  }

  if (nextBtn && !nextDisabled) {
    nextBtn.addEventListener("click", async () => {
      currentPage++;
      await loadRoster();
    });
  }
}

/**
 * Show loading state
 */
function showLoading() {
  const tbody = document.getElementById("roster-table-body");
  if (tbody) {
    tbody.innerHTML = "<tr><td colspan=\"4\" style=\"padding: var(--space-2xl); text-align: center; font-family: var(--font-mono); color: var(--color-forest-green-medium);\">Loading roster...</td></tr>";
  }
}

/**
 * Show error message
 * @param {string} message - Error message
 */
function showError(message) {
  const tbody = document.getElementById("roster-table-body");
  if (tbody) {
    tbody.innerHTML = "<tr><td colspan=\"4\" style=\"padding: var(--space-2xl); text-align: center; font-family: var(--font-mono); color: var(--color-forest-green); background: var(--color-light-matcha);\">" + message + "</td></tr>";
  }
}
