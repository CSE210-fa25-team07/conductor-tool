/**
 * User Directory View
 * Renders paginated user cards with filtering by role
 */

import { getCourseRoster } from "../../../api/directory/directoryApiMock.js";

// State management for pagination and filtering
const currentState = {
  courseUuid: null,
  page: 1,
  limit: 12,
  filter: "all", // "all", "student", "instructor", "ta"
  totalCount: 0,
  totalPages: 0
};

/**
 * Render directory header
 * @param {string} courseName - Course name
 * @param {number} totalCount - Total number of users
 * @returns {string} HTML string
 */
function renderHeader(courseName, totalCount) {
  return `
    <div class="directory-header">
      <h1>Class Roster</h1>
      <p>${courseName} - ${totalCount} ${totalCount === 1 ? "person" : "people"}</p>
    </div>
  `;
}

/**
 * Render filter buttons
 * @param {Object} counts - User counts by role
 * @returns {string} HTML string
 */
function renderFilters(counts) {
  const filters = [
    { value: "all", label: "All", count: counts.all },
    { value: "student", label: "Students", count: counts.students },
    { value: "instructor", label: "Instructors", count: counts.instructors },
    { value: "ta", label: "TAs", count: counts.tas }
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
 * Render user card
 * @param {Object} user - User data
 * @returns {string} HTML string
 */
function renderUserCard(user) {
  // Determine role display and class
  let roleDisplay = "Student";
  let roleClass = "role-student";

  if (user.role === "instructor") {
    roleDisplay = "Instructor";
    roleClass = "role-instructor";
  } else if (user.role === "ta") {
    roleDisplay = "TA";
    roleClass = "role-ta";
  }

  // Photo or placeholder
  const photoHtml = user.photo_url
    ? `<img src="${user.photo_url}" alt="${user.first_name} ${user.last_name}">`
    : "👤";

  // Additional metadata
  let metaText = "";
  if (user.role === "student" && user.year) {
    const yearNames = ["", "Freshman", "Sophomore", "Junior", "Senior"];
    metaText = yearNames[user.year] || `Year ${user.year}`;
  } else if (user.office_location) {
    metaText = user.office_location;
  }

  return `
    <a href="user-profile.html?user=${user.user_uuid}" class="user-card">
      <div class="user-photo">${photoHtml}</div>
      <div class="user-info">
        <div class="user-name">${user.first_name} ${user.last_name}</div>
        <div class="user-role ${roleClass}">${roleDisplay}</div>
        <div class="user-email">${user.email}</div>
        ${metaText ? `<div class="user-meta">${metaText}</div>` : ""}
      </div>
    </a>
  `;
}

/**
 * Render user grid
 * @param {Array} users - List of users
 * @returns {string} HTML string
 */
function renderUserGrid(users) {
  if (!users || users.length === 0) {
    return `
      <div class="no-data">
        <h3>No users found</h3>
        <p>Try adjusting your filters</p>
      </div>
    `;
  }

  const cards = users.map(user => renderUserCard(user)).join("");

  return `
    <div class="user-grid">
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
    pages.push(`<button class="pagination-btn" data-page="1">1</button>`);
    if (startPage > 2) {
      pages.push(`<span class="pagination-info">...</span>`);
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
      pages.push(`<span class="pagination-info">...</span>`);
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
      await renderUserDirectory(currentState.courseUuid, container);
    });
  });

  // Pagination button listeners
  const paginationButtons = container.querySelectorAll(".pagination-btn");
  paginationButtons.forEach(button => {
    button.addEventListener("click", async () => {
      if (button.disabled) return;
      currentState.page = parseInt(button.dataset.page);
      await renderUserDirectory(currentState.courseUuid, container);
      // Scroll to top of page
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  });
}

/**
 * Render complete user directory view
 * @param {string} courseUuid - Course UUID
 * @param {HTMLElement} container - Container element to render into
 */
export async function renderUserDirectory(courseUuid, container) {
  try {
    // Update state
    currentState.courseUuid = courseUuid;

    // Show loading state
    container.innerHTML = "<div class=\"loading\">Loading roster...</div>";

    // Fetch roster data with pagination and filter
    const rosterData = await getCourseRoster(
      courseUuid,
      currentState.page,
      currentState.limit,
      currentState.filter
    );

    // Update state with response data
    currentState.totalCount = rosterData.total_count;
    currentState.totalPages = rosterData.total_pages;

    // Render the complete directory
    container.innerHTML = `
      <div class="user-directory">
        ${renderHeader(rosterData.course_name, rosterData.total_count)}
        ${renderFilters(rosterData.counts)}
        ${renderUserGrid(rosterData.users)}
        ${renderPagination()}
      </div>
    `;

    // Setup event listeners
    setupEventListeners(container);

  } catch (error) {
    container.innerHTML = `
      <div class="error-message">
        <h2>Error Loading Roster</h2>
        <p>${error.message || "Failed to load roster. Please try again later."}</p>
      </div>
    `;
  }
}
