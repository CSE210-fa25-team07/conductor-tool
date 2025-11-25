/**
 * @fileoverview Profile Dropdown Component
 * Shared component for user profile avatar and dropdown menu
 * Used in dashboard, class features, and other pages
 */

/**
 * Initialize the profile dropdown component
 * Fetches user data from API and sets up dropdown behavior
 */
export async function initProfileDropdown() {
  await updateProfileFromAPI();
  setupDropdownBehavior();
}

/**
 * Fetch user data from API and update avatar/name
 */
export async function updateProfileFromAPI() {
  try {
    const response = await fetch("/v1/api/auth/session", {
      credentials: "include"
    });

    if (response.ok) {
      const data = await response.json();
      if (data.user && data.user.name) {
        updateProfileDisplay(data.user.name);
      }
    }
  } catch (_error) { // eslint-disable-line no-unused-vars
    // Silently fail - profile will show default state
  }
}

/**
 * Update the profile display with user name
 * @param {string} name - User's full name
 */
export function updateProfileDisplay(name) {
  const userAvatar = document.querySelector(".user-avatar");
  const userName = document.querySelector(".user-name");

  if (userAvatar) {
    // Create initials from name
    const initials = name.split(" ").map(word => word[0]).join("").toUpperCase();
    userAvatar.textContent = initials;
  }

  if (userName) {
    userName.textContent = name;
  }
}

/**
 * Set up dropdown toggle and close behavior
 */
export function setupDropdownBehavior() {
  const userProfileTrigger = document.getElementById("user-profile-trigger");
  const userDropdown = document.getElementById("user-dropdown");

  if (userProfileTrigger && userDropdown) {
    userProfileTrigger.addEventListener("click", (e) => {
      e.stopPropagation();
      userDropdown.classList.toggle("show");
    });

    // Close dropdown when clicking outside
    document.addEventListener("click", () => {
      userDropdown.classList.remove("show");
    });
  }
}

/**
 * Create and populate the user dropdown menu
 * @param {string} userType - Either "professor", "admin", or "student"
 */
export function createUserDropdown(_userType = "student") { // eslint-disable-line no-unused-vars
  const dropdown = document.getElementById("user-dropdown");

  if (!dropdown) return;

  // Clear existing content
  dropdown.innerHTML = "";

  // Define menu items based on user type
  // Same menu items for all user types
  const menuItems = [
    { text: "Profile", href: "/profile" },
    { text: "Log Out", href: "/logout" }
  ];

  // Create and append each menu item
  menuItems.forEach(item => {
    const link = document.createElement("a");
    link.href = item.href;
    link.className = "dropdown-item";
    link.textContent = item.text;
    dropdown.appendChild(link);
  });
}

/**
 * Render the profile dropdown HTML into a container
 * @param {HTMLElement} container - Container to render into
 * @param {string} userType - User type for dropdown menu
 */
export function renderProfileDropdown(container, userType = "student") {
  container.innerHTML = `
    <section class="user-profile-dropdown">
      <article class="user-profile" id="user-profile-trigger">
        <figure class="user-avatar">...</figure>
        <span class="user-name">Loading...</span>
      </article>
      <menu class="dropdown-menu" id="user-dropdown"></menu>
    </section>
  `;

  createUserDropdown(userType);
  initProfileDropdown();
}
