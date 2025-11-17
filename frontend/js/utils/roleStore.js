/**
 * Role Store
 *
 * Global state management for user roles and course enrollments.
 * Provides a single source of truth for role-based UI rendering.
 *
 * Usage:
 *   import { initRoleState, setActiveCourse, useRoleState, ROLE_TYPES } from './roleStore.js';
 *
 *   await initRoleState();
 *   setActiveCourse(courseId);
 *   useRoleState(s => ({ role: s.activeRoleId }), ({ role }) => {
 *     renderView(role);
 *   });
 */

// ============================================
// ROLE CONSTANTS
// ============================================

/**
 * Canonical role type keywords
 * Use these constants instead of hardcoding strings
 */
export const ROLE_TYPES = {
  STUDENT: 'student',
  TA: 'ta',
  PROFESSOR: 'professor',
  ADMIN: 'admin',
  LEAD: 'lead',
};

// ============================================
// STATE
// ============================================

/**
 * Internal state object
 * @private
 */
let state = {
  user: null, // Current user object
  rolesByCourse: {}, // Map of courseId -> { roleId, roleName, teamId }
  activeCourseId: null, // Currently selected course ID
  activeRoleId: null, // Primary role for active course
  activeRoleName: null, // Primary role name for active course
  isInitialized: false, // Whether store has been initialized
};

/**
 * Set of listener functions
 * @private
 */
const listeners = new Set();

// ============================================
// CORE API
// ============================================

/**
 * Initialize role state by fetching user and enrollment data
 * Call this once when the application boots
 * @param {string} [userId] - Optional user ID (for testing/mock)
 * @returns {Promise<void>}
 */
export async function initRoleState(userId = null) {
  try {
    // Import API client
    const { getCurrentUser } = await import('../api/authApi.js');

    // Fetch current user with enrollments
    const userData = await getCurrentUser(userId);

    if (!userData) {
      console.warn('No user data returned, using empty state');
      setState({
        user: null,
        rolesByCourse: {},
        isInitialized: true,
      });
      return;
    }

    // Build rolesByCourse map from enrollments
    const rolesByCourse = {};

    if (userData.enrollments && Array.isArray(userData.enrollments)) {
      for (const enrollment of userData.enrollments) {
        const courseId = enrollment.course_uuid;

        if (!rolesByCourse[courseId]) {
          rolesByCourse[courseId] = {
            courseUuid: courseId,
            courseCode: enrollment.course_code,
            courseName: enrollment.course_name,
            roles: [],
          };
        }

        rolesByCourse[courseId].roles.push({
          roleId: enrollment.role_uuid,
          roleName: enrollment.role_name,
        });
      }
    }

    // Update state
    setState({
      user: {
        userId: userData.user_uuid,
        email: userData.email,
        firstName: userData.first_name,
        lastName: userData.last_name,
        photoUrl: userData.photo_url,
        githubUsername: userData.github_username,
      },
      rolesByCourse,
      isInitialized: true,
    });

    console.log('Role state initialized:', state);
  } catch (error) {
    console.error('Error initializing role state:', error);
    // Set initialized flag even on error so app doesn't hang
    setState({
      user: null,
      rolesByCourse: {},
      isInitialized: true,
    });
  }
}

/**
 * Set the active course
 * Updates activeRoleId based on the user's role in this course
 * @param {string} courseId - Course UUID
 */
export function setActiveCourse(courseId) {
  if (!courseId) {
    setState({
      activeCourseId: null,
      activeRoleId: null,
      activeRoleName: null,
    });
    return;
  }

  const courseData = state.rolesByCourse[courseId];

  if (!courseData || !courseData.roles || courseData.roles.length === 0) {
    console.warn(`No role found for course ${courseId}, defaulting to student`);
    setState({
      activeCourseId: courseId,
      activeRoleId: null,
      activeRoleName: ROLE_TYPES.STUDENT,
    });
    return;
  }

  // Get primary role (highest priority)
  const primaryRole = getPrimaryRole(courseData.roles);

  setState({
    activeCourseId: courseId,
    activeRoleId: primaryRole.roleId,
    activeRoleName: primaryRole.roleName,
  });

  // Persist to sessionStorage
  try {
    sessionStorage.setItem('activeCourseId', courseId);
  } catch (e) {
    console.warn('Could not save to sessionStorage:', e);
  }
}

/**
 * Manually override the active role (for role switcher feature)
 * @param {string} roleId - Role UUID
 * @param {string} roleName - Role name
 */
