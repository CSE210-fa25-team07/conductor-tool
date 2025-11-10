/**
 * Student Dashboard View
 * Displays course information, personal grades, and staff details
 */

// USING MOCK DATA - Switch to directoryApi.js when backend is ready
import {
  getCourseOverview,
  getStudentGrade,
  getStudentAssignments,
  getCourseStaff
} from '../../api/directory/directoryApiMock.js';

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
          <span class="value">${course.lecture_time || 'TBA'}</span>
        </div>
        <div class="info-item">
          <span class="label">Location:</span>
          <span class="value">${course.lecture_location || 'TBA'}</span>
        </div>
      </div>
      <div class="course-links">
        ${course.syllabus_url ? `<a href="${course.syllabus_url}" target="_blank" class="btn btn-secondary">Syllabus</a>` : ''}
        ${course.canvas_url ? `<a href="${course.canvas_url}" target="_blank" class="btn btn-secondary">Canvas</a>` : ''}
      </div>
    </div>
  `;
}

/**
 * Render student's current grade
 * @param {Object} grade - Grade data
 * @returns {string} HTML string
 */
function renderCurrentGrade(grade) {
  if (!grade || grade.current_percentage === null) {
    return `
      <div class="grade-card">
        <h2>Your Grade</h2>
        <p class="no-grade">No grades posted yet</p>
      </div>
    `;
  }

  const percentage = parseFloat(grade.current_percentage).toFixed(2);
  const letterGrade = grade.current_letter_grade || 'N/A';

  return `
    <div class="grade-card">
      <h2>Your Grade</h2>
      <div class="grade-display">
        <div class="grade-percentage">${percentage}%</div>
        <div class="grade-letter">${letterGrade}</div>
      </div>
    </div>
  `;
}

/**
 * Render assignments table
 * @param {Array} assignments - List of assignments
 * @returns {string} HTML string
 */
function renderAssignments(assignments) {
  if (!assignments || assignments.length === 0) {
    return `
      <div class="assignments-section">
        <h2>Assignments</h2>
        <p class="no-data">No assignments yet</p>
      </div>
    `;
  }

  const assignmentRows = assignments.map(assignment => {
    const dueDate = assignment.due_date
      ? new Date(assignment.due_date).toLocaleDateString()
      : 'No due date';

    const points = assignment.points_earned !== null
      ? `${assignment.points_earned} / ${assignment.points_possible}`
      : `- / ${assignment.points_possible}`;

    const percentage = assignment.percentage !== null
      ? `${parseFloat(assignment.percentage).toFixed(1)}%`
      : '-';

    const status = assignment.graded_at
      ? 'Graded'
      : assignment.submitted_at
      ? 'Submitted'
      : 'Not Submitted';

    return `
      <tr>
        <td>${assignment.assignment_name}</td>
        <td><span class="category-badge">${assignment.assignment_category}</span></td>
        <td>${dueDate}</td>
        <td>${points}</td>
        <td>${percentage}</td>
        <td><span class="status-badge status-${status.toLowerCase().replace(' ', '-')}">${status}</span></td>
      </tr>
    `;
  }).join('');

  return `
    <div class="assignments-section">
      <h2>Assignments</h2>
      <table class="assignments-table">
        <thead>
          <tr>
            <th>Assignment</th>
            <th>Category</th>
            <th>Due Date</th>
            <th>Points</th>
            <th>Percentage</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${assignmentRows}
        </tbody>
      </table>
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
          const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
          return `${days[oh.day_of_week]} ${oh.start_time}-${oh.end_time} (${oh.location})`;
        }).join('<br>')
      : 'No office hours posted';

    return `
      <div class="staff-card">
        <div class="staff-info">
          <h3>${member.first_name} ${member.last_name}</h3>
          <span class="staff-role">${role}</span>
        </div>
        <div class="contact-info">
          <p><strong>Email:</strong> <a href="mailto:${member.email}">${member.email}</a></p>
          ${member.office_location ? `<p><strong>Office:</strong> ${member.office_location}</p>` : ''}
        </div>
        <div class="office-hours">
          <strong>Office Hours:</strong><br>
          ${officeHours}
        </div>
      </div>
    `;
  }).join('');

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
      <a href="/roster?course=${courseUuid}" class="nav-btn">
        <span class="icon">👥</span>
        <span class="label">Class Roster</span>
      </a>
      <a href="/my-group?course=${courseUuid}" class="nav-btn">
        <span class="icon">🔧</span>
        <span class="label">My Group</span>
      </a>
      <a href="/profile" class="nav-btn">
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
export async function renderStudentDashboard(courseUuid, container) {
  try {
    // Show loading state
    container.innerHTML = '<div class="loading">Loading dashboard...</div>';

    // Fetch all data in parallel
    const [courseData, gradeData, assignmentsData, staffData] = await Promise.all([
      getCourseOverview(courseUuid),
      getStudentGrade(courseUuid),
      getStudentAssignments(courseUuid),
      getCourseStaff(courseUuid)
    ]);

    // Render the complete dashboard
    container.innerHTML = `
      <div class="student-dashboard">
        ${renderCourseHeader(courseData)}

        <div class="dashboard-main">
          <div class="left-column">
            ${renderCurrentGrade(gradeData)}
            ${renderNavigationButtons(courseUuid)}
          </div>

          <div class="right-column">
            ${renderAssignments(assignmentsData)}
          </div>
        </div>

        ${renderStaff(staffData)}
      </div>
    `;

    // Add event listeners if needed
    setupEventListeners(container);

  } catch (error) {
    console.error('Error rendering student dashboard:', error);
    container.innerHTML = `
      <div class="error-message">
        <h2>Error Loading Dashboard</h2>
        <p>${error.message || 'Failed to load dashboard. Please try again later.'}</p>
      </div>
    `;
  }
}

/**
 * Setup event listeners for interactive elements
 * @param {HTMLElement} container - Dashboard container
 */
function setupEventListeners(container) {
  // Add any interactive behavior here
  // For example: sorting tables, filtering, etc.
}
