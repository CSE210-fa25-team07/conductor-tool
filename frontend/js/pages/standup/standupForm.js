/**
 * @fileoverview Standup Form View
 * Handles creating and editing standup submissions
 */

import { createStandup, updateStandup } from "../../api/standupApi.js";
import { getGitHubStatus, getGitHubActivity, getConnectUrl } from "../../api/githubApi.js";
import { getActiveCourse, getUserTeams } from "../../utils/userContext.js";
import { refreshCurrentView, navigateBack } from "./courseIntegration.js";
import { loadTemplate } from "../../utils/templateLoader.js";

let editMode = false;
let editingStandupId = null;

/**
 * Render the standup form
 * @param {HTMLElement} container - Container to render into
 * @param {Object} params - Optional params (standupData for editing)
 */
export async function render(container, params = {}) {
  // Extract standupData from params
  const standupData = params.standupData || null;

  // Set edit mode if standupData provided
  editMode = !!standupData;
  editingStandupId = standupData?.standupUuid || null;

  // Reset selected activities for new form
  selectedActivities = [];
  currentActivityData = null;

  const activeCourse = getActiveCourse();
  const userTeams = getUserTeams();

  // Filter teams for the active course
  const courseTeams = userTeams.filter(t => t.courseUuid === activeCourse?.courseUuid);

  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split("T")[0];

  // Load page template
  const pageHTML = await loadTemplate("standup", "standupForm");
  container.innerHTML = pageHTML;

  // Set form title
  const formTitle = document.getElementById("form-title");
  if (formTitle) {
    formTitle.textContent = editMode ? "Edit Standup" : "Submit Daily Standup";
  }

  // Set date field
  const dateField = document.getElementById("date-submitted");
  if (dateField) {
    dateField.value = standupData?.dateSubmitted?.split("T")[0] || today;
    dateField.max = today;
  }

  // Insert team select if teams exist
  const teamSelectPlaceholder = document.getElementById("team-select-placeholder");
  if (teamSelectPlaceholder && courseTeams.length > 0) {
    // Use pill-style selector for teams - default to first team or editing team
    const selectedTeam = standupData?.teamUuid || courseTeams[0].teamUuid;
    teamSelectPlaceholder.innerHTML = `
      <label>Team *</label>
      <div class="team-pill-selector">
        ${courseTeams.map(team => `
          <label class="team-pill-option">
            <input type="radio" name="teamUuid" value="${team.teamUuid}" ${selectedTeam === team.teamUuid ? "checked" : ""} required>
            <span class="team-pill-content" title="${team.teamName}">${team.teamName}</span>
          </label>
        `).join("")}
      </div>
    `;
  } else if (teamSelectPlaceholder) {
    // Show message if no teams - standup requires a team
    teamSelectPlaceholder.innerHTML = `
      <div class="no-team-warning">
        You must be assigned to a team to submit standups.
      </div>
    `;
  }

  // Populate form fields with standupData if editing
  if (standupData) {
    const whatDone = document.getElementById("what-done");
    const whatNext = document.getElementById("what-next");
    const blockers = document.getElementById("blockers");
    const reflection = document.getElementById("reflection");

    if (whatDone) whatDone.value = standupData.whatDone || "";
    if (whatNext) whatNext.value = standupData.whatNext || "";
    if (blockers) blockers.value = standupData.blockers || "";
    if (reflection) reflection.value = standupData.reflection || "";

    // Set mood selector radio button
    const moodValue = standupData.sentimentScore || 3;
    const moodRadio = document.querySelector(`input[name="sentimentScore"][value="${moodValue}"]`);
    if (moodRadio) moodRadio.checked = true;

    // Set visibility radio button
    const visibilityValue = standupData.visibility || "team";
    const visibilityRadio = document.querySelector(`input[name="visibility"][value="${visibilityValue}"]`);
    if (visibilityRadio) visibilityRadio.checked = true;

    // Populate selected activities from stored githubActivities
    if (standupData.githubActivities && Array.isArray(standupData.githubActivities)) {
      selectedActivities = standupData.githubActivities.map(activity => ({
        type: activity.type,
        iconClass: `activity-icon-${activity.type}`,
        icon: getIconForType(activity.type),
        label: activity.label,
        url: activity.url,
        text: `- ${activity.label}`
      }));
      // Render selected activities section
      renderSelectedActivities();
    }
  }

  // Insert cancel button if in edit mode
  const cancelButtonPlaceholder = document.getElementById("cancel-button-placeholder");
  if (cancelButtonPlaceholder && editMode) {
    cancelButtonPlaceholder.outerHTML = "<button type=\"button\" class=\"btn-secondary\" id=\"cancel-edit\">Cancel</button>";
  }

  // Update submit button text
  const submitButton = document.getElementById("submit-button");
  if (submitButton) {
    submitButton.textContent = editMode ? "Update Standup" : "Submit Standup";
  }

  // Attach event listeners
  const form = document.getElementById("standup-form");
  form.addEventListener("submit", handleSubmit);

  if (editMode) {
    const cancelBtn = document.getElementById("cancel-edit");
    cancelBtn?.addEventListener("click", () => {
      editMode = false;
      editingStandupId = null;
      navigateBack();
    });
  }

  // Setup GitHub integration
  await setupGitHubIntegration();
}

