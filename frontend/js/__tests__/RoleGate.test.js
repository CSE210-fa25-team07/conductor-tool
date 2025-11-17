/**
 * RoleGate Component Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  renderIfRole,
  renderIfInstructor,
  renderIfStudent,
  showIfRole,
  addRoleClass,
  createRoleBadge,
} from '../components/role/RoleGate.js';
import * as roleStore from '../utils/roleStore.js';

// Mock roleStore
vi.mock('../utils/roleStore.js', () => ({
  hasRole: vi.fn(),
  isInstructor: vi.fn(),
}));

describe('RoleGate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('renderIfRole', () => {
    it('should render content when user has role', () => {
      vi.mocked(roleStore.hasRole).mockReturnValue(true);

      const renderFn = vi.fn(() => '<div>Admin Panel</div>');
      const result = renderIfRole('admin', renderFn);

      expect(renderFn).toHaveBeenCalled();
      expect(result).toBe('<div>Admin Panel</div>');
    });

    it('should return null when user does not have role', () => {
      vi.mocked(roleStore.hasRole).mockReturnValue(false);

      const renderFn = vi.fn(() => '<div>Admin Panel</div>');
      const result = renderIfRole('admin', renderFn);

      expect(renderFn).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });

    it('should work with array of roles', () => {
      vi.mocked(roleStore.hasRole).mockReturnValue(true);

      const renderFn = vi.fn(() => '<button>Grade</button>');
      const result = renderIfRole(['ta', 'professor'], renderFn);

      expect(roleStore.hasRole).toHaveBeenCalledWith(['ta', 'professor']);
      expect(result).toBe('<button>Grade</button>');
    });

    it('should work with DOM elements', () => {
      vi.mocked(roleStore.hasRole).mockReturnValue(true);

      const element = document.createElement('div');
      element.textContent = 'Test';

      const renderFn = () => element;
      const result = renderIfRole('professor', renderFn);

      expect(result).toBe(element);
    });
  });

  describe('renderIfInstructor', () => {
    it('should render content for instructors', () => {
      vi.mocked(roleStore.isInstructor).mockReturnValue(true);

      const renderFn = vi.fn(() => '<div>Instructor Tools</div>');
      const result = renderIfInstructor(renderFn);

      expect(result).toBe('<div>Instructor Tools</div>');
    });

    it('should return null for non-instructors', () => {
      vi.mocked(roleStore.isInstructor).mockReturnValue(false);

      const renderFn = vi.fn(() => '<div>Instructor Tools</div>');
      const result = renderIfInstructor(renderFn);

      expect(result).toBeNull();
    });
  });

  describe('renderIfStudent', () => {
    it('should render content for students', () => {
      vi.mocked(roleStore.hasRole).mockReturnValue(true);

      const renderFn = vi.fn(() => '<div>Student View</div>');
      const result = renderIfStudent(renderFn);

      expect(roleStore.hasRole).toHaveBeenCalledWith('student');
      expect(result).toBe('<div>Student View</div>');
    });

    it('should return null for non-students', () => {
      vi.mocked(roleStore.hasRole).mockReturnValue(false);

      const renderFn = vi.fn(() => '<div>Student View</div>');
      const result = renderIfStudent(renderFn);

      expect(result).toBeNull();
    });
  });

  describe('showIfRole', () => {
    it('should show element when user has role', () => {
      vi.mocked(roleStore.hasRole).mockReturnValue(true);

      const element = document.createElement('div');
      element.style.display = 'none';
      element.setAttribute('hidden', '');

      showIfRole(element, 'professor');

      expect(element.style.display).toBe('');
      expect(element.hasAttribute('hidden')).toBe(false);
    });

    it('should hide element when user does not have role', () => {
      vi.mocked(roleStore.hasRole).mockReturnValue(false);

      const element = document.createElement('div');

      showIfRole(element, 'professor');

      expect(element.style.display).toBe('none');
      expect(element.hasAttribute('hidden')).toBe(true);
    });

    it('should handle null element gracefully', () => {
      vi.mocked(roleStore.hasRole).mockReturnValue(true);

      expect(() => showIfRole(null, 'professor')).not.toThrow();
    });

    it('should work with array of roles', () => {
      vi.mocked(roleStore.hasRole).mockReturnValue(true);

      const element = document.createElement('button');

      showIfRole(element, ['ta', 'professor']);

      expect(roleStore.hasRole).toHaveBeenCalledWith(['ta', 'professor']);
      expect(element.style.display).toBe('');
    });
  });

  describe('addRoleClass', () => {
    it('should add class when user has role', () => {
      vi.mocked(roleStore.hasRole).mockReturnValue(true);

      const element = document.createElement('div');

      addRoleClass(element, 'role-professor', 'professor');

      expect(element.classList.contains('role-professor')).toBe(true);
    });

    it('should remove class when user does not have role', () => {
      vi.mocked(roleStore.hasRole).mockReturnValue(false);

      const element = document.createElement('div');
      element.classList.add('role-professor');

      addRoleClass(element, 'role-professor', 'professor');

      expect(element.classList.contains('role-professor')).toBe(false);
    });

    it('should handle null element gracefully', () => {
      vi.mocked(roleStore.hasRole).mockReturnValue(true);

      expect(() => addRoleClass(null, 'role-ta', 'ta')).not.toThrow();
    });
  });

  describe('createRoleBadge', () => {
    it('should create badge element with correct class and text', () => {
      const badge = createRoleBadge('professor');

      expect(badge.tagName).toBe('SPAN');
      expect(badge.className).toBe('role-badge role-badge-professor');
      expect(badge.textContent).toBe('Professor');
    });

    it('should capitalize first letter', () => {
      const badge = createRoleBadge('student');

      expect(badge.textContent).toBe('Student');
    });

    it('should work with all role types', () => {
      const roles = ['student', 'ta', 'professor', 'admin', 'lead'];

      roles.forEach((role) => {
        const badge = createRoleBadge(role);
        expect(badge.className).toContain(`role-badge-${role}`);
      });
    });

    it('should handle uppercase role names', () => {
      const badge = createRoleBadge('TA');

      expect(badge.className).toBe('role-badge role-badge-TA');
      expect(badge.textContent).toBe('TA');
    });
  });
});
