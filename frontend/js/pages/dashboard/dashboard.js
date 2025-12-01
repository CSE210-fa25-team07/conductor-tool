/** @module dashboard/frontend */
import { initGlobalNavigation } from "../../components/navigation.js";
import { handleVerification } from "../../utils/authVerify.js";
import { loadUserContext, isProf } from "../../utils/userContext.js";

// Wait for DOM to be fully loaded
document.addEventListener("DOMContentLoaded", async () => {

  // ==================== CHECK USER ====================
  // Initialize navigation component
  await initGlobalNavigation("dashboard");

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
 * @param {string} course.code - Course code
 * @param {string} course.name - Course name
 * @param {string} [course.description] - Course description
 * @param {string} [course.term] - Term name
 * @param {number} course.people - Number of people enrolled
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
      <div class="course-menu-container">
        <button class="course-menu-button" aria-label="Course options">
          <span class="menu-dots">⋮</span>
        </button>
        <div class="course-menu-dropdown">
          <a href="/courses/${course.courseUuid}/edit" class="menu-item">
            <span class="menu-item-icon">✎</span>
            <span>Edit</span>
          </a>
        </div>
      </div>
    </header>

    <p class="course-description">
      ${course.description || "No description available"}
    </p>

    ${course.term ? `<p style="font-size: var(--text-sm); color: var(--color-forest-green-medium); margin-top: var(--space-xs);">Term: ${course.term}</p>` : ""}

    <footer class="course-footer">
      <span class="course-people">${course.people} people</span>
    </footer>
  `;

  // Add click handler to navigate to course features page
  article.addEventListener("click", (e) => {
    // Don't navigate if clicking on menu or menu items
    if (e.target.closest(".course-menu-container")) {
      return;
    }
    handleCourseClick(course);
  });

  // Setup menu toggle
  const menuButton = article.querySelector(".course-menu-button");
  const menuDropdown = article.querySelector(".course-menu-dropdown");

  menuButton.addEventListener("click", (e) => {
    e.stopPropagation();

    // Close all other open menus
    document.querySelectorAll(".course-menu-dropdown.active").forEach(menu => {
      if (menu !== menuDropdown) {
        menu.classList.remove("active");
      }
    });

    // Toggle current menu
    menuDropdown.classList.toggle("active");
  });

  // Close menu when clicking outside
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".course-menu-container")) {
      menuDropdown.classList.remove("active");
    }
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

  article.addEventListener("click", async () => {
    await loadUserContext();

    // Enroll to new course
    if (!isProf()) {
      article.replaceWith(handleAddCourse());
    } else {
      // TODO: Create course for professors is not implemented yet
      window.location.href = "/courses/create"; // Placeholder redirect
    }
  });

  return article;
}

/**
 * Handle adding a new course
 * @returns {HTMLElement} The updated card element with the form
 */
function handleAddCourse() {
  const card = document.createElement("article");
  card.className = "course-card empty-state";

  card.innerHTML = `
    <form class="add-course-inline-form">
      <input type="text" id="verification-code" placeholder="Course Code" required />
      <button type="submit">Add</button>
    </form>
  `;

  const form = card.querySelector("form");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    handleVerification();
  });
  return card;
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
