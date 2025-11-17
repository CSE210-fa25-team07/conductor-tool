/**
 * @fileoverview Directory Routes - Class/People/Groups
 * Directory team endpoints for class management
 * @module routes/directoryRoutes
 */

import express from 'express';

const router = express.Router();

// ============================================
// MOCK DATA
// ============================================

/**
 * Mock people/students data
 */
const mockPeople = [
  { id: 1, name: 'Alice Johnson', email: 'alice@example.com', role: 'Student', status: 'Active' },
  { id: 2, name: 'Bob Smith', email: 'bob@example.com', role: 'Student', status: 'Active' },
  { id: 3, name: 'Carol Williams', email: 'carol@example.com', role: 'TA', status: 'Active' },
  { id: 4, name: 'David Brown', email: 'david@example.com', role: 'Student', status: 'Active' },
  { id: 5, name: 'Eve Davis', email: 'eve@example.com', role: 'Student', status: 'Active' }
];

/**
 * Mock groups data
 */
const mockGroups = [
  { id: 1, name: 'Team Alpha', members: ['Alice', 'Bob', 'Carol'], projects: 3, status: 'Active' },
  { id: 2, name: 'Team Beta', members: ['David', 'Eve', 'Frank'], projects: 2, status: 'Active' },
  { id: 3, name: 'Team Gamma', members: ['Grace', 'Henry', 'Iris'], projects: 4, status: 'Active' }
];

// ============================================
// ENDPOINTS
// ============================================

/**
 * GET /api/class/people
 * Get list of people in class
 *
 * @route GET /api/class/people
 * @returns {Object} 200 - Success response with people array
 * @returns {Object} 200.success - Indicates successful operation
 * @returns {Array} 200.data - Array of person objects
 * @example
 * // Response:
 * {
 *   "success": true,
 *   "data": [
 *     {
 *       "id": 1,
 *       "name": "Alice Johnson",
 *       "email": "alice@example.com",
 *       "role": "Student",
 *       "status": "Active"
 *     }
 *   ]
 * }
 */
router.get('/people', (req, res) => {
  res.json({
    success: true,
    data: mockPeople
  });
});

/**
 * GET /api/class/groups
 * Get list of groups in class
 *
 * @route GET /api/class/groups
 * @returns {Object} 200 - Success response with groups array
 * @returns {Object} 200.success - Indicates successful operation
 * @returns {Array} 200.data - Array of group objects
 * @example
 * // Response:
 * {
 *   "success": true,
 *   "data": [
 *     {
 *       "id": 1,
 *       "name": "Team Alpha",
 *       "members": ["Alice", "Bob", "Carol"],
 *       "projects": 3,
 *       "status": "Active"
 *     }
 *   ]
 * }
 */
router.get('/groups', (req, res) => {
  res.json({
    success: true,
    data: mockGroups
  });
});

/**
 * GET /api/class/stats
 * Get class statistics
 *
 * @route GET /api/class/stats
 * @returns {Object} 200 - Success response with class statistics
 * @returns {Object} 200.success - Indicates successful operation
 * @returns {Object} 200.data - Statistics object
 * @returns {number} 200.data.averageGrade - Average grade across all students
 * @returns {number} 200.data.totalAssignments - Total number of assignments
 * @returns {number} 200.data.totalStudents - Total number of students
 * @returns {number} 200.data.attendanceRate - Attendance rate percentage
 * @example
 * // Response:
 * {
 *   "success": true,
 *   "data": {
 *     "averageGrade": 85,
 *     "totalAssignments": 12,
 *     "totalStudents": 45,
 *     "attendanceRate": 95
 *   }
 * }
 */
router.get('/stats', (req, res) => {
  res.json({
    success: true,
    data: {
      averageGrade: 85,
      totalAssignments: 12,
      totalStudents: 45,
      attendanceRate: 95
    }
  });
});

export default router;
