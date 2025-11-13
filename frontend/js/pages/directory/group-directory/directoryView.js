/**
 * Group Directory View
 * Renders paginated group/team cards with filtering by status
 */

import { getCourseTeams } from "../../../api/directory/directoryApiMock.js";

// State management for pagination and filtering
const currentState = {
  courseUuid: null,
  page: 1,
  limit: 3,
  filter: "all", // "all", "healthy", "at-risk", "critical", "excellent"
  totalCount: 0,
  totalPages: 0
};

/**
 * Render directory header
 * @param {string} courseName - Course name
 * @param {number} totalCount - Total number of teams
 * @returns {string} HTML string
 */
function renderHeader(courseName, totalCount) {
  return `
    <div class="directory-header">
      <h1>Group Directory</h1>
      <p>${courseName} - ${totalCount} ${totalCount === 1 ? "team" : "teams"}</p>
    </div>
  `;
}

/**
 * Render filter buttons
 * @param {Object} counts - Team counts by status
 * @returns {string} HTML string
 */
function renderFilters(counts) {
  const filters = [
    { value: "all", label: "All", count: counts.all },
    { value: "healthy", label: "On Track", count: counts.healthy },
    { value: "at-risk", label: "At Risk", count: counts.at_risk },
    { value: "critical", label: "Critical", count: counts.critical },
    { value: "excellent", label: "Excellent", count: counts.excellent }
  ];

  const filterButtons = filters.map(filter => {
    const activeClass = currentState.filter === filter.value ? "active" : "";
    return `
      <button
        class="filter-btn ${activeClass}"
        data-filter="${filter.value}">
        ${filter.label} (${filter.count})
      </button>
    `;
  }).join("");

  const startIndex = (currentState.page - 1) * currentState.limit + 1;
  const endIndex = Math.min(currentState.page * currentState.limit, currentState.totalCount);
  const resultsText = currentState.totalCount > 0
    ? `Showing ${startIndex}-${endIndex} of ${currentState.totalCount}`
    : "No results";

  return `
    <div class="filter-section">
      <div class="filter-buttons">
        ${filterButtons}
      </div>
      <div class="results-count">${resultsText}</div>
    </div>
  `;
}

/**
 * Render group card
 * @param {Object} team - Team data
 * @returns {string} HTML string
 */
function renderGroupCard(team) {
  // Determine status class
  let statusClass = "status-healthy";
  if (team.status_health === "At Risk") {
    statusClass = "status-at-risk";
  } else if (team.status_health === "Critical") {
    statusClass = "status-critical";
  } else if (team.status_health === "Excellent") {
    statusClass = "status-excellent";
  }

  // Render tags (show up to 2)
  const tagsHtml = team.tags && team.tags.length > 0
    ? team.tags.slice(0, 2).map(tag => `<span class="group-tag">${tag}</span>`).join("")
    : "";

  return `
    <a href="group-profile.html?team=${team.team_uuid}" class="group-card">
      <div class="group-card-header">
        <div class="group-icon">👥</div>
        <div class="group-info">
          <div class="group-name">${team.team_name}</div>
          <div class="group-project">${team.project_name || "No project assigned"}</div>
          <span class="group-status ${statusClass}">${team.status_health}</span>
        </div>
      </div>
      <div class="group-meta">
        <div class="group-members">
          <span class="group-members-icon">🧑‍🤝‍🧑</span>
          <span>${team.member_count} ${team.member_count === 1 ? "member" : "members"}</span>
        </div>
        ${tagsHtml ? `<div class="group-tags">${tagsHtml}</div>` : ""}
      </div>
    </a>
  `;
}

/**
 * Render group grid
 * @param {Array} teams - List of teams
 * @returns {string} HTML string
 */
function renderGroupGrid(teams) {
  if (!teams || teams.length === 0) {
    return `
      <div class="no-data">
        <h3>No teams found</h3>
        <p>Try adjusting your filters</p>
      </div>
    `;
  }

  const cards = teams.map(team => renderGroupCard(team)).join("");

  return `
    <div class="group-grid">
      ${cards}
    </div>
  `;
}

/**
 * Render pagination controls
 * @returns {string} HTML string
 */
