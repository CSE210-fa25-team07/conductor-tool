/**
 * @module course/api
 * API endpoints for course data
 */
import express from "express";
import * as courseService from "../../services/courseService.js";

const router = express.Router();

/**
 * Get all courses for the current user
 *
 * @name GET /v1/api/courses
 * @returns {Object} 200 - Array of courses
 * @returns {Object} 401 - Not authenticated
 * @returns {Object} 500 - Server error
 * @status IN USE - Frontend dashboard fetches user's courses
 */
router.get("/", async (req, res) => {
  try {
    return await courseService.getUserCourses(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.get("/:courseUUID", async (req, res) => {
  try {
    return await courseService.getCourseByUUID(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.get("/:courseUUID/users", async (req, res) => {
  try {
    return await courseService.getUsersByCourseUUID(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Might be deprecated -- get course by UUID already includes teams
router.get("/:courseUUID/teams", async (req, res) => {
  try {
    return await courseService.getTeamsByCourseUUID(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get available terms (current and next term)
 *
 * @name GET /v1/api/courses/terms
 * @returns {Object} 200 - Array of available terms
 * @returns {Object} 401 - Not authenticated
 * @returns {Object} 500 - Server error
 */
router.get("/terms", async (req, res) => {
  try {
    return await courseService.getAvailableTerms(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Create a new course
 *
 * @name POST /v1/api/courses/create
 * @param {Object} body - Course data
 * @returns {Object} 201 - Course created successfully
 * @returns {Object} 400 - Validation error
 * @returns {Object} 401 - Not authenticated
 * @returns {Object} 403 - Not authorized (not professor)
 * @returns {Object} 409 - Course already exists or verification code already used
 * @returns {Object} 500 - Server error
 */
router.post("/create", async (req, res) => {
  try {
    return await courseService.createCourse(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get course details for editing
 *
 * @name GET /v1/api/courses/:courseUuid
 * @param {string} courseUuid - The course UUID
 * @returns {Object} 200 - Course details
 * @returns {Object} 401 - Not authenticated
 * @returns {Object} 403 - Not authorized (not instructor)
 * @returns {Object} 404 - Course not found
 * @returns {Object} 500 - Server error
 */
router.get("/:courseUuid", async (req, res) => {
  try {
    return await courseService.getCourseForEdit(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Update an existing course
 *
 * @name PUT /v1/api/courses/:courseUuid
 * @param {string} courseUuid - The course UUID
 * @param {Object} body - Updated course data
 * @returns {Object} 200 - Course updated successfully
 * @returns {Object} 400 - Validation error
 * @returns {Object} 401 - Not authenticated
 * @returns {Object} 403 - Not authorized (not instructor)
 * @returns {Object} 404 - Course not found
 * @returns {Object} 409 - Verification code already used
 * @returns {Object} 500 - Server error
 */
router.put("/:courseUuid", async (req, res) => {
  try {
    return await courseService.updateCourse(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Remove current user from a course (leave course)
 *
 * @name DELETE /v1/api/courses/:courseUuid/leave
 * @param {string} courseUuid - The course UUID
 * @returns {Object} 200 - Successfully removed from course
 * @returns {Object} 401 - Not authenticated
 * @returns {Object} 403 - Not authorized (professors cannot leave their own courses)
 * @returns {Object} 404 - Enrollment not found
 * @returns {Object} 500 - Server error
 */
router.delete("/:courseUuid/leave", async (req, res) => {
  try {
    return await courseService.removeUserFromCourse(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Delete a course (professor/admin deleting entire course)
 *
 * @name DELETE /v1/api/courses/:courseUuid/delete
 * @param {string} courseUuid - The course UUID
 * @returns {Object} 200 - Successfully deleted course
 * @returns {Object} 401 - Not authenticated
 * @returns {Object} 403 - Not authorized (only professors/admins can delete courses)
 * @returns {Object} 404 - Course not found
 * @returns {Object} 500 - Server error
 */
router.delete("/:courseUuid/delete", async (req, res) => {
  try {
    return await courseService.deleteCourse(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
