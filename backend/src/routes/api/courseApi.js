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

export default router;
