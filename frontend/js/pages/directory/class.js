/**
 * @fileoverview Class Feature Page
 * Handles Dashboard, People, Group, and My views
 * @module pages/directory/class
 */

import { createTopNav, createSecondaryNav, setupNavigation, getCourseIdFromUrl } from '../../components/navigation.js';

/**
 * Mock user data
 */
const mockUser = {
  name: 'John Doe',
  avatar: 'JD'
};

/**
 * Current active page
 */
let currentPage = 'dashboard';

/**
 * Initializes the class page
 */
function initClassPage() {
  // Get course ID from URL
  const courseId = getCourseIdFromUrl();

  if (!courseId) {
    // No course selected, redirect to dashboard
    window.location.href = '/dashboard';
    return;
  }

  // Create and inject top navigation
  const topNavContainer = document.getElementById('top-navigation');
  const topNav = createTopNav({ activeFeature: 'class', courseId, user: mockUser });
  topNavContainer.appendChild(topNav);

  // Create and inject secondary navigation
  const secondaryNavContainer = document.getElementById('secondary-navigation');
  const secondaryNav = createSecondaryNav({ feature: 'class', courseId, activePage: currentPage });
  secondaryNavContainer.appendChild(secondaryNav);

  // Setup navigation event listener
  setupNavigation(handleNavigation);

  // Load initial page from URL hash or default to dashboard
  const hash = window.location.hash.slice(1);
  currentPage = hash || 'dashboard';
  loadPage(currentPage);
}

/**
 * Handles navigation events
 * @param {string} path - Navigation path
 */
function handleNavigation(path) {
  console.log(`Class page handling navigation to: ${path}`);

  // Extract page from path (e.g., "class/people" -> "people")
  if (path.startsWith('class/')) {
    const page = path.split('/')[1].split('?')[0];
    loadPage(page);
  }
}

/**
 * Loads a specific page view
 * @param {string} page - Page to load (dashboard, people, group, my)
 */
function loadPage(page) {
  currentPage = page;
  window.location.hash = page;

  // Update secondary navigation
  const secondaryNavContainer = document.getElementById('secondary-navigation');
  secondaryNavContainer.innerHTML = '';
  const secondaryNav = createSecondaryNav({ feature: 'class', activePage: currentPage });
  secondaryNavContainer.appendChild(secondaryNav);

  // Render page content
  const contentContainer = document.getElementById('page-content');

  switch (page) {
    case 'dashboard':
      renderDashboard(contentContainer);
      break;
    case 'people':
      renderPeople(contentContainer);
      break;
    case 'group':
      renderGroup(contentContainer);
      break;
    case 'my':
      renderMy(contentContainer);
      break;
    default:
      renderDashboard(contentContainer);
  }
}

/**
 * Renders the dashboard view - PLACEHOLDER
 * @param {HTMLElement} container - Container element
 */
function renderDashboard(container) {
  container.innerHTML = `
    <div class="page-header">
      <h1 class="page-title">Class Dashboard</h1>
      <p class="page-description">Placeholder for routing testing</p>
    </div>

    <div class="card">
      <h3>Dashboard Placeholder</h3>
      <p>This is a placeholder for the class dashboard. Implement your features here when ready.</p>
    </div>
  `;
}

/**
 * Renders the people view - PLACEHOLDER
 * @param {HTMLElement} container - Container element
 */
function renderPeople(container) {
  container.innerHTML = `
    <div class="page-header">
      <h1 class="page-title">People</h1>
      <p class="page-description">Placeholder for routing testing</p>
    </div>

    <div class="card">
      <h3>People Placeholder</h3>
      <p>This is a placeholder for the people page. Implement your features here when ready.</p>
    </div>
  `;
}

/**
 * Renders the group view - PLACEHOLDER
 * @param {HTMLElement} container - Container element
 */
function renderGroup(container) {
  container.innerHTML = `
    <div class="page-header">
      <h1 class="page-title">Groups</h1>
      <p class="page-description">Placeholder for routing testing</p>
    </div>

    <div class="card">
      <h3>Groups Placeholder</h3>
      <p>This is a placeholder for the groups page. Implement your features here when ready.</p>
    </div>
  `;
}

/**
 * Renders the my (personal) view - PLACEHOLDER
 * @param {HTMLElement} container - Container element
 */
function renderMy(container) {
  container.innerHTML = `
    <div class="page-header">
      <h1 class="page-title">My Progress</h1>
      <p class="page-description">Placeholder for routing testing</p>
    </div>

    <div class="card">
      <h3>My Progress Placeholder</h3>
      <p>This is a placeholder for the personal progress page. Implement your features here when ready.</p>
    </div>
  `;
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initClassPage);
} else {
  initClassPage();
}
