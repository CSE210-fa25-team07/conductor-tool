/**
 * @fileoverview Directory Feature Main Entry Point
 * Handles directory views: Dashboard, People (roster), Group (teams), Team Profile, My (user profile)
 */

import { loadTemplate } from "../../utils/templateLoader.js";
import { getCurrentUser } from "../../utils/userContext.js";
import * as dashboardPage from "./dashboard.js";
import * as peoplePage from "./people.js";
import * as groupPage from "./group.js";
import * as teamProfilePage from "./teamProfile.js";
import * as myPage from "./my.js";

/**
 * Get course UUID from session storage
 * @returns {string|null} Course UUID
 */
function getCourseUuid() {
  const storedCourse = sessionStorage.getItem("activeCourse");
  if (storedCourse) {
    try {
      const course = JSON.parse(storedCourse);
      return course.courseUuid || null;
    } catch (error) {
      return null;
    }
  }
  return null;
}

// Store container reference for navigation
let containerRef = null;

/**
 * Render directory view
 * @param {HTMLElement} container - Container to render into
 * @param {string} view - View name (dashboard, people, group, my, roster, teams, team, user)
 * @param {Object} params - URL parameters (e.g., { teamUuid, userUuid })
 */
export async function render(container, view = "dashboard", params = {}) {
  try {
    // Scroll to top immediately (before showing loading)
    window.scrollTo({ top: 0, behavior: "instant" });

    // Show loading state immediately
    container.innerHTML = "<div style=\"background: var(--color-light-matcha); border: var(--border-thick); padding: var(--space-2xl); text-align: center; min-height: 400px; display: flex; align-items: center; justify-content: center;\"><p style=\"font-family: var(--font-mono); color: var(--color-forest-green-medium); font-size: var(--text-lg);\">Loading...</p></div>";

    // Store container reference for navigation
    containerRef = container;

    // Get course UUID from session storage
    const courseUuid = getCourseUuid();

    // Map view names to template names (only for special cases)
    let templateView = view;
    if (view === "team") {
      templateView = "teamProfile";
    }

    // Load template
    const templateHTML = await loadTemplate("directory", templateView);

    // Create a temporary container to hold the new content
    const tempContainer = document.createElement("div");
    tempContainer.innerHTML = templateHTML;

    // Initialize page-specific logic in the temporary container
    // This prevents the flash by loading everything before displaying
    switch (view) {
    case "dashboard":
      if (courseUuid) {
        container.innerHTML = templateHTML;
        await dashboardPage.init(courseUuid);
      }
      break;

    case "people":
      if (courseUuid) {
        container.innerHTML = templateHTML;
        await peoplePage.init(courseUuid);
      }
      break;

    case "group":
      if (courseUuid) {
        container.innerHTML = templateHTML;
        await groupPage.init(courseUuid);
      }
      break;

    case "team":
    case "teamProfile":
      if (params.teamUuid) {
        container.innerHTML = templateHTML;
        await teamProfilePage.init(params.teamUuid);
      }
      break;

    case "my":
      // If userUuid provided in params, use it (for viewing other users)
      // Otherwise get current user
      container.innerHTML = templateHTML;
      if (params.userUuid) {
        await myPage.init(params.userUuid);
      } else {
        const currentUser = getCurrentUser();
        if (currentUser) {
          await myPage.init(currentUser.userUuid);
        }
      }
      break;

    default:
      container.innerHTML = templateHTML;
      break;
    }

  } catch (error) {
    container.innerHTML = "<div style=\"font-family: var(--font-mono); color: var(--color-forest-green); background: var(--color-light-matcha); border: var(--border-thick); padding: var(--space-xl); text-align: center;\"><strong>Error:</strong> " + error.message + "</div>";
  }
}

/**
 * Navigate to team profile
 * @param {string} teamUuid - Team UUID
 */
export function navigateToTeam(teamUuid) {
  if (containerRef) {
    render(containerRef, "team", { teamUuid });
    // Activate the "Group" sidebar item since team profile is part of Group
    activateSidebarItem("group");
  }
}

/**
 * Activate a sidebar navigation item
 * @param {string} viewId - View ID to activate
 */
function activateSidebarItem(viewId) {
  const sidebarItems = document.querySelectorAll(".sidebar-nav-item");
  sidebarItems.forEach(item => {
    const itemView = item.getAttribute("data-view");
    if (itemView === viewId) {
      item.classList.add("active");
    } else {
      item.classList.remove("active");
    }
  });
}

/**
 * Navigate to user profile
 * @param {string} userUuid - User UUID
 */
export function navigateToUser(userUuid) {
  if (containerRef) {
    render(containerRef, "my", { userUuid });
    // Activate the "People" sidebar item since user profile is part of People
    activateSidebarItem("people");
  }
}

/**
 * Navigate to People page (roster)
 */
export function navigateToPeople() {
  if (containerRef) {
    render(containerRef, "people");
    // Activate the "People" sidebar item
    activateSidebarItem("people");
  }
}

/**
 * Navigate to Group page (teams)
 */
export function navigateToGroup() {
  if (containerRef) {
    render(containerRef, "group");
  }
}
