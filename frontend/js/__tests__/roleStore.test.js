/**
 * Role Store Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
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
} from '../utils/roleStore.js';

// Mock the authApi module
vi.mock('../api/authApi.js', () => ({
  getCurrentUser: vi.fn(),
}));

describe('RoleStore', () => {
  let mockStore;

  beforeEach(() => {
    // Create fresh mock store for each test
    mockStore = createMockRoleStore();

    // Clear any mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    mockStore.reset();
  });

  describe('ROLE_TYPES constants', () => {
    it('should export all role types', () => {
      expect(ROLE_TYPES.STUDENT).toBe('student');
      expect(ROLE_TYPES.TA).toBe('ta');
      expect(ROLE_TYPES.PROFESSOR).toBe('professor');
      expect(ROLE_TYPES.ADMIN).toBe('admin');
      expect(ROLE_TYPES.LEAD).toBe('lead');
    });
  });

  describe('initRoleState', () => {
    it('should initialize state with user data', async () => {
      const { getCurrentUser } = await import('../api/authApi.js');

      const mockUserData = {
        user_uuid: 'user123',
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User',
        enrollments: [
          {
            course_uuid: 'course1',
            course_code: 'CSE210',
            course_name: 'Software Engineering',
            role_uuid: 'role1',
            role_name: 'student',
          },
        ],
      };

      vi.mocked(getCurrentUser).mockResolvedValue(mockUserData);

      await initRoleState();

      const state = getState();
      expect(state.isInitialized).toBe(true);
      expect(state.user.userId).toBe('user123');
      expect(state.user.email).toBe('test@example.com');
      expect(state.rolesByCourse.course1).toBeDefined();
    });

    it('should handle no user data gracefully', async () => {
      const { getCurrentUser } = await import('../api/authApi.js');
      vi.mocked(getCurrentUser).mockResolvedValue(null);

      await initRoleState();

      const state = getState();
      expect(state.isInitialized).toBe(true);
      expect(state.user).toBeNull();
      expect(state.rolesByCourse).toEqual({});
    });

    it('should handle API errors gracefully', async () => {
      const { getCurrentUser } = await import('../api/authApi.js');
      vi.mocked(getCurrentUser).mockRejectedValue(new Error('API Error'));

      await initRoleState();

      const state = getState();
      expect(state.isInitialized).toBe(true);
      expect(state.user).toBeNull();
    });

    it('should organize multiple roles per course', async () => {
      const { getCurrentUser } = await import('../api/authApi.js');

      const mockUserData = {
        user_uuid: 'user123',
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User',
        enrollments: [
          {
            course_uuid: 'course1',
            course_code: 'CSE210',
            course_name: 'Software Engineering',
            role_uuid: 'role1',
            role_name: 'student',
          },
          {
            course_uuid: 'course1',
            course_code: 'CSE210',
            course_name: 'Software Engineering',
            role_uuid: 'role2',
            role_name: 'lead',
          },
        ],
      };

      vi.mocked(getCurrentUser).mockResolvedValue(mockUserData);

      await initRoleState();

      const state = getState();
      expect(state.rolesByCourse.course1.roles).toHaveLength(2);
      expect(state.rolesByCourse.course1.roles[0].roleName).toBe('student');
      expect(state.rolesByCourse.course1.roles[1].roleName).toBe('lead');
    });
  });

  describe('setActiveCourse', () => {
    beforeEach(() => {
      mockStore.setState({
        rolesByCourse: {
          course1: {
            courseUuid: 'course1',
            courseCode: 'CSE210',
            roles: [
              { roleId: 'role1', roleName: 'student' },
              { roleId: 'role2', roleName: 'lead' },
            ],
          },
        },
      });
    });

    it('should set active course and select primary role', () => {
      setActiveCourse('course1');

      const state = getState();
      expect(state.activeCourseId).toBe('course1');
      expect(state.activeRoleName).toBe('lead'); // Higher priority than student
    });

    it('should handle course with single role', () => {
      mockStore.setState({
        rolesByCourse: {
          course2: {
            courseUuid: 'course2',
            roles: [{ roleId: 'role1', roleName: 'ta' }],
          },
        },
      });

      setActiveCourse('course2');

      const state = getState();
      expect(state.activeRoleName).toBe('ta');
    });

    it('should default to student when course not found', () => {
      setActiveCourse('nonexistent');

      const state = getState();
      expect(state.activeCourseId).toBe('nonexistent');
      expect(state.activeRoleName).toBe(ROLE_TYPES.STUDENT);
    });

    it('should clear active course when null provided', () => {
      setActiveCourse('course1');
      setActiveCourse(null);

      const state = getState();
      expect(state.activeCourseId).toBeNull();
      expect(state.activeRoleName).toBeNull();
    });

    it('should select highest priority role', () => {
      mockStore.setState({
        rolesByCourse: {
          course3: {
            courseUuid: 'course3',
            roles: [
              { roleId: 'r1', roleName: 'student' },
              { roleId: 'r2', roleName: 'ta' },
              { roleId: 'r3', roleName: 'professor' },
            ],
          },
        },
      });

      setActiveCourse('course3');

      const state = getState();
      expect(state.activeRoleName).toBe('professor'); // Highest priority
    });
  });

  describe('setActiveRole', () => {
    it('should manually set active role', () => {
      setActiveRole('role123', 'ta');

      const state = getState();
      expect(state.activeRoleId).toBe('role123');
      expect(state.activeRoleName).toBe('ta');
    });
  });

  describe('getState', () => {
    it('should return frozen state copy', () => {
      const state = getState();

      expect(() => {
        state.user = { changed: true };
      }).toThrow();
    });
  });

  describe('useRoleState', () => {
    it('should call handler immediately with current state', () => {
      mockStore.setState({ activeRoleName: 'professor' });

      const handler = vi.fn();
      const selector = (s) => ({ role: s.activeRoleName });

      useRoleState(selector, handler);

      expect(handler).toHaveBeenCalledWith({ role: 'professor' });
    });

    it('should call handler when state changes', () => {
      const handler = vi.fn();
      const selector = (s) => ({ role: s.activeRoleName });

      useRoleState(selector, handler);
      handler.mockClear();

      mockStore.setState({ activeRoleName: 'ta' });

      expect(handler).toHaveBeenCalledWith({ role: 'ta' });
    });

    it('should return unsubscribe function', () => {
      const handler = vi.fn();
      const selector = (s) => ({ role: s.activeRoleName });

      const unsubscribe = useRoleState(selector, handler);
      handler.mockClear();

      unsubscribe();
      mockStore.setState({ activeRoleName: 'student' });

      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe('getRoleForCourse', () => {
    it('should return role data for course', () => {
      const courseData = {
        courseUuid: 'course1',
        courseCode: 'CSE210',
        roles: [{ roleId: 'r1', roleName: 'student' }],
      };

      mockStore.setState({
        rolesByCourse: { course1: courseData },
      });

      const result = getRoleForCourse('course1');

      expect(result).toEqual(courseData);
    });

    it('should return null for non-existent course', () => {
      const result = getRoleForCourse('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('getAllCourses', () => {
    it('should return array of all courses', () => {
      mockStore.setState({
        rolesByCourse: {
          course1: { courseCode: 'CSE210' },
          course2: { courseCode: 'CSE112' },
        },
      });

      const result = getAllCourses();

      expect(result).toHaveLength(2);
      expect(result[0].courseCode).toBeDefined();
    });

    it('should return empty array when no courses', () => {
      mockStore.setState({ rolesByCourse: {} });

      const result = getAllCourses();

      expect(result).toEqual([]);
    });
  });

  describe('hasRole', () => {
    beforeEach(() => {
      mockStore.setState({ activeRoleName: 'ta' });
    });

    it('should return true for matching role', () => {
      expect(hasRole('ta')).toBe(true);
    });

    it('should return false for non-matching role', () => {
      expect(hasRole('professor')).toBe(false);
    });

    it('should return true when role in array', () => {
      expect(hasRole(['student', 'ta', 'professor'])).toBe(true);
    });

    it('should return false when role not in array', () => {
      expect(hasRole(['student', 'professor'])).toBe(false);
    });

    it('should return false when no active role', () => {
      mockStore.setState({ activeRoleName: null });

      expect(hasRole('ta')).toBe(false);
    });
  });

  describe('isInstructor', () => {
    it('should return true for professor', () => {
      mockStore.setState({ activeRoleName: 'professor' });

      expect(isInstructor()).toBe(true);
    });

    it('should return true for TA', () => {
      mockStore.setState({ activeRoleName: 'ta' });

      expect(isInstructor()).toBe(true);
    });

    it('should return false for student', () => {
      mockStore.setState({ activeRoleName: 'student' });

      expect(isInstructor()).toBe(false);
    });

    it('should return false for lead', () => {
      mockStore.setState({ activeRoleName: 'lead' });

      expect(isInstructor()).toBe(false);
    });
  });

  describe('getCourseIdFromUrl', () => {
    const originalLocation = window.location;

    beforeEach(() => {
      delete window.location;
      window.location = { pathname: '' };
    });

    afterEach(() => {
      window.location = originalLocation;
    });

    it('should extract course ID from URL', () => {
      window.location.pathname = '/course/abc-123/class';

      const result = getCourseIdFromUrl();

      expect(result).toBe('abc-123');
    });

    it('should return null when not on course page', () => {
      window.location.pathname = '/dashboard';

      const result = getCourseIdFromUrl();

      expect(result).toBeNull();
    });

    it('should handle different course pages', () => {
      window.location.pathname = '/course/xyz-789/journal';

      const result = getCourseIdFromUrl();

      expect(result).toBe('xyz-789');
    });
  });

  describe('createMockRoleStore', () => {
    it('should create mock store with custom state', () => {
      const customStore = createMockRoleStore({
        activeRoleName: 'professor',
        activeCourseId: 'course1',
      });

      const state = customStore.getState();
      expect(state.activeRoleName).toBe('professor');
      expect(state.activeCourseId).toBe('course1');
    });

    it('should allow setState on mock store', () => {
      const customStore = createMockRoleStore();

      customStore.setState({ activeRoleName: 'ta' });

      const state = customStore.getState();
      expect(state.activeRoleName).toBe('ta');
    });

    it('should reset mock store', () => {
      const customStore = createMockRoleStore({ activeRoleName: 'professor' });

      customStore.reset();

      const state = customStore.getState();
      expect(state.activeRoleName).toBeNull();
      expect(state.isInitialized).toBe(false);
    });
  });
});