export function setActiveRole(roleId, roleName) {
  setState({
    activeRoleId: roleId,
    activeRoleName: roleName,
  });
}

/**
 * Get a read-only copy of the current state
 * @returns {Object} Frozen state object
 */
export function getState() {
  return Object.freeze({ ...state });
}

/**
 * Subscribe to state changes using a selector
 * @param {Function} selector - Function to select relevant state (s => ({ role: s.activeRoleName }))
 * @param {Function} handler - Callback when selected state changes
 * @returns {Function} Unsubscribe function
 */
export function useRoleState(selector, handler) {
  const listener = () => {
    const selected = selector(state);
    handler(selected);
  };

  listeners.add(listener);

  // Call immediately with current state
  listener();

  // Return unsubscribe function
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Get role data for a specific course
 * @param {string} courseId - Course UUID
 * @returns {Object|null} Course role data or null if not found
 */
export function getRoleForCourse(courseId) {
  return state.rolesByCourse[courseId] || null;
}

/**
 * Get all courses the user is enrolled in
 * @returns {Array} Array of course objects
 */
export function getAllCourses() {
  return Object.values(state.rolesByCourse);
}

/**
 * Check if user has a specific role in the active course
 * @param {string|Array<string>} roleName - Role name or array of role names
 * @returns {boolean} True if user has the role
 */
export function hasRole(roleName) {
  if (!state.activeRoleName) return false;

  if (Array.isArray(roleName)) {
    return roleName.includes(state.activeRoleName);
  }

  return state.activeRoleName === roleName;
}

/**
 * Check if user is an instructor (professor or TA)
 * @returns {boolean} True if user is professor or TA
 */
export function isInstructor() {
  return hasRole([ROLE_TYPES.PROFESSOR, ROLE_TYPES.TA]);
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Update state and notify listeners
 * @private
 * @param {Object} updates - State updates to apply
 */
function setState(updates) {
  state = { ...state, ...updates };
  notifyListeners();
}

/**
 * Notify all listeners of state change
 * @private
 */
function notifyListeners() {
  listeners.forEach(listener => {
    try {
      listener();
    } catch (error) {
      console.error('Error in state listener:', error);
    }
  });
}

/**
 * Get the primary (highest priority) role from a list
 * Priority: professor > ta > lead > student > admin
 * @private
 * @param {Array} roles - Array of role objects
 * @returns {Object} Primary role object
 */
function getPrimaryRole(roles) {
  const priorities = {
    professor: 1,
    ta: 2,
    lead: 3,
    student: 4,
    admin: 5,
  };

  return roles.reduce((highest, current) => {
    const currentPriority = priorities[current.roleName] || 999;
    const highestPriority = priorities[highest.roleName] || 999;
    return currentPriority < highestPriority ? current : highest;
  });
}

/**
 * Get course ID from URL
 * Looks for /course/:courseId/ pattern in URL
 * @returns {string|null} Course ID or null
 */
export function getCourseIdFromUrl() {
  const match = window.location.pathname.match(/\/course\/([^/]+)/);
  return match ? match[1] : null;
}

/**
 * Get active course ID from sessionStorage or URL
 * @returns {string|null} Course ID or null
 */
export function getActiveCourseId() {
  // Try sessionStorage first
  try {
    const stored = sessionStorage.getItem('activeCourseId');
    if (stored) return stored;
  } catch (e) {
    // Ignore
  }

  // Fall back to URL
  return getCourseIdFromUrl();
}

// ============================================
// TESTING / DEVELOPMENT
// ============================================

/**
 * Create a mock role store for testing
 * @param {Object} mockState - Mock state object
 * @returns {Object} Mock store API
 */
export function createMockRoleStore(mockState = {}) {
  state = {
    user: null,
    rolesByCourse: {},
    activeCourseId: null,
    activeRoleId: null,
    activeRoleName: null,
    isInitialized: true,
    ...mockState,
  };

  listeners.clear();

  return {
    getState,
    setState: (updates) => setState(updates),
    reset: () => {
      state = {
        user: null,
        rolesByCourse: {},
        activeCourseId: null,
        activeRoleId: null,
        activeRoleName: null,
        isInitialized: false,
      };
      listeners.clear();
    },
  };
}

// ============================================
// EXPORTS
// ============================================

export default {
  ROLE_TYPES,
  initRoleState,
  setActiveCourse,
  setActiveRole,
  getState,
  useRoleState,
  getRoleForCourse,
  getAllCourses,
  hasRole,
  isInstructor,
  getCourseIdFromUrl,
  getActiveCourseId,
  createMockRoleStore,
};
