/**
 * @fileoverview Individual History View
 * Displays user's standup history with filtering
 */

import { getUserStandups, deleteStandup } from "../../api/standupApi.js";
import { getActiveCourse, getUserTeams, getEnrolledCourses } from "../../utils/userContext.js";
import { renderComponent, renderComponents } from "../../utils/componentLoader.js";
import { loadTemplate } from "../../utils/templateLoader.js";

const currentFilters = {};

/**
 * Render the individual history view
 * @param {HTMLElement} container - Container to render into
 */
export async function render(container) {
  // Initialize filters if not set
  if (!currentFilters.courseUuid) {
    const activeCourse = getActiveCourse();
    currentFilters.courseUuid = activeCourse?.courseUuid;
  }

  // Load page template
  const pageHTML = await loadTemplate("standup", "individualHistory");
  container.innerHTML = pageHTML;

  // Insert filters
  const filtersPlaceholder = document.getElementById("history-filters-placeholder");
  if (filtersPlaceholder) {
    filtersPlaceholder.outerHTML = renderFilters();
  }

  // Attach filter event listeners
  setupFilterListeners();

  // Load standups
  await loadStandups();
}

/**
 * Render filter controls
 */
function renderFilters() {
  const enrolledCourses = getEnrolledCourses();
  const userTeams = getUserTeams();

  // Filter teams for selected course
  const courseTeams = currentFilters.courseUuid
    ? userTeams.filter(t => t.courseUuid === currentFilters.courseUuid)
    : [];

  return `
    <div class="history-filters">
      <div class="filter-row">
        <div class="filter-group">
          <label for="filter-course">Course</label>
          <select id="filter-course">
            <option value="">All Courses</option>
            ${enrolledCourses.map(course => `
              <option
                value="${course.courseUuid}"
                ${currentFilters.courseUuid === course.courseUuid ? "selected" : ""}
              >
                ${course.courseCode} - ${course.courseName}
              </option>
            `).join("")}
          </select>
        </div>

        ${courseTeams.length > 0 ? `
          <div class="filter-group">
            <label for="filter-team">Team</label>
            <select id="filter-team">
              <option value="">All Teams</option>
              ${courseTeams.map(team => `
                <option
                  value="${team.teamUuid}"
                  ${currentFilters.teamUuid === team.teamUuid ? "selected" : ""}
                >
                  ${team.teamName}
                </option>
              `).join("")}
            </select>
          </div>
        ` : ""}

        <div class="filter-group">
          <label for="filter-start-date">Start Date</label>
          <input
            type="date"
            id="filter-start-date"
            value="${currentFilters.startDate || ""}"
          >
        </div>

        <div class="filter-group">
          <label for="filter-end-date">End Date</label>
          <input
            type="date"
            id="filter-end-date"
            value="${currentFilters.endDate || ""}"
          >
        </div>
      </div>
    </div>
  `;
}

/**
 * Setup filter event listeners
 */
function setupFilterListeners() {
  const courseSelect = document.getElementById("filter-course");
  const teamSelect = document.getElementById("filter-team");
  const startDateInput = document.getElementById("filter-start-date");
  const endDateInput = document.getElementById("filter-end-date");

  courseSelect?.addEventListener("change", async (e) => {
    currentFilters.courseUuid = e.target.value || null;
    currentFilters.teamUuid = null; // Reset team when course changes
    const container = document.querySelector(".history-view").parentElement;
    await render(container);
  });

  teamSelect?.addEventListener("change", async (e) => {
    currentFilters.teamUuid = e.target.value || null;
    await loadStandups();
  });

  startDateInput?.addEventListener("change", async (e) => {
    currentFilters.startDate = e.target.value || null;
    await loadStandups();
  });

  endDateInput?.addEventListener("change", async (e) => {
    currentFilters.endDate = e.target.value || null;
    await loadStandups();
  });
}

/**
 * Load standups from API
 */
