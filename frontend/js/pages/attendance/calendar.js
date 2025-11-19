/**
 * @fileoverview Calendar/Attendance Feature Page
 * Handles Calendar and Analysis views
 * @module pages/attendance/calendar
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
let currentPage = "calendar";

/**
 * Initializes the calendar page
 */
function initCalendarPage() {
  // Setup user profile dropdown
  setupDropdown();

  // Get course ID from URL
  const courseId = getCourseIdFromUrl();

  // If there's no course ID, this is the main calendar page (placeholder)
  if (!courseId) {
    // Just show the placeholder - navigation is already in HTML
    return;
  }

  // Course-specific calendar view (original functionality)
  // Create and inject top navigation
  const topNavContainer = document.getElementById("top-navigation");
  const topNav = createTopNav({ activeFeature: "calendar", courseId, user: mockUser });
  topNavContainer.appendChild(topNav);

  // Create and inject secondary navigation
  const secondaryNavContainer = document.getElementById("secondary-navigation");
  const secondaryNav = createSecondaryNav({ feature: "calendar", courseId, activePage: currentPage });
  secondaryNavContainer.appendChild(secondaryNav);

  // Setup navigation event listener
  setupNavigation(handleNavigation);

  // Load initial page from URL hash or default to calendar
  const hash = window.location.hash.slice(1);
  currentPage = hash || "calendar";
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
  console.log(`Calendar page handling navigation to: ${path}`);

  // Extract page from path (e.g., "calendar/analysis" -> "analysis")
  if (path.startsWith("calendar/")) {
    const page = path.split("/")[1].split("?")[0];
    loadPage(page);
  }
}

/**
 * Loads a specific page view
 * @param {string} page - Page to load (calendar, analysis)
 */
function loadPage(page) {
  currentPage = page;
  window.location.hash = page;

  const courseId = getCourseIdFromUrl();

  // Update secondary navigation
  const secondaryNavContainer = document.getElementById("secondary-navigation");
  secondaryNavContainer.innerHTML = "";
  const secondaryNav = createSecondaryNav({ feature: "calendar", courseId, activePage: currentPage });
  secondaryNavContainer.appendChild(secondaryNav);

  // Render page content
  const contentContainer = document.getElementById("page-content");

  switch (page) {
  case "calendar":
    renderCalendar(contentContainer);
    break;
  case "analysis":
    renderAnalysis(contentContainer);
    break;
  default:
    renderCalendar(contentContainer);
  }
}

/**
 * Renders the calendar view - PLACEHOLDER
 * @param {HTMLElement} container - Container element
 */
function renderCalendar(container) {
  container.innerHTML = `
    <div class="page-header">
      <h1 class="page-title">Attendance Calendar</h1>
      <p class="page-description">Placeholder for routing testing</p>
    </div>

    <div class="card">
      <h3>Calendar Placeholder</h3>
      <p>This is a placeholder for the attendance calendar. Implement your features here when ready.</p>
    </div>
  `;
}

/**
 * Renders the analysis view - PLACEHOLDER
 * @param {HTMLElement} container - Container element
 */
function renderAnalysis(container) {
  container.innerHTML = `
    <div class="page-header">
      <h1 class="page-title">Attendance Analysis</h1>
      <p class="page-description">Placeholder for routing testing</p>
    </div>

    <div class="card">
      <h3>Analysis Placeholder</h3>
      <p>This is a placeholder for the attendance analysis page. Implement your features here when ready.</p>
    </div>
  `;
}

// Initialize when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initCalendarPage);
} else {
  initCalendarPage();
}