function renderPagination() {
  if (currentState.totalPages <= 1) {
    return ""; // Don't show pagination if only one page
  }

  const pages = [];
  const maxVisiblePages = 5;
  let startPage = Math.max(1, currentState.page - Math.floor(maxVisiblePages / 2));
  const endPage = Math.min(currentState.totalPages, startPage + maxVisiblePages - 1);

  // Adjust start if we're near the end
  if (endPage - startPage < maxVisiblePages - 1) {
    startPage = Math.max(1, endPage - maxVisiblePages + 1);
  }

  // Previous button
  const prevDisabled = currentState.page === 1 ? "disabled" : "";
  pages.push(`
    <button class="pagination-btn" data-page="${currentState.page - 1}" ${prevDisabled}>
      « Previous
    </button>
  `);

  // First page + ellipsis
  if (startPage > 1) {
    pages.push(`
      <button class="pagination-btn" data-page="1">1</button>
    `);
    if (startPage > 2) {
      pages.push(`
        <span class="pagination-info">...</span>
      `);
    }
  }

  // Page numbers
  for (let i = startPage; i <= endPage; i++) {
    const activeClass = i === currentState.page ? "active" : "";
    pages.push(`
      <button class="pagination-btn ${activeClass}" data-page="${i}">
        ${i}
      </button>
    `);
  }

  // Ellipsis + last page
  if (endPage < currentState.totalPages) {
    if (endPage < currentState.totalPages - 1) {
      pages.push(`
        <span class="pagination-info">...</span>
      `);
    }
    pages.push(`
      <button class="pagination-btn" data-page="${currentState.totalPages}">
        ${currentState.totalPages}
      </button>
    `);
  }

  // Next button
  const nextDisabled = currentState.page === currentState.totalPages ? "disabled" : "";
  pages.push(`
    <button class="pagination-btn" data-page="${currentState.page + 1}" ${nextDisabled}>
      Next »
    </button>
  `);

  return `
    <div class="pagination">
      ${pages.join("")}
    </div>
  `;
}

/**
 * Setup event listeners for filters and pagination
 * @param {HTMLElement} container - Directory container
 */
function setupEventListeners(container) {
  // Filter button listeners
  const filterButtons = container.querySelectorAll(".filter-btn");
  filterButtons.forEach(button => {
    button.addEventListener("click", async () => {
      currentState.filter = button.dataset.filter;
      currentState.page = 1; // Reset to page 1 when filter changes
      await renderGroupDirectory(currentState.courseUuid, container);
    });
  });

  // Pagination button listeners
  const paginationButtons = container.querySelectorAll(".pagination-btn");
  paginationButtons.forEach(button => {
    button.addEventListener("click", async () => {
      if (button.disabled) return;
      currentState.page = parseInt(button.dataset.page);
      await renderGroupDirectory(currentState.courseUuid, container);
      // Scroll to top of page
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  });
}

/**
 * Render complete group directory view
 * @param {string} courseUuid - Course UUID
 * @param {HTMLElement} container - Container element to render into
 */
export async function renderGroupDirectory(courseUuid, container) {
  try {
    // Update state
    currentState.courseUuid = courseUuid;

    // Show loading state
    container.innerHTML = "<div class=\"loading\">Loading groups...</div>";

    // Fetch team data with pagination and filter
    const teamsData = await getCourseTeams(
      courseUuid,
      currentState.page,
      currentState.limit,
      currentState.filter
    );

    // Update state with response data
    currentState.totalCount = teamsData.total_count;
    currentState.totalPages = teamsData.total_pages;

    // Render the complete directory
    container.innerHTML = `
      <div class="group-directory">
        ${renderHeader(teamsData.course_name, teamsData.total_count)}
        ${renderFilters(teamsData.counts)}
        ${renderGroupGrid(teamsData.teams)}
        ${renderPagination()}
      </div>
    `;

    // Setup event listeners
    setupEventListeners(container);

  } catch (error) {
    container.innerHTML = `
      <div class="error-message">
        <h2>Error Loading Groups</h2>
        <p>${error.message || "Failed to load groups. Please try again later."}</p>
      </div>
    `;
  }
}
