/**
 * @fileoverview Top Navigation Component
 * Shared component for top navigation bar with logo and links
 * Can be injected into any page that needs navigation
 */
import { initProfileDropdown } from "./profileDropdown.js";

/**
 * Create and render the top navigation HTML
 * @returns {HTMLElement} The navigation element
 */
function createNavigation() {
  const nav = document.createElement("nav");
  nav.className = "top-nav";

  nav.innerHTML = `
    <section class="top-nav-container">
      <header class="top-nav-logo">
        <a href="/dashboard" style="color: inherit; text-decoration: none; border: none;">Conductor</a>
      </header>

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
 */
export async function initGlobalNavigation() {
  const navElement = createNavigation();
  document.body.prepend(navElement); // Insert at the top of the body

  // Initialize dropdown functionality
  initProfileDropdown();

}
