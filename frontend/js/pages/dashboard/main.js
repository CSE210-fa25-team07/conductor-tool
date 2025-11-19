/**
 * @fileoverview Main Dashboard Page
 * Displays course cards for logged-in user
 * @module pages/dashboard/main
 */

/**
 * Courses data - fetched from API
 */
let courses = [];

/**
 * Mock user data
 */
const mockUser = {
  name: "John Doe",
  avatar: "JD"
};

/**
 * Initializes the dashboard
 */
async function initDashboard() {
  // Setup user profile dropdown
  setupDropdown();

  // Fetch and render courses from API
  await loadCourses();
}

/**
 * Sets up the user profile dropdown menu
 */
function setupDropdown() {
  const trigger = document.getElementById("user-profile-trigger");
  const dropdown = document.getElementById("user-dropdown");

  if (!trigger || !dropdown) return;

  // Toggle dropdown on click
  trigger.addEventListener("click", (e) => {
    e.stopPropagation();
    dropdown.classList.toggle("show");
  });

  // Close dropdown when clicking outside
  document.addEventListener("click", (e) => {
    if (!trigger.contains(e.target) && !dropdown.contains(e.target)) {
      dropdown.classList.remove("show");
    }
  });

  // Close dropdown when pressing Escape
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      dropdown.classList.remove("show");
    }
  });
}

/**
 * Loads courses from API
 */
async function loadCourses() {
  try {
    const response = await fetch("/api/courses");
    const result = await response.json();

    if (result.success) {
      courses = result.data;
      renderCourses();
    } else {
      console.error("Failed to load courses:", result.error);
      renderCourses();
    }
  } catch (error) {
    console.error("Error fetching courses:", error);
    renderCourses();
  }
}

/**
 * Renders course cards to the grid
 */
function renderCourses() {
  const grid = document.getElementById("course-grid");

  if (!courses || courses.length === 0) {
    grid.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📚</div>
        <div class="empty-state-text">No courses found. Check back later!</div>
      </div>
    `;
    return;
  }

  grid.innerHTML = "";

  courses.forEach(course => {
    const card = createCourseCard(course);
    grid.appendChild(card);
  });
}

/**
 * Creates a course card element
 * @param {Object} course - Course data
 * @returns {HTMLElement} Course card element
 */
function createCourseCard(course) {
  const card = document.createElement("div");
  card.className = "course-card";
  card.onclick = () => navigateToCourse(course.id);

  // Get initials from course code
  const initials = course.code.split(" ")[0].slice(0, 3).toUpperCase();

  card.innerHTML = `
    <div class="course-card-header">
      <div class="course-icon">${initials}</div>
      <div class="course-info">
        <div class="course-code">${course.code}</div>
        <div class="course-name">${course.name}</div>
      </div>
    </div>

    <p class="course-description">${course.description}</p>

    <div class="course-stats">
      <div class="course-stat">
        <div class="course-stat-value">${course.assignments}</div>
        <div class="course-stat-label">Assignments</div>
      </div>
      <div class="course-stat">
        <div class="course-stat-value">${course.attendance}%</div>
        <div class="course-stat-label">Attendance</div>
      </div>
    </div>

    <div class="course-footer">
      <div class="course-instructor">${course.instructor}</div>
      <div class="course-students">${course.students} students</div>
    </div>
  `;

  return card;
}

/**
 * Navigates to a specific course
 * @param {number} courseId - Course ID
 */
function navigateToCourse(courseId) {
  // Navigate to the course's class dashboard
  window.location.href = `/course/${courseId}/class`;
}

// Initialize when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initDashboard);
} else {
  initDashboard();
}
