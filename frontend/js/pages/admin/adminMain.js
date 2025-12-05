/**
 * @fileoverview Admin Dashboard Main Entry Point
 * Handles navigation between admin views: Request Forms, Add User, Manage Users
 */

import { loadUserContext } from "../../utils/userContext.js";
import { initGlobalNavigation } from "../../components/navigation.js";
import { loadTemplate } from "../../utils/templateLoader.js";
import { initRequestForms } from "./adminRequestForms.js";
import { initManageUsers } from "./adminManageUsers.js";
import { initAddUser } from "./adminAddUser.js";

// State management
let currentView = "adminManageUsers"; // default view (Manage Users)

// Admin view configurations
const ADMIN_VIEWS = [
  { id: "adminManageUsers", label: "Manage Users" },
  { id: "adminAddUser", label: "Add User" },
  { id: "adminRequestForms", label: "Request Forms" }
];

/**
 * Add admin title to the navigation bar
 */
function addAdminTitle() {
  const navContainer = document.querySelector(".top-nav-container");
  if (!navContainer) return;

  const logo = navContainer.querySelector(".top-nav-logo");
  if (!logo) return;

  // Create admin title element
  const adminTitle = document.createElement("div");
  adminTitle.className = "course-title-nav";
  adminTitle.innerHTML = `
    <span class="course-code">Admin</span>
    <span class="course-name-short">System Management</span>
  `;

  // Insert after logo
  logo.insertAdjacentElement("afterend", adminTitle);
}

/**
 * Initialize the admin dashboard
 */
async function init() {
  try {
    // Show loading state
    showLoading();

    // Load user context
    await loadUserContext();

    // Initialize top navigation
    await initGlobalNavigation();

    // Add admin title to navigation
    addAdminTitle();

    // Set up sidebar navigation
    setupSidebar();

    // Set up mobile menu toggle
    setupMobileMenu();

    // Default initial view
    const initialView = "adminManageUsers";

    // Load initial view
    await loadContent(initialView);

  } catch (error) {
    showError(`Failed to initialize: ${error.message}`);
  }
}

/**
 * Set up sidebar with admin navigation items
 */
function setupSidebar() {
  const sidebarNav = document.getElementById("sidebar-nav");
  if (!sidebarNav) return;

  // Clear existing sidebar content
  sidebarNav.innerHTML = "";

  // Add navigation items for admin views
  ADMIN_VIEWS.forEach(view => {
    const button = document.createElement("button");
    button.className = "sidebar-nav-item";
    button.textContent = view.label;
    button.setAttribute("data-view", view.id);

    // Set active state
    if (view.id === currentView) {
      button.classList.add("active");
    }

    // Add click handler
    button.addEventListener("click", () => {
      loadContent(view.id);
      updateSidebarActive(view.id);
    });

    sidebarNav.appendChild(button);
  });
}

/**
 * Update sidebar active state
 * @param {string} viewId - Active view ID
 */
function updateSidebarActive(viewId) {
  const sidebarItems = document.querySelectorAll(".sidebar-nav-item");

  sidebarItems.forEach(item => {
    const itemView = item.getAttribute("data-view");
    if (itemView === viewId) {
      item.classList.add("active");
    } else {
      item.classList.remove("active");
    }
  });

  currentView = viewId;
}

/**
 * Set up mobile menu toggle functionality (For small screens)
 */
function setupMobileMenu() {
  const menuToggle = document.getElementById("mobile-menu-toggle");
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("sidebar-overlay");

  if (!menuToggle || !sidebar || !overlay) return;

  // Toggle menu
  menuToggle.addEventListener("click", () => {
    sidebar.classList.toggle("mobile-open");
    overlay.classList.toggle("show");
    menuToggle.classList.toggle("shifted");
  });

  // Close menu when overlay is clicked
  overlay.addEventListener("click", () => {
    sidebar.classList.remove("mobile-open");
    overlay.classList.remove("show");
    menuToggle.classList.remove("shifted");
  });

  // Close menu when a nav item is clicked
  sidebar.addEventListener("click", (e) => {
    if (e.target.classList.contains("sidebar-nav-item")) {
      sidebar.classList.remove("mobile-open");
      overlay.classList.remove("show");
      menuToggle.classList.remove("shifted");
    }
  });
}

/**
 * Render admin view
 * @param {HTMLElement} container - Container to render into
 * @param {string} view - View name (adminRequestForms, adminAddUser, adminManageUsers)
 */
async function render(container, view = "adminManageUsers") {
  try {
    // Clear container
    container.innerHTML = "";

    // Load and render the template
    const templateHTML = await loadTemplate("admin", view);
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

/**
 * Load content for a specific admin view
 * @param {string} view - View name (adminRequestForms, adminAddUser, adminManageUsers)
 */
async function loadContent(view) {
  const contentArea = document.getElementById("content-area");
  if (!contentArea) return;

  try {
    showLoading();

    // Render the admin view
    await render(contentArea, view);

    // Initialize view-specific functionality
    switch (view) {
    case "adminRequestForms":
      await initRequestForms();
      break;

    case "adminManageUsers":
      await initManageUsers();
      break;

    case "adminAddUser":
      await initAddUser();
      break;
    }

    // Update current view state
    currentView = view;

  } catch (error) {
    showError(`Failed to load content: ${error.message}`);
  }
}

/**
 * Show loading state
 */
function showLoading() {
  const contentArea = document.getElementById("content-area");
  if (contentArea) {
    contentArea.innerHTML = "<div class=\"loading-message\">Loading...</div>";
  }
}

/**
 * Show error message
 * @param {string} message - Error message to display
 */
function showError(message) {
  const contentArea = document.getElementById("content-area");
  if (contentArea) {
    contentArea.innerHTML = `
      <div class="error-message" style="
        font-family: var(--font-mono);
        color: var(--color-forest-green);
        background: var(--color-light-matcha);
        border: var(--border-thick);
        padding: var(--space-xl);
        text-align: center;
      ">
        <strong>Error:</strong> ${message}
      </div>
    `;
  }
}

// Initialize on page load
document.addEventListener("DOMContentLoaded", init);
