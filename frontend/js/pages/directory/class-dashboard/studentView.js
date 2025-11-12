/**
 * Student Dashboard View
 * Displays course information, personal grades, and staff details
 */

// USING MOCK DATA - Switch to directoryApi.js when backend is ready
import {
  getCourseOverview,
  getCourseStaff,
  getUserProfile
} from "../../../api/directory/directoryApiMock.js";
import { mockData } from "../../../api/directory/mockData.js";

/**
 * Render course information header
 * @param {Object} course - Course data
 * @returns {string} HTML string
 */
function renderCourseHeader(course) {
  return `
    <div class="course-header">
      <div class="course-title">
        <h1>${course.course_name}</h1>
        <span class="course-code">${course.course_code}</span>
        <span class="course-term">${course.term_name}</span>
      </div>
      <div class="course-info">
        <div class="info-item">
          <span class="label">Lecture:</span>
          <span class="value">${course.lecture_time || "TBA"}</span>
        </div>
        <div class="info-item">
          <span class="label">Location:</span>
          <span class="value">${course.lecture_location || "TBA"}</span>
        </div>
      </div>
      <div class="course-links">
        ${course.syllabus_url ? `<a href="${course.syllabus_url}" target="_blank" class="btn btn-secondary">Syllabus</a>` : ""}
        ${course.canvas_url ? `<a href="${course.canvas_url}" target="_blank" class="btn btn-secondary">Canvas</a>` : ""}
      </div>
    </div>
  `;
}

/**
 * Render teaching staff and office hours
 * @param {Array} staff - List of staff members
 * @returns {string} HTML string
 */
function renderStaff(staff) {
  if (!staff || staff.length === 0) {
    return `
      <div class="staff-section">
        <h2>Teaching Staff</h2>
        <p class="no-data">No staff information available</p>
      </div>
    `;
  }

  const staffCards = staff.map(member => {
    const role = member.staff_role.charAt(0).toUpperCase() + member.staff_role.slice(1);
    const officeHours = member.office_hours && member.office_hours.length > 0
      ? member.office_hours.map(oh => {
        const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        return `${days[oh.day_of_week]} ${oh.start_time}-${oh.end_time} (${oh.location})`;
      }).join("<br>")
      : "No office hours posted";

    return `
      <div class="staff-card">
        <div class="staff-info">
          <h3><a href="user-profile.html?user=${member.user_uuid}" class="profile-link">${member.first_name} ${member.last_name}</a></h3>
          <span class="staff-role">${role}</span>
        </div>
        <div class="contact-info">
          <p><strong>Email:</strong> <a href="mailto:${member.email}">${member.email}</a></p>
          ${member.office_location ? `<p><strong>Office:</strong> ${member.office_location}</p>` : ""}
        </div>
        <div class="office-hours">
          <strong>Office Hours:</strong><br>
          ${officeHours}
        </div>
      </div>
    `;
  }).join("");

  return `
    <div class="staff-section">
      <h2>Teaching Staff & Office Hours</h2>
      <div class="staff-grid">
        ${staffCards}
      </div>
    </div>
  `;
}

/**
 * Render navigation buttons
 * @param {string} courseUuid - Course UUID
 * @returns {string} HTML string
 */
function renderNavigationButtons(courseUuid, options = {}) {
  const userUuid = options.userUuid || "student-1-uuid";
  const teamLink = options.teamLink || null;
  const teamName = options.teamName || null;

  const rosterLink = `user-directory.html?course=${courseUuid}`;
  const profileLink = `user-profile.html?user=${userUuid}`;

  const groupButton = teamLink
    ? `
      <a href="${teamLink}" class="nav-btn">
        <span class="icon">🔧</span>
        <span class="label">
          My Group
          ${teamName ? `<small>${teamName}</small>` : ""}
        </span>
      </a>
    `
    : `
      <div class="nav-btn nav-btn--disabled" role="button" aria-disabled="true">
        <span class="icon">🔧</span>
        <span class="label">
          My Group
          <span class="nav-helper">Join a team to unlock this link</span>
        </span>
      </div>
    `;

  return `
    <div class="dashboard-navigation">
      <a href="${rosterLink}" class="nav-btn">
        <span class="icon">👥</span>
        <span class="label">Class Roster</span>
      </a>
      ${groupButton}
      <a href="${profileLink}" class="nav-btn">
        <span class="icon">👤</span>
        <span class="label">My Profile</span>
      </a>
    </div>
  `;
}

/**
 * Render complete student dashboard view
 * @param {string} courseUuid - Course UUID
 * @param {HTMLElement} container - Container element to render into
 */
export async function renderStudentDashboard(courseUuid, container, roleData = null) {
  try {
    // Show loading state
    container.innerHTML = "<div class=\"loading\">Loading dashboard...</div>";

    // Fetch all data in parallel
    const [courseData, staffData] = await Promise.all([
      getCourseOverview(courseUuid),
      getCourseStaff(courseUuid)
    ]);

    // Resolve current user/team information for navigation
    let teamLink = null;
    let teamName = null;
    let userUuid = roleData?.user_uuid || mockData.userRole.user_uuid || "student-1-uuid";

    if (userUuid) {
      try {
        const userProfile = await getUserProfile(userUuid);
        const teams = userProfile.teams || [];
        const canonicalCourseUuid = courseData.course_uuid || courseUuid;

        let teamMembership = teams.find((team) => team.course_uuid === canonicalCourseUuid);

        if (!teamMembership) {
          teamMembership = teams.find((team) => team.course_uuid === courseUuid);
        }

        if (!teamMembership && courseUuid && courseUuid.startsWith("test-")) {
          teamMembership = teams.find((team) => team.course_uuid === canonicalCourseUuid);
        }

        if (!teamMembership && teams.length > 0) {
          teamMembership = teams.find((team) => team.course_uuid === canonicalCourseUuid) || teams[0];
        }

        if (teamMembership) {
          teamLink = `group-profile.html?team=${teamMembership.team_uuid}`;
          teamName = teamMembership.team_name;
        }
      } catch (profileError) {
        console.warn("Unable to load user profile for navigation", profileError);
      }
    }

    // Render the complete dashboard
    container.innerHTML = `
      <div class="student-dashboard">
        ${renderCourseHeader(courseData)}

        <div class="student-navigation-section">
          ${renderNavigationButtons(courseUuid, { teamLink, teamName, userUuid })}
        </div>

        ${renderStaff(staffData)}
      </div>
    `;

    // Add event listeners if needed
    setupEventListeners(container);

  } catch (error) {
    container.innerHTML = `
      <div class="error-message">
        <h2>Error Loading Dashboard</h2>
        <p>${error.message || "Failed to load dashboard. Please try again later."}</p>
      </div>
    `;
  }
}

/**
 * Setup event listeners for interactive elements
 * @param {HTMLElement} _container - Dashboard container
 */
function setupEventListeners(_container) {
  // Add any interactive behavior here
  // For example: sorting tables, filtering, etc.
}
