/**
 * User Profile View
 * Displays comprehensive user information including personal details, academic info, and team membership
 */

// USING MOCK DATA - Switch to directoryApi.js when backend is ready
import {
  getUserProfile
} from "../../../api/directory/directoryApiMock.js";

/**
 * Render user header with photo and basic info
 * @param {Object} user - User data
 * @returns {string} HTML string
 */
function renderUserHeader(user) {
  const photoUrl = user.photo_url || "https://upload.wikimedia.org/wikipedia/commons/a/ac/Default_pfp.jpg";
  const pronouns = user.pronouns ? `(${user.pronouns})` : "";
  const yearLabels = {
    1: "Freshman",
    2: "Sophomore",
    3: "Junior",
    4: "Senior",
    5: "Graduate Student"
  };
  const yearLabel = user.year ? yearLabels[user.year] || `Year ${user.year}` : "";

  return `
    <div class="profile-header">
      <div class="profile-photo">
        <img src="${photoUrl}" alt="${user.first_name} ${user.last_name}" onerror="this.src='https://upload.wikimedia.org/wikipedia/commons/a/ac/Default_pfp.jpg';">
      </div>
      <div class="profile-header-info">
        <h1>${user.first_name} ${user.last_name} ${pronouns}</h1>
        ${yearLabel ? `<p class="year-label">${yearLabel}</p>` : ""}
        ${user.email ? `<p class="email"><a href="mailto:${user.email}">${user.email}</a></p>` : ""}
      </div>
    </div>
  `;
}

/**
 * Render contact information section
 * @param {Object} user - User data
 * @returns {string} HTML string
 */
function renderContactInfo(user) {
  const hasContactInfo = user.phone_number || user.personal_page_url || user.github_username;

  if (!hasContactInfo) {
    return "";
  }

  return `
    <div class="profile-section">
      <h2>Contact Information</h2>
      <div class="info-grid">
        ${user.phone_number ? `
          <div class="info-item">
            <span class="info-label">Phone:</span>
            <span class="info-value">${user.phone_number}</span>
          </div>
        ` : ""}
        ${user.personal_page_url ? `
          <div class="info-item">
            <span class="info-label">Personal Website:</span>
            <span class="info-value"><a href="${user.personal_page_url}" target="_blank">${user.personal_page_url}</a></span>
          </div>
        ` : ""}
        ${user.github_username ? `
          <div class="info-item">
            <span class="info-label">GitHub:</span>
            <span class="info-value"><a href="https://github.com/${user.github_username}" target="_blank">@${user.github_username}</a></span>
          </div>
        ` : ""}
      </div>
    </div>
  `;
}

/**
 * Render academic information section
 * @param {Object} user - User data
 * @returns {string} HTML string
 */
function renderAcademicInfo(user) {
  const hasMajors = user.majors && user.majors.length > 0;
  const hasMinors = user.minors && user.minors.length > 0;

  if (!hasMajors && !hasMinors) {
    return "";
  }

  return `
    <div class="profile-section">
      <h2>Academic Information</h2>
      <div class="info-grid">
        ${hasMajors ? `
          <div class="info-item">
            <span class="info-label">${user.majors.length > 1 ? "Majors" : "Major"}:</span>
            <span class="info-value">${user.majors.join(", ")}</span>
          </div>
        ` : ""}
        ${hasMinors ? `
          <div class="info-item">
            <span class="info-label">${user.minors.length > 1 ? "Minors" : "Minor"}:</span>
            <span class="info-value">${user.minors.join(", ")}</span>
          </div>
        ` : ""}
      </div>
    </div>
  `;
}

/**
 * Render biography section
 * @param {Object} user - User data
 * @returns {string} HTML string
 */
function renderBio(user) {
  if (!user.bio) {
    return "";
  }

  return `
    <div class="profile-section">
      <h2>About Me</h2>
      <p class="bio-text">${user.bio}</p>
    </div>
  `;
}

