/**
 * @fileoverview Directory Feature Main Entry Point
 * Handles directory views: Dashboard, People, Group, My
 */

import { loadTemplate } from "../../utils/templateLoader.js";

/**
 * Render directory view
 * @param {HTMLElement} container - Container to render into
 * @param {string} view - View name (dashboard, people, group, my)
 */
export async function render(container, view = "dashboard") {
  try {
    // Clear container
    container.innerHTML = "";

    // Load and render the template
    const templateHTML = await loadTemplate("directory", view);
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
