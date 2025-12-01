/**
 * Course Repository
 *
 * Handles data operations for course enrollments.
 */

import { getPrisma } from "../utils/db.js";

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
    students: enrollment.course.enrollments.length
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
  // TODO(bukhradze): shouldn't there be a DTO here?
  return await prisma.course.findUnique({
    where: {
      courseUuid: courseUuid
    }
  }); 
}
export { getCoursesByUserId, getCoursesWithDetailsByUserId, enrollUserToCourse, getCourseByUuid };
