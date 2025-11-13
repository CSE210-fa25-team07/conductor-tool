// Group Directory Page Script
// Uses mockData.js for directory list and directoryApiMock.js for future details

import { mockData } from "../../../api/directory/mockData.js";

const PAGE_SIZE = 40;

/**
 * Safely return a defined value or a fallback string.
 * @param {unknown} value - Input value that may be null/undefined.
 * @param {string} [fallback=""] - Fallback string when value is nullish.
 * @returns {string} A defined string value.
 */
function byDefined(value, fallback = "") {
  return (value === null || value === undefined) ? fallback : value;
}

/**
 * Format an ISO date string into a human-readable short date.
 * @param {string|null|undefined} isoDate - ISO date string, null, or undefined.
 * @returns {string} Localized date string or original input if invalid.
 */
function formatDateISOToReadable(isoDate) {
  if (!isoDate) return "—";
  try {
    const date = new Date(isoDate);
    // Fallback if invalid
    if (Number.isNaN(date.getTime())) return isoDate;
    return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  } catch {
    return isoDate;
  }
}

/**
 * Create a single group card element.
 * Displays team name, project, status pill + updated date, and repo link.
 * @param {Object} teamInfo - Team info from mock data.
 * @param {string} teamInfo.team_uuid
 * @param {string} teamInfo.team_name
 * @param {string} [teamInfo.project_name]
 * @param {string} [teamInfo.status_health]
 * @param {string} [teamInfo.status_updated]
 * @param {string} [teamInfo.repo_url]
 * @returns {HTMLLIElement} List item representing a group card.
 */
function createCard(teamInfo) {
  const {
    team_uuid: teamUuid,
    team_name: teamName,
    project_name: projectName,
    status_health: statusHealth,
    status_updated: statusUpdated,
    repo_url: repoUrl
  } = teamInfo || {};

  const li = document.createElement("li");
  li.className = "group-card";

  const a = document.createElement("a");
  a.className = "group-card__link";
  a.href = `group.html?team=${encodeURIComponent(byDefined(teamUuid))}`;
  a.setAttribute("aria-label", `View group ${byDefined(teamName, "Unnamed Team")}`);

  const title = document.createElement("h3");
  title.className = "group-card__title";
  title.textContent = byDefined(teamName, "Unnamed Team");

  const project = document.createElement("p");
  project.className = "group-card__meta";
  project.innerHTML = `<strong>Project:</strong> ${byDefined(projectName, "—")}`;

  const statusRow = document.createElement("div");
  statusRow.className = "group-card__status-row";

  const statusPill = document.createElement("span");
  statusPill.className = "group-card__status";
  statusPill.textContent = byDefined(statusHealth, "Unknown");
  statusPill.setAttribute("aria-label", `Status ${byDefined(statusHealth, "Unknown")}`);

  const statusUpdatedEl = document.createElement("span");
  statusUpdatedEl.className = "group-card__status-updated";
  statusUpdatedEl.textContent = `Updated ${formatDateISOToReadable(statusUpdated)}`;
  statusUpdatedEl.setAttribute("aria-label", `Updated ${formatDateISOToReadable(statusUpdated)}`);

  const repo = document.createElement("p");
  repo.className = "group-card__repo";
  if (repoUrl) {
    const link = document.createElement("a");
    link.href = repoUrl;
    link.target = "_blank";
    link.rel = "noopener";
    link.textContent = "GitHub↗";
    link.setAttribute("aria-label", "Open repository in a new tab");
    repo.appendChild(link);
  } else {
    repo.textContent = "No repository linked";
  }

  a.appendChild(title);
  a.appendChild(project);
  statusRow.appendChild(statusPill);
  statusRow.appendChild(statusUpdatedEl);

  a.appendChild(statusRow);
  a.appendChild(repo);
  li.appendChild(a);
  return li;
}

/**
 * Gather all teams from the mock dataset as an array of team_info objects.
 * @returns {Array<Object>} List of team_info items.
 */
function getAllTeamsFromMock() {
  const profiles = mockData?.teamProfiles || {};
  const list = Object.values(profiles)
    .map(p => p?.team_info)
    .filter(Boolean);
  return list;
}

/**
 * Set polite status text for screen readers and visual users.
 * @param {HTMLElement} el - Status container element.
 * @param {string} message - Status text to display.
 */
function setStatus(el, message) {
  if (!el) return;
  el.textContent = message || "";
}

/**
 * Toggle [hidden] on an element.
 * @param {HTMLElement} el - Element to hide/show.
 * @param {boolean} hidden - Whether to hide the element.
 */
function toggleHidden(el, hidden) {
  if (!el) return;
  // Using [hidden] attribute for better a11y semantics
  if (hidden) {
    el.setAttribute("hidden", "");
  } else {
    el.removeAttribute("hidden");
  }
}

/**
 * Initialize the group directory page:
 * - Loads teams from mock data
 * - Renders in pages of PAGE_SIZE
 * - Handles loading/empty states and "Load more"
 */
function initDirectory() {
  const listEl = document.getElementById("group-list");
  const statusEl = document.getElementById("status-message");
  const loadMoreBtn = document.getElementById("load-more");

  if (!listEl || !statusEl || !loadMoreBtn) {
    // Required nodes missing; abort gracefully
    return;
  }

  // State
  const teams = getAllTeamsFromMock();
  let nextIndex = 0;

  function renderNextPage() {
    const slice = teams.slice(nextIndex, nextIndex + PAGE_SIZE);
    slice.forEach(teamInfo => {
      listEl.appendChild(createCard(teamInfo));
    });
    nextIndex += slice.length;

    // Controls visibility of Load More
    toggleHidden(loadMoreBtn, nextIndex >= teams.length);
  }

  // Initial load
  setStatus(statusEl, "Loading groups…");
  // Simulate the same delay behavior users expect from mocks; keep UI consistent
  // Reuse a small timeout to emulate async
  window.setTimeout(() => {
    setStatus(statusEl, "");
    if (teams.length === 0) {
      setStatus(statusEl, "No groups found.");
      toggleHidden(loadMoreBtn, true);
      return;
    }
    renderNextPage();
  }, 350);

  // Events
  loadMoreBtn.addEventListener("click", () => {
    renderNextPage();
    // Move focus back to the last newly added card for keyboard users
    const lastCardLink = listEl.querySelector("li:last-child a");
    if (lastCardLink) {
      lastCardLink.focus();
    }
  });
}

// Initialize when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initDirectory);
} else {
  initDirectory();
}

