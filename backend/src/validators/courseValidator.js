/**
 * Course Validator
 *
 * Validates course data for creation and updates.
 * @module course/validator
 */

/**
 * Validate course data
 * @param {Object} courseData - Course data to validate
 * @throws {Error} If validation fails
 * @status IN USE
 */
async function validateCourseData(courseData) {
  const {
    courseCode,
    courseName,
    termUuid,
    taCode,
    tutorCode,
    studentCode,
    syllabusUrl,
    canvasUrl
  } = courseData;

  // Validate required fields
  if (!courseCode || typeof courseCode !== "string" || courseCode.trim().length === 0) {
    throw new Error("Course code is required and must be a non-empty string");
  }

  if (!courseName || typeof courseName !== "string" || courseName.trim().length === 0) {
    throw new Error("Course name is required and must be a non-empty string");
  }

  if (!termUuid || typeof termUuid !== "string" || termUuid.trim().length === 0) {
    throw new Error("Term is required");
  }

  // Validate verification codes
  if (!taCode || typeof taCode !== "string" || taCode.trim().length === 0) {
    throw new Error("TA verification code is required");
  }

  if (!tutorCode || typeof tutorCode !== "string" || tutorCode.trim().length === 0) {
    throw new Error("Tutor verification code is required");
  }

  if (!studentCode || typeof studentCode !== "string" || studentCode.trim().length === 0) {
    throw new Error("Student verification code is required");
  }

  // Validate URL formats if provided
  if (syllabusUrl && syllabusUrl.trim().length > 0) {
    const urlRegex = /^https?:\/\/.+/;
    if (!urlRegex.test(syllabusUrl)) {
      throw new Error("Syllabus URL must be a valid URL starting with http:// or https://");
    }
  }

  if (canvasUrl && canvasUrl.trim().length > 0) {
    const urlRegex = /^https?:\/\/.+/;
    if (!urlRegex.test(canvasUrl)) {
      throw new Error("Canvas URL must be a valid URL starting with http:// or https://");
    }
  }
}

export {
  validateCourseData
};
