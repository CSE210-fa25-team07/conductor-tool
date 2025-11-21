/** @module dashboard/frontend */
import { initProfileDropdown, createUserDropdown } from "../../components/profileDropdown.js";

// Wait for DOM to be fully loaded
document.addEventListener("DOMContentLoaded", async () => {

  // ==================== CHECK USER ====================
  // Initialize shared profile dropdown component
  createUserDropdown("student");
  await initProfileDropdown();

  // ==================== DASHBOARD PAGE ====================
  const courseGrid = document.getElementById("course-grid");

  if (courseGrid) {
    // Load and render courses
    loadCourses();
  }

});
/**
 * Load courses from backend and render them
 */
async function loadCourses() {
  try {
    const response = await fetch("/v1/api/courses");

    if (!response.ok) {
      throw new Error("Failed to fetch courses");
    }

    const data = await response.json();
    const courses = data.courses || [];

    renderCourses(courses);

  } catch {
    showErrorState();
  }
}


// ==================== HTML RENDERING FUNCTIONS ====================
/**
 * Render all courses to the grid
 * @param {Array} courses - Array of course objects
 */
function renderCourses(courses) {
  const courseGrid = document.getElementById("course-grid");

  // Clear existing content
  courseGrid.innerHTML = "";

  // Render each course card
  courses.forEach(course => {
    const courseCard = createCourseCard(course);
    courseGrid.appendChild(courseCard);
  });

  // Add empty-state card at the end
  const emptyStateCard = createEmptyStateCard();
  courseGrid.appendChild(emptyStateCard);
}

/**
 * Create a course card element
 * @param {Object} course - Course data object
 * @param {string} course.courseUuid - Course UUID (primary key)
 * @param {string} course.code - Course code (e.g., "CSE 210")
 * @param {string} course.name - Course name
 * @param {string} [course.description] - Course description
 * @param {string} [course.term] - Term name
 * @param {number} course.students - Number of students enrolled
 * @returns {HTMLElement} Course card article element
 */
function createCourseCard(course) {
  // Create main card article
  const article = document.createElement("article");
  article.className = "course-card";

  // Extract department code (first part of course code)
  const deptCode = course.code.split(" ")[0];

  // Build card HTML
  article.innerHTML = `
    <header class="course-card-header">
      <figure class="course-icon">${deptCode}</figure>
      <section class="course-info">
        <span class="course-code">${course.code}</span>
        <h3 class="course-name">${course.name}</h3>
      </section>
    </header>

    <p class="course-description">
      ${course.description || "No description available"}
    </p>

    ${course.term ? `<p style="font-size: var(--text-sm); color: var(--color-forest-green-medium); margin-top: var(--space-xs);">Term: ${course.term}</p>` : ""}

    <footer class="course-footer">
      <span class="course-students">${course.students} students</span>
    </footer>
  `;

  // Add click handler to navigate to course features page
  article.addEventListener("click", () => {
    handleCourseClick(course);
  });

  article.style.cursor = "pointer";

  return article;
}

/**
 * Handle course card click
 * @param {Object} course - Course data
 */
function handleCourseClick(course) {
  // Store course data in sessionStorage for access on course page
  sessionStorage.setItem("activeCourse", JSON.stringify(course));

  // Navigate to course directory page using courseUuid
  window.location.href = `/courses/${course.courseUuid}/directory`;
}

/**
 * Create the empty-state "Add New Course" card
 * @returns {HTMLElement} Empty-state card article element
 */
function createEmptyStateCard() {
  const article = document.createElement("article");
  article.className = "course-card empty-state";

  article.innerHTML = `
    <section class="empty-state-section">
      <span class="empty-state-icon">➕</span>
      <h3 class="empty-state-text">Add New Course</h3>
      <p class="empty-state-description">Click to enroll in a new course</p>
    </section>
  `;

  // TODO: Add click handler (Depending on either student or professor)
  // article.addEventListener("click", () => {
  //   handleAddCourse();
  // });

  return article;
}

/**
 * Show error state when courses fail to load
 */
function showErrorState() {
  const courseGrid = document.getElementById("course-grid");
  courseGrid.innerHTML = `
    <div style="grid-column: 1 / -1; text-align: center; padding: var(--space-2xl);">
      <p style="color: var(--color-forest-green-medium); font-size: var(--text-lg);">
        Failed to load courses. Please refresh the page to try again.
      </p>
    </div>
  `;
}
