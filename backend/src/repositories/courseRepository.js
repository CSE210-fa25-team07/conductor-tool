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

/**
 * Get all active terms
 * @returns {Promise<Array>} Array of term objects
 */
async function getAllActiveTerms() {
  const terms = await prisma.classTerm.findMany({
    where: {
      isActive: true
    },
    orderBy: {
      startDate: "asc"
    }
  });

  return terms.map(term => ({
    termUuid: term.termUuid,
    year: term.year,
    season: term.season,
    startDate: term.startDate,
    endDate: term.endDate
  }));
}

/**
 * Check if user is professor for a course
 * @param {string} userUuid - The UUID of the user
 * @param {string} courseUuid - The UUID of the course
 * @returns {Promise<boolean>} True if user is professor
 */
async function isUserCourseProfessor(userUuid, courseUuid) {
  // Get the "Professor" role UUID
  const professorRole = await prisma.role.findUnique({
    where: { role: "Professor" }
  });

  if (!professorRole) {
    return false;
  }

  const enrollment = await prisma.courseEnrollment.findFirst({
    where: {
      userUuid: userUuid,
      courseUuid: courseUuid,
      roleUuid: professorRole.roleUuid
    }
  });

  return enrollment !== null;
}

/**
 * Find course by code, term, and professor
 * @param {string} courseCode - The course code
 * @param {string} termUuid - The term UUID
 * @param {string} professorUuid - The professor's user UUID
 * @returns {Promise<Object|null>} Course object or null
 */
async function findCourseByCodeTermAndProfessor(courseCode, termUuid, professorUuid) {
  // Get the Professor role UUID
  const professorRole = await prisma.role.findUnique({
    where: { role: "Professor" }
  });

  if (!professorRole) {
    return null;
  }

  // Find a course with the given code and term where the professor is enrolled
  return await prisma.course.findFirst({
    where: {
      courseCode: courseCode,
      termUuid: termUuid,
      enrollments: {
        some: {
          userUuid: professorUuid,
          roleUuid: professorRole.roleUuid
        }
      }
    }
  });
}

/**
 * Get course with verification codes
 * @param {string} courseUuid - The UUID of the course
 * @returns {Promise<Object|null>} Course object with verification codes
 */
async function getCourseWithVerificationCodes(courseUuid) {
  const course = await prisma.course.findUnique({
    where: {
      courseUuid: courseUuid
    }
  });

  if (!course) {
    return null;
  }

  // Get verification codes from the verification code repository
  const codes = await verificationCodeRepository.getVerificationCodesByCourseUuid(courseUuid);

  return {
    courseUuid: course.courseUuid,
    courseCode: course.courseCode,
    courseName: course.courseName,
    termUuid: course.termUuid,
    description: course.description,
    syllabusUrl: course.syllabusUrl,
    canvasUrl: course.canvasUrl,
    ...codes
  };
}

/**
 * Create course with verification codes
 * @param {Object} courseData - Course data including verification codes
 * @returns {Promise<Object>} Created course object
 */
async function createCourseWithVerificationCodes(courseData) {
  const {
    courseCode,
    courseName,
    termUuid,
    description,
    syllabusUrl,
    canvasUrl,
    taCode,
    tutorCode,
    studentCode,
    instructorId
  } = courseData;

  // Get Professor role UUID
  const professorRole = await prisma.role.findUnique({
    where: { role: "Professor" }
  });

  // Create course and verification codes in a transaction
  const result = await prisma.$transaction(async (tx) => {
    // Create the course
    const newCourse = await tx.course.create({
      data: {
        courseCode,
        courseName,
        termUuid,
        description,
        syllabusUrl,
        canvasUrl
      }
    });

    // Create verification codes using the verification code repository
    await verificationCodeRepository.createVerificationCodes(tx, newCourse.courseUuid, {
      taCode,
      tutorCode,
      studentCode
    });

    // Enroll the professor as instructor
    await tx.courseEnrollment.create({
      data: {
        userUuid: instructorId,
        roleUuid: professorRole.roleUuid,
        courseUuid: newCourse.courseUuid,
        enrollmentStatus: "active"
      }
    });

    return newCourse;
  });

  return result;
}

/**
 * Update course with verification codes
 * @param {string} courseUuid - The UUID of the course to update
 * @param {Object} courseData - Updated course data
 * @returns {Promise<Object>} Updated course object
 */
async function updateCourseWithVerificationCodes(courseUuid, courseData) {
  const {
    courseCode,
    courseName,
    termUuid,
    description,
    syllabusUrl,
    canvasUrl,
    taCode,
    tutorCode,
    studentCode
  } = courseData;

  // Update course and verification codes in a transaction
  const result = await prisma.$transaction(async (tx) => {
    // Update the course
    const updatedCourse = await tx.course.update({
      where: {
        courseUuid: courseUuid
      },
      data: {
        courseCode,
        courseName,
        termUuid,
        description,
        syllabusUrl,
        canvasUrl
      }
    });

    // Update verification codes using the verification code repository
    await verificationCodeRepository.updateVerificationCodes(tx, courseUuid, {
      taCode,
      tutorCode,
      studentCode
    });

    return updatedCourse;
  });

  return result;
}

export {
  getCoursesByUserId,
  getCoursesWithDetailsByUserId,
  enrollUserToCourse,
  getAllActiveTerms,
  isUserCourseProfessor,
  findCourseByCodeTermAndProfessor,
  getCourseWithVerificationCodes,
  createCourseWithVerificationCodes,
  updateCourseWithVerificationCodes
};
