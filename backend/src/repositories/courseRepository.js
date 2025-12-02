/**
 * Course Repository
 * Handles data operations for course enrollments.
 * @module course/repository
 */

import { getPrisma } from "../utils/db.js";
import * as verificationCodeRepository from "./verificationCodeRepository.js";

const prisma = getPrisma();

/**
 * Get all courses currently enrolled by a user
 * @param {string} userUuid - The UUID of the user
 * @returns {Promise<Array>} Array of course objects
 * @throws {Error} If database query fails
 */
async function getCoursesByUserId(userUuid) {
  const enrollments = await prisma.courseEnrollment.findMany({
    where: {
      userUuid: userUuid,
      course: {
        term: {
          isActive: true
        }
      }
    },
    distinct: ["courseUuid"]
  });

  return enrollments.map(enrollment => enrollment.courseUuid);
}

/**
 * Get all courses with full details for a user
 * @param {string} userUuid - The UUID of the user
 * @returns {Promise<Array>} Array of course objects with full details
 * @throws {Error} If database query fails
 */
async function getCoursesWithDetailsByUserId(userUuid) {
  const enrollments = await prisma.courseEnrollment.findMany({
    where: {
      userUuid: userUuid,
      course: {
        term: {
          isActive: true
        }
      }
    },
    include: {
      course: {
        include: {
          term: true,
          enrollments: {
            select: {
              userUuid: true
            }
          }
        }
      }
    },
    distinct: ["courseUuid"]
  });

  return enrollments.map(enrollment => ({
    courseUuid: enrollment.course.courseUuid,
    code: enrollment.course.courseCode,
    name: enrollment.course.courseName,
    description: enrollment.course.description,
    term: enrollment.course.term.termName,
    people: enrollment.course.enrollments.length
  }));
}

/**
 * Enroll a user to a course with a specific role if not already enrolled
 * @param {string} userUuid
 * @param {string} courseUuid
 * @param {string} roleUuid
 * @returns {Promise<Object|null>} The created enrollment or null if already enrolled
 */
async function enrollUserToCourse(userUuid, courseUuid, roleUuid) {
  const exists = await prisma.courseEnrollment.findFirst({
    where: {
      userUuid: userUuid,
      courseUuid: courseUuid
    }
  });

  if (exists) {
    return null;
  }

  return await prisma.courseEnrollment.create({
    data: {
      userUuid: userUuid,
      roleUuid: roleUuid,
      courseUuid: courseUuid,
      enrollmentStatus: "active"
    }
  });
}

/**
 * Find and return course by its UUID
 * @param {string} courseUuid -- course UUID to search
 * @returns {Promise<Object>} Course object
 */
async function getCourseByUuid(courseUuid) {
  return await prisma.course.findUnique({
    where: {
      courseUuid: courseUuid
    },
    include: {
      term: true,
      teams: {
        include: {
          members: {
            where: {
              leftAt: null
            },
            include: {
              user: {
                select: {
                  userUuid: true,
                  firstName: true,
                  lastName: true,
                  email: true
                }
              }
            }
          }
        }
      }
    }
  });
}

async function getUsersByCourseUuid(courseUuid) {
  const enrollments = await prisma.courseEnrollment.findMany({
    where: {
      courseUuid: courseUuid
    },
    include: {
      user: {
        select: {
          userUuid: true,
          firstName: true,
          lastName: true,
          email: true
        }
      }
    }
  });

  // Get team memberships for all users in this course
  const userUuids = enrollments.map(e => e.userUuid).filter(uuid => uuid !== null && uuid !== undefined);

  let teamMemberships = [];
  if (userUuids.length > 0) {
    teamMemberships = await prisma.teamMember.findMany({
      where: {
        userUuid: { in: userUuids },
        leftAt: null,
        team: {
          courseUuid: courseUuid
        }
      },
      include: {
        team: {
          select: {
            teamUuid: true,
            teamName: true
          }
        }
      }
    });
  }

  // Create a map of userUuid -> team info
  const userTeamMap = {};
  teamMemberships.forEach(membership => {
    userTeamMap[membership.userUuid] = {
      teamUuid: membership.team.teamUuid,
      teamName: membership.team.teamName
    };
  });

  // Map enrollments to user objects with team info
  // Filter out any enrollments where user is null (shouldn't happen, but safety check)
  return enrollments
    .filter(enrollment => enrollment.user !== null)
    .map(enrollment => ({
      userUuid: enrollment.user.userUuid,
      firstName: enrollment.user.firstName,
      lastName: enrollment.user.lastName,
      email: enrollment.user.email,
      teamUuid: userTeamMap[enrollment.userUuid]?.teamUuid || null,
      teamName: userTeamMap[enrollment.userUuid]?.teamName || null
    }));
}

export {
  getCoursesByUserId,
  getCoursesWithDetailsByUserId,
  enrollUserToCourse,
  getCourseByUuid,
  getUsersByCourseUuid
};
