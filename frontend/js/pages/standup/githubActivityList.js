/**
 * @fileoverview GitHub Activity List Component
 * Reusable component for displaying and selecting GitHub activities
 */

import { loadTemplate } from "../../utils/templateLoader.js";

/**
 * Simple icons for activity types (using Unicode symbols)
 */
export const ACTIVITY_ICONS = {
  commit: "●",
  pr: "⑃",
  review: "✓",
  issue: "◉"
};

/**
 * Activity type configuration
 */
export const ACTIVITY_TYPES = {
  commit: { icon: ACTIVITY_ICONS.commit, iconClass: "activity-icon-commit" },
  pr: { icon: ACTIVITY_ICONS.pr, iconClass: "activity-icon-pr" },
  review: { icon: ACTIVITY_ICONS.review, iconClass: "activity-icon-review" },
  issue: { icon: ACTIVITY_ICONS.issue, iconClass: "activity-icon-issue" }
};

/**
 * Escape HTML special characters
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Transform raw GitHub activity data into a flat list of items
 * @param {Object} activity - Activity object with commits, pullRequests, reviews, issues
 * @returns {Array} Array of activity item objects
 */
export function transformActivityData(activity) {
  const items = [];

  // Add commits
  (activity.commits || []).forEach((commit, idx) => {
    const shortRepo = commit.repo.split("/").pop();
    items.push({
      type: "commit",
      id: `commit-${idx}`,
      ...ACTIVITY_TYPES.commit,
      label: `[${shortRepo}] ${commit.message}`,
      url: commit.url,
      text: `- [${shortRepo}] ${commit.message}`
    });
  });

  // Add PRs
  (activity.pullRequests || []).forEach((pr, idx) => {
    const shortRepo = pr.repo.split("/").pop();
    const actionLabel = pr.action === "opened" ? "Opened" : pr.action === "closed" ? "Closed" : pr.action;
    items.push({
      type: "pr",
      id: `pr-${idx}`,
      ...ACTIVITY_TYPES.pr,
      label: `[${shortRepo}] PR #${pr.number}: ${pr.title} (${actionLabel})`,
      url: pr.url,
      text: `- [${shortRepo}] PR #${pr.number}: ${pr.title} (${actionLabel})`
    });
  });

  // Add reviews
  (activity.reviews || []).forEach((review, idx) => {
    const shortRepo = review.repo.split("/").pop();
    const stateLabel = review.state === "approved" ? "Approved" :
      review.state === "changes_requested" ? "Requested changes" : "Commented";
    items.push({
      type: "review",
      id: `review-${idx}`,
      ...ACTIVITY_TYPES.review,
      label: `[${shortRepo}] Reviewed PR #${review.prNumber} (${stateLabel})`,
      url: review.url,
      text: `- [${shortRepo}] Reviewed PR #${review.prNumber} (${stateLabel})`
    });
  });

  // Add issues
  (activity.issues || []).forEach((issue, idx) => {
    const shortRepo = issue.repo.split("/").pop();
    const actionLabel = issue.action === "opened" ? "Opened" : "Closed";
    items.push({
      type: "issue",
      id: `issue-${idx}`,
      ...ACTIVITY_TYPES.issue,
      label: `[${shortRepo}] Issue #${issue.number}: ${issue.title} (${actionLabel})`,
      url: issue.url,
      text: `- [${shortRepo}] Issue #${issue.number}: ${issue.title} (${actionLabel})`
    });
  });

  return items;
}

/**
 * Render a single activity item with checkbox
 * @param {Object} item - Activity item object
 * @returns {HTMLElement} Activity item element
 */
export function renderActivityItem(item) {
  const itemEl = document.createElement("label");
  itemEl.className = `github-activity-item ${item.iconClass}`;

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.checked = true;
  checkbox.className = "activity-checkbox";
  checkbox.dataset.text = item.text;

  const iconSpan = document.createElement("span");
  iconSpan.className = "activity-icon";
  iconSpan.textContent = item.icon;

  const link = document.createElement("a");
  link.href = item.url;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.className = "activity-label";
  link.textContent = item.label;
  link.onclick = (e) => e.stopPropagation();

  itemEl.appendChild(checkbox);
  itemEl.appendChild(iconSpan);
  itemEl.appendChild(link);

  return itemEl;
}

/**
 * Render activity list into a container
 * @param {Array} items - Array of activity items (from transformActivityData)
 * @param {HTMLElement} container - Container element to render into
 */
export function renderActivityList(items, container) {
  container.innerHTML = "";

  if (items.length === 0) {
    const emptyDiv = document.createElement("div");
    emptyDiv.className = "github-activity-empty";
    emptyDiv.textContent = "No GitHub activity in the last 24 hours.";
    container.appendChild(emptyDiv);
    return;
  }

  items.forEach(item => {
    container.appendChild(renderActivityItem(item));
  });
}

/**
 * Get selected items text from activity list
 * @param {HTMLElement} container - Container with activity items
 * @returns {Array<string>} Array of selected item text
 */
export function getSelectedItemsText(container) {
  const checkboxes = container.querySelectorAll(".activity-checkbox:checked");
  return Array.from(checkboxes).map(cb => cb.dataset.text);
}

