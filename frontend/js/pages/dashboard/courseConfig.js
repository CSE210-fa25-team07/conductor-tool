/** @module courseConfig/frontend */
import { initGlobalNavigation } from "../../components/navigation.js";

// Detect if we"re on create or edit page
const isCreatePage = window.location.pathname.includes("/create");
const isEditPage = window.location.pathname.includes("/edit");

// Wait for DOM to be fully loaded
document.addEventListener("DOMContentLoaded", async () => {

  // Initialize navigation component
  await initGlobalNavigation("dashboard");

  if (isCreatePage) {
    await initCreateCoursePage();
  } else if (isEditPage) {
    await initEditCoursePage();
  }
});

/**
 * Initialize the create course page
 */
async function initCreateCoursePage() {
  // Load available terms
  await loadTerms("create");

  // Setup generate buttons for verification codes
  setupGenerateButtons("create");

  // Setup cancel button
  document.getElementById("cancel-button").addEventListener("click", () => {
    window.location.href = "/dashboard";
  });

  // Setup form submission
  const form = document.getElementById("create-course-form");
  form.addEventListener("submit", handleCreateCourseSubmit);
}

/**
 * Initialize the edit course page
 */
async function initEditCoursePage() {
  // Extract courseUuid from URL: /courses/:courseUuid/edit
  const pathParts = window.location.pathname.split("/");
  const courseUuid = pathParts[2];

  if (!courseUuid) {
    showError("edit", "Invalid course URL");
    return;
  }

  // Load available terms
  await loadTerms("edit");

  // Load existing course data
  await loadCourseData(courseUuid);

  // Setup generate buttons for verification codes
  setupGenerateButtons("edit");

  // Setup cancel button
  document.getElementById("cancel-button").addEventListener("click", () => {
    window.location.href = "/dashboard";
  });

  // Setup form submission
  const form = document.getElementById("edit-course-form");
  form.addEventListener("submit", (e) => handleEditCourseSubmit(e, courseUuid));
}

/**
 * Load available terms (current and next term)
 * @param {string} mode - "create" or "edit"
 */
async function loadTerms(mode) {
  try {
    const response = await fetch("/v1/api/courses/terms");

    if (!response.ok) {
      throw new Error("Failed to fetch terms");
    }

    const data = await response.json();
    const terms = data.terms || [];

    const selectElement = document.getElementById(`term-select-${mode}`);
    selectElement.innerHTML = "<option value=\"\">Select a term...</option>";

    terms.forEach(term => {
      const option = document.createElement("option");
      option.value = term.termUuid;
      option.textContent = `${term.season} ${term.year}`;
      selectElement.appendChild(option);
    });

  } catch {
    showError(mode, "Failed to load terms. Please refresh the page.");
  }
}

/**
 * Load existing course data for editing
 * @param {string} courseUuid - The course UUID
 */
async function loadCourseData(courseUuid) {
  try {
    const response = await fetch(`/v1/api/courses/${courseUuid}/edit`);

    if (!response.ok) {
      throw new Error("Failed to fetch course data");
    }

    const data = await response.json();
    const course = data.course;

    // Populate form fields
    document.getElementById("course-code-edit").value = course.courseCode || "";
    document.getElementById("course-name-edit").value = course.courseName || "";
    document.getElementById("term-select-edit").value = course.termUuid || "";
    document.getElementById("description-edit").value = course.description || "";
    document.getElementById("ta-code-edit").value = course.taCode || "";
    document.getElementById("tutor-code-edit").value = course.tutorCode || "";
    document.getElementById("student-code-edit").value = course.studentCode || "";
    document.getElementById("syllabus-url-edit").value = course.syllabusUrl || "";
    document.getElementById("canvas-url-edit").value = course.canvasUrl || "";

  } catch {
    showError("edit", "Failed to load course data. Please try again.");
  }
}

/**
 * Setup generate buttons for verification codes
 * @param {string} mode - "create" or "edit"
 */
function setupGenerateButtons(mode) {
  const roles = ["ta", "tutor", "student"];

  roles.forEach(role => {
    const button = document.getElementById(`generate-${role}-code-${mode}`);
    const input = document.getElementById(`${role}-code-${mode}`);

    button.addEventListener("click", () => {
      const code = generateVerificationCode();
      input.value = code;
    });
  });
}

/**
 * Generate a random verification code (8 characters: uppercase letters and digits)
 * @returns {string} A random verification code
 */
function generateVerificationCode() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Handle create course form submission
 * @param {Event} e - The form submission event
 */
