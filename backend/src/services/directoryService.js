/**
 * @module directory/service
 */

import * as directoryRepository from "../repositories/directoryRepository.js";
import * as directoryDto from "../dtos/directoryDto.js";
import * as userContextRepository from "../repositories/userContextRepository.js";

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
  const { courseUuid } = req.params;

  if (!courseUuid) {
    return res.status(400).json({
      success: false,
      error: "courseUuid is required"
    });
  }

  const staff = await directoryRepository.getCourseStaff(courseUuid);

  return res.status(200).json({
    success: true,
    data: directoryDto.toStaffListDto(staff)
  });
}

async function getEnrollmentStats(req, res) {
  const userId = req.session.user.id;
  const { courseUuid } = req.params;

  if (!courseUuid) {
    return res.status(400).json({
      success: false,
      error: "courseUuid is required"
    });
  }

  const isStaff = await userContextRepository.checkCourseStaffRole(userId, courseUuid);

  if (!isStaff) {
    return res.status(403).json({
      success: false,
      error: "Not authorized to view enrollment statistics"
    });
  }

  const stats = await directoryRepository.getEnrollmentStats(courseUuid);

  return res.status(200).json({
    success: true,
    data: directoryDto.toEnrollmentStatsDto(stats)
  });
}

async function getRecentEnrollments(req, res) {
  const userId = req.session.user.id;
  const { courseUuid } = req.params;
  const { limit = 10 } = req.query;

  if (!courseUuid) {
    return res.status(400).json({
      success: false,
      error: "courseUuid is required"
    });
  }

  const isStaff = await userContextRepository.checkCourseStaffRole(userId, courseUuid);

  if (!isStaff) {
    return res.status(403).json({
      success: false,
      error: "Not authorized to view recent enrollments"
    });
  }

  const enrollments = await directoryRepository.getRecentEnrollments(courseUuid, parseInt(limit));

  return res.status(200).json({
    success: true,
    data: directoryDto.toEnrollmentListDto(enrollments)
  });
}

