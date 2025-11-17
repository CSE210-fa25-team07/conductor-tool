/**
 * Auth API Client
 *
 * Handles authentication and user-related API calls.
 * Provides functions to get current user info, enrollments, and roles.
 */

const API_BASE = '/api';

/**
 * Get current authenticated user with enrollments
 * @param {string} [userId] - Optional user ID for testing
 * @returns {Promise<Object>} User object with enrollments
 */
export async function getCurrentUser(userId = null) {
  try {
    const url = userId ? `${API_BASE}/auth/me?userId=${userId}` : `${API_BASE}/auth/me`;
    const response = await fetch(url);

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Not authenticated');
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Failed to get current user');
    }

    return data.data;
  } catch (error) {
    console.error('Error fetching current user:', error);
    throw error;
  }
}

/**
 * Get user's enrollments with roles
 * @param {string} userId - User UUID
 * @returns {Promise<Object>} Enrollments organized by course
 */
export async function getUserEnrollments(userId) {
  try {
    const response = await fetch(`${API_BASE}/users/${userId}/enrollments`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Failed to get user enrollments');
    }

    return data.data;
  } catch (error) {
    console.error('Error fetching user enrollments:', error);
    throw error;
  }
}

/**
 * Get user's role in a specific course
 * @param {string} userId - User UUID
 * @param {string} courseId - Course UUID
 * @returns {Promise<Object|null>} Role object or null if not enrolled
 */
export async function getUserRoleInCourse(userId, courseId) {
  try {
    const response = await fetch(`${API_BASE}/users/${userId}/courses/${courseId}/role`);

    if (response.status === 404) {
      return null; // User not enrolled in course
    }

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (!data.success) {
      return null;
    }

    return data.data;
  } catch (error) {
    console.error('Error fetching user role in course:', error);
    return null;
  }
}

/**
 * Get all available roles
 * @returns {Promise<Array>} Array of role objects
 */
export async function getAllRoles() {
  try {
    const response = await fetch(`${API_BASE}/roles`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Failed to get roles');
    }

    return data.data;
  } catch (error) {
    console.error('Error fetching roles:', error);
    throw error;
  }
}

export default {
  getCurrentUser,
  getUserEnrollments,
  getUserRoleInCourse,
  getAllRoles,
};
