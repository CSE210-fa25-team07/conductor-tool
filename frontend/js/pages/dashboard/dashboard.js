/** @module dashboard/frontend */
// Wait for DOM to be fully loaded
document.addEventListener("DOMContentLoaded", () => {

  // ==================== CHECK USER ====================
  // TODO: Connect backend to get user
  updateProfileName();
  createUserDropdown("student");

  const userProfileTrigger = document.getElementById("user-profile-trigger");
  const userDropdown = document.getElementById("user-dropdown");

  if (userProfileTrigger && userDropdown) {
    userProfileTrigger.addEventListener("click", (e) => {
      e.stopPropagation();
      userDropdown.classList.toggle("show");
    });

    // Close dropdown when clicking outside
    document.addEventListener("click", () => {
      userDropdown.classList.remove("show");
    });
  }

  // ==================== DASHBOARD PAGE ====================
  const courseGrid = document.getElementById("course-grid");

  if (courseGrid) {
    // Load and render courses
    loadCourses();
  }

});


// ==================== UTILITY FUNCTIONS ====================
async function updateProfileName() {

  try {
    const response = await fetch("/auth/session", {
      credentials: "include"
    });

    if (response.ok) {
      const data = await response.json();
      if (data.user && data.user.name) {
        const userAvatar = document.querySelector(".user-avatar");
        const userName = document.querySelector(".user-name");
        const name = data.user.name;

        // Change the avatar initials
        userAvatar.textContent = name.split(" ").map(word => word[0]).join("").toUpperCase();

        // Change the user name
        userName.textContent = name;
      }
    }
  } catch (error) {
    alert("Error fetching user session:", error);
  }

}
/**
 * Load courses from backend and render them
 */
async function loadCourses() {
  try {
    // TODO: Fetch from backend

    // Mock data for now
    const courses = [
      {
        code: "CSE 210",
        name: "Software Engineering",
        description: "Principles and practices of software engineering including requirements, design, implementation, testing, and maintenance.",
        assignments: 12,
        attendance: 95,
        instructor: "Dr. Smith",
        students: 45
      },
      {
        code: "CSE 110",
        name: "Software Engineering Fundamentals",
        description: "Introduction to software development with emphasis on teamwork, tools, and techniques for building quality software.",
        assignments: 8,
        attendance: 88,
        instructor: "Prof. Johnson",
        students: 60
      },
      {
        code: "CSE 100",
        name: "Advanced Data Structures",
        description: "Advanced topics in data structures and algorithms including graphs, trees, and optimization techniques.",
        assignments: 15,
        attendance: 92,
        instructor: "Dr. Williams",
        students: 38
      }
    ];

    renderCourses(courses);

  } catch {
    showErrorState();
  }
}


// ==================== HTML RENDERING FUNCTIONS ====================
/**
 * Create and populate the user dropdown menu
 * @param usertype - Either professor, admin, or student
 */
function createUserDropdown(usertype) {
  const dropdown = document.getElementById("user-dropdown");

  if (!dropdown) return;

  // Clear existing content
  dropdown.innerHTML = "";

  // Define menu items
  let menuItems;

  if (usertype === "student") {
    menuItems = [
      { text: "Profile", href: "html/profile.html" },
      { text: "Log Out", href: "/logout" }
    ];
  } else if (usertype === "professor") {
    menuItems = [
      { text: "Profile", href: "html/profile.html" },
      { text: "Manage Courses", href: "html/manage.html" },
      { text: "Log Out", href: "/logout" }
    ];
  }


  // Create and append each menu item
  menuItems.forEach(item => {
    const link = document.createElement("a");
    link.href = item.href;
    link.className = "dropdown-item";
    link.textContent = item.text;
    dropdown.appendChild(link);
  });
}

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
 * @param {string} course.code - Course code (e.g., "CSE 210")
 * @param {string} course.name - Course name
 * @param {string} course.description - Course description
 * @param {number} course.assignments - Number of assignments
 * @param {number} course.attendance - Attendance percentage
 * @param {string} course.instructor - Instructor name
 * @param {number} course.students - Number of students
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
      ${course.description}
    </p>

    <section class="course-stats">
      <article class="course-stat">
        <span class="course-stat-value">${course.assignments}</span>
        <span class="course-stat-label">Assignments</span>
      </article>
      <article class="course-stat">
        <span class="course-stat-value">${course.attendance}%</span>
        <span class="course-stat-label">Attendance</span>
      </article>
    </section>

    <footer class="course-footer">
      <span class="course-instructor">${course.instructor}</span>
      <span class="course-students">${course.students} students</span>
    </footer>
  `;

  // TODO: Add click handler to navigate to course details
  // article.addEventListener("click", () => {
  //   handleCourseClick(course);
  // });

  return article;
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
