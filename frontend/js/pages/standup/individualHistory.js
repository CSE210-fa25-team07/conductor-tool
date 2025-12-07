/**
 * @fileoverview Individual History View
 * Displays a user's standup history (own history or another user's for TAs)
 */

import { getUserStandups, getStandupsByUser, deleteStandup } from "../../api/standupApi.js";
import { getActiveCourse } from "../../utils/userContext.js";
import { renderComponent, renderComponents } from "../../utils/componentLoader.js";
import { loadTemplate } from "../../utils/templateLoader.js";
import { navigateToView, navigateBack } from "./courseIntegration.js";
import { generateStoredActivitiesHtml } from "./githubActivityList.js";


// Store current view context
let viewContext = {
  userUuid: null,
  userName: null,
  isViewingOther: false
};

// Store loaded standups for edit access
let loadedStandups = [];

/**
 * Show a custom confirmation modal
 * @param {Object} options - Modal options
 * @param {string} options.title - Modal title
 * @param {string} options.message - Modal message
 * @param {string} options.confirmText - Confirm button text
 * @param {string} options.cancelText - Cancel button text
 * @param {boolean} options.danger - Use danger styling for confirm button
 * @returns {Promise<boolean>} - Resolves true if confirmed, false if cancelled
 */
function showConfirm({ title = "Confirm", message, confirmText = "Confirm", cancelText = "Cancel", danger = false }) {
  return new Promise((resolve) => {
    const overlay = document.createElement("div");
    overlay.className = "confirm-modal-overlay";
    overlay.innerHTML = `
      <div class="confirm-modal">
        <div class="confirm-modal-header">
          <h3 class="confirm-modal-title">${title}</h3>
        </div>
        <div class="confirm-modal-body">
          <p class="confirm-modal-message">${message}</p>
        </div>
        <div class="confirm-modal-actions">
          <button class="confirm-modal-btn cancel">${cancelText}</button>
          <button class="confirm-modal-btn ${danger ? "danger" : "confirm"}">${confirmText}</button>
        </div>
      </div>
    `;

    const closeModal = (result) => {
      overlay.remove();
      resolve(result);
    };

    overlay.querySelector(".confirm-modal-btn.cancel").addEventListener("click", () => closeModal(false));
    overlay.querySelector(".confirm-modal-btn:not(.cancel)").addEventListener("click", () => closeModal(true));

    // Close on overlay click (outside modal)
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) closeModal(false);
    });

    // Close on Escape key
    const handleKeydown = (e) => {
      if (e.key === "Escape") {
        document.removeEventListener("keydown", handleKeydown);
        closeModal(false);
      }
    };
    document.addEventListener("keydown", handleKeydown);

    document.body.appendChild(overlay);
  });
}

/**
 * Render the history view
 * @param {HTMLElement} container - Container to render into
 * @param {Object} params - Optional params (userUuid, userName for TA viewing student)
 */
export async function render(container, params = {}) {
  // Store context for viewing another user's history
  viewContext = {
    userUuid: params.userUuid || null,
    userName: params.userName || null,
    isViewingOther: !!params.userUuid
  };

  // Load page template
  const pageHTML = await loadTemplate("standup", "individualHistory");
  container.innerHTML = pageHTML;

  // Add header for viewing another user (TA view)
  const headerPlaceholder = document.getElementById("history-header-placeholder");
  if (headerPlaceholder && viewContext.isViewingOther) {
    headerPlaceholder.outerHTML = await renderComponent("standup/studentHistoryHeader", {
      userName: viewContext.userName
    });
    // Attach back button listener
    document.getElementById("back-to-dashboard")?.addEventListener("click", () => {
      navigateBack();
    });
  }

  // Render filter bar (simplified for TA view, full for own history)
  const filterBarPlaceholder = document.getElementById("filter-bar-placeholder");
  if (filterBarPlaceholder) {
    if (viewContext.isViewingOther) {
      // Simpler filter for TA viewing student
      filterBarPlaceholder.outerHTML = await renderComponent("standup/historyFilterTA", {});
    } else {
      filterBarPlaceholder.outerHTML = await renderComponent("standup/historyFilterUser", {});
    }
  }

  // Attach event listeners
  attachFilterListeners();

  // Load initial data
  await loadHistory();
}

