/**
 * Shared Navigation Component
 * Generates consistent navigation across all features
 *
 * RATIONALE:
 * - Directory feature had hardcoded nav in each HTML file
 * - Attendance and Standup features had no navigation
 * - Auth feature only had login (no nav needed there)
 * - This creates a single reusable navigation component
 *
 * USAGE:
 * import { renderNavigation } from '../../shared/navigation.js';
 * renderNavigation('dashboard'); // Pass current page for active state
 */

/**
 * Navigation configuration
 * Defines all main navigation links
 */
const NAV_LINKS = [
  { id: "dashboard", label: "Dashboard", href: "/frontend/html/dashboard.html" },
  { id: "directory", label: "Directory", href: "/frontend/html/directory/class-dashboard.html" },
  { id: "standup", label: "Standup", href: "/frontend/html/standup/index.html" },
  { id: "attendance", label: "Attendance", href: "/frontend/html/pages/attendance/meeting_list/meeting_list.html" }
];

/**
 * Get current user from mock data or session
 * TODO: Replace with actual user service once backend is integrated
 */
function getCurrentUser() {
  // For demo purposes, return a mock user
  // In production, this would fetch from session/API
  /* eslint-disable camelcase */
  return {
    user_uuid: "current-user",
    first_name: "Demo",
    last_name: "User",
    email: "demo@ucsd.edu",
    photo_url: null
  };
  /* eslint-enable camelcase */
}

/**
 * Renders the main navigation bar
 * @param {string} activePage - ID of the current active page
 * @param {HTMLElement} container - Container element (defaults to body prepend)
 */
export function renderNavigation(activePage = "", container = null) {
  const user = getCurrentUser();

  const nav = document.createElement("nav");
  nav.id = "main-nav";
  nav.className = "main-nav";

  nav.innerHTML = `
    <div class="nav-container">
      <div class="nav-brand">
        <a href="/frontend/html/dashboard.html">Conductor Tool</a>
      </div>

      <button class="nav-toggle" aria-label="Toggle navigation">
        ☰
      </button>

      <div class="nav-links">
        ${NAV_LINKS.map(
    (link) => `
          <a href="${link.href}" class="${link.id === activePage ? "active" : ""}" data-page="${link.id}">
            ${link.label}
          </a>
        `
  ).join("")}
        <a href="/frontend/html/directory/user-profile.html?user=${user.user_uuid}" data-page="profile">
          My Profile
        </a>
        <a href="/frontend/html/auth/login.html" data-page="logout">
          Logout
        </a>
      </div>
    </div>
  `;

  // Add mobile toggle functionality
  const toggle = nav.querySelector(".nav-toggle");
  const links = nav.querySelector(".nav-links");

  toggle.addEventListener("click", () => {
    links.classList.toggle("active");
  });

  // Close mobile menu when clicking outside
  document.addEventListener("click", (e) => {
    if (!nav.contains(e.target) && links.classList.contains("active")) {
      links.classList.remove("active");
    }
  });

  // Insert navigation
  if (container) {
    container.prepend(nav);
  } else {
    document.body.prepend(nav);
  }

  return nav;
}

/**
 * Renders the footer
 * @param {HTMLElement} container - Container element (defaults to body append)
 */
export function renderFooter(container = null) {
  const footer = document.createElement("footer");
  footer.className = "main-footer";

  footer.innerHTML = `
    <div class="footer-container">
      <p>&copy; 2025 Conductor Tool. All rights reserved.</p>
    </div>
  `;

  if (container) {
    container.append(footer);
  } else {
    document.body.append(footer);
  }

  return footer;
}

/**
 * Updates the active page in navigation
 * Useful for single-page applications or dynamic content
 * @param {string} pageId - ID of the page to mark as active
 */
export function setActivePage(pageId) {
  const links = document.querySelectorAll(".nav-links a");
  links.forEach((link) => {
    if (link.dataset.page === pageId) {
      link.classList.add("active");
    } else {
      link.classList.remove("active");
    }
  });
}
