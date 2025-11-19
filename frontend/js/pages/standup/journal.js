/**
 * @fileoverview Journal/Standup Feature Page
 * Handles Dashboard and Team views
 * @module pages/standup/journal
 */

import { createTopNav, createSecondaryNav, setupNavigation, getCourseIdFromUrl } from "../../components/navigation.js";

/**
 * Mock user data
 */
const mockUser = {
  name: "John Doe",
  avatar: "JD"
};

/**
 * Current active page
 */
let currentPage = "dashboard";

/**
 * Initializes the journal page
 */
function initJournalPage() {
  // Get course ID from URL
  const courseId = getCourseIdFromUrl();

  if (!courseId) {
    // No course selected, redirect to dashboard
    window.location.href = "/dashboard";
    return;
  }

  // Create and inject top navigation
  const topNavContainer = document.getElementById("top-navigation");
  const topNav = createTopNav({ activeFeature: "journal", courseId, user: mockUser });
  topNavContainer.appendChild(topNav);

  // Create and inject secondary navigation
  const secondaryNavContainer = document.getElementById("secondary-navigation");
  const secondaryNav = createSecondaryNav({ feature: "journal", courseId, activePage: currentPage });
  secondaryNavContainer.appendChild(secondaryNav);

  // Setup user profile dropdown (must be after navigation is injected)
  setupDropdown();

  // Setup navigation event listener
  setupNavigation(handleNavigation);

  // Load initial page from URL hash or default to dashboard
  const hash = window.location.hash.slice(1);
  currentPage = hash || "dashboard";
  loadPage(currentPage);
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

/**
 * Handles navigation events
 * @param {string} path - Navigation path
 */
function handleNavigation(path) {
  console.log(`Journal page handling navigation to: ${path}`);

  // Extract page from path (e.g., "journal/team" -> "team")
  if (path.startsWith("journal/")) {
    const page = path.split("/")[1].split("?")[0];
    loadPage(page);
  }
}

/**
 * Loads a specific page view
 * @param {string} page - Page to load (dashboard, team)
 */
function loadPage(page) {
  currentPage = page;
  window.location.hash = page;

  const courseId = getCourseIdFromUrl();

  // Update secondary navigation
  const secondaryNavContainer = document.getElementById("secondary-navigation");
  secondaryNavContainer.innerHTML = "";
  const secondaryNav = createSecondaryNav({ feature: "journal", courseId, activePage: currentPage });
  secondaryNavContainer.appendChild(secondaryNav);

  // Render page content
  const contentContainer = document.getElementById("page-content");

  switch (page) {
  case "dashboard":
    renderDashboard(contentContainer);
    break;
  case "team":
    renderTeam(contentContainer);
    break;
  default:
    renderDashboard(contentContainer);
  }
}

/**
 * Renders the dashboard view (personal journal) - PLACEHOLDER
 * @param {HTMLElement} container - Container element
 */
function renderDashboard(container) {
  container.innerHTML = `
    <div class="page-header">
      <h1 class="page-title">My Journal</h1>
      <p class="page-description">Placeholder for routing testing</p>
    </div>

    <div class="card">
      <h3>Journal Placeholder</h3>
      <p>This is a placeholder for the journal page. Implement your features here when ready.</p>
    </div>
  `;
}

/**
 * Renders the team view - PLACEHOLDER
 * @param {HTMLElement} container - Container element
 */
function renderTeam(container) {
  container.innerHTML = `
    <div class="page-header">
      <h1 class="page-title">Team Dashboard</h1>
      <p class="page-description">Placeholder for routing testing</p>
    </div>

    <div class="card">
      <h3>Team Placeholder</h3>
      <p>This is a placeholder for the team dashboard. Implement your features here when ready.</p>
    </div>
  `;
}

// Initialize when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initJournalPage);
} else {
  initJournalPage();
}