/**
 * Setup GitHub integration section
 */
async function setupGitHubIntegration() {
  const githubSection = document.getElementById("github-section");
  const fetchGithubBtn = document.getElementById("fetch-github-btn");

  if (!githubSection) return;

  try {
    const status = await getGitHubStatus();

    if (status.connected) {
      // Show connected status
      githubSection.innerHTML = `
        <div class="github-status github-connected">
          <span class="github-icon">&#xf09b;</span>
          <span>Connected as <strong>@${status.username}</strong></span>
        </div>
      `;

      // Show the fetch button
      if (fetchGithubBtn) {
        fetchGithubBtn.style.display = "inline-block";
        fetchGithubBtn.addEventListener("click", handleFetchFromGitHub);
      }
    } else {
      // Show connect prompt - include courseUuid for redirect after auth
      const activeCourse = getActiveCourse();
      const connectUrl = getConnectUrl(activeCourse?.courseUuid || "");
      githubSection.innerHTML = `
        <div class="github-status github-not-connected">
          <span>Connect your GitHub account to auto-populate your standup</span>
          <a href="${connectUrl}" class="btn-github-connect">Connect GitHub</a>
        </div>
      `;
    }
  } catch {
    // Hide section on error
    githubSection.style.display = "none";
  }
}

// Store fetched activity data
let currentActivityData = null;

// Store selected activities (array of {icon, iconClass, label, url, text})
let selectedActivities = [];

// Simple icons for activity types (using Unicode symbols)
const ACTIVITY_ICONS = {
  commit: "●",
  pr: "⑃",
  review: "✓",
  issue: "◉"
};

/**
 * Get icon for activity type
 * @param {string} type - Activity type (commit, pr, review, issue)
 * @returns {string} Icon character
 */
function getIconForType(type) {
  return ACTIVITY_ICONS[type] || ACTIVITY_ICONS.commit;
}

/**
 * Handle "Fetch from GitHub" button click
 */
async function handleFetchFromGitHub() {
  const fetchBtn = document.getElementById("fetch-github-btn");
  const activityContainer = document.getElementById("github-activity-container");
  const activityList = document.getElementById("github-activity-list");

  if (!fetchBtn || !activityContainer || !activityList) return;

  // Show loading state
  const originalText = fetchBtn.textContent;
  fetchBtn.disabled = true;
  fetchBtn.textContent = "Fetching...";

  try {
    const result = await getGitHubActivity(24);
    currentActivityData = result;

    // Render activity items
    renderActivityList(result.activity, activityList);

    // Show the activity container
    activityContainer.style.display = "block";

    // Setup activity controls
    setupActivityControls();

    // Reset button
    fetchBtn.textContent = originalText;
    fetchBtn.disabled = false;

  } catch (error) {
    // Show error state
    fetchBtn.textContent = "Failed";
    setTimeout(() => {
      fetchBtn.textContent = originalText;
      fetchBtn.disabled = false;
    }, 2000);

    // Show error message if token expired
    if (error.code === "GITHUB_TOKEN_EXPIRED") {
      showError("GitHub token expired. Please reconnect your account.");
    } else {
      showError("Failed to fetch GitHub activity. Please try again.");
    }
  }
}

/**
 * Render activity items with checkboxes
 * @param {Object} activity - Activity data with commits, pullRequests, reviews, issues
 * @param {HTMLElement} container - Container to render into
 */
