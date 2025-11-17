/**
 * @fileoverview Courses Routes - Shared Courses Data
 * Shared endpoints for course information
 * @module routes/coursesRoutes
 */

import express from "express";

const router = express.Router();

// ============================================
// MOCK DATA
// ============================================

/**
 * Mock courses data
 * In production, this would come from a database
 */
const mockCourses = [
  {
    id: "test-routing",
    code: "TEST 000",
    name: "For Testing Routing",
    description: "Mock course for testing routing logic - will be moved to PostgreSQL later",
    instructor: "Test Instructor",
    instructor_email: "test@example.com",
    students: 0,
    assignments: 0,
    attendance: 0,
    term: "Testing"
  }
];

// ============================================
// ENDPOINTS
// ============================================

/**
 * GET /api/courses
 * Get all courses for the current user
 *
 * @route GET /api/courses
 * @returns {Object} 200 - Success response with courses array
 * @returns {Object} 200.success - Indicates successful operation
 * @returns {Array} 200.data - Array of course objects
 * @example
 * // Response:
 * {
 *   "success": true,
 *   "data": [
 *     {
 *       "id": "test-routing",
 *       "code": "TEST 000",
 *       "name": "For Testing Routing",
 *       "description": "Mock course for testing routing logic",
 *       "instructor": "Test Instructor",
 *       "instructor_email": "test@example.com",
 *       "students": 0,
 *       "assignments": 0,
 *       "attendance": 0,
 *       "term": "Testing"
 *     }
 *   ]
 * }
 */
router.get("/", (req, res) => {
  res.json({
    success: true,
    data: mockCourses
  });
});

/**
 * GET /api/courses/:id
 * Get a specific course by ID
 *
 * @route GET /api/courses/:id
 * @param {string} req.params.id - Course ID (string or integer)
 * @returns {Object} 200 - Success response with course object
 * @returns {Object} 200.success - Indicates successful operation
 * @returns {Object} 200.data - Course object with details
 * @returns {Object} 404 - Course not found error
 * @returns {Object} 404.success - Indicates failed operation (false)
 * @returns {string} 404.error - Error message
 * @example
 * // Success Response:
 * {
 *   "success": true,
 *   "data": {
 *     "id": "test-routing",
 *     "code": "TEST 000",
 *     "name": "For Testing Routing",
 *     "description": "Mock course for testing routing logic",
 *     "instructor": "Test Instructor",
 *     "instructor_email": "test@example.com",
 *     "students": 0,
 *     "assignments": 0,
 *     "attendance": 0,
 *     "term": "Testing"
 *   }
 * }
 * @example
 * // Error Response:
 * {
 *   "success": false,
 *   "error": "Course not found"
 * }
 */
router.get("/:id", (req, res) => {
  const courseId = req.params.id;
  // Try to parse as integer, otherwise use as string
  const parsedId = isNaN(courseId) ? courseId : parseInt(courseId);
  const course = mockCourses.find(c => c.id === parsedId);

  if (!course) {
    return res.status(404).json({
      success: false,
      error: "Course not found"
    });
  }

  res.json({
    success: true,
    data: course
  });
});

export default router;
