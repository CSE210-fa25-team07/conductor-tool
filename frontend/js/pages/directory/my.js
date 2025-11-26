/**
 * @fileoverview My page logic (user profile)
 * @module pages/directory/my
 */

import * as directoryApi from "../../api/directoryApi.js";
import { navigateToTeam, navigateToPeople } from "./main.js";
import { getCurrentUser, getUserTeams } from "../../utils/userContext.js";

/**
 * Initialize the user profile page
 * @param {string} userUuid - User UUID
 */
export async function init(userUuid) {
  await loadUserProfile(userUuid);
  setupEventListeners(userUuid);
}

/**
 * Set up event listeners for the user profile page
 * @param {string} userUuid - User UUID being viewed
 */
function setupEventListeners(userUuid) {
  // Hide "Back to People" button if viewing own profile
  const currentUser = getCurrentUser();
  const backToPeopleContainer = document.getElementById("back-to-people-container");

  if (backToPeopleContainer && currentUser && currentUser.userUuid === userUuid) {
    backToPeopleContainer.style.display = "none";
  }

  // Set up back button click handler
  const backBtn = document.getElementById("back-to-people");
  if (backBtn) {
    backBtn.addEventListener("click", (e) => {
      e.preventDefault();
      navigateToPeople();
    });
  }
}

/**
 * Load user profile data
 * @param {string} userUuid - User UUID
 */
async function loadUserProfile(userUuid) {
  try {
    showLoading();
    const user = await directoryApi.getUserProfile(userUuid);
    renderUserProfile(user);
  } catch (error) {
    // Error loading user profile
    showError("Failed to load user profile. Please try again.");
  }
}

/**
 * Render user profile
 * @param {Object} user - User data
 */
function renderUserProfile(user) {
  const userName = document.getElementById("user-name");
  const userEmail = document.getElementById("user-email");
  const userPronouns = document.getElementById("user-pronouns");
  const userBio = document.getElementById("user-bio");
  const userAvatar = document.getElementById("user-avatar");
  const contactInfo = document.getElementById("user-contact-info");
  const staffSection = document.getElementById("staff-info-section");
  const staffDetails = document.getElementById("staff-details");
  const coursesList = document.getElementById("user-courses-list");
  const teamsList = document.getElementById("user-teams-list");

  if (userName) {
    userName.textContent = user.firstName + " " + user.lastName;
  }

  if (userEmail) {
    userEmail.textContent = user.email;
  }

  if (userPronouns) {
    if (user.pronouns) {
      userPronouns.textContent = "Pronouns: " + user.pronouns;
    } else {
      userPronouns.style.display = "none";
    }
  }

  if (userBio) {
    if (user.bio) {
      userBio.textContent = user.bio;
    } else {
      userBio.style.display = "none";
    }
  }

  if (userAvatar) {
    const initials = (user.firstName[0] + user.lastName[0]).toUpperCase();
    if (user.photoUrl) {
      userAvatar.innerHTML = "<img src=\"" + user.photoUrl + "\" alt=\"" + user.firstName + " " + user.lastName + "\" style=\"width: 100%; height: 100%; object-fit: cover; border-radius: 50%;\">";
    } else {
      userAvatar.textContent = initials;
    }
  }

  if (contactInfo) {
    const contactItems = [];

    contactItems.push("<div><strong>Email:</strong> <a href=\"mailto:" + user.email + "\" style=\"color: var(--color-forest-green); text-decoration: underline;\">" + user.email + "</a></div>");

    if (user.phoneNumber) {
      contactItems.push("<div><strong>Phone:</strong> " + user.phoneNumber + "</div>");
    }

    if (user.githubUsername) {
      contactItems.push("<div><strong>GitHub:</strong> <a href=\"https://github.com/" + user.githubUsername + "\" target=\"_blank\" style=\"color: var(--color-forest-green); text-decoration: underline;\">@" + user.githubUsername + "</a></div>");
    }

    contactInfo.innerHTML = contactItems.join("");
  }

  if (staffSection && staffDetails && user.staff) {
    staffSection.style.display = "block";

    // Check if viewing own profile
    const currentUser = getCurrentUser();
    const isOwnProfile = currentUser && currentUser.userUuid === user.userUuid;

    renderStaffInfo(user.staff, staffDetails, isOwnProfile);
  }

  if (coursesList) {
    if (user.courses && user.courses.length > 0) {
      // Group courses by courseUuid to combine multiple roles
      const courseMap = {};
      user.courses.forEach(course => {
        const key = course.courseUuid;
        if (!courseMap[key]) {
          courseMap[key] = {
            courseCode: course.courseCode,
            courseName: course.courseName,
            roles: []
          };
        }
        courseMap[key].roles.push(course.role);
      });

      // Render grouped courses with combined roles
      coursesList.innerHTML = Object.values(courseMap).map(course => {
        const rolesText = course.roles.join(", ");
        return "<div style=\"padding: var(--space-md); background: white; border: var(--border-thick); margin-bottom: var(--space-sm);\"><div style=\"font-weight: 600; color: var(--color-forest-green);\">" + course.courseCode + ": " + course.courseName + "</div><div style=\"font-size: var(--text-sm); color: var(--color-forest-green-medium); margin-top: var(--space-xs); text-transform: capitalize;\">" + rolesText + "</div></div>";
      }).join("");
    } else {
      coursesList.innerHTML = "<p style=\"font-family: var(--font-mono); color: var(--color-forest-green-medium);\">No enrolled courses</p>";
    }
  }

  if (teamsList) {
    if (user.teams && user.teams.length > 0) {
      // Get current user context to check team membership
      const currentUser = getCurrentUser();
      const currentUserTeams = getUserTeams();

      // Build a set of team UUIDs the current user belongs to
      const currentUserTeamUuids = new Set(currentUserTeams.map(t => t.teamUuid));

      teamsList.innerHTML = user.teams.map(team => {
        const joinedDate = new Date(team.joinedAt).toLocaleDateString();

        // Show "View Team" button if:
        // 1. Viewing own profile, OR
        // 2. Current user is in the same team (teammate), OR
        // 3. Current user is staff (can view all teams)
        const isOwnProfile = currentUser && currentUser.userUuid === user.userUuid;
        const isTeammate = currentUserTeamUuids.has(team.teamUuid);
        const isStaff = currentUser && currentUser.isStaff;
        const canViewTeam = isOwnProfile || isTeammate || isStaff;

        const viewTeamButton = canViewTeam
          ? "<div style=\"margin-top: var(--space-sm);\"><button data-team-uuid=\"" + team.teamUuid + "\" class=\"view-team-link\" style=\"font-family: var(--font-mono); font-size: var(--text-sm); color: var(--color-forest-green); text-decoration: underline; background: none; border: none; cursor: pointer;\">View Team →</button></div>"
          : "";

        return "<div style=\"padding: var(--space-xl); background: white; border: var(--border-thick); margin-bottom: var(--space-sm);\"><div style=\"font-weight: 600; color: var(--color-forest-green);\">" + team.teamName + "</div><div style=\"font-size: var(--text-sm); color: var(--color-forest-green-medium); margin-top: var(--space-xs);\">Joined: " + joinedDate + "</div>" + viewTeamButton + "</div>";
      }).join("");

      // Add click handlers for view team links
      const viewTeamLinks = teamsList.querySelectorAll(".view-team-link");
      viewTeamLinks.forEach(button => {
        button.addEventListener("click", () => {
          const teamUuid = button.getAttribute("data-team-uuid");
          navigateToTeam(teamUuid);
        });
      });
    } else {
      teamsList.innerHTML = "<p style=\"font-family: var(--font-mono); color: var(--color-forest-green-medium);\">No team memberships</p>";
    }
  }
}

