/**
 * @module standup/service
 */

import * as standupRepository from "../repositories/standupRepository.js";
import * as standupDto from "../dtos/standupDto.js";

/**
 * Get user context with role and course information
 * @param {Object} req
 * @param {Object} res
 * @returns {Promise<void>}
 */
async function getUserContext(req, res) {
  const userId = req.session.user.id;
  const courseId = req.query.courseId;

  const { user, enrollments, teamMemberships } =
    await standupRepository.getUserContext(userId, courseId);

  const contextData = standupDto.toUserContextDto(
    user,
    enrollments,
    teamMemberships,
    req.session.user.name,
    courseId
  );

  return res.status(200).json({
    success: true,
    data: contextData
  });
}

async function createStandup(req, res) {
  const userId = req.session.user.id;
  const { teamUuid, courseUuid, whatDone, whatNext, blockers, reflection, visibility } = req.body;

  if (!teamUuid || !courseUuid) {
    return res.status(400).json({
      success: false,
      error: "teamUuid and courseUuid are required"
    });
  }

  const { teamMemberships } = await standupRepository.getUserContext(userId);
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
  const { whatDone, whatNext, blockers, reflection, visibility } = req.body;

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

  const isTeamMember = await standupRepository.checkTeamMembership(userId, teamId);
  const isStaff = await standupRepository.checkCourseStaffAccess(userId, teamId);

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

  const isStaff = await standupRepository.checkCourseStaffRole(userId, courseId);

  if (!isStaff) {
    return res.status(403).json({
      success: false,
      error: "Not authorized to view course overview"
    });
  }

  const overview = await standupRepository.getCourseOverview(courseId, {
    startDate,
    endDate
  });

  return res.status(200).json({
    success: true,
    data: standupDto.toCourseOverviewDto(overview)
  });
}

export {
  getUserContext,
  createStandup,
  getUserStandups,
  updateStandup,
  deleteStandup,
  getTeamStandups,
  getTAOverview
};
