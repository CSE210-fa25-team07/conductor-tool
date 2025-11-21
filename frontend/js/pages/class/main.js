/**
 * @fileoverview Class Features Main Entry Point
 * Handles navigation between Directory, Attendance, and Standup features
 */

import { loadUserContext, getActiveCourse, isProfessorOrTA } from "../../utils/userContext.js";
import { initProfileDropdown, createUserDropdown } from "../../components/profileDropdown.js";

// State management
let currentFeature = "directory"; // default feature
let currentView = "dashboard"; // default view within feature
let courseData = null;

// Feature configurations
const FEATURES = {
  directory: {
    title: "Directory",
    views: [
      { id: "dashboard", label: "Dashboard" },
      { id: "people", label: "People" },
      { id: "group", label: "Group" },
      { id: "my", label: "My" }
    ]
  },
  attendance: {
    title: "Attendance",
    views: [
      { id: "dashboard", label: "Dashboard" },
      { id: "analysis", label: "Analysis" }
    ]
  },
  standup: {
    title: "Standup",
    views: [
      { id: "form", label: "Submit Standup" },
      { id: "history", label: "My History" },
      { id: "team", label: "Team Dashboard" },
      { id: "ta", label: "TA Overview" }
    ]
  }
};

/**
 * Initialize the course page
 */
async function init() {
  try {
    // Show loading state
    showLoading();

    // Load user context
    await loadUserContext();

    // Initialize profile dropdown (shared component)
    const userType = isProfessorOrTA() ? "professor" : "student";
    createUserDropdown(userType);
    await initProfileDropdown();

    // Get course data from sessionStorage or context
    const storedCourse = sessionStorage.getItem("activeCourse");
    courseData = storedCourse ? JSON.parse(storedCourse) : getActiveCourse();

    // If no course data available, show error
    if (!courseData) {
      throw new Error("No course data available. Please select a course from the dashboard.");
    }

    // Update course title in navigation
    updateCourseTitle();

    // Set up navigation event listeners
    setupFeatureNavigation();

    // Get initial feature from URL or use default
    const urlParams = new URLSearchParams(window.location.search);
    const initialFeature = urlParams.get("feature") || "directory";
    const initialView = urlParams.get("view") || "dashboard";

    // Load initial feature
    await switchFeature(initialFeature, initialView);

  } catch (error) {
    showError(`Failed to initialize: ${error.message}`);
  }
}

/**
 * Update course title in navigation
 */
function updateCourseTitle() {
  if (!courseData) return;

  const courseCode = document.getElementById("nav-course-code");
  const courseName = document.getElementById("nav-course-name");

  if (courseCode) courseCode.textContent = courseData.code || courseData.courseCode || "Course";
  if (courseName) courseName.textContent = courseData.name || courseData.courseName || "";
}

/**
 * Set up feature navigation event listeners
 */
function setupFeatureNavigation() {
  const featureButtons = document.querySelectorAll(".feature-nav-btn");

  featureButtons.forEach(button => {
    button.addEventListener("click", () => {
      const feature = button.getAttribute("data-feature");
      switchFeature(feature);
    });
  });
}

/**
 * Switch to a different feature
 * @param {string} feature - Feature name (directory, attendance, standup)
 * @param {string} view - Optional view within the feature
 */
async function switchFeature(feature, view = null) {
  try {
    // Validate feature
    if (!FEATURES[feature]) {
      throw new Error(`Unknown feature: ${feature}`);
    }

    // Update active state in feature navigation
    updateFeatureNavigation(feature);

    // Update sidebar with feature-specific views
    updateSidebar(feature);

    // Determine which view to load based on feature and user role
    let targetView = view;

    if (!targetView) {
      // Default view based on feature and user role
      if (feature === "standup") {
        const isTA = isProfessorOrTA();
        targetView = isTA ? "ta" : "form";
      } else {
        targetView = FEATURES[feature].views[0].id;
      }
    }

    // Update current state
    currentFeature = feature;
    currentView = targetView;

    // Load the content for the feature/view
    await loadContent(feature, targetView);

  } catch (error) {
    showError(`Failed to switch feature: ${error.message}`);
  }
}

/**
 * Update feature navigation active state
 * @param {string} feature - Active feature name
 */
function updateFeatureNavigation(feature) {
  const featureButtons = document.querySelectorAll(".feature-nav-btn");

  featureButtons.forEach(button => {
    const buttonFeature = button.getAttribute("data-feature");
    if (buttonFeature === feature) {
      button.classList.add("active");
    } else {
      button.classList.remove("active");
    }
  });
}

/**
 * Update sidebar with feature-specific navigation
 * @param {string} feature - Feature name
 */
function updateSidebar(feature) {
  const sidebarNav = document.getElementById("sidebar-nav");
  if (!sidebarNav) return;

  const featureConfig = FEATURES[feature];
  if (!featureConfig) return;

  // Clear existing sidebar content
  sidebarNav.innerHTML = "";

  // Filter views based on user role for standup feature
  let views = featureConfig.views;
  if (feature === "standup") {
    const isTA = isProfessorOrTA();
    if (isTA) {
      // TAs and Professors only see Team Dashboard and TA Overview
      views = views.filter(v => v.id === "team" || v.id === "ta");
    } else {
      // Students see Submit Standup, My History, and Team Dashboard
      views = views.filter(v => v.id !== "ta");
    }
  }

  // Add navigation items for this feature
  views.forEach(view => {
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
      loadContent(feature, view.id);
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
 * Load content for a specific feature and view
 * @param {string} feature - Feature name
 * @param {string} view - View name
 */
async function loadContent(feature, view) {
  const contentArea = document.getElementById("content-area");
  if (!contentArea) return;

  try {
    showLoading();

    // Load the appropriate module based on feature and view
    if (feature === "standup") {
      // Load standup course integration module
      const standupModule = await import("../standup/courseIntegration.js");
      await standupModule.render(contentArea, view);
    } else if (feature === "directory") {
      // Load directory module
      const directoryModule = await import("../directory/main.js");
      await directoryModule.render(contentArea, view);
    } else if (feature === "attendance") {
      // Load attendance module
      const attendanceModule = await import("../attendance/main.js");
      await attendanceModule.render(contentArea, view);
    }

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
