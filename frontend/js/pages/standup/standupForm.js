/**
 * @fileoverview Standup Form View
 * Handles creating and editing standup submissions
 */

import { createStandup, updateStandup } from "../../api/standupApi.js";
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
    // Use pill-style selector for teams
    const selectedTeam = standupData?.teamUuid || "";
    teamSelectPlaceholder.innerHTML = `
      <label>Team</label>
      <div class="team-pill-selector">
        <label class="team-pill-option">
          <input type="radio" name="teamUuid" value="" ${!selectedTeam ? "checked" : ""}>
          <span class="team-pill-content">None</span>
        </label>
        ${courseTeams.map(team => `
          <label class="team-pill-option">
            <input type="radio" name="teamUuid" value="${team.teamUuid}" ${selectedTeam === team.teamUuid ? "checked" : ""}>
            <span class="team-pill-content" title="${team.teamName}">${team.teamName}</span>
          </label>
        `).join("")}
      </div>
    `;
  } else if (teamSelectPlaceholder) {
    // Hide the placeholder if no teams
    teamSelectPlaceholder.style.display = "none";
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
}

/**
 * Handle form submission
 * @param {Event} event - Form submit event
 */
async function handleSubmit(event) {
  event.preventDefault();

  const form = event.target;
  const formData = new FormData(form);

  // Build standup data object
  const standupData = {
    dateSubmitted: formData.get("dateSubmitted"),
    teamUuid: formData.get("teamUuid") || null,
    whatDone: formData.get("whatDone"),
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
      const defaultMoodRadio = form.querySelector('input[name="sentimentScore"][value="3"]');
      if (defaultMoodRadio) defaultMoodRadio.checked = true;
      // Reset visibility to default (team)
      const defaultVisibilityRadio = form.querySelector('input[name="visibility"][value="team"]');
      if (defaultVisibilityRadio) defaultVisibilityRadio.checked = true;
      // Reset team to none
      const defaultTeamRadio = form.querySelector('input[name="teamUuid"][value=""]');
      if (defaultTeamRadio) defaultTeamRadio.checked = true;
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
