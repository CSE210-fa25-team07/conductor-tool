/**
 * @fileoverview Dashboard page logic
 * @module pages/directory/dashboard
 */

import * as directoryApi from "../../api/directoryApi.js";
import { navigateToUser } from "./main.js";
import { getUserRoleInCourse } from "../../utils/userContext.js";

let currentCourseUuid = null;
let currentCourse = null;

/**
 * Initialize the dashboard page
 * @param {string} courseUuid - Course UUID
 */
export async function init(courseUuid) {
  currentCourseUuid = courseUuid;
  await loadDashboard();
  setupEventListeners();
}

/**
 * Load dashboard data
 */
async function loadDashboard() {
  try {
    // Load all data in parallel
    const [overview, staff] = await Promise.all([
      directoryApi.getCourseOverview(currentCourseUuid),
      directoryApi.getCourseStaff(currentCourseUuid)
    ]);

    currentCourse = overview;
    renderCourseInfo(overview);
    renderStats(overview.stats, staff);
    renderStaff(staff);

    // Show edit button only for professors
    const userRole = getUserRoleInCourse(currentCourseUuid);
    const editBtn = document.getElementById("edit-course-links-btn");
    if (editBtn && userRole === "Professor") {
      editBtn.style.display = "block";
    }

  } catch (error) {
    showError("Failed to load dashboard: " + error.message);
  }
}

/**
 * Render course information
 * @param {Object} course - Course overview data
 */
function renderCourseInfo(course) {
  const container = document.getElementById("course-info-content");
  if (!container) return;

  const termInfo = course.term
    ? "<div style=\"font-family: var(--font-mono); font-size: var(--text-sm); color: var(--color-forest-green-medium); margin-top: var(--space-sm);\">" + course.term.season + " " + course.term.year + "</div>"
    : "";

  const description = course.description
    ? "<p style=\"font-family: var(--font-mono); font-size: var(--text-base); color: var(--color-forest-green); margin-top: var(--space-md); line-height: 1.6;\">" + course.description + "</p>"
    : "";

  const links = [];
  if (course.syllabusUrl) {
    links.push("<a href=\"" + course.syllabusUrl + "\" target=\"_blank\" style=\"font-family: var(--font-mono); font-size: var(--text-sm); color: var(--color-forest-green); text-decoration: underline;\">Syllabus →</a>");
  }
  if (course.canvasUrl) {
    links.push("<a href=\"" + course.canvasUrl + "\" target=\"_blank\" style=\"font-family: var(--font-mono); font-size: var(--text-sm); color: var(--color-forest-green); text-decoration: underline;\">Canvas →</a>");
  }
  const linksHtml = links.length > 0
    ? "<div style=\"display: flex; gap: var(--space-md); margin-top: var(--space-md);\">" + links.join("") + "</div>"
    : "";

  container.innerHTML = "<div><h3 style=\"font-family: var(--font-heading); font-size: var(--text-xl); color: var(--color-forest-green);\">" + course.courseCode + " - " + course.courseName + "</h3>" + termInfo + description + linksHtml + "</div>";
}

/**
 * Render course statistics
 * @param {Object} stats - Statistics data
 * @param {Array} staff - Staff members array
 */
function renderStats(stats, staff) {
  const enrollmentsEl = document.getElementById("total-enrollments");
  const staffEl = document.getElementById("total-staff");

  if (enrollmentsEl) enrollmentsEl.textContent = stats.totalEnrollments || 0;
  if (staffEl) staffEl.textContent = staff ? staff.length : 0;
}

/**
 * Render staff list
 * @param {Array} staff - Staff members
 */
