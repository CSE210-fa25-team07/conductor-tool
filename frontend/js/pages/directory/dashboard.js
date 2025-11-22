/**
 * @fileoverview Dashboard page logic
 * @module pages/directory/dashboard
 */

import * as directoryApi from "../../api/directoryApi.js";
import { navigateToUser } from "./main.js";

let currentCourseUuid = null;

/**
 * Initialize the dashboard page
 * @param {string} courseUuid - Course UUID
 */
export async function init(courseUuid) {
  currentCourseUuid = courseUuid;
  await loadDashboard();
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

    renderCourseInfo(overview);
    renderStats(overview.stats);
    renderStaff(staff);

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
 */
function renderStats(stats) {
  const enrollmentsEl = document.getElementById("total-enrollments");
  const teamsEl = document.getElementById("total-teams");

  if (enrollmentsEl) enrollmentsEl.textContent = stats.totalEnrollments || 0;
  if (teamsEl) teamsEl.textContent = stats.totalTeams || 0;
}

/**
 * Render staff list
 * @param {Array} staff - Staff members
 */
function renderStaff(staff) {
  const container = document.getElementById("staff-list");
  if (!container) return;

  if (!staff || staff.length === 0) {
    container.innerHTML = "<p style=\"font-family: var(--font-mono); color: var(--color-forest-green-medium);\">No staff members found</p>";
    return;
  }

  container.innerHTML = "<div style=\"display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: var(--space-lg);\">" + staff.map(member => {
    const initials = (member.firstName[0] + member.lastName[0]).toUpperCase();
    const photoHtml = member.photoUrl
      ? "<img src=\"" + member.photoUrl + "\" alt=\"" + member.firstName + " " + member.lastName + "\" style=\"width: 50px; height: 50px; border-radius: 50%; border: var(--border-thick);\">"
      : "<div style=\"width: 50px; height: 50px; border-radius: 50%; background: var(--color-radioactive-lime); border: var(--border-thick); display: flex; align-items: center; justify-content: center; font-family: var(--font-mono); font-weight: 600; color: var(--color-forest-green);\">" + initials + "</div>";

    const roleLabel = member.role === "Professor" ? "Professor" : "Teaching Assistant";
    const roleColor = member.role === "Professor" ? "var(--color-radioactive-lime)" : "var(--color-light-matcha)";

    const staffInfo = member.staff && member.staff.officeLocation
      ? "<div style=\"font-family: var(--font-mono); font-size: var(--text-xs); color: var(--color-forest-green-medium); margin-top: var(--space-xs);\">Office: " + member.staff.officeLocation + "</div>"
      : "";

    return "<article data-user-uuid=\"" + member.userUuid + "\" class=\"staff-card\" style=\"background: var(--color-light-matcha); border: var(--border-thick); padding: var(--space-md); cursor: pointer; transition: all 0.2s ease;\"><div style=\"display: flex; align-items: center; gap: var(--space-md); margin-bottom: var(--space-sm);\">" + photoHtml + "<div style=\"flex: 1;\"><div style=\"font-family: var(--font-mono); font-weight: 600; color: var(--color-forest-green);\">" + member.firstName + " " + member.lastName + "</div><div style=\"font-family: var(--font-mono); font-size: var(--text-sm); color: var(--color-forest-green-medium);\">" + member.email + "</div></div></div><div style=\"margin-top: var(--space-sm);\"><span style=\"font-family: var(--font-mono); font-size: var(--text-xs); padding: var(--space-xs) var(--space-sm); background: " + roleColor + "; border: var(--border-thick); color: var(--color-forest-green);\">" + roleLabel + "</span></div>" + staffInfo + "</article>";
  }).join("") + "</div>";

  // Add click handlers for staff cards
  const staffCards = container.querySelectorAll(".staff-card");
  staffCards.forEach(card => {
    card.addEventListener("click", () => {
      const userUuid = card.getAttribute("data-user-uuid");
      navigateToUser(userUuid);
    });

    // Add hover effect
    card.addEventListener("mouseenter", () => {
      card.style.transform = "translateY(-2px)";
      card.style.boxShadow = "0 4px 6px rgba(0, 0, 0, 0.1)";
    });

    card.addEventListener("mouseleave", () => {
      card.style.transform = "translateY(0)";
      card.style.boxShadow = "none";
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
    container.innerHTML = "<div style=\"background: var(--color-light-matcha); border: var(--border-thick); padding: var(--space-2xl); text-align: center;\"><p style=\"font-family: var(--font-mono); color: var(--color-forest-green);\">" + message + "</p></div>";
  }
}
