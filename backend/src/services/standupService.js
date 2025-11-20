/**
 * @module standup/service
 */

import * as standupRepository from "../repositories/standupRepository.js";

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

  const activeCourse = courseId
    ? enrollments.find(e => e.courseUuid === courseId)
    : enrollments[0];

  return res.status(200).json({
    success: true,
    data: {
      user: {
        userUuid: user.userUuid,
        name: req.session.user.name,
        email: user.email,
        isStaff: !!user.staff,
        isSystemAdmin: user.staff?.isSystemAdmin || false
      },
      activeCourse: activeCourse ? {
        courseUuid: activeCourse.course.courseUuid,
        courseCode: activeCourse.course.courseCode,
        courseName: activeCourse.course.courseName,
        role: activeCourse.role.role,
        enrollmentStatus: activeCourse.enrollmentStatus
      } : null,
      enrolledCourses: enrollments.map(e => ({
        courseUuid: e.course.courseUuid,
        courseCode: e.course.courseCode,
        courseName: e.course.courseName,
        role: e.role.role
      })),
      teams: teamMemberships.map(tm => ({
        teamUuid: tm.team.teamUuid,
        teamName: tm.team.teamName,
        courseUuid: tm.team.courseUuid,
        role: "member"
      }))
    }
  });
}

export {
  getUserContext
};
