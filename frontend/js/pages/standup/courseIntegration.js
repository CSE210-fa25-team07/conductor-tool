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

// View modules cache - lazy loaded on first use
let viewModules = {};

/**
 * Adapter render method - bridges standup views into course page framework
 *
 * This is the ONLY public interface for accessing standup features from the course page.
 *
 * @param {HTMLElement} container - Container element from course page to render into
 * @param {string} view - View name (form, history, team, ta)
 * @returns {Promise<void>}
 */
export async function render(container, view = "form") {
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

    // Default view based on role
    let targetView = view;
    if (isTA && (view === "form" || view === "history")) {
      targetView = "ta";
    } else if (!isTA && view === "ta") {
      targetView = "form";
    }

    // Get the view module
    const module = viewModules[targetView];
    if (!module) {
      throw new Error(`Unknown standup view: ${targetView}`);
    }

    // Render the view
    await module.render(container);

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
    throw new Error("Failed to load required standup modules");
  }
}
