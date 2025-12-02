/**
 * @module standup/service
 */

import * as standupRepository from "../repositories/standupRepository.js";
import * as standupDto from "../dtos/standupDto.js";
import * as userContextRepository from "../repositories/userContextRepository.js";

async function createStandup(req, res) {
  const userId = req.session.user.id;
  const { teamUuid, courseUuid, whatDone, githubActivities, whatNext, blockers, reflection, visibility } = req.body;

  if (!teamUuid || !courseUuid) {
    return res.status(400).json({
      success: false,
      error: "teamUuid and courseUuid are required"
    });
  }

  const { teamMemberships } = await userContextRepository.getUserContext(userId);
  const isTeamMember = teamMemberships.some(tm => tm.team.teamUuid === teamUuid);

  if (!isTeamMember) {
    return res.status(403).json({
      success: false,
      error: "Not authorized to create standup for this team"
    });
  }

  const standup = await standupRepository.createStandup({
    userUuid: userId,
    teamUuid,
    courseUuid,
    whatDone,
    githubActivities,
    whatNext,
    blockers,
    reflection,
    visibility: visibility || "team"
  });

  return res.status(201).json({
    success: true,
    data: standupDto.toStandupDto(standup)
  });
}

async function getUserStandups(req, res) {
  const userId = req.session.user.id;
  const { courseUuid, teamUuid, startDate, endDate } = req.query;

  const standups = await standupRepository.getUserStandups(userId, {
    courseUuid,
    teamUuid,
    startDate,
    endDate
  });

  return res.status(200).json({
    success: true,
    data: standupDto.toStandupListDto(standups)
  });
}

async function updateStandup(req, res) {
  const userId = req.session.user.id;
  const { standupId } = req.params;
  const { whatDone, githubActivities, whatNext, blockers, reflection, visibility } = req.body;

  const standup = await standupRepository.getStandupById(standupId);

  if (!standup) {
    return res.status(404).json({
      success: false,
      error: "Standup not found"
    });
  }

  if (standup.userUuid !== userId) {
    return res.status(403).json({
      success: false,
      error: "Not authorized to update this standup"
    });
  }

  const updatedStandup = await standupRepository.updateStandup(standupId, {
    whatDone,
    githubActivities,
    whatNext,
    blockers,
    reflection,
    visibility
  });

  return res.status(200).json({
    success: true,
    data: standupDto.toStandupDto(updatedStandup)
  });
}

async function deleteStandup(req, res) {
  const userId = req.session.user.id;
  const { standupId } = req.params;

  const standup = await standupRepository.getStandupById(standupId);

  if (!standup) {
    return res.status(404).json({
      success: false,
      error: "Standup not found"
    });
  }

  if (standup.userUuid !== userId) {
    return res.status(403).json({
      success: false,
      error: "Not authorized to delete this standup"
    });
  }

  await standupRepository.deleteStandup(standupId);

  return res.status(200).json({
    success: true,
    message: "Standup deleted successfully"
  });
}

async function getTeamStandups(req, res) {
  const userId = req.session.user.id;
  const { teamId } = req.params;
  const { startDate, endDate } = req.query;

  const isTeamMember = await userContextRepository.checkTeamMembership(userId, teamId);
  const isStaff = await userContextRepository.checkCourseStaffAccess(userId, teamId);

  if (!isTeamMember && !isStaff) {
    return res.status(403).json({
      success: false,
      error: "Not authorized to view this team's standups"
    });
  }

  const standups = await standupRepository.getTeamStandups(teamId, {
    startDate,
    endDate
  });

  return res.status(200).json({
    success: true,
    data: standupDto.toStandupListDto(standups)
  });
}

async function getTAOverview(req, res) {
  const userId = req.session.user.id;
  const { courseId, startDate, endDate } = req.query;

  if (!courseId) {
    return res.status(400).json({
      success: false,
      error: "courseId is required"
    });
  }

  const isStaff = await userContextRepository.checkCourseStaffRole(userId, courseId);

  if (!isStaff) {
    return res.status(403).json({
      success: false,
      error: "Not authorized to view course overview"
    });
  }

  const standups = await standupRepository.getCourseStandups(courseId, {
    startDate,
    endDate
  });

  return res.status(200).json({
    success: true,
    data: standupDto.toStandupListDto(standups)
  });
}

async function getStandupsByUser(req, res) {
  const requesterId = req.session.user.id;
  const { userUuid } = req.params;
  const { courseId, startDate, endDate } = req.query;

  if (!courseId) {
    return res.status(400).json({
      success: false,
      error: "courseId is required"
    });
  }

  // Allow access if: staff for this course OR share a team with the target user
  const isStaff = await userContextRepository.checkCourseStaffRole(requesterId, courseId);
  const isTeammate = await userContextRepository.checkSameTeamMembership(requesterId, userUuid);

  if (!isStaff && !isTeammate) {
    return res.status(403).json({
      success: false,
      error: "Not authorized to view this user's standups"
    });
  }

  const standups = await standupRepository.getUserStandups(userUuid, {
    courseUuid: courseId,
    startDate,
    endDate
  });

  return res.status(200).json({
    success: true,
    data: standupDto.toStandupListDto(standups)
  });
}

export {
  createStandup,
  getUserStandups,
  updateStandup,
  deleteStandup,
  getTeamStandups,
  getTAOverview,
  getStandupsByUser
};
