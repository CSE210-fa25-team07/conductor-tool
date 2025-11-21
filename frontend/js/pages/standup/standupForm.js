/**
 * @fileoverview Standup Form View
 * Handles creating and editing standup submissions
 */

import { createStandup, updateStandup } from "../../api/standupApi.js";
import { getActiveCourse, getUserTeams } from "../../utils/userContext.js";
import { refreshCurrentView } from "./main.js";
import { loadTemplate } from "../../utils/templateLoader.js";

let editMode = false;
let editingStandupId = null;

/**
 * Render the standup form
 * @param {HTMLElement} container - Container to render into
 * @param {Object} standupData - Optional standup data for editing
 */
export async function render(container, standupData = null) {
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
    teamSelectPlaceholder.outerHTML = `
      <div class="form-group">
        <label for="team">Team</label>
        <select id="team" name="teamUuid">
          <option value="">Personal (No team)</option>
          ${courseTeams.map(team => `
            <option
              value="${team.teamUuid}"
              ${standupData?.teamUuid === team.teamUuid ? "selected" : ""}
            >
              ${team.teamName}
            </option>
          `).join("")}
        </select>
        <span class="form-help-text">Optional: Select a team to share with</span>
      </div>
    `;
  }

  // Populate form fields with standupData if editing
  if (standupData) {
    const whatDone = document.getElementById("what-done");
    const whatNext = document.getElementById("what-next");
    const blockers = document.getElementById("blockers");
    const reflection = document.getElementById("reflection");
    const sentiment = document.getElementById("sentiment");
    const visibility = document.getElementById("visibility");

    if (whatDone) whatDone.value = standupData.whatDone || "";
    if (whatNext) whatNext.value = standupData.whatNext || "";
    if (blockers) blockers.value = standupData.blockers || "";
    if (reflection) reflection.value = standupData.reflection || "";
    if (sentiment) sentiment.value = standupData.sentimentScore || "3";
    if (visibility) visibility.value = standupData.visibility || "team";
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
      render(container);
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
      form.querySelector("#sentiment").value = "3";
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
  successDiv.style.cssText = `
    background-color: var(--color-radioactive-lime);
    border: 3px solid var(--color-forest-green);
    color: var(--color-forest-green);
    padding: 1rem;
    border-radius: 4px;
    margin-bottom: 1rem;
    font-family: var(--font-primary);
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
 * @param {Object} standupData - Standup data to edit
 */
export function editStandup(container, standupData) {
  render(container, standupData);
}
