/**
 * @fileoverview User Profile Page - Placeholder
 * Personal information and settings
 * @module pages/profile/main
 */

/**
 * Mock user data
 */
const mockUser = {
  name: "John Doe",
  avatar: "JD"
};

/**
 * Initializes the profile page
 */
function initProfilePage() {
  // Setup user profile dropdown
  setupDropdown();
}

/**
 * Sets up the user profile dropdown menu
 */
function setupDropdown() {
  const trigger = document.getElementById("user-profile-trigger");
  const dropdown = document.getElementById("user-dropdown");

  if (!trigger || !dropdown) return;

  // Toggle dropdown on click
  trigger.addEventListener("click", (e) => {
    e.stopPropagation();
    dropdown.classList.toggle("show");
  });

  // Close dropdown when clicking outside
  document.addEventListener("click", (e) => {
    if (!trigger.contains(e.target) && !dropdown.contains(e.target)) {
      dropdown.classList.remove("show");
    }
  });

  // Close dropdown when pressing Escape
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      dropdown.classList.remove("show");
    }
  });
}

// Initialize when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initProfilePage);
} else {
  initProfilePage();
}
