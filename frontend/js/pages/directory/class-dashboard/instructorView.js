/**
 * Instructor Dashboard View
 * Displays course information, enrollment statistics, assignment stats, and recent enrollments
 */

// USING MOCK DATA - Switch to directoryApi.js when backend is ready
import {
  getCourseOverview,
  getEnrollmentStats,
  getRecentEnrollments,
  getCourseStaff
} from "../../../api/directory/directoryApiMock.js";

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
 * Render enrollment statistics cards
 * @param {Object} stats - Enrollment statistics
 * @returns {string} HTML string
 */
function renderEnrollmentStats(stats) {
  if (!stats) {
    return `
      <div class="stats-section">
        <h2>Enrollment Statistics</h2>
        <p class="no-data">No enrollment data available</p>
      </div>
    `;
  }

  return `
    <div class="stats-section">
      <h2>Enrollment Statistics</h2>
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-value">${stats.total_students || 0}</div>
          <div class="stat-label">Total Students</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${stats.active_students || 0}</div>
          <div class="stat-label">Active Students</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${stats.dropped_students || 0}</div>
          <div class="stat-label">Dropped Students</div>
        </div>
      </div>
    </div>
  `;
}

/**
 * Render recent enrollments list
 * @param {Array} enrollments - List of recent enrollments
 * @returns {string} HTML string
 */
function renderRecentEnrollments(enrollments) {
  if (!enrollments || enrollments.length === 0) {
    return `
      <div class="recent-enrollments-section">
        <h2>Recent Enrollments</h2>
        <p class="no-data">No recent enrollments</p>
      </div>
    `;
  }

  const enrollmentItems = enrollments.map(enrollment => {
    const enrolledDate = new Date(enrollment.enrolled_at).toLocaleDateString();
    const status = enrollment.enrollment_status === "active" ? "Active" : "Dropped";

    return `
      <div class="enrollment-item">
        <div class="enrollment-student">
          <strong><a href="user-profile.html?user=${enrollment.user_uuid}" class="profile-link">${enrollment.first_name} ${enrollment.last_name}</a></strong>
          <span class="student-email">${enrollment.email}</span>
        </div>
        <div class="enrollment-details">
          <span class="enrollment-date">${enrolledDate}</span>
          <span class="status-badge status-${status.toLowerCase()}">${status}</span>
        </div>
      </div>
    `;
  }).join("");

  return `
    <div class="recent-enrollments-section">
      <h2>Recent Enrollments</h2>
      <div class="enrollments-list">
        ${enrollmentItems}
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
function renderNavigationButtons(courseUuid) {
  return `
    <div class="dashboard-navigation">
      <a href="user-directory.html?course=${courseUuid}" class="nav-btn">
        <span class="icon">👥</span>
        <span class="label">Class Roster</span>
      </a>
      <a href="user-profile.html?user=staff-1-uuid" class="nav-btn">
        <span class="icon">👤</span>
        <span class="label">My Profile</span>
      </a>
    </div>
  `;
}

/**
 * Render complete instructor dashboard view
 * @param {string} courseUuid - Course UUID
 * @param {HTMLElement} container - Container element to render into
 */
export async function renderInstructorDashboard(courseUuid, container) {
  try {
    // Show loading state
    container.innerHTML = "<div class=\"loading\">Loading dashboard...</div>";

    // Fetch all data in parallel
    const [courseData, enrollmentStats, recentEnrollments, staffData] = await Promise.all([
      getCourseOverview(courseUuid),
      getEnrollmentStats(courseUuid),
      getRecentEnrollments(courseUuid, 10),
      getCourseStaff(courseUuid)
    ]);

    // Render the complete dashboard
    container.innerHTML = `
      <div class="instructor-dashboard">
        ${renderCourseHeader(courseData)}

        <div class="dashboard-main">
          <div class="left-column">
            ${renderEnrollmentStats(enrollmentStats)}
            ${renderNavigationButtons(courseUuid)}
          </div>

          <div class="right-column">
            ${renderRecentEnrollments(recentEnrollments)}
          </div>
        </div>

        ${renderStaff(staffData)}
      </div>
    `;

    // Add event listeners if needed
    setupEventListeners();

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
function setupEventListeners() {
  // Add any interactive behavior here
  // For example: sorting tables, filtering, etc.
}
