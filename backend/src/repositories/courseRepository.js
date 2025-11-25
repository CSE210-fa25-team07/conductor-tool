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
 * Enroll a user to a course with a specific role
 * @param {string} userUuid 
 * @param {string} courseUuid 
 * @param {string} roleUuid 
 */
async function enrollUserToCourse(userUuid, courseUuid, roleUuid) {
  const enrollment = await prisma.courseEnrollment.create({
    data: {
      userUuid: userUuid,
      roleUuid: roleUuid,
      courseUuid: courseUuid,
      enrollmentStatus: "active"
    }
  });
}
export { getCoursesByUserId, getCoursesWithDetailsByUserId, enrollUserToCourse };
