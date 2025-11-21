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

export default router;
