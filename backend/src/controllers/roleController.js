/**
 * Role Controller
 *
 * HTTP request handlers for role-related endpoints.
 * Handles requests for getting roles and enrollment data.
 */

import * as roleService from '../services/roleService.js';
import * as enrollmentService from '../services/enrollmentService.js';
import * as userRepository from '../repositories/userRepositoryPg.js';

/**
 * Get all available roles
 * GET /api/roles
 */
export async function getAllRoles(req, res) {
  try {
    const roles = await roleService.getAllRoles();
    res.json({ success: true, data: roles });
  } catch (error) {
    console.error('Error in getAllRoles:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * Get user's enrollments with roles
 * GET /api/users/:userId/enrollments
 */
export async function getUserEnrollments(req, res) {
  try {
    const { userId } = req.params;
    const enrollments = await enrollmentService.getUserEnrollments(userId);
    res.json({ success: true, data: enrollments });
  } catch (error) {
    console.error('Error in getUserEnrollments:', error);
    const status = error.message.includes('not found') ? 404 : 500;
    res.status(status).json({ success: false, error: error.message });
  }
}

/**
 * Get user's role for a specific course
 * GET /api/users/:userId/courses/:courseId/role
 */
export async function getUserRoleInCourse(req, res) {
  try {
    const { userId, courseId } = req.params;
    const role = await enrollmentService.getUserRoleInCourse(userId, courseId);

    if (!role) {
      return res.status(404).json({
        success: false,
        error: 'User is not enrolled in this course',
      });
    }

    res.json({ success: true, data: role });
  } catch (error) {
    console.error('Error in getUserRoleInCourse:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * Get all users enrolled in a course with their roles
 * GET /api/courses/:courseId/enrollments
 */
export async function getCourseEnrollments(req, res) {
  try {
    const { courseId } = req.params;
    const { role } = req.query;

    let enrollments;
    if (role) {
      // Filter by specific role
      switch (role.toLowerCase()) {
        case 'student':
          enrollments = await enrollmentService.getCourseStudents(courseId);
          break;
        case 'ta':
          enrollments = await enrollmentService.getCourseTAs(courseId);
          break;
        case 'professor':
          enrollments = await enrollmentService.getCourseProfessors(courseId);
          break;
        case 'lead':
          enrollments = await enrollmentService.getCourseLeads(courseId);
          break;
        default:
          return res.status(400).json({
            success: false,
            error: 'Invalid role. Must be one of: student, ta, professor, lead',
          });
      }
    } else {
      // Get all enrollments
      enrollments = await enrollmentService.getUserEnrollments(courseId);
    }

    res.json({ success: true, data: enrollments });
  } catch (error) {
    console.error('Error in getCourseEnrollments:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * Get current user's info with enrollments
 * GET /api/auth/me
 */
export async function getCurrentUser(req, res) {
  try {
    // For now, we'll use session user ID
    // In production, this would come from authenticated session/JWT
    const userId = req.session?.userId || req.query.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated',
      });
    }

    const user = await userRepository.getUserWithEnrollments(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    res.json({ success: true, data: user });
  } catch (error) {
    console.error('Error in getCurrentUser:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

export default {
  getAllRoles,
  getUserEnrollments,
  getUserRoleInCourse,
  getCourseEnrollments,
  getCurrentUser,
};
