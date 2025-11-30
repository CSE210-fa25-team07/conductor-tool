/**
 * @fileoverview Standup Class Integration Adapter
 *
 * IMPORTANT: This is an ADAPTER module that bridges the standalone standup feature
 * into the unified class features page framework.
 *
 * The standup feature should ONLY be accessed through the class page
 * (/html/class/index.html?feature=standup), not directly through the
 * standalone standup page.
 *
 * This adapter:
 * 1. Loads standup view modules (form, history, team, ta)
 * 2. Enforces role-based access control
 * 3. Renders standup content within the course page container
 * 4. Maintains separation between the course page framework and standup logic
 */

import { loadUserContext, isProfessorOrTA } from "../../utils/userContext.js";

// All available standup views
const ALL_VIEWS = [
  { id: "form", label: "Submit Standup" },
  { id: "history", label: "My History" },
  { id: "team", label: "Team Dashboard" },
  { id: "ta", label: "TA Overview" }
];

/**
 * Get available views based on user role
 * TAs/Professors: Team Dashboard and TA Overview
 * Students: Submit Standup, My History, Team Dashboard
 * @returns {Array} Array of view objects { id, label }
 */
export function getAvailableViews() {
  const isTA = isProfessorOrTA();
  if (isTA) {
    return ALL_VIEWS.filter(v => v.id === "team" || v.id === "ta");
  }
  return ALL_VIEWS.filter(v => v.id !== "ta");
}

/**
 * Get default view based on user role
 * TAs/Professors default to TA Overview
 * Students default to Submit Standup form
 * @returns {string} Default view ID
 */
export function getDefaultView() {
  return isProfessorOrTA() ? "ta" : "form";
}

// View modules cache - lazy loaded on first use
let viewModules = {};

// CSS loaded flag
let cssLoaded = false;

// Current container reference for navigation
let currentContainer = null;

// Current view state for back navigation
let viewHistory = [];

/**
 * Dynamically load standup CSS
 * @private
 */
function loadStandupCSS() {
  if (cssLoaded) return;

  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = "../../css/pages/standup/standup.css";
  link.id = "standup-css";
  document.head.appendChild(link);
  cssLoaded = true;
}

/**
 * Navigate to a standup view (used by child views for drill-down)
 * @param {string} view - View name
 * @param {Object} params - View parameters
 */
export async function navigateToView(view, params = {}) {
  if (!currentContainer) return;

  // Track view history for back navigation
  viewHistory.push({ view, params });

  await renderView(currentContainer, view, params);
}

/**
 * Navigate back to previous view
 */
export async function navigateBack() {
  if (!currentContainer || viewHistory.length < 2) return;

  // Remove current view
  viewHistory.pop();

  // Get previous view
  const previous = viewHistory[viewHistory.length - 1];
  await renderView(currentContainer, previous.view, previous.params);
}

/**
 * Refresh the current view
 */
export async function refreshCurrentView() {
  if (!currentContainer || viewHistory.length === 0) return;

  const current = viewHistory[viewHistory.length - 1];
  await renderView(currentContainer, current.view, current.params);
}

/**
 * Adapter render method - bridges standup views into course page framework
 *
 * This is the ONLY public interface for accessing standup features from the course page.
 *
 * @param {HTMLElement} container - Container element from course page to render into
 * @param {string} view - View name (form, history, team, ta)
 * @param {Object} params - Optional parameters for the view
 * @returns {Promise<void>}
 */
export async function render(container, view = "form", params = {}) {
  // Load standup CSS if not already loaded
  loadStandupCSS();

  // Store container reference for drill-down navigation
  currentContainer = container;

  // Reset view history when entering standup feature
  viewHistory = [{ view, params }];

  await renderView(container, view, params);
}

/**
 * Internal render function
 */
async function renderView(container, view, params = {}) {
  try {
    // Clear container
    container.innerHTML = "";

    // Load user context if not already loaded
    await loadUserContext();

    // Load view modules if not already loaded
    if (Object.keys(viewModules).length === 0) {
      await loadViewModules();
    }

    // Validate view based on user role
    const isTA = isProfessorOrTA();

    // Only restrict TA view for non-TAs
    let targetView = view;
    if (!isTA && view === "ta") {
      targetView = "form";
    }

    // Get the view module
    const module = viewModules[targetView];
    if (!module) {
      throw new Error(`Unknown standup view: ${targetView}`);
    }

    // Render the view with params
    await module.render(container, params);

  } catch (error) {
    container.innerHTML = `
      <div style="
        font-family: var(--font-mono);
        color: var(--color-forest-green);
        background: var(--color-light-matcha);
        border: var(--border-thick);
        padding: var(--space-xl);
        text-align: center;
      ">
        <strong>Error:</strong> ${error.message}
      </div>
    `;
  }
}

/**
 * Lazy load standalone standup view modules
 *
 * This adapter dynamically imports the actual standup view implementations,
 * keeping them decoupled from the course page framework.
 *
 * @private
 * @returns {Promise<void>}
 */
async function loadViewModules() {
  try {
    // Import all standup view modules dynamically
    const [formModule, historyModule, teamModule, taModule] = await Promise.all([
      import("./standupForm.js"),
      import("./individualHistory.js"),
      import("./teamDashboard.js"),
      import("./taDashboard.js")
    ]);

    // Cache the loaded modules
    viewModules = {
      form: formModule,
      history: historyModule,
      team: teamModule,
      ta: taModule
    };
  } catch (error) {
    throw new Error("Failed to load required standup modules", { cause: error });
  }
}
