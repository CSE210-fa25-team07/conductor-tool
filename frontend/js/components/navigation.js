/**
 * @fileoverview Top Navigation Component
 * Shared component for top navigation bar with logo and links
 * Can be injected into any page that needs navigation
 */
import { initProfileDropdown } from "./profileDropdown.js";

/**
 * Create and render the top navigation HTML
 * @param {string} [activePage] - The currently active page (e.g., 'dashboard', 'calendar')
 * @returns {HTMLElement} The navigation element
 */
function createNavigation(activePage = "") {
  const nav = document.createElement("nav");
  nav.className = "top-nav";

  nav.innerHTML = `
    <section class="top-nav-container">
      <!-- Logo -->
      <header class="top-nav-logo">Conductor</header>

      <!-- Navigation Links -->
      <nav class="top-nav-links">
        <a href="/dashboard" class="top-nav-link ${activePage === "dashboard" ? "active" : ""}">Dashboard</a>
        <a href="/calendar" class="top-nav-link ${activePage === "calendar" ? "active" : ""}">Calendar</a>
      </nav>

      <!-- User Profile with Dropdown -->
      <section class="user-profile-dropdown">
        <article class="user-profile" id="user-profile-trigger">
          <figure class="user-avatar">JD</figure>
          <span class="user-name">John Doe</span>
        </article>

        <!-- Dropdown Menu -->
        <menu class="dropdown-menu" id="user-dropdown"></menu>
      </section>
    </section>
  `;

  return nav;
}

/**
 * Initialize and inject the top navigation into the page
 * Call this function in your page's DOMContentLoaded handler
 * @param {string} activePage - The currently active page (e.g., 'dashboard', 'calendar')
 */
export async function initGlobalNavigation(activePage = "") {
  const navElement = createNavigation(activePage);
  document.body.prepend(navElement); // Insert at the top of the body

  // Initialize dropdown functionality
  initProfileDropdown();

}
