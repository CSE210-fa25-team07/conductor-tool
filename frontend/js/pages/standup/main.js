/**
 * @fileoverview Main Demo Entry Point for Standup Pages
 * NO STYLING - Pure HTML elements only
 * Navigation between different views
 * @module standup/main
 */

import { renderStandupForm } from "./standupForm.js";
import { renderTeamDashboard } from "./teamDashboard.js";
import { renderTADashboard } from "./taDashboard.js";
import { renderIndividualHistory } from "./individualHistory.js";
import { currentUser, getUnreadNotificationCount } from "./mockData.js";

/**
 * Initializes the standup demo application
 * Creates the main UI structure with navigation and content container
 * @function initStandupDemo
 * @returns {void}
 */
export function initStandupDemo() {
  const appContainer = document.getElementById("app");
  if (!appContainer) {
    // App container not found - cannot initialize demo
    return;
  }

  appContainer.innerHTML = "";

  // Main title
  const mainTitle = document.createElement("h1");
  mainTitle.textContent = "Conductor - Standup Tool Demo";
  appContainer.appendChild(mainTitle);

  // Demo notice
  const notice = document.createElement("p");
  notice.textContent = "⚠️ DEMO MODE - All data is mocked, no backend connection, zero styling";
  appContainer.appendChild(notice);

  appContainer.appendChild(document.createElement("hr"));

  // Navigation
  const nav = createNavigation();
  appContainer.appendChild(nav);

  appContainer.appendChild(document.createElement("hr"));

  // Content container
  const contentContainer = document.createElement("div");
  contentContainer.id = "content";
  appContainer.appendChild(contentContainer);

  // Default view: Standup Form
  renderStandupForm("content");
}

/**
 * Creates the navigation bar with buttons to switch between different views
 * @function createNavigation
 * @returns {HTMLElement} Navigation element with buttons and descriptions
 * @private
 */
function createNavigation() {
  const nav = document.createElement("nav");

  const navTitle = document.createElement("h2");
  navTitle.textContent = "Navigation";
  nav.appendChild(navTitle);

  const navInfo = document.createElement("p");
  navInfo.textContent = `Current User: ${currentUser.name} | Unread Notifications: ${getUnreadNotificationCount(currentUser.user_uuid)}`;
  nav.appendChild(navInfo);

  // Navigation buttons
  const buttonContainer = document.createElement("div");

  const buttons = [
    {
      label: "Submit Standup",
      view: "form",
      description: "Daily standup submission form (Student view)",
      renderer: renderStandupForm
    },
    {
      label: "Team Dashboard",
      view: "team",
      description: "View team standups and collaborate (Student/Team Lead view)",
      renderer: renderTeamDashboard
    },
    {
      label: "My History",
      view: "history",
      description: "Personal standup history and stats (Student view)",
      renderer: renderIndividualHistory
    },
    {
      label: "TA Dashboard",
      view: "ta",
      description: "Multi-team overview and alerts (TA/Instructor view)",
      renderer: renderTADashboard
    }
  ];

  buttons.forEach(button => {
    const btn = document.createElement("button");
    btn.textContent = button.label;
    btn.onclick = () => {
      button.renderer("content");
      highlightActiveButton(button.view);
    };
    btn.id = `nav-${button.view}`;

    buttonContainer.appendChild(btn);

    // Add description
    const desc = document.createElement("span");
    desc.textContent = ` - ${button.description}`;
    buttonContainer.appendChild(desc);

    buttonContainer.appendChild(document.createElement("br"));
  });

  nav.appendChild(buttonContainer);

  return nav;
}

/**
 * Highlights the currently active navigation button by adding [ACTIVE] text
 * @function highlightActiveButton
 * @param {string} activeView - The view identifier to highlight (form, team, history, or ta)
 * @returns {void}
 * @private
 */
function highlightActiveButton(activeView) {
  // Simple highlight by adding text indicator (no CSS!)
  const views = ["form", "team", "history", "ta"];

  views.forEach(view => {
    const btn = document.getElementById(`nav-${view}`);
    if (btn) {
      const originalText = btn.textContent.replace(" [ACTIVE]", "");
      if (view === activeView) {
        btn.textContent = `${originalText} [ACTIVE]`;
      } else {
        btn.textContent = originalText;
      }
    }
  });
}

// Initialize when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initStandupDemo);
} else {
  initStandupDemo();
}