/**
 * Show loading state
 */
function showLoading() {
  const userName = document.getElementById("user-name");
  if (userName) {
    userName.textContent = "Loading...";
  }
  const contactInfo = document.getElementById("user-contact-info");
  if (contactInfo) {
    contactInfo.innerHTML = "<div style=\"background: var(--color-light-matcha); border: var(--border-thick); padding: var(--space-lg); text-align: center;\"><p style=\"font-family: var(--font-mono); color: var(--color-forest-green-medium);\">Loading profile...</p></div>";
  }
}

/**
 * Show error message
 * @param {string} message - Error message
 */
function showError(message) {
  const userName = document.getElementById("user-name");
  if (userName) {
    userName.textContent = "Error";
  }

  const contactInfo = document.getElementById("user-contact-info");
  if (contactInfo) {
    contactInfo.innerHTML = "<div style=\"background: var(--color-light-matcha); border: var(--border-thick); padding: var(--space-lg); text-align: center;\"><p style=\"font-family: var(--font-mono); color: var(--color-forest-green);\">" + message + "</p></div>";
  }
}

/**
 * Render staff information without edit button
 * @param {Object} staffData - Staff data
 * @param {HTMLElement} container - Container element
 * @param {boolean} isOwnProfile - Whether viewing own profile (unused now)
 */
function renderStaffInfo(staffData, container, isOwnProfile) {
  const staffItems = [];

  if (staffData.isProf) {
    staffItems.push("<div><strong>Position:</strong> Professor</div>");
  } else {
    staffItems.push("<div><strong>Position:</strong> Teaching Assistant</div>");
  }

  if (staffData.officeLocation) {
    staffItems.push("<div><strong>Office:</strong> " + staffData.officeLocation + "</div>");
  }

  if (staffData.researchInterest) {
    staffItems.push("<div><strong>Research Interests:</strong> " + staffData.researchInterest + "</div>");
  }

  if (staffData.personalWebsite) {
    staffItems.push("<div><strong>Website:</strong> <a href=\"" + staffData.personalWebsite + "\" target=\"_blank\" style=\"color: var(--color-forest-green); text-decoration: underline;\">" + staffData.personalWebsite + "</a></div>");
  }

  container.innerHTML = staffItems.join("");
}
