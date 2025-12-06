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