async function getUserProfile(req, res) {
  const { userUuid } = req.params;

  if (!userUuid) {
    return res.status(400).json({
      success: false,
      error: "userUuid is required"
    });
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

  const rosterData = await directoryRepository.getCourseRoster(
    courseUuid,
    parseInt(page),
    parseInt(limit),
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

  const teamsData = await directoryRepository.getCourseTeams(
    courseUuid,
    parseInt(page),
    parseInt(limit),
    isStaff ? null : userId  // Pass userId to filter to user's team only if not staff
  );

  return res.status(200).json({
    success: true,
    data: directoryDto.toTeamListDto(teamsData)
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

  // Get user with staff relationship
  const prisma = (await import("../utils/db.js")).getPrisma();
  const user = await prisma.user.findUnique({
    where: { userUuid: userUuid },
    include: {
      staff: true
    }
  });

  if (!user) {
    return res.status(404).json({
      success: false,
      error: "User not found"
    });
  }

  return res.status(200).json({
    success: true,
    data: user
  });
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

  // Validate profile data
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

  // Remove undefined fields from user data
  Object.keys(normalizedUserData).forEach(key => {
    if (normalizedUserData[key] === undefined) {
      delete normalizedUserData[key];
    }
  });

  // Update user
  const updatedUser = await directoryRepository.updateUser(userUuid, normalizedUserData);

  // Update staff information if provided
  if (profileData.staff) {
    const normalizedStaffData = {
      officeLocation: profileData.staff.officeLocation?.trim() || null,
      researchInterest: profileData.staff.researchInterest?.trim() || null,
      personalWebsite: profileData.staff.personalWebsite?.trim() || null
    };

    // Remove undefined fields from staff data
    Object.keys(normalizedStaffData).forEach(key => {
      if (normalizedStaffData[key] === undefined) {
        delete normalizedStaffData[key];
      }
    });

    // Only update if there are staff fields to update
    if (Object.keys(normalizedStaffData).length > 0) {
      try {
        await directoryRepository.updateStaff(userUuid, normalizedStaffData);
      } catch (error) {
        // If staff record doesn't exist, user is not staff - ignore error
        if (error.message !== "Staff record not found for this user") {
          throw error;
        }
      }
    }
  }

  // Update session with new name if changed
  if (profileData.firstName || profileData.lastName) {
    req.session.user.name = `${updatedUser.firstName} ${updatedUser.lastName}`;
  }

  return res.status(200).json({
    success: true,
    data: updatedUser
  });
}

/**
 * Validate profile data for updates (inline validator for Directory team)
 * @param {Object} profileData - Profile data to validate
 * @throws {Error} If validation fails
 */
function validateProfileData(profileData) {
  if (!profileData || typeof profileData !== "object") {
    throw new Error("Profile data is required and must be an object");
  }

  // Validate firstName if provided
  if (profileData.firstName !== undefined) {
    if (typeof profileData.firstName !== "string" || profileData.firstName.trim().length === 0) {
      throw new Error("First name must be a non-empty string");
    }
    if (profileData.firstName.trim().length > 100) {
      throw new Error("First name must not exceed 100 characters");
    }
  }

  // Validate lastName if provided
  if (profileData.lastName !== undefined) {
    if (typeof profileData.lastName !== "string" || profileData.lastName.trim().length === 0) {
      throw new Error("Last name must be a non-empty string");
    }
    if (profileData.lastName.trim().length > 100) {
      throw new Error("Last name must not exceed 100 characters");
    }
  }

  // Validate email if provided
  if (profileData.email !== undefined) {
    if (typeof profileData.email !== "string" || profileData.email.trim().length === 0) {
      throw new Error("Email must be a non-empty string");
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(profileData.email.trim())) {
      throw new Error("Invalid email format");
    }
    if (profileData.email.trim().length > 255) {
      throw new Error("Email must not exceed 255 characters");
    }
  }

  // Validate pronouns if provided
  if (profileData.pronouns !== undefined && profileData.pronouns !== null && profileData.pronouns !== "") {
    if (typeof profileData.pronouns !== "string") {
      throw new Error("Pronouns must be a string");
    }
    if (profileData.pronouns.trim().length > 50) {
      throw new Error("Pronouns must not exceed 50 characters");
    }
  }

  // Validate bio if provided
  if (profileData.bio !== undefined && profileData.bio !== null && profileData.bio !== "") {
    if (typeof profileData.bio !== "string") {
      throw new Error("Bio must be a string");
    }
    if (profileData.bio.trim().length > 1000) {
      throw new Error("Bio must not exceed 1000 characters");
    }
  }

  // Validate phoneNumber if provided
  if (profileData.phoneNumber !== undefined && profileData.phoneNumber !== null && profileData.phoneNumber !== "") {
    if (typeof profileData.phoneNumber !== "string") {
      throw new Error("Phone number must be a string");
    }
    if (profileData.phoneNumber.trim().length > 20) {
      throw new Error("Phone number must not exceed 20 characters");
    }
  }

  // Validate githubUsername if provided
  if (profileData.githubUsername !== undefined && profileData.githubUsername !== null && profileData.githubUsername !== "") {
    if (typeof profileData.githubUsername !== "string") {
      throw new Error("GitHub username must be a string");
    }
    if (profileData.githubUsername.trim().length > 100) {
      throw new Error("GitHub username must not exceed 100 characters");
    }
  }
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
  const isTeamLeader = await userContextRepository.checkTeamLeaderRole(userUuid, teamUuid);

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

  console.log("Updating team links:", { teamUuid, linksData });

  // Update team in database
  await directoryRepository.updateTeamLinks(teamUuid, linksData);

  // Fetch updated team profile to ensure we return the latest data
  const updatedTeam = await directoryRepository.getTeamProfile(teamUuid);

  console.log("Updated team links:", { 
    teamUuid, 
    teamPageUrl: updatedTeam.teamPageUrl, 
    repoUrl: updatedTeam.repoUrl 
  });

  return res.status(200).json({
    success: true,
    data: directoryDto.toTeamProfileDto(updatedTeam)
  });
}

export {
  getCourseOverview,
  getCourseStaff,
  getEnrollmentStats,
  getRecentEnrollments,
  getUserProfile,
  getCourseRoster,
  getTeamProfile,
  getCourseTeams,
  getCurrentUserProfile,
  updateCurrentUserProfile,
  updateCourseLinks,
  updateTeamLinks
};