/**
 * Select or deselect all checkboxes in container
 * @param {HTMLElement} container - Container with activity items
 * @param {boolean} checked - Whether to check or uncheck
 */
export function toggleAllItems(container, checked) {
  const checkboxes = container.querySelectorAll(".activity-checkbox");
  checkboxes.forEach(cb => cb.checked = checked);
}

/**
 * Render a single stored activity item (read-only, no checkbox)
 * @param {Object} activity - Stored activity object {type, label, url}
 * @returns {HTMLElement} Activity item element
 */
export function renderStoredActivityItem(activity) {
  const type = activity.type || "commit";
  const config = ACTIVITY_TYPES[type] || ACTIVITY_TYPES.commit;

  const itemEl = document.createElement("div");
  itemEl.className = `history-activity-item ${config.iconClass}`;

  const iconSpan = document.createElement("span");
  iconSpan.className = "activity-icon";
  iconSpan.textContent = config.icon;

  const link = document.createElement("a");
  link.href = activity.url;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.className = "activity-label";
  link.textContent = activity.label;

  itemEl.appendChild(iconSpan);
  itemEl.appendChild(link);

  return itemEl;
}

/**
 * Render stored activities into a container (read-only display)
 * @param {Array} activities - Array of stored activities {type, label, url}
 * @param {HTMLElement} container - Container element to render into
 */
export function renderStoredActivities(activities, container) {
  container.innerHTML = "";

  if (!activities || !Array.isArray(activities) || activities.length === 0) {
    return;
  }

  activities.forEach(activity => {
    container.appendChild(renderStoredActivityItem(activity));
  });
}

/**
 * Generate HTML string for stored activities (for use with templates)
 * @param {Array} activities - Array of stored activities {type, label, url}
 * @returns {string} HTML string
 */
export function generateStoredActivitiesHtml(activities) {
  if (!activities || !Array.isArray(activities) || activities.length === 0) {
    return "";
  }

  return activities.map(activity => {
    const type = activity.type || "commit";
    const config = ACTIVITY_TYPES[type] || ACTIVITY_TYPES.commit;

    return `<div class="history-activity-item ${config.iconClass}">
        <span class="activity-icon">${config.icon}</span>
        <a href="${escapeHtml(activity.url)}" target="_blank" rel="noopener noreferrer" class="activity-label">${escapeHtml(activity.label)}</a>
      </div>`;
  }).join("");
}

/**
 * Create and setup a GitHub activity container with controls
 * Uses template from standup/components/githubActivityContainer.html
 * @param {Object} options - Configuration options
 * @param {HTMLElement} options.container - Parent container to append to
 * @param {Array} options.items - Activity items to display
 * @param {Function} options.onAdd - Callback when "Add Selected" is clicked, receives selected texts
 * @param {Function} options.onClose - Callback when "Close" is clicked
 * @returns {Promise<HTMLElement>} The activity container element
 */
export async function createActivityContainer({ container, items, onAdd, onClose }) {
  // Load container template
  const templateHtml = await loadTemplate("standup", "components/githubActivityContainer");

  // Create a temporary container to parse the template
  const temp = document.createElement("div");
  temp.innerHTML = templateHtml;

  // Get the template content
  const template = temp.querySelector("#github-activity-container-template");
  const activityContainer = template ? template.content.cloneNode(true).firstElementChild : null;

  if (!activityContainer) {
    // Fallback: create manually if template not found
    const fallback = document.createElement("div");
    fallback.className = "github-activity-container";
    fallback.innerHTML = `
      <div class="github-activity-header">
        <span class="github-activity-title">GitHub Activity (Last 24h)</span>
        <div class="github-activity-actions">
          <button type="button" class="btn-link github-select-all">Select All</button>
          <button type="button" class="btn-link github-deselect-all">Deselect All</button>
        </div>
      </div>
      <div class="github-activity-list"></div>
      <div class="github-activity-footer">
        <button type="button" class="btn-github-add">Add Selected to Standup</button>
        <button type="button" class="btn-link btn-close-activities">Close</button>
      </div>
    `;
    return setupActivityContainer(fallback, items, onAdd, onClose, container);
  }

  return setupActivityContainer(activityContainer, items, onAdd, onClose, container);
}

/**
 * Setup activity container with event listeners
 * @private
 */
function setupActivityContainer(activityContainer, items, onAdd, onClose, parentContainer) {
  // Render items
  const listContainer = activityContainer.querySelector(".github-activity-list");
  renderActivityList(items, listContainer);

  // Setup controls
  activityContainer.querySelector(".github-select-all").addEventListener("click", () => {
    toggleAllItems(listContainer, true);
  });

  activityContainer.querySelector(".github-deselect-all").addEventListener("click", () => {
    toggleAllItems(listContainer, false);
  });

  activityContainer.querySelector(".btn-github-add").addEventListener("click", () => {
    const selectedTexts = getSelectedItemsText(listContainer);
    if (onAdd) onAdd(selectedTexts);
  });

  activityContainer.querySelector(".btn-close-activities").addEventListener("click", () => {
    if (onClose) onClose();
  });

  // Append to parent container
  if (parentContainer) {
    parentContainer.appendChild(activityContainer);
  }

  return activityContainer;
}