/**
 * Render staff information section (if user is staff)
 * @param {Object} staffProfile - Staff profile data
 * @returns {string} HTML string
 */
function renderStaffInfo(staffProfile) {
  if (!staffProfile) {
    return "";
  }

  const hasInfo = staffProfile.office_location || staffProfile.office_phone ||
                  staffProfile.research_interests || staffProfile.personal_website;

  if (!hasInfo) {
    return "";
  }

  return `
    <div class="profile-section">
      <h2>Staff Information</h2>
      <div class="info-grid">
        ${staffProfile.office_location ? `
          <div class="info-item">
            <span class="info-label">Office Location:</span>
            <span class="info-value">${staffProfile.office_location}</span>
          </div>
        ` : ""}
        ${staffProfile.office_phone ? `
          <div class="info-item">
            <span class="info-label">Office Phone:</span>
            <span class="info-value">${staffProfile.office_phone}</span>
          </div>
        ` : ""}
        ${staffProfile.personal_website ? `
          <div class="info-item">
            <span class="info-label">Academic Website:</span>
            <span class="info-value"><a href="${staffProfile.personal_website}" target="_blank">${staffProfile.personal_website}</a></span>
          </div>
        ` : ""}
        ${staffProfile.research_interests ? `
          <div class="info-item full-width">
            <span class="info-label">Research Interests:</span>
            <span class="info-value">${staffProfile.research_interests}</span>
          </div>
        ` : ""}
      </div>
    </div>
  `;
}

/**
 * Render team membership section
 * @param {Array} teams - Array of team objects
 * @returns {string} HTML string
 */
function renderTeams(teams) {
  if (!teams || teams.length === 0) {
    return `
      <div class="profile-section">
        <h2>Team Membership</h2>
        <p class="no-data">Not currently a member of any team</p>
      </div>
    `;
  }

  const teamCards = teams.map(team => {
    const leaderBadge = team.is_team_leader ? "<span class=\"leader-badge\">Team Leader</span>" : "";

    return `
      <div class="team-card">
        <div class="team-header">
          <h3>${team.team_name}</h3>
          ${leaderBadge}
        </div>
        <p class="team-course">${team.course_name}</p>
        ${team.project_name ? `<p class="team-project"><strong>Project:</strong> ${team.project_name}</p>` : ""}
        <a href="/public/group-profile.html?team=${team.team_uuid}" class="btn btn-secondary">View Team Profile</a>
      </div>
    `;
  }).join("");

  return `
    <div class="profile-section">
      <h2>Team Membership</h2>
      <div class="teams-grid">
        ${teamCards}
      </div>
    </div>
  `;
}

/**
 * Render complete user profile
 * @param {string} userUuid - User UUID
 * @param {HTMLElement} container - Container element to render into
 */
export async function renderUserProfile(userUuid, container) {
  try {
    // Show loading state
    container.innerHTML = "<div class=\"loading\">Loading profile...</div>";

    // Fetch user profile data
    const profileData = await getUserProfile(userUuid);

    // Render the complete profile
    container.innerHTML = `
      <div class="user-profile">
        ${renderUserHeader(profileData.user)}

        <div class="profile-content">
          ${renderBio(profileData.user)}
          ${renderContactInfo(profileData.user)}
          ${renderAcademicInfo(profileData.user)}
          ${renderStaffInfo(profileData.staff_profile)}
          ${renderTeams(profileData.teams)}
        </div>
      </div>
    `;

    // Add event listeners if needed
    setupEventListeners(container);

  } catch (error) {
    container.innerHTML = `
      <div class="error-message">
        <h2>Error Loading Profile</h2>
        <p>${error.message || "Failed to load user profile. Please try again later."}</p>
      </div>
    `;
  }
}

/**
 * Setup event listeners for interactive elements
 * @param {HTMLElement} _container - Profile container
 */
function setupEventListeners(_container) {
  // Add any interactive behavior here
  // For example: edit profile button, contact form, etc.
}