function renderStaff(staff) {
  const container = document.getElementById("staff-list");
  if (!container) return;

  if (!staff || staff.length === 0) {
    container.innerHTML = "<p class=\"loading-text\">No staff members found</p>";
    return;
  }

  container.innerHTML = "<div class=\"staff-grid\">" + staff.map(member => {
    const initials = ((member.firstName?.[0] || "") + (member.lastName?.[0] || "")).toUpperCase() || "?";
    const photoHtml = member.photoUrl
      ? "<div class=\"staff-avatar\"><img src=\"" + member.photoUrl + "\" alt=\"" + member.firstName + " " + member.lastName + "\"></div>"
      : "<div class=\"staff-avatar-initials\">" + initials + "</div>";

    const roleLabel = member.role === "Professor" ? "Professor" : "Teaching Assistant";
    const roleClass = member.role === "Professor" ? "staff-role-professor" : "staff-role-ta";

    const staffInfo = member.staff && member.staff.officeLocation
      ? "<div class=\"staff-office\">Office: " + member.staff.officeLocation + "</div>"
      : "";

    return "<article data-user-uuid=\"" + member.userUuid + "\" class=\"staff-card\"><div class=\"staff-card-header\">" + photoHtml + "<div class=\"staff-info\"><div class=\"staff-name\">" + member.firstName + " " + member.lastName + "</div><div class=\"staff-email\">" + member.email + "</div></div></div><span class=\"staff-role-badge " + roleClass + "\">" + roleLabel + "</span>" + staffInfo + "</article>";
  }).join("") + "</div>";

  // Add click handlers for staff cards
  const staffCards = container.querySelectorAll(".staff-card");
  staffCards.forEach(card => {
    card.addEventListener("click", () => {
      const userUuid = card.getAttribute("data-user-uuid");
      navigateToUser(userUuid);
    });
  });
}

/**
 * Show error message
 * @param {string} message - Error message
 */
function showError(message) {
  const container = document.getElementById("course-overview");
  if (container) {
    container.innerHTML = "<div class=\"loading-card\"><p class=\"loading-text\">" + message + "</p></div>";
  }
}

/**
 * Setup event listeners for edit functionality
 */
function setupEventListeners() {
  const editBtn = document.getElementById("edit-course-links-btn");
  const cancelBtn = document.getElementById("cancel-edit-btn");
  const form = document.getElementById("course-links-form");

  if (editBtn) {
    editBtn.addEventListener("click", enterEditMode);
  }

  if (cancelBtn) {
    cancelBtn.addEventListener("click", exitEditMode);
  }

  if (form) {
    form.addEventListener("submit", saveCourseLinks);
  }
}

/**
 * Enter edit mode for course links
 */
function enterEditMode() {
  if (!currentCourse) return;

  // Populate form with current values
  const syllabusInput = document.getElementById("edit-syllabusUrl");
  const canvasInput = document.getElementById("edit-canvasUrl");

  if (syllabusInput) syllabusInput.value = currentCourse.syllabusUrl || "";
  if (canvasInput) canvasInput.value = currentCourse.canvasUrl || "";

  // Toggle views
  const viewMode = document.getElementById("course-info-view-mode");
  const editMode = document.getElementById("course-info-edit-mode");
  const editBtn = document.getElementById("edit-course-links-btn");

  if (viewMode) viewMode.style.display = "none";
  if (editMode) editMode.style.display = "block";
  if (editBtn) editBtn.style.display = "none";
}

/**
 * Exit edit mode
 */
function exitEditMode() {
  const viewMode = document.getElementById("course-info-view-mode");
  const editMode = document.getElementById("course-info-edit-mode");
  const editBtn = document.getElementById("edit-course-links-btn");

  if (viewMode) viewMode.style.display = "block";
  if (editMode) editMode.style.display = "none";
  if (editBtn) editBtn.style.display = "block";
}

/**
 * Save course links
 * @param {Event} event - Form submit event
 */
async function saveCourseLinks(event) {
  event.preventDefault();

  const saveBtn = document.getElementById("save-links-btn");
  if (!saveBtn) return;

  saveBtn.disabled = true;
  saveBtn.textContent = "Saving...";

  try {
    const syllabusUrl = document.getElementById("edit-syllabusUrl").value.trim() || null;
    const canvasUrl = document.getElementById("edit-canvasUrl").value.trim() || null;

    await directoryApi.updateCourseLinks(currentCourseUuid, {
      syllabusUrl,
      canvasUrl
    });

    // Reload dashboard to show updated links
    await loadDashboard();
    exitEditMode();

  } catch (error) {
    alert("Failed to update course links: " + error.message);
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = "Save Changes";
  }
}