async function loadStandups() {
  const contentDiv = document.getElementById("history-content");

  try {
    contentDiv.innerHTML = "<div class=\"loading-message\">Loading standups...</div>";

    const standups = await getUserStandups(currentFilters);

    if (standups.length === 0) {
      contentDiv.innerHTML = await renderEmptyState();
    } else {
      const standupCardsHTML = await renderComponents("standupCard", standups.map(prepareStandupData));
      contentDiv.innerHTML = `<div class="standup-list">${standupCardsHTML}</div>`;

      // Attach event listeners to action buttons
      attachCardListeners();
    }
  } catch (error) {
    contentDiv.innerHTML = `
      <div class="error-message">
        Failed to load standups: ${error.message}
      </div>
    `;
  }
}

/**
 * Prepare standup data for template
 * @param {Object} standup - Standup data
 * @returns {Object} Template data
 */
function prepareStandupData(standup) {
  const dateFormatted = new Date(standup.dateSubmitted).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
  });

  const createdAtFormatted = new Date(standup.createdAt).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });

  return {
    standupUuid: standup.standupUuid,
    dateFormatted,
    createdAtFormatted,
    teamName: standup.team?.teamName || null,
    sentimentScore: standup.sentimentScore,
    moodEmoji: standup.sentimentScore ? renderMood(standup.sentimentScore) : null,
    whatDone: standup.whatDone,
    whatNext: standup.whatNext,
    blockers: standup.blockers || null,
    reflection: standup.reflection || null
  };
}

/**
 * Render mood emoji
 * @param {number} score - Sentiment score (1-5)
 */
function renderMood(score) {
  const moods = {
    1: "😞",
    2: "😕",
    3: "😐",
    4: "🙂",
    5: "😄"
  };
  return moods[score] || "😐";
}

/**
 * Render empty state
 */
async function renderEmptyState() {
  return await renderComponent("emptyState", {
    icon: "📝",
    title: "No standups yet",
    text: "Submit your first standup to start tracking your progress!"
  });
}

/**
 * Attach event listeners to card action buttons
 */
function attachCardListeners() {
  const editButtons = document.querySelectorAll(".btn-edit");
  const deleteButtons = document.querySelectorAll(".btn-delete");

  editButtons.forEach(btn => {
    btn.addEventListener("click", handleEdit);
  });

  deleteButtons.forEach(btn => {
    btn.addEventListener("click", handleDelete);
  });
}

/**
 * Handle edit button click
 * @param {Event} event - Click event
 */
async function handleEdit(event) {
  const standupId = event.target.getAttribute("data-standup-id");

  try {
    // Get full standup data
    const standups = await getUserStandups(currentFilters);
    const standup = standups.find(s => s.standupUuid === standupId);

    if (!standup) {
      throw new Error("Standup not found");
    }

    // Switch to form view with edit mode
    const container = document.querySelector(".history-view").parentElement;
    const formModule = await import("./standupForm.js");
    await formModule.render(container, standup);

    // Update navigation
    document.querySelectorAll(".standup-nav button").forEach(btn => {
      btn.classList.remove("active");
    });
    document.getElementById("nav-form")?.classList.add("active");

  } catch (error) {
    alert(`Failed to load standup: ${error.message}`);
  }
}

/**
 * Handle delete button click
 * @param {Event} event - Click event
 */
async function handleDelete(event) {
  const standupId = event.target.getAttribute("data-standup-id");

  if (!confirm("Are you sure you want to delete this standup? This action cannot be undone.")) {
    return;
  }

  try {
    event.target.disabled = true;
    event.target.textContent = "Deleting...";

    await deleteStandup(standupId);

    // Remove card from DOM
    const card = document.querySelector(`[data-standup-id="${standupId}"]`);
    card.remove();

    // Check if list is now empty
    const remainingCards = document.querySelectorAll(".standup-card");
    if (remainingCards.length === 0) {
      document.getElementById("history-content").innerHTML = renderEmptyState();
    }

  } catch (error) {
    alert(`Failed to delete standup: ${error.message}`);
    event.target.disabled = false;
    event.target.textContent = "Delete";
  }
}
