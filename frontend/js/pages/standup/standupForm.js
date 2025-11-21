/**
 * @fileoverview Standup Form View
 * Handles creating and editing standup submissions
 */

import { createStandup, updateStandup } from "../../api/standupApi.js";
import { getActiveCourse, getUserTeams } from "../../utils/standup/userContext.js";
import { refreshCurrentView } from "./main.js";

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

  container.innerHTML = `
    <div class="standup-form">
      <form id="standup-form">
        <div class="form-section">
          <h2>${editMode ? "Edit Standup" : "Submit Daily Standup"}</h2>

          <div class="form-group">
            <label for="date-submitted">Date *</label>
            <input
              type="date"
              id="date-submitted"
              name="dateSubmitted"
              value="${standupData?.dateSubmitted?.split("T")[0] || today}"
              max="${today}"
              required
            >
            <span class="form-help-text">The date this standup is for</span>
          </div>

          ${courseTeams.length > 0 ? `
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
          ` : ""}
        </div>

        <div class="form-section">
          <h2>Progress Update</h2>

          <div class="form-group">
            <label for="what-done">What did you accomplish? *</label>
            <textarea
              id="what-done"
              name="whatDone"
              required
              placeholder="Describe what you completed today..."
            >${standupData?.whatDone || ""}</textarea>
            <span class="form-help-text">Share your completed tasks and achievements</span>
          </div>

          <div class="form-group">
            <label for="what-next">What are you working on next? *</label>
            <textarea
              id="what-next"
              name="whatNext"
              required
              placeholder="Describe your plans for the next work session..."
            >${standupData?.whatNext || ""}</textarea>
            <span class="form-help-text">Outline your upcoming tasks and goals</span>
          </div>

          <div class="form-group">
            <label for="blockers">Any blockers or challenges?</label>
            <textarea
              id="blockers"
              name="blockers"
              placeholder="Describe any obstacles you're facing (optional)..."
            >${standupData?.blockers || ""}</textarea>
            <span class="form-help-text">Share any issues that are blocking your progress</span>
          </div>
        </div>

        <div class="form-section">
          <h2>Reflection</h2>

          <div class="form-group">
            <label for="reflection">Personal Reflection</label>
            <textarea
              id="reflection"
              name="reflection"
              placeholder="How are you feeling about your progress? Any insights?"
            >${standupData?.reflection || ""}</textarea>
            <span class="form-help-text">Optional: Reflect on your learning and progress</span>
          </div>

          <div class="form-group">
            <label for="sentiment">How are you feeling? (1-5)</label>
            <input
              type="number"
              id="sentiment"
              name="sentimentScore"
              min="1"
              max="5"
              value="${standupData?.sentimentScore || 3}"
            >
            <span class="form-help-text">1 = Struggling, 3 = Okay, 5 = Great</span>
          </div>

          <div class="form-group">
            <label for="visibility">Visibility</label>
            <select id="visibility" name="visibility">
              <option value="team" ${!standupData || standupData?.visibility === "team" ? "selected" : ""}>
                Team (visible to team members and instructors)
              </option>
              <option value="private" ${standupData?.visibility === "private" ? "selected" : ""}>
                Private (only visible to you and instructors)
              </option>
              <option value="public" ${standupData?.visibility === "public" ? "selected" : ""}>
                Public (visible to everyone in the course)
              </option>
            </select>
            <span class="form-help-text">Control who can see your standup</span>
          </div>
        </div>

        <div class="form-actions">
          ${editMode ? `
            <button type="button" class="btn-secondary" id="cancel-edit">Cancel</button>
          ` : ""}
          <button type="submit" class="btn-primary">
            ${editMode ? "Update Standup" : "Submit Standup"}
          </button>
        </div>
      </form>
    </div>
  `;

  // Attach event listeners
  const form = document.getElementById("standup-form");
  form.addEventListener("submit", handleSubmit);

  if (editMode) {
    const cancelBtn = document.getElementById("cancel-edit");
    cancelBtn.addEventListener("click", () => {
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
