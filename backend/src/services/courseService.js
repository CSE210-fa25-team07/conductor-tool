/**
 * @module course/service
 * Course Service
 *
 * Business logic layer for course operations.
 */
import * as courseRepository from "../repositories/courseRepository.js";

/**
 * Get all courses for a user
 * @param {*} req Request object with authenticated user in session
 * @param {*} res Response object
 * @returns Response with list of courses
 */
async function getUserCourses(req, res) {
  try {
    const userId = req.session.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "Not authenticated"
      });
    }

    const courses = await courseRepository.getCoursesWithDetailsByUserId(userId);

    res.status(200).json({
      success: true,
      courses: courses
    });
  } catch {
    res.status(500).json({
      success: false,
      error: "Failed to fetch courses"
    });
  }
}

export { getUserCourses };
