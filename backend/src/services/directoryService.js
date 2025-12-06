/**
 * @module directory/service
 */

import * as directoryRepository from "../repositories/directoryRepository.js";
import * as directoryDto from "../dtos/directoryDto.js";
import * as userContextRepository from "../repositories/userContextRepository.js";

/**
 * Validate and normalize pagination parameters
 * @param {number|string} page - Page number
 * @param {number|string} limit - Items per page
 * @returns {Object} Validated page and limit values
 */
function validatePagination(page, limit) {
  const validPage = Math.max(1, parseInt(page) || 1);
  const validLimit = Math.min(Math.max(1, parseInt(limit) || 20), 100);
  return { page: validPage, limit: validLimit };
}

async function getCourseOverview(req, res) {
  const userId = req.session.user.id;
  const { courseUuid } = req.params;

  if (!courseUuid) {
    return res.status(400).json({
      success: false,
      error: "courseUuid is required"
    });
  }

  // Check if user is staff (can see all teams) or student (can only see their own team count)
  const isStaff = await userContextRepository.checkCourseStaffRole(userId, courseUuid);

  const course = await directoryRepository.getCourseOverview(
    courseUuid,
    isStaff ? null : userId  // Pass userId to filter to user's teams only if not staff
  );

  if (!course) {
    return res.status(404).json({
      success: false,
      error: "Course not found"
    });
  }

  return res.status(200).json({
    success: true,
    data: directoryDto.toCourseOverviewDto(course)
  });
}

async function getCourseStaff(req, res) {
  const userId = req.session.user.id;
  const { courseUuid } = req.params;

  if (!courseUuid) {
    return res.status(400).json({
      success: false,
      error: "courseUuid is required"
    });
  }

  // Check if user is enrolled in this course
  const isEnrolled = await directoryRepository.checkCourseEnrollment(userId, courseUuid);

  if (!isEnrolled) {
    return res.status(403).json({
      success: false,
      error: "Not authorized to view course staff"
    });
  }

  const staff = await directoryRepository.getCourseStaff(courseUuid);

  return res.status(200).json({
    success: true,
    data: directoryDto.toStaffListDto(staff)
  });
}

async function getUserProfile(req, res) {
  const requesterId = req.session.user.id;
  const { userUuid } = req.params;

  if (!userUuid) {
    return res.status(400).json({
      success: false,
      error: "userUuid is required"
    });
  }

  // Allow viewing own profile without course check
  if (requesterId !== userUuid) {
    // Check if requester shares a course with the target user
    const sharesCourse = await directoryRepository.checkSharedCourseEnrollment(requesterId, userUuid);
    if (!sharesCourse) {
      return res.status(403).json({
        success: false,
        error: "Not authorized to view this profile"
      });
    }
  }

  const user = await directoryRepository.getUserProfile(userUuid);

  if (!user) {
    return res.status(404).json({
      success: false,
      error: "User not found"
    });
  }

  return res.status(200).json({
    success: true,
    data: directoryDto.toUserProfileDto(user)
  });
}

async function getCourseRoster(req, res) {
  const userId = req.session.user.id;
  const { courseUuid } = req.params;
  const { page = 1, limit = 20, filter = "all" } = req.query;

  if (!courseUuid) {
    return res.status(400).json({
      success: false,
      error: "courseUuid is required"
    });
  }

  const isEnrolled = await directoryRepository.checkCourseEnrollment(userId, courseUuid);

  if (!isEnrolled) {
    return res.status(403).json({
      success: false,
      error: "Not authorized to view course roster"
    });
  }

  // Validate pagination parameters
  const pagination = validatePagination(page, limit);

  const rosterData = await directoryRepository.getCourseRoster(
    courseUuid,
    pagination.page,
    pagination.limit,
    filter
  );

  return res.status(200).json({
    success: true,
    data: directoryDto.toRosterDto(rosterData)
  });
}

async function getTeamProfile(req, res) {
  const userId = req.session.user.id;
  const { teamUuid } = req.params;

  if (!teamUuid) {
    return res.status(400).json({
      success: false,
      error: "teamUuid is required"
    });
  }

  const team = await directoryRepository.getTeamProfile(teamUuid);

  if (!team) {
    return res.status(404).json({
      success: false,
      error: "Team not found"
    });
  }

  // Check authorization: must be team member OR staff
  const isTeamMember = await userContextRepository.checkTeamMembership(userId, teamUuid);
  const isStaff = await userContextRepository.checkCourseStaffRole(userId, team.courseUuid);

  if (!isTeamMember && !isStaff) {
    return res.status(403).json({
      success: false,
      error: "Not authorized to view this team"
    });
  }

  return res.status(200).json({
    success: true,
    data: directoryDto.toTeamProfileDto(team)
  });
}

