/**
 * @fileoverview Profile Page Logic
 * Handles profile view, edit, and update functionality
 */

import { initProfileDropdown } from "../../components/profileDropdown.js";

let currentProfile = null;

/**
 * Initialize the profile page
 */
async function initProfilePage() {
  await initProfileDropdown();
  await loadProfile();
  setupEventListeners();
}

/**
 * Load user profile data from API
 */
async function loadProfile() {
  try {
    const response = await fetch("/v1/api/directory/profile", {
      credentials: "include"
    });

    if (response.ok) {
      const data = await response.json();
      if (data.success && data.data) {
        currentProfile = data.data;
        displayProfile(currentProfile);
      }
    } else {
      showError("Failed to load profile");
    }
  } catch (error) {
    showError("Error loading profile: " + error.message);
  }
}

/**
 * Display profile data in view mode
 * @param {Object} profile - Profile data
 */
function displayProfile(profile) {
  // Update header
  const name = `${profile.firstName} ${profile.lastName}`;
  const initials = name.split(" ").map(word => word[0]).join("").toUpperCase();

  document.getElementById("profile-avatar").textContent = initials;
  document.getElementById("profile-name").textContent = name;
  document.getElementById("profile-email").textContent = profile.email || "";

  // Update view mode fields
  document.getElementById("view-firstName").textContent = profile.firstName || "-";
  document.getElementById("view-lastName").textContent = profile.lastName || "-";
  document.getElementById("view-email").textContent = profile.email || "-";
  document.getElementById("view-pronouns").textContent = profile.pronouns || "-";
  document.getElementById("view-bio").textContent = profile.bio || "-";
  document.getElementById("view-phoneNumber").textContent = profile.phoneNumber || "-";
  document.getElementById("view-githubUsername").textContent = profile.githubUsername || "-";

  // Show/hide and populate staff information if user is staff
  const staffSection = document.getElementById("staff-section");
  if (profile.staff) {
    staffSection.style.display = "block";
    document.getElementById("view-officeLocation").textContent = profile.staff.officeLocation || "-";
    document.getElementById("view-researchInterest").textContent = profile.staff.researchInterest || "-";
    const website = profile.staff.personalWebsite;
    if (website) {
      document.getElementById("view-personalWebsite").innerHTML = `<a href="${website}" target="_blank" style="color: var(--color-forest-green); text-decoration: underline;">${website}</a>`;
    } else {
      document.getElementById("view-personalWebsite").textContent = "-";
    }
  } else {
    staffSection.style.display = "none";
  }
}

/**
 * Populate edit form with current profile data
 */
function populateEditForm() {
  if (!currentProfile) return;

  document.getElementById("edit-firstName").value = currentProfile.firstName || "";
  document.getElementById("edit-lastName").value = currentProfile.lastName || "";
  document.getElementById("edit-email").value = currentProfile.email || "";
  document.getElementById("edit-pronouns").value = currentProfile.pronouns || "";
  document.getElementById("edit-bio").value = currentProfile.bio || "";
  document.getElementById("edit-phoneNumber").value = currentProfile.phoneNumber || "";
  document.getElementById("edit-githubUsername").value = currentProfile.githubUsername || "";

  // Show/hide and populate staff fields if user is staff
  const staffEditSection = document.getElementById("staff-edit-section");
  if (currentProfile.staff) {
    staffEditSection.style.display = "block";
    document.getElementById("edit-officeLocation").value = currentProfile.staff.officeLocation || "";
    document.getElementById("edit-researchInterest").value = currentProfile.staff.researchInterest || "";
    document.getElementById("edit-personalWebsite").value = currentProfile.staff.personalWebsite || "";
  } else {
    staffEditSection.style.display = "none";
  }
}

/**
 * Switch to edit mode
 */
function enterEditMode() {
  populateEditForm();
  document.getElementById("view-mode").style.display = "none";
  document.getElementById("edit-mode").style.display = "block";
  hideMessages();
}

/**
 * Switch to view mode
 */
function exitEditMode() {
  document.getElementById("view-mode").style.display = "block";
  document.getElementById("edit-mode").style.display = "none";
  hideMessages();
}

/**
 * Save profile changes
 * @param {Event} event - Form submit event
 */
async function saveProfile(event) {
  event.preventDefault();

  const saveBtn = document.getElementById("save-btn");
  saveBtn.disabled = true;
  saveBtn.textContent = "Saving...";

  const formData = {
    firstName: document.getElementById("edit-firstName").value.trim(),
    lastName: document.getElementById("edit-lastName").value.trim(),
    pronouns: document.getElementById("edit-pronouns").value.trim() || null,
    bio: document.getElementById("edit-bio").value.trim() || null,
    phoneNumber: document.getElementById("edit-phoneNumber").value.trim() || null,
    githubUsername: document.getElementById("edit-githubUsername").value.trim() || null
  };

  // Include staff information if user is staff
  if (currentProfile && currentProfile.staff) {
    formData.staff = {
      officeLocation: document.getElementById("edit-officeLocation").value.trim() || null,
      researchInterest: document.getElementById("edit-researchInterest").value.trim() || null,
      personalWebsite: document.getElementById("edit-personalWebsite").value.trim() || null
    };
  }

  try {
    const response = await fetch("/v1/api/directory/profile", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      credentials: "include",
      body: JSON.stringify(formData)
    });

    const data = await response.json();

    if (response.ok && data.success) {
      // Reload profile to get updated staff data
      await loadProfile();
      exitEditMode();
      showSuccess("Profile updated successfully!");

      // Refresh the profile dropdown to show updated name
      await initProfileDropdown();
    } else {
      showError(data.error || "Failed to update profile");
    }
  } catch (error) {
    showError("Error updating profile: " + error.message);
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = "Save Changes";
  }
}

/**
 * Show error message
 * @param {string} message - Error message
 */
function showError(message) {
  const errorDiv = document.getElementById("error-message");
  errorDiv.textContent = message;
  errorDiv.style.display = "block";

  const successDiv = document.getElementById("success-message");
  successDiv.style.display = "none";

  // Scroll to top to show message
  window.scrollTo({ top: 0, behavior: "smooth" });
}

/**
 * Show success message
 * @param {string} message - Success message
 */
function showSuccess(message) {
  const successDiv = document.getElementById("success-message");
  successDiv.textContent = message;
  successDiv.style.display = "block";

  const errorDiv = document.getElementById("error-message");
  errorDiv.style.display = "none";

  // Scroll to top to show message
  window.scrollTo({ top: 0, behavior: "smooth" });

  // Auto-hide after 5 seconds
  setTimeout(() => {
    successDiv.style.display = "none";
  }, 5000);
}

/**
 * Hide all messages
 */
function hideMessages() {
  document.getElementById("error-message").style.display = "none";
  document.getElementById("success-message").style.display = "none";
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
  // Edit button
  document.getElementById("edit-btn").addEventListener("click", enterEditMode);

  // Cancel button
  document.getElementById("cancel-btn").addEventListener("click", exitEditMode);

  // Form submit
  document.getElementById("profile-form").addEventListener("submit", saveProfile);
}

// Initialize on page load
document.addEventListener("DOMContentLoaded", initProfilePage);