async function handleCreateCourseSubmit(e) {
  e.preventDefault();

  // Clear previous errors
  clearError("create");

  // Get form data
  const formData = {
    courseCode: document.getElementById("course-code-create").value.trim(),
    courseName: document.getElementById("course-name-create").value.trim(),
    termUuid: document.getElementById("term-select-create").value,
    description: document.getElementById("description-create").value.trim(),
    taCode: document.getElementById("ta-code-create").value.trim(),
    tutorCode: document.getElementById("tutor-code-create").value.trim(),
    studentCode: document.getElementById("student-code-create").value.trim(),
    syllabusUrl: document.getElementById("syllabus-url-create").value.trim(),
    canvasUrl: document.getElementById("canvas-url-create").value.trim()
  };

  // Validate form data
  const validationError = validateCourseData(formData);
  if (validationError) {
    showError("create", validationError);
    return;
  }

  // Disable submit button to prevent double submission
  const submitButton = document.getElementById("submit-button");
  submitButton.disabled = true;
  submitButton.textContent = "Creating...";

  try {
    const response = await fetch("/v1/api/courses/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(formData)
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to create course");
    }

    // Success - redirect to dashboard
    window.location.href = "/dashboard";

  } catch (error) {
    showError("create", error.message);
    submitButton.disabled = false;
    submitButton.textContent = "Create Course";
  }
}

/**
 * Handle edit course form submission
 * @param {Event} e - The form submission event
 * @param {string} courseUuid - The course UUID
 */
async function handleEditCourseSubmit(e, courseUuid) {
  e.preventDefault();

  // Clear previous errors
  clearError("edit");

  // Get form data
  const formData = {
    courseCode: document.getElementById("course-code-edit").value.trim(),
    courseName: document.getElementById("course-name-edit").value.trim(),
    termUuid: document.getElementById("term-select-edit").value,
    description: document.getElementById("description-edit").value.trim(),
    taCode: document.getElementById("ta-code-edit").value.trim(),
    tutorCode: document.getElementById("tutor-code-edit").value.trim(),
    studentCode: document.getElementById("student-code-edit").value.trim(),
    syllabusUrl: document.getElementById("syllabus-url-edit").value.trim(),
    canvasUrl: document.getElementById("canvas-url-edit").value.trim()
  };

  // Validate form data
  const validationError = validateCourseData(formData);
  if (validationError) {
    showError("edit", validationError);
    return;
  }

  // Disable submit button to prevent double submission
  const submitButton = document.getElementById("submit-button");
  submitButton.disabled = true;
  submitButton.textContent = "Saving...";

  try {
    const response = await fetch(`/v1/api/courses/${courseUuid}/update`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(formData)
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to update course");
    }

    // Success - redirect to dashboard
    window.location.href = "/dashboard";

  } catch (error) {
    showError("edit", error.message);
    submitButton.disabled = false;
    submitButton.textContent = "Save Changes";
  }
}

/**
 * Validate course form data
 * @param {Object} data - The course data
 * @returns {string|null} Error message or null if valid
 */
function validateCourseData(data) {
  // Check required fields
  if (!data.courseCode) {
    return "Course code is required";
  }
  if (!data.courseName) {
    return "Course name is required";
  }
  if (!data.termUuid) {
    return "Academic term is required";
  }
  if (!data.taCode) {
    return "TA verification code is required";
  }
  if (!data.tutorCode) {
    return "Tutor verification code is required";
  }
  if (!data.studentCode) {
    return "Student verification code is required";
  }

  // Check length constraints
  if (data.courseCode.length > 20) {
    return "Course code must be 20 characters or less";
  }
  if (data.courseName.length > 255) {
    return "Course name must be 255 characters or less";
  }
  if (data.taCode.length > 50) {
    return "TA code must be 50 characters or less";
  }
  if (data.tutorCode.length > 50) {
    return "Tutor code must be 50 characters or less";
  }
  if (data.studentCode.length > 50) {
    return "Student code must be 50 characters or less";
  }

  // Check that verification codes are unique among themselves
  const codes = [data.taCode, data.tutorCode, data.studentCode];
  const uniqueCodes = new Set(codes);
  if (uniqueCodes.size !== codes.length) {
    return "TA, Tutor, and Student verification codes must be different from each other";
  }

  // Check url validity if provided
  if (data.syllabusUrl) {
    if (!isValidUrl(data.syllabusUrl)) {
      return "Invalid syllabus URL";
    }
  }

  if (data.canvasUrl) {
    if (!isValidUrl(data.canvasUrl)) {
      return "Invalid canvas URL";
    }
  }
  return null;
}

/**
 * Validate URL format
 * @param {string} url - The URL to validate
 * @returns {boolean} True if valid
 */
function isValidUrl(url) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Show error message
 * @param {string} mode - "create" or "edit"
 * @param {string} message - The error message
 */
function showError(mode, message) {
  const errorDiv = document.getElementById(`form-error-message-${mode}`);
  errorDiv.textContent = message;
  errorDiv.style.display = "block";
}

/**
 * Clear error message
 * @param {string} mode - "create" or "edit"
 */
function clearError(mode) {
  const errorDiv = document.getElementById(`form-error-message-${mode}`);
  errorDiv.textContent = "";
  errorDiv.style.display = "none";
}