async function getCourseTeams(req, res) {
  const userId = req.session.user.id;
  const { courseUuid } = req.params;
  const { page = 1, limit = 20 } = req.query;

  if (!courseUuid) {
    return res.status(400).json({
      success: false,
      error: "courseUuid is required"
    });
  }

  const isEnrolled = await directoryRepository.checkCourseEnrollment(userId, courseUuid);

  if (!isEnrolled) {
    return res.status(403).json({
      success: false,
      error: "Not authorized to view course teams"
    });
  }

  // Check if user is staff (can see all teams) or student (can only see their own team)
  const isStaff = await userContextRepository.checkCourseStaffRole(userId, courseUuid);

  // Validate pagination parameters
  const pagination = validatePagination(page, limit);

  const teamsData = await directoryRepository.getCourseTeams(
    courseUuid,
    pagination.page,
    pagination.limit,
    isStaff ? null : userId  // Pass userId to filter to user's team only if not staff
  );

  return res.status(200).json({
    success: true,
    data: directoryDto.toTeamListDto(teamsData)
  });
}

/**
 * Validate profile data for updates
 * @param {Object} profileData - Profile data to validate
 * @throws {Error} If validation fails
 */
function validateProfileData(profileData) {
  const { firstName, lastName, email, pronouns, bio, phoneNumber, githubUsername } = profileData;

  // firstName is required
  if (firstName !== undefined) {
    if (typeof firstName !== "string" || firstName.trim().length === 0) {
      throw new Error("First name must be a non-empty string");
    }
    if (firstName.trim().length > 100) {
      throw new Error("First name must be 100 characters or less");
    }
  }

  // lastName is required
  if (lastName !== undefined) {
    if (typeof lastName !== "string" || lastName.trim().length === 0) {
      throw new Error("Last name must be a non-empty string");
    }
    if (lastName.trim().length > 100) {
      throw new Error("Last name must be 100 characters or less");
    }
  }

  // email is required
  if (email !== undefined) {
    if (typeof email !== "string" || email.trim().length === 0) {
      throw new Error("Email must be a non-empty string");
    }
    if (email.trim().length > 255) {
      throw new Error("Email must be 255 characters or less");
    }
    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      throw new Error("Invalid email format");
    }
  }

  // Optional fields validation
  if (pronouns !== undefined && pronouns !== null && pronouns !== "") {
    if (typeof pronouns !== "string") {
      throw new Error("Pronouns must be a string");
    }
    if (pronouns.length > 50) {
      throw new Error("Pronouns must be 50 characters or less");
    }
  }

  if (bio !== undefined && bio !== null && bio !== "") {
    if (typeof bio !== "string") {
      throw new Error("Bio must be a string");
    }
    if (bio.length > 500) {
      throw new Error("Bio must be 500 characters or less");
    }
  }

  if (phoneNumber !== undefined && phoneNumber !== null && phoneNumber !== "") {
    if (typeof phoneNumber !== "string") {
      throw new Error("Phone number must be a string");
    }
    // Basic phone validation - allows digits, spaces, dashes, parentheses, plus
    const phoneRegex = /^[0-9\s\-\(\)\+]+$/;
    if (!phoneRegex.test(phoneNumber)) {
      throw new Error("Invalid phone number format");
    }
  }

  if (githubUsername !== undefined && githubUsername !== null && githubUsername !== "") {
    if (typeof githubUsername !== "string") {
      throw new Error("GitHub username must be a string");
    }
    // GitHub username rules: alphanumeric and hyphens, max 39 chars
    const githubRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?$/;
    if (!githubRegex.test(githubUsername)) {
      throw new Error("Invalid GitHub username format");
    }
  }
}

/**
 * Update current user's profile
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @returns {Object} Updated profile data
 */
async function updateCurrentUserProfile(req, res) {
  const userUuid = req.session.user.id;
  const profileData = req.body;

  // Validate input
  validateProfileData(profileData);

  // Normalize user data
  const normalizedUserData = {
    firstName: profileData.firstName?.trim(),
    lastName: profileData.lastName?.trim(),
    email: profileData.email?.trim(),
    pronouns: profileData.pronouns?.trim() || null,
    bio: profileData.bio?.trim() || null,
    phoneNumber: profileData.phoneNumber?.trim() || null,
    githubUsername: profileData.githubUsername?.trim() || null
  };

  // Update user basic info
  const updatedUser = await directoryRepository.updateUser(userUuid, normalizedUserData);

  // If staff data is provided, update staff record
  if (profileData.staff) {
    const normalizedStaffData = {
      officeLocation: profileData.staff.officeLocation?.trim() || null,
      researchInterest: profileData.staff.researchInterest?.trim() || null,
      personalWebsite: profileData.staff.personalWebsite?.trim() || null
    };

    // Validate website URL if provided
    if (normalizedStaffData.personalWebsite) {
      try {
        new URL(normalizedStaffData.personalWebsite);
      } catch (error) {
        return res.status(400).json({
          success: false,
          error: "Invalid personal website URL format"
        });
      }
    }

    await directoryRepository.updateStaff(userUuid, normalizedStaffData);
  }

  // Fetch updated user profile
  const user = await directoryRepository.getUserProfile(userUuid);

  // Update session with new name and email so sidebar reflects the change
  if (req.session.user) {
    req.session.user.name = `${user.firstName} ${user.lastName}`;
    req.session.user.email = user.email;
  }

  return res.status(200).json({
    success: true,
    data: directoryDto.toUserProfileDto(user)
  });
}