/**
 * Attach filter event listeners
 */
function attachFilterListeners() {
  const inputs = [
    "filter-start-date",
    "filter-end-date"
  ];

  inputs.forEach(id => {
    document.getElementById(id)?.addEventListener("change", loadHistory);
  });
}

/**
 * Load history data based on filters
 */
async function loadHistory() {
  const contentDiv = document.getElementById("history-content");
  const activeCourse = getActiveCourse();

  try {
    contentDiv.innerHTML = "<div class=\"loading-message\">Loading history...</div>";

    const filters = {
      startDate: document.getElementById("filter-start-date")?.value,
      endDate: document.getElementById("filter-end-date")?.value
    };

    let standups;
    if (viewContext.isViewingOther) {
      // TA viewing another user's history
      standups = await getStandupsByUser(viewContext.userUuid, activeCourse.courseUuid, filters);
    } else {
      // User viewing their own history
      standups = await getUserStandups(filters);
    }

    // Store standups for edit access
    loadedStandups = standups;

    if (standups.length > 0) {
      const cardData = standups.map(standup => prepareHistoryCardData(standup, viewContext.isViewingOther));
      const standupsHTML = await renderComponents("standup/historyCard", cardData);
      contentDiv.innerHTML = `<div class="standup-list">${standupsHTML}</div>`;

      // Attach action listeners (only for own history)
      if (!viewContext.isViewingOther) {
        attachActionListeners(contentDiv);
      }
    } else {
      const emptyText = viewContext.isViewingOther
        ? "This student has no standups in the selected date range."
        : "Try adjusting your filters or submit a new standup.";
      contentDiv.innerHTML = await renderComponent("standup/emptyState", {
        icon: "📝",
        title: "No standups found",
        text: emptyText
      });
    }

  } catch (error) {
    contentDiv.innerHTML = `
      <div class="error-message">
        Failed to load history: ${error.message}
      </div>
    `;
  }
}

/**
 * Prepare data for history card template
 * @param {Object} standup - Standup data
 * @param {boolean} readOnly - Hide edit/delete buttons (for TA view)
 */
function prepareHistoryCardData(standup, readOnly = false) {
  const dateObj = new Date(standup.dateSubmitted);
  const hasBlocker = !!standup.blockers;
  const hasGithubActivities = standup.githubActivities && Array.isArray(standup.githubActivities) && standup.githubActivities.length > 0;

  return {
    standupUuid: standup.standupUuid,
    date: dateObj.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric"
    }),
    time: dateObj.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit"
    }),
    moodScore: standup.sentimentScore || 3,
    teamName: standup.team?.teamName || "Unknown Team",
    hasBlocker,
    blockerClass: hasBlocker ? "has-blocker" : "",
    showActions: !readOnly,
    hasGithubActivities,
    githubActivitiesHtml: hasGithubActivities ? generateStoredActivitiesHtml(standup.githubActivities) : "",
    whatDone: standup.whatDone || "",
    whatNext: standup.whatNext || "",
    blockers: standup.blockers || ""
  };
}

/**
 * Attach listeners for edit/delete buttons
 * @param {HTMLElement} container - Container element
 */
function attachActionListeners(container) {
  container.querySelectorAll(".edit-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const id = e.target.dataset.id;
      const standup = loadedStandups.find(s => s.standupUuid === id);
      if (standup) {
        navigateToView("form", { standupData: standup });
      }
    });
  });

  container.querySelectorAll(".delete-btn").forEach(btn => {
    btn.addEventListener("click", async (e) => {
      const id = e.target.dataset.id;
      const confirmed = await showConfirm({
        title: "Delete Standup",
        message: "Are you sure you want to delete this standup? This action cannot be undone.",
        confirmText: "Delete",
        cancelText: "Cancel",
        danger: true
      });

      if (confirmed) {
        try {
          await deleteStandup(id);
          await loadHistory();
        } catch (error) {
          alert(`Failed to delete: ${error.message}`);
        }
      }
    });
  });
}
