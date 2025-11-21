/**
 * @fileoverview Attendance Feature Main Entry Point
 * Handles attendance views: Dashboard, Analysis
 */

import { loadTemplate } from "../../utils/templateLoader.js";

/**
 * Render attendance view
 * @param {HTMLElement} container - Container to render into
 * @param {string} view - View name (dashboard, analysis)
 */
export async function render(container, view = "dashboard") {
  try {
    // Clear container
    container.innerHTML = "";

    // Load and render the template
    const templateHTML = await loadTemplate("attendance", view);
    container.innerHTML = templateHTML;

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
