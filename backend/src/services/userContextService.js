/**
 * @module userContext/service
 */

import * as userContextRepository from "../repositories/userContextRepository.js";
import * as userContextDto from "../dtos/userContextDto.js";

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
    await userContextRepository.getUserContext(userId, courseId);

  const contextData = userContextDto.toUserContextDto(
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

export {
  getUserContext
};