/**
 * Get current user's own profile
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @returns {Object} Profile data
 */
async function getCurrentUserProfile(req, res) {
  const userUuid = req.session.user.id;

  // Use repository for consistent data retrieval
  const user = await directoryRepository.getUserProfile(userUuid);

  if (!user) {
    return res.status(404).json({
      success: false,
      error: "User not found"
    });
  }

  return res.status(200).json({
    success: true,
    data: directoryDto.toUserProfileDto(user)
  });
}

/**
 * Update course links (professor only)
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @returns {Object} Updated course data
 */
async function updateCourseLinks(req, res) {
  const userUuid = req.session.user.id;
  const { courseUuid } = req.params;
  const { syllabusUrl, canvasUrl } = req.body;

  if (!courseUuid) {
    return res.status(400).json({
      success: false,
      error: "courseUuid is required"
    });
  }

  // Check if user is a professor for this course
  const userRole = await directoryRepository.getUserRoleInCourse(userUuid, courseUuid);

  if (userRole !== "Professor") {
    return res.status(403).json({
      success: false,
      error: "Only professors can update course links"
    });
  }

  // Validate URLs
  if (syllabusUrl !== null && syllabusUrl !== undefined && syllabusUrl !== "") {
    if (typeof syllabusUrl !== "string") {
      return res.status(400).json({
        success: false,
        error: "Syllabus URL must be a string"
      });
    }
    try {
      new URL(syllabusUrl.trim());
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: "Invalid syllabus URL format"
      });
    }
  }

  if (canvasUrl !== null && canvasUrl !== undefined && canvasUrl !== "") {
    if (typeof canvasUrl !== "string") {
      return res.status(400).json({
        success: false,
        error: "Canvas URL must be a string"
      });
    }
    try {
      new URL(canvasUrl.trim());
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: "Invalid canvas URL format"
      });
    }
  }

  // Normalize the data
  const linksData = {
    syllabusUrl: syllabusUrl?.trim() || null,
    canvasUrl: canvasUrl?.trim() || null
  };

  // Update course
  const updatedCourse = await directoryRepository.updateCourseLinks(courseUuid, linksData);

  return res.status(200).json({
    success: true,
    data: updatedCourse
  });
}

/**
 * Update team links (team leader only)
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @returns {Object} Updated team data
 */
async function updateTeamLinks(req, res) {
  const userUuid = req.session.user.id;
  const { teamUuid } = req.params;
  const { teamPageUrl, repoUrl } = req.body;

  if (!teamUuid) {
    return res.status(400).json({
      success: false,
      error: "teamUuid is required"
    });
  }

  // Check if user is a team leader for this team
  const isTeamLeader = await directoryRepository.checkTeamLeaderRole(userUuid, teamUuid);

  if (!isTeamLeader) {
    return res.status(403).json({
      success: false,
      error: "Only team leaders can update team links"
    });
  }

  // Validate URLs if provided
  if (teamPageUrl !== null && teamPageUrl !== undefined && teamPageUrl !== "") {
    if (typeof teamPageUrl !== "string") {
      return res.status(400).json({
        success: false,
        error: "Team page URL must be a string"
      });
    }
    try {
      new URL(teamPageUrl.trim());
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: "Invalid team page URL format"
      });
    }
  }

  if (repoUrl !== null && repoUrl !== undefined && repoUrl !== "") {
    if (typeof repoUrl !== "string") {
      return res.status(400).json({
        success: false,
        error: "Repository URL must be a string"
      });
    }
    try {
      new URL(repoUrl.trim());
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: "Invalid repository URL format"
      });
    }
  }

  // Normalize the data - empty strings become null
  // Always set both fields to ensure old values are cleared if needed
  const linksData = {
    teamPageUrl: (teamPageUrl && typeof teamPageUrl === "string" && teamPageUrl.trim()) ? teamPageUrl.trim() : null,
    repoUrl: (repoUrl && typeof repoUrl === "string" && repoUrl.trim()) ? repoUrl.trim() : null
  };

  // Update team in database
  await directoryRepository.updateTeamLinks(teamUuid, linksData);

  // Fetch updated team profile to ensure we return the latest data
  const updatedTeam = await directoryRepository.getTeamProfile(teamUuid);

  return res.status(200).json({
    success: true,
    data: directoryDto.toTeamProfileDto(updatedTeam)
  });
}

export {
  getCourseOverview,
  getCourseStaff,
  getUserProfile,
  getCourseRoster,
  getTeamProfile,
  getCourseTeams,
  getCurrentUserProfile,
  updateCurrentUserProfile,
  updateCourseLinks,
  updateTeamLinks
};