function renderActivityList(activity, container) {
  container.innerHTML = "";

  const allItems = [];

  // Add commits
  activity.commits.forEach((commit, idx) => {
    const shortRepo = commit.repo.split("/").pop();
    allItems.push({
      type: "commit",
      id: `commit-${idx}`,
      icon: ACTIVITY_ICONS.commit,
      iconClass: "activity-icon-commit",
      label: `[${shortRepo}] ${commit.message}`,
      url: commit.url,
      text: `- [${shortRepo}] ${commit.message}`
    });
  });

  // Add PRs
  activity.pullRequests.forEach((pr, idx) => {
    const shortRepo = pr.repo.split("/").pop();
    const actionLabel = pr.action === "opened" ? "Opened" : pr.action === "closed" ? "Closed" : pr.action;
    allItems.push({
      type: "pr",
      id: `pr-${idx}`,
      icon: ACTIVITY_ICONS.pr,
      iconClass: "activity-icon-pr",
      label: `[${shortRepo}] PR #${pr.number}: ${pr.title} (${actionLabel})`,
      url: pr.url,
      text: `- [${shortRepo}] PR #${pr.number}: ${pr.title} (${actionLabel})`
    });
  });

  // Add reviews
  activity.reviews.forEach((review, idx) => {
    const shortRepo = review.repo.split("/").pop();
    const stateLabel = review.state === "approved" ? "Approved" :
      review.state === "changes_requested" ? "Requested changes" : "Commented";
    allItems.push({
      type: "review",
      id: `review-${idx}`,
      icon: ACTIVITY_ICONS.review,
      iconClass: "activity-icon-review",
      label: `[${shortRepo}] Reviewed PR #${review.prNumber} (${stateLabel})`,
      url: review.url,
      text: `- [${shortRepo}] Reviewed PR #${review.prNumber} (${stateLabel})`
    });
  });

  // Add issues
  activity.issues.forEach((issue, idx) => {
    const shortRepo = issue.repo.split("/").pop();
    const actionLabel = issue.action === "opened" ? "Opened" : "Closed";
    allItems.push({
      type: "issue",
      id: `issue-${idx}`,
      icon: ACTIVITY_ICONS.issue,
      iconClass: "activity-icon-issue",
      label: `[${shortRepo}] Issue #${issue.number}: ${issue.title} (${actionLabel})`,
      url: issue.url,
      text: `- [${shortRepo}] Issue #${issue.number}: ${issue.title} (${actionLabel})`
    });
  });

  if (allItems.length === 0) {
    container.innerHTML = "<div class=\"github-activity-empty\">No GitHub activity in the last 24 hours.</div>";
    return;
  }

  // Render each item
  allItems.forEach(item => {
    const itemEl = document.createElement("label");
    itemEl.className = `github-activity-item ${item.iconClass}`;
    itemEl.innerHTML = `
      <input type="checkbox" checked data-text="${escapeHtml(item.text)}" class="activity-checkbox">
      <span class="activity-icon">${item.icon}</span>
      <a href="${item.url}" target="_blank" rel="noopener noreferrer" class="activity-label" onclick="event.stopPropagation();">
        ${escapeHtml(item.label)}
      </a>
    `;
    container.appendChild(itemEl);
  });
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Setup activity controls (select/deselect all, add selected, close)
 */
function setupActivityControls() {
  const selectAllBtn = document.getElementById("select-all-btn");
  const deselectAllBtn = document.getElementById("deselect-all-btn");
  const addSelectedBtn = document.getElementById("add-selected-btn");
  const closeBtn = document.getElementById("close-activities-btn");

  // Remove old event listeners by replacing elements
  if (selectAllBtn) {
    const newSelectAll = selectAllBtn.cloneNode(true);
    selectAllBtn.parentNode.replaceChild(newSelectAll, selectAllBtn);
    newSelectAll.addEventListener("click", () => toggleAllCheckboxes(true));
  }

  if (deselectAllBtn) {
    const newDeselectAll = deselectAllBtn.cloneNode(true);
    deselectAllBtn.parentNode.replaceChild(newDeselectAll, deselectAllBtn);
    newDeselectAll.addEventListener("click", () => toggleAllCheckboxes(false));
  }

  if (addSelectedBtn) {
    const newAddSelected = addSelectedBtn.cloneNode(true);
    addSelectedBtn.parentNode.replaceChild(newAddSelected, addSelectedBtn);
    newAddSelected.addEventListener("click", addSelectedToStandup);
  }

  if (closeBtn) {
    const newClose = closeBtn.cloneNode(true);
    closeBtn.parentNode.replaceChild(newClose, closeBtn);
    newClose.addEventListener("click", closeActivityContainer);
  }
}

/**
 * Toggle all checkboxes
 */
function toggleAllCheckboxes(checked) {
  const checkboxes = document.querySelectorAll(".activity-checkbox");
  checkboxes.forEach(cb => cb.checked = checked);
}

/**
 * Add selected items to the standup (show in selected section)
 */
function addSelectedToStandup() {
  const activityItems = document.querySelectorAll(".github-activity-item");

  if (activityItems.length === 0) {
    showError("No activities available.");
    return;
  }

  // Collect selected items with their full data
  selectedActivities = [];
  activityItems.forEach(item => {
    const checkbox = item.querySelector(".activity-checkbox");
    if (checkbox && checkbox.checked) {
      const iconClass = Array.from(item.classList).find(c => c.startsWith("activity-icon-")) || "";
      const type = iconClass.replace("activity-icon-", "") || "commit";
      const link = item.querySelector(".activity-label");
      selectedActivities.push({
        type,
        icon: ACTIVITY_ICONS[type] || ACTIVITY_ICONS.commit,
        iconClass,
        label: link?.textContent?.trim() || "",
        url: link?.href || "",
        text: checkbox.dataset.text || ""
      });
    }
  });

  if (selectedActivities.length === 0) {
    showError("No items selected.");
    return;
  }

  // Show selected activities section
  renderSelectedActivities();

  // Close the activity picker
  closeActivityContainer();
}

/**
 * Render selected activities in the display section
 */
function renderSelectedActivities() {
  const section = document.getElementById("selected-activities-section");
  const list = document.getElementById("selected-activities-list");
  const editBtn = document.getElementById("edit-selection-btn");

  if (!section || !list) return;

  if (selectedActivities.length === 0) {
    section.style.display = "none";
    return;
  }

  // Render selected items (read-only, clickable)
  list.innerHTML = "";
  selectedActivities.forEach(item => {
    const itemEl = document.createElement("div");
    itemEl.className = `selected-activity-item ${item.iconClass}`;
    itemEl.innerHTML = `
      <span class="activity-icon">${item.icon}</span>
      <a href="${item.url}" target="_blank" rel="noopener noreferrer" class="activity-label">
        ${escapeHtml(item.label)}
      </a>
    `;
    list.appendChild(itemEl);
  });

  // Show section
  section.style.display = "block";

  // Setup edit button
  if (editBtn) {
    const newEditBtn = editBtn.cloneNode(true);
    editBtn.parentNode.replaceChild(newEditBtn, editBtn);
    newEditBtn.addEventListener("click", handleEditSelection);
  }
}

/**
 * Handle edit button - reopen activity picker
 */
function handleEditSelection() {
  const activityContainer = document.getElementById("github-activity-container");

  if (!activityContainer) return;

  // If we have activity data, just show the picker again
  if (currentActivityData) {
    activityContainer.style.display = "block";

    // Re-check the boxes based on selectedActivities
    const checkboxes = document.querySelectorAll(".activity-checkbox");
    checkboxes.forEach(cb => {
      const text = cb.dataset.text;
      const isSelected = selectedActivities.some(a => a.text === text);
      cb.checked = isSelected;
    });
  } else {
    // Need to fetch again
    handleFetchFromGitHub();
  }
}

/**
 * Close the activity container
 */
function closeActivityContainer() {
  const activityContainer = document.getElementById("github-activity-container");
  if (activityContainer) {
    activityContainer.style.display = "none";
  }
}

/**
 * Get the user notes from the textarea
 */
function getUserNotes() {
  const whatDoneField = document.getElementById("what-done");
  return whatDoneField?.value?.trim() || "";
}

/**
 * Get GitHub activities formatted for storage (type, label, url only - no icons)
 * @returns {Array|null} Array of activity objects or null if none
 */
function getGitHubActivitiesForStorage() {
  if (selectedActivities.length === 0) return null;

  return selectedActivities.map(activity => ({
    type: activity.iconClass?.replace("activity-icon-", "") || "commit",
    label: activity.label,
    url: activity.url
  }));
}

/**
 * Handle form submission
 * @param {Event} event - Form submit event
 */
async function handleSubmit(event) {
  event.preventDefault();

  const form = event.target;
  const formData = new FormData(form);

  // Get user notes and GitHub activities separately
  const userNotes = getUserNotes();
  const githubActivities = getGitHubActivitiesForStorage();

  // Validate: must have either selected activities or user input
  if (!userNotes && !githubActivities) {
    showError("Please select GitHub activities or enter what you accomplished.");
    return;
  }

  // Build standup data object
  const standupData = {
    dateSubmitted: formData.get("dateSubmitted"),
    teamUuid: formData.get("teamUuid") || null,
    whatDone: userNotes || null,
    githubActivities: githubActivities,
    whatNext: formData.get("whatNext"),
    blockers: formData.get("blockers") || null,
    reflection: formData.get("reflection") || null,
    sentimentScore: parseInt(formData.get("sentimentScore"), 10),
    visibility: formData.get("visibility")
  };

  // Add courseUuid from active course
  const activeCourse = getActiveCourse();
  if (activeCourse) {
    standupData.courseUuid = activeCourse.courseUuid;
  }

  try {
    // Disable submit button
    const submitBtn = form.querySelector("button[type=\"submit\"]");
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = editMode ? "Updating..." : "Submitting...";

    // Submit to API
    if (editMode && editingStandupId) {
      await updateStandup(editingStandupId, standupData);
    } else {
      await createStandup(standupData);
    }

    // Show success message
    showSuccess(editMode ? "Standup updated successfully!" : "Standup submitted successfully!");

    // Reset form if creating new
    if (!editMode) {
      form.reset();
      // Reset to today's date
      const today = new Date().toISOString().split("T")[0];
      form.querySelector("#date-submitted").value = today;
      // Reset mood selector to default (3)
      const defaultMoodRadio = form.querySelector("input[name=\"sentimentScore\"][value=\"3\"]");
      if (defaultMoodRadio) defaultMoodRadio.checked = true;
      // Reset visibility to default (team)
      const defaultVisibilityRadio = form.querySelector("input[name=\"visibility\"][value=\"team\"]");
      if (defaultVisibilityRadio) defaultVisibilityRadio.checked = true;
      // Clear selected activities
      selectedActivities = [];
      const selectedSection = document.getElementById("selected-activities-section");
      if (selectedSection) selectedSection.style.display = "none";
    }

    // Re-enable button
    submitBtn.disabled = false;
    submitBtn.textContent = originalText;

    // Exit edit mode if editing
    if (editMode) {
      setTimeout(() => {
        editMode = false;
        editingStandupId = null;
        refreshCurrentView();
      }, 1500);
    }

  } catch (error) {
    showError(error.message);

    // Re-enable button
    const submitBtn = form.querySelector("button[type=\"submit\"]");
    submitBtn.disabled = false;
    submitBtn.textContent = editMode ? "Update Standup" : "Submit Standup";
  }
}

/**
 * Show success message
 * @param {string} message - Success message
 */
function showSuccess(message) {
  const form = document.getElementById("standup-form");
  const existing = document.querySelector(".success-message");
  if (existing) existing.remove();

  const successDiv = document.createElement("div");
  successDiv.className = "success-message";
  // Using class instead of inline style
  successDiv.style.cssText = `
    background-color: var(--color-radioactive-lime);
    border: 1px solid var(--color-forest-green);
    color: var(--color-forest-green);
    padding: 1rem;
    border-radius: 8px;
    margin-bottom: 1rem;
    font-family: var(--font-body);
  `;
  successDiv.textContent = message;

  form.insertBefore(successDiv, form.firstChild);

  // Auto-remove after 3 seconds
  setTimeout(() => successDiv.remove(), 3000);
}

/**
 * Show error message
 * @param {string} message - Error message
 */
function showError(message) {
  const form = document.getElementById("standup-form");
  const existing = document.querySelector(".error-message");
  if (existing) existing.remove();

  const errorDiv = document.createElement("div");
  errorDiv.className = "error-message";
  errorDiv.textContent = message;

  form.insertBefore(errorDiv, form.firstChild);

  // Auto-remove after 5 seconds
  setTimeout(() => errorDiv.remove(), 5000);
}

/**
 * Edit a standup
 * @param {HTMLElement} container - Container to render into
 * @param {Object} standupData - Standup data to edit
 */
export function editStandup(container, standupData) {
  render(container, { standupData });
}
