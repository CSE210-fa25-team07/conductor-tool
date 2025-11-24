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

export {
  getCourseOverview,
  getCourseStaff,
  getEnrollmentStats,
  getRecentEnrollments,
  getUserProfile,
  getCourseRoster,
  getTeamProfile,
  getCourseTeams
};
