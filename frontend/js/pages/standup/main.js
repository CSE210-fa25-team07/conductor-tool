/**
 * @fileoverview Main entry point for Standup feature
 * Handles navigation and view switching
 */

import { loadUserContext, isProfessorOrTA } from "../../utils/userContext.js";

// View state
let currentView = "form";
let viewModules = {};

/**
 * Initialize the standup page
 */
async function init() {
  try {
    // Show loading state
    showLoading();

    // Load user context
    await loadUserContext();

    // Set up navigation
    setupNavigation();

    // Load view modules (lazy loaded)
    await loadViewModules();

    // Render initial view based on role
    const initialView = isProfessorOrTA() ? "ta" : "form";
    currentView = initialView;
    await renderView(initialView);

  } catch (error) {
    showError(`Failed to initialize: ${error.message}`);
    // eslint-disable-next-line no-console
    console.error("Initialization error:", error);
  }
}

/**
 * Set up navigation event listeners and visibility
 */
function setupNavigation() {
  const navButtons = {
    "nav-form": "form",
    "nav-history": "history",
    "nav-team": "team",
    "nav-ta": "ta"
  };

  const isTA = isProfessorOrTA();

  // Show/hide buttons based on role
  const formButton = document.getElementById("nav-form");
  const historyButton = document.getElementById("nav-history");
  const taButton = document.getElementById("nav-ta");

  // TAs and Professors can only see Team Dashboard and TA Overview
  if (isTA) {
    formButton.style.display = "none";
    historyButton.style.display = "none";
    taButton.style.display = "inline-block";
  } else {
    // Students see Submit Standup, My History, and Team Dashboard
    formButton.style.display = "inline-block";
    historyButton.style.display = "inline-block";
    taButton.style.display = "none";
  }

  // Add click handlers
  Object.entries(navButtons).forEach(([buttonId, view]) => {
    const button = document.getElementById(buttonId);
    if (button) {
      button.addEventListener("click", () => {
        renderView(view);
      });
    }
  });
}

/**
 * Lazy load view modules
 */
async function loadViewModules() {
  try {
    // Import all view modules dynamically
    const [formModule, historyModule, teamModule, taModule] = await Promise.all([
      import("./standupForm.js"),
      import("./individualHistory.js"),
      import("./teamDashboard.js"),
      import("./taDashboard.js")
    ]);

    viewModules = {
      form: formModule,
      history: historyModule,
      team: teamModule,
      ta: taModule
    };
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Failed to load view modules:", error);
    throw new Error("Failed to load required modules");
  }
}

/**
 * Render a specific view
 * @param {string} viewName - Name of the view to render
 */
async function renderView(viewName) {
  try {
    // Update navigation active state
    updateNavigation(viewName);

    // Show loading
    showLoading();

    // Get the view module
    const module = viewModules[viewName];
    if (!module) {
      throw new Error(`Unknown view: ${viewName}`);
    }

    // Render the view
    const contentContainer = document.getElementById("standup-content");
    await module.render(contentContainer);

    // Update current view
    currentView = viewName;

  } catch (error) {
    showError(`Failed to load view: ${error.message}`);
    // eslint-disable-next-line no-console
    console.error("View render error:", error);
  }
}

/**
 * Update navigation button active states
 * @param {string} activeView - The currently active view
 */
function updateNavigation(activeView) {
  const navButtons = document.querySelectorAll(".standup-nav button");
  navButtons.forEach(button => {
    const view = button.getAttribute("data-view");
    if (view === activeView) {
      button.classList.add("active");
    } else {
      button.classList.remove("active");
    }
  });
}

/**
 * Show loading state
 */
function showLoading() {
  const contentContainer = document.getElementById("standup-content");
  contentContainer.innerHTML = "<div class=\"loading-message\">Loading...</div>";
}

/**
 * Show error message
 * @param {string} message - Error message to display
 */
function showError(message) {
  const contentContainer = document.getElementById("standup-content");
  contentContainer.innerHTML = `
    <div class="error-message">
      <strong>Error:</strong> ${message}
    </div>
  `;
}

/**
 * Refresh the current view
 */
export async function refreshCurrentView() {
  await renderView(currentView);
}

/**
 * Get the current active view name
 */
export function getCurrentView() {
  return currentView;
}

// Initialize on page load
document.addEventListener("DOMContentLoaded", init);
