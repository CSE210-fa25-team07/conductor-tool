/**
 * @fileoverview User Profile Page - Placeholder
 * Personal information and settings
 * @module pages/profile/main
 */

import { createTopNav, setupNavigation } from '../../components/navigation.js';

/**
 * Mock user data
 */
const mockUser = {
  name: 'John Doe',
  avatar: 'JD'
};

/**
 * Initializes the profile page
 */
function initProfilePage() {
  // Create and inject top navigation
  const topNavContainer = document.getElementById('top-navigation');
  const topNav = createTopNav({ activeFeature: '', user: mockUser });
  topNavContainer.appendChild(topNav);

  // Setup navigation event listener
  setupNavigation(handleNavigation);

  // Render profile content
  renderProfile();
}

/**
 * Handles navigation events
 * @param {string} path - Navigation path
 */
function handleNavigation(path) {
  console.log(`Profile page handling navigation to: ${path}`);
}

/**
 * Renders the profile content - PLACEHOLDER
 */
function renderProfile() {
  const container = document.getElementById('page-content');

  container.innerHTML = `
    <div class="page-header">
      <h1 class="page-title">My Profile</h1>
      <p class="page-description">Placeholder for routing testing</p>
    </div>

    <div class="card">
      <h3>Profile Placeholder</h3>
      <p>This is a placeholder for the user profile and settings page. Implement your features here when ready.</p>
      <br>
      <p><strong>User:</strong> ${mockUser.name}</p>
      <p><strong>Initials:</strong> ${mockUser.avatar}</p>
    </div>

    <div style="margin-top: var(--space-lg);">
      <button class="btn btn-secondary" onclick="window.location.href='/dashboard'">Back to Dashboard</button>
    </div>
  `;
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initProfilePage);
} else {
  initProfilePage();
}
