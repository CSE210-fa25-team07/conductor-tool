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
    const initials = ((user.firstName?.[0] || "") + (user.lastName?.[0] || "")).toUpperCase() || "?";
    if (user.photoUrl) {
      userAvatar.innerHTML = "<img src=\"" + user.photoUrl + "\" alt=\"" + user.firstName + " " + user.lastName + "\" style=\"width: 100%; height: 100%; object-fit: cover; border-radius: 50%;\">";
    } else {
      userAvatar.textContent = initials;
    }
  }

  if (contactInfo) {
    const contactItems = [];

    contactItems.push("<div class=\"contact-info-item\"><span class=\"contact-info-label\">Email:</span><span class=\"contact-info-value\"><a href=\"mailto:" + user.email + "\" style=\"color: var(--color-forest-green); text-decoration: underline;\">" + user.email + "</a></span></div>");

    if (user.phoneNumber) {
      contactItems.push("<div class=\"contact-info-item\"><span class=\"contact-info-label\">Phone:</span><span class=\"contact-info-value\">" + user.phoneNumber + "</span></div>");
    }

    if (user.githubUsername) {
      contactItems.push("<div class=\"contact-info-item\"><span class=\"contact-info-label\">GitHub:</span><span class=\"contact-info-value\"><a href=\"https://github.com/" + user.githubUsername + "\" target=\"_blank\" style=\"color: var(--color-forest-green); text-decoration: underline;\">@" + user.githubUsername + "</a></span></div>");
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
      // Get active course UUID from session storage to filter courses
      const activeCourseJson = sessionStorage.getItem("activeCourse");
      const activeCourse = activeCourseJson ? JSON.parse(activeCourseJson) : null;
      const activeCourseUuid = activeCourse?.courseUuid;

      // Filter courses to only show the active course
      const filteredCourses = activeCourseUuid
        ? user.courses.filter(course => course.courseUuid === activeCourseUuid)
        : user.courses;

      if (filteredCourses.length > 0) {
        // Group courses by courseUuid to combine multiple roles
        const courseMap = {};
        filteredCourses.forEach(course => {
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
          return "<div class=\"course-card\"><div class=\"course-card-title\">" + course.courseCode + ": " + course.courseName + "</div><div class=\"course-card-role\">" + rolesText + "</div></div>";
        }).join("");
      } else {
        coursesList.innerHTML = "<p class=\"no-items-message\">No enrolled courses in this term</p>";
      }
    } else {
      coursesList.innerHTML = "<p class=\"no-items-message\">No enrolled courses</p>";
    }
  }

  if (teamsList) {
    if (user.teams && user.teams.length > 0) {
      // Get active course UUID from session storage to filter teams
      const activeCourseJson = sessionStorage.getItem("activeCourse");
      const activeCourse = activeCourseJson ? JSON.parse(activeCourseJson) : null;
      const activeCourseUuid = activeCourse?.courseUuid;

      // Filter teams to only show teams for the active course
      const filteredTeams = activeCourseUuid
        ? user.teams.filter(team => team.courseUuid === activeCourseUuid)
        : user.teams;

      // Get current user context to check team membership
      const currentUser = getCurrentUser();
      const currentUserTeams = getUserTeams();

      // Build a set of team UUIDs the current user belongs to
      const currentUserTeamUuids = new Set(currentUserTeams.map(t => t.teamUuid));

      if (filteredTeams.length === 0) {
        teamsList.innerHTML = "<p class=\"no-items-message\">No team in this course</p>";
      } else {
        teamsList.innerHTML = filteredTeams.map(team => {
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
            ? "<button data-team-uuid=\"" + team.teamUuid + "\" class=\"view-team-btn\">View Team →</button>"
            : "";

          return "<div class=\"team-card\"><div class=\"team-card-name\">" + team.teamName + "</div><div class=\"team-card-date\">Joined: " + joinedDate + "</div>" + viewTeamButton + "</div>";
        }).join("");

        // Add click handlers for view team links
        const viewTeamButtons = teamsList.querySelectorAll(".view-team-btn");
        viewTeamButtons.forEach(button => {
          button.addEventListener("click", () => {
            const teamUuid = button.getAttribute("data-team-uuid");
            navigateToTeam(teamUuid);
          });
        });
      }
    } else {
      teamsList.innerHTML = "<p class=\"no-items-message\">No team memberships</p>";
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
    contactInfo.innerHTML = "<p class=\"no-items-message\">Loading profile...</p>";
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
    contactInfo.innerHTML = "<p class=\"no-items-message\">" + message + "</p>";
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
    staffItems.push("<div class=\"staff-detail-item\"><span class=\"staff-detail-label\">Position:</span><span class=\"staff-detail-value\">Professor</span></div>");
  } else {
    staffItems.push("<div class=\"staff-detail-item\"><span class=\"staff-detail-label\">Position:</span><span class=\"staff-detail-value\">Teaching Assistant</span></div>");
  }

  if (staffData.officeLocation) {
    staffItems.push("<div class=\"staff-detail-item\"><span class=\"staff-detail-label\">Office:</span><span class=\"staff-detail-value\">" + staffData.officeLocation + "</span></div>");
  }

  if (staffData.researchInterest) {
    staffItems.push("<div class=\"staff-detail-item\"><span class=\"staff-detail-label\">Research Interests:</span><span class=\"staff-detail-value\">" + staffData.researchInterest + "</span></div>");
  }

  if (staffData.personalWebsite) {
    staffItems.push("<div class=\"staff-detail-item\"><span class=\"staff-detail-label\">Website:</span><span class=\"staff-detail-value\"><a href=\"" + staffData.personalWebsite + "\" target=\"_blank\" style=\"color: var(--color-forest-green); text-decoration: underline;\">" + staffData.personalWebsite + "</a></span></div>");
  }

  container.innerHTML = staffItems.join("");
}
