/**
 * Role Gate Component
 *
 * Provides role-based conditional rendering utilities.
 * Use these helpers to show/hide UI elements based on user's role.
 */

import { hasRole, isInstructor } from '../../utils/roleStore.js';

/**
 * Render content only if user has specified role(s)
 * @param {string|Array<string>} allowedRoles - Role name or array of role names
 * @param {Function} renderFn - Function that returns HTML string or DOM element
 * @returns {string|HTMLElement|null} Rendered content or null if not authorized
 *
 * @example
 * renderIfRole('professor', () => '<button>Admin Panel</button>')
 * renderIfRole(['ta', 'professor'], () => createGradingInterface())
 */
export function renderIfRole(allowedRoles, renderFn) {
  if (hasRole(allowedRoles)) {
    return renderFn();
  }
  return null;
}

/**
 * Render content only for instructors (professors and TAs)
 * @param {Function} renderFn - Function that returns HTML string or DOM element
 * @returns {string|HTMLElement|null} Rendered content or null if not instructor
 *
 * @example
 * renderIfInstructor(() => '<div class="instructor-tools">...</div>')
 */
export function renderIfInstructor(renderFn) {
  if (isInstructor()) {
    return renderFn();
  }
  return null;
}

/**
 * Render content only for students (excludes TAs and professors)
 * @param {Function} renderFn - Function that returns HTML string or DOM element
 * @returns {string|HTMLElement|null} Rendered content or null if not student
 *
 * @example
 * renderIfStudent(() => '<div class="student-view">...</div>')
 */
export function renderIfStudent(renderFn) {
  if (hasRole('student')) {
    return renderFn();
  }
  return null;
}

/**
 * Show/hide a DOM element based on role
 * @param {HTMLElement} element - DOM element to show/hide
 * @param {string|Array<string>} allowedRoles - Role name or array of role names
 *
 * @example
 * const button = document.querySelector('#admin-button');
 * showIfRole(button, 'professor');
 */
export function showIfRole(element, allowedRoles) {
  if (!element) return;

  if (hasRole(allowedRoles)) {
    element.style.display = '';
    element.removeAttribute('hidden');
  } else {
    element.style.display = 'none';
    element.setAttribute('hidden', '');
  }
}

/**
 * Add role-based class to element
 * Useful for CSS-based role styling
 * @param {HTMLElement} element - DOM element
 * @param {string} roleClassName - Class name to add (e.g., 'role-professor')
 *
 * @example
 * const container = document.querySelector('#main');
 * addRoleClass(container, 'role-professor'); // Adds if user is professor
 */
export function addRoleClass(element, roleClassName, roleName) {
  if (!element) return;

  if (hasRole(roleName)) {
    element.classList.add(roleClassName);
  } else {
    element.classList.remove(roleClassName);
  }
}

/**
 * Create a role badge element
 * @param {string} roleName - Role name to display
 * @returns {HTMLElement} Badge element
 *
 * @example
 * const badge = createRoleBadge('professor');
 * container.appendChild(badge);
 */
export function createRoleBadge(roleName) {
  const badge = document.createElement('span');
  badge.className = `role-badge role-badge-${roleName}`;
  badge.textContent = capitalizeFirst(roleName);
  return badge;
}

/**
 * Helper: Capitalize first letter
 * @private
 */
function capitalizeFirst(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export default {
  renderIfRole,
  renderIfInstructor,
  renderIfStudent,
  showIfRole,
  addRoleClass,
  createRoleBadge,
};
