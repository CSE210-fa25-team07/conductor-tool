/**
 * @fileoverview Calendar/Attendance Feature Page
 * Handles Calendar and Analysis views
 * @module pages/attendance/calendar
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
let currentPage = 'calendar';

/**
 * Initializes the calendar page
 */
function initCalendarPage() {
  // Get course ID from URL
  const courseId = getCourseIdFromUrl();

  if (!courseId) {
    window.location.href = '/dashboard';
    return;
  }

  // Create and inject top navigation
  const topNavContainer = document.getElementById('top-navigation');
  const topNav = createTopNav({ activeFeature: 'calendar', courseId, user: mockUser });
  topNavContainer.appendChild(topNav);

  // Create and inject secondary navigation
  const secondaryNavContainer = document.getElementById('secondary-navigation');
  const secondaryNav = createSecondaryNav({ feature: 'calendar', courseId, activePage: currentPage });
  secondaryNavContainer.appendChild(secondaryNav);

  // Setup navigation event listener
  setupNavigation(handleNavigation);

  // Load initial page from URL hash or default to calendar
  const hash = window.location.hash.slice(1);
  currentPage = hash || 'calendar';
  loadPage(currentPage);
}

/**
 * Handles navigation events
 * @param {string} path - Navigation path
 */
function handleNavigation(path) {
  console.log(`Calendar page handling navigation to: ${path}`);

  // Extract page from path (e.g., "calendar/analysis" -> "analysis")
  if (path.startsWith('calendar/')) {
    const page = path.split('/')[1].split('?')[0];
    loadPage(page);
  }
}

/**
 * Loads a specific page view
 * @param {string} page - Page to load (calendar, analysis)
 */
function loadPage(page) {
  currentPage = page;
  window.location.hash = page;

  const courseId = getCourseIdFromUrl();

  // Update secondary navigation
  const secondaryNavContainer = document.getElementById('secondary-navigation');
  secondaryNavContainer.innerHTML = '';
  const secondaryNav = createSecondaryNav({ feature: 'calendar', courseId, activePage: currentPage });
  secondaryNavContainer.appendChild(secondaryNav);

  // Render page content
  const contentContainer = document.getElementById('page-content');

  switch (page) {
    case 'calendar':
      renderCalendar(contentContainer);
      break;
    case 'analysis':
      renderAnalysis(contentContainer);
      break;
    default:
      renderCalendar(contentContainer);
  }
}

/**
 * Renders the calendar view - PLACEHOLDER
 * @param {HTMLElement} container - Container element
 */
function renderCalendar(container) {
  container.innerHTML = `
    <div class="page-header">
      <h1 class="page-title">Attendance Calendar</h1>
      <p class="page-description">Placeholder for routing testing</p>
    </div>

    <div class="card">
      <h3>Calendar Placeholder</h3>
      <p>This is a placeholder for the attendance calendar. Implement your features here when ready.</p>
    </div>
  `;
}

/**
 * Renders the analysis view - PLACEHOLDER
 * @param {HTMLElement} container - Container element
 */
function renderAnalysis(container) {
  container.innerHTML = `
    <div class="page-header">
      <h1 class="page-title">Attendance Analysis</h1>
      <p class="page-description">Placeholder for routing testing</p>
    </div>

    <div class="card">
      <h3>Analysis Placeholder</h3>
      <p>This is a placeholder for the attendance analysis page. Implement your features here when ready.</p>
    </div>
  `;
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCalendarPage);
} else {
  initCalendarPage();
}
