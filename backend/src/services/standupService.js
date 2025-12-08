/**
 * @module standup/service
 * Standup Service
 *
 * Business logic for standup CRUD operations and authorization.
 * Handles user permissions, team membership validation, and data transformation.
 */

import * as standupRepository from "../repositories/standupRepository.js";
import * as standupDto from "../dtos/standupDto.js";
import * as userContextRepository from "../repositories/userContextRepository.js";
import * as emailService from "./emailService.js";


/**
 * Create a new standup entry
 * @param {Object} req - Express request object
 * @param {Object} req.session.user - Authenticated user from session
 * @param {string} req.session.user.id - User UUID
 * @param {Object} req.body - Request body
 * @param {string} req.body.teamUuid - Team UUID (required)
 * @param {string} req.body.courseUuid - Course UUID (required)
 * @param {string} [req.body.whatDone] - What was accomplished
 * @param {Array} [req.body.githubActivities] - Linked GitHub activities
 * @param {string} [req.body.whatNext] - What's planned next
 * @param {string} [req.body.blockers] - Current blockers
 * @param {string} [req.body.reflection] - Personal reflection
 * @param {string} [req.body.visibility="team"] - Visibility level
 * @param {Object} res - Express response object
 * @returns {Promise<Object>} JSON response with created standup or error
 */
async function createStandup(req, res) {
  const userId = req.session.user.id;
  const { teamUuid, courseUuid, whatDone, githubActivities, whatNext, blockers, reflection, visibility, sentimentScore } = req.body;

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
    visibility: visibility || "team",
    sentimentScore
  });

  if (blockers && blockers.trim().length > 0) {
    try {
      const taEmail = await standupRepository.getTAEmailByTeam(teamUuid);
      await emailService.sendBlockerNotification({
        taEmail: taEmail,
        studentName: `${standup.user.firstName} ${standup.user.lastName}`,
        studentEmail: standup.user.email,
        teamName: standup.team.teamName,
        courseName: standup.course.courseName,
        blockerContent: blockers
      });
    } catch (emailError) {
    }
  }

  return res.status(201).json({
    success: true,
    data: standupDto.toStandupDto(standup)
  });
}

/**
 * Get standups for the authenticated user
 * @param {Object} req - Express request object
 * @param {Object} req.session.user - Authenticated user from session
 * @param {string} req.session.user.id - User UUID
 * @param {Object} req.query - Query parameters
 * @param {string} [req.query.courseUuid] - Filter by course
 * @param {string} [req.query.teamUuid] - Filter by team
 * @param {string} [req.query.startDate] - Filter from date (ISO string)
 * @param {string} [req.query.endDate] - Filter to date (ISO string)
 * @param {Object} res - Express response object
 * @returns {Promise<Object>} JSON response with list of standups
 */
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

/**
 * Update an existing standup
 * Only the standup owner can update their own standup.
 * @param {Object} req - Express request object
 * @param {Object} req.session.user - Authenticated user from session
 * @param {string} req.session.user.id - User UUID
 * @param {Object} req.params - Route parameters
 * @param {string} req.params.standupId - Standup UUID to update
 * @param {Object} req.body - Request body with fields to update
 * @param {string} [req.body.whatDone] - What was accomplished
 * @param {Array} [req.body.githubActivities] - Linked GitHub activities
 * @param {string} [req.body.whatNext] - What's planned next
 * @param {string} [req.body.blockers] - Current blockers
 * @param {string} [req.body.reflection] - Personal reflection
 * @param {string} [req.body.visibility] - Visibility level
 * @param {Object} res - Express response object
 * @returns {Promise<Object>} JSON response with updated standup or error
 */
async function updateStandup(req, res) {
  const userId = req.session.user.id;
  const { standupId } = req.params;
  const { whatDone, githubActivities, whatNext, blockers, reflection, visibility, sentimentScore } = req.body;

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
    visibility,
    sentimentScore
  });

  return res.status(200).json({
    success: true,
    data: standupDto.toStandupDto(updatedStandup)
  });
}

/**
 * Delete a standup
 * Only the standup owner can delete their own standup.
 * @param {Object} req - Express request object
 * @param {Object} req.session.user - Authenticated user from session
 * @param {string} req.session.user.id - User UUID
 * @param {Object} req.params - Route parameters
 * @param {string} req.params.standupId - Standup UUID to delete
 * @param {Object} res - Express response object
 * @returns {Promise<Object>} JSON response with success message or error
 */
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

/**
 * Get all standups for a team
 * Requires team membership or course staff access.
 * @param {Object} req - Express request object
 * @param {Object} req.session.user - Authenticated user from session
 * @param {string} req.session.user.id - User UUID
 * @param {Object} req.params - Route parameters
 * @param {string} req.params.teamId - Team UUID
 * @param {Object} req.query - Query parameters
 * @param {string} [req.query.startDate] - Filter from date (ISO string)
 * @param {string} [req.query.endDate] - Filter to date (ISO string)
 * @param {Object} res - Express response object
 * @returns {Promise<Object>} JSON response with list of team standups or error
 */
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

/**
 * Get TA/instructor overview of all standups for a course
 * Requires course staff role (professor or TA).
 * @param {Object} req - Express request object
 * @param {Object} req.session.user - Authenticated user from session
 * @param {string} req.session.user.id - User UUID
 * @param {Object} req.query - Query parameters
 * @param {string} req.query.courseId - Course UUID (required)
 * @param {string} [req.query.startDate] - Filter from date (ISO string)
 * @param {string} [req.query.endDate] - Filter to date (ISO string)
 * @param {Object} res - Express response object
 * @returns {Promise<Object>} JSON response with list of course standups or error
 */
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

/**
 * Get standups for a specific user (for staff or teammates)
 * Requires course staff role or shared team membership with the target user.
 * @param {Object} req - Express request object
 * @param {Object} req.session.user - Authenticated user from session
 * @param {string} req.session.user.id - Requester's user UUID
 * @param {Object} req.params - Route parameters
 * @param {string} req.params.userUuid - Target user's UUID
 * @param {Object} req.query - Query parameters
 * @param {string} req.query.courseId - Course UUID (required)
 * @param {string} [req.query.startDate] - Filter from date (ISO string)
 * @param {string} [req.query.endDate] - Filter to date (ISO string)
 * @param {Object} res - Express response object
 * @returns {Promise<Object>} JSON response with list of user's standups or error
 */
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
