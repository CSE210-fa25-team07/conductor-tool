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
 * Check if verification codes are unique (not already used)
 * @param {Array<string>} codes - Array of verification codes to check
 * @returns {Promise<boolean>} True if all codes are unique
 */
async function areVerificationCodesUnique(codes) {
  const existingCodes = await prisma.verificationCode.findMany({
    where: {
      veriCode: {
        in: codes
      },
      isActive: true
    }
  });

  return existingCodes.length === 0;
}

/**
 * Check if verification codes are unique for update (excluding current course)
 * @param {string} courseUuid - The UUID of the course being updated
 * @param {Array<string>} codes - Array of verification codes to check
 * @returns {Promise<boolean>} True if all codes are unique
 */
async function areVerificationCodesUniqueForUpdate(courseUuid, codes) {
  const existingCodes = await prisma.verificationCode.findMany({
    where: {
      veriCode: {
        in: codes
      },
      isActive: true,
      courseUuid: {
        not: courseUuid
      }
    }
  });

  return existingCodes.length === 0;
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
    },
    include: {
      verificationCodes: {
        include: {
          role: true
        }
      }
    }
  });

  if (!course) {
    return null;
  }

  // Map verification codes to their roles
  const taCode = course.verificationCodes.find(vc => vc.role.role === "TA")?.veriCode || "";
  const tutorCode = course.verificationCodes.find(vc => vc.role.role === "Tutor")?.veriCode || "";
  const studentCode = course.verificationCodes.find(vc => vc.role.role === "Student")?.veriCode || "";

  return {
    courseUuid: course.courseUuid,
    courseCode: course.courseCode,
    courseName: course.courseName,
    termUuid: course.termUuid,
    description: course.description,
    syllabusUrl: course.syllabusUrl,
    canvasUrl: course.canvasUrl,
    taCode,
    tutorCode,
    studentCode
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

  // Get role UUIDs
  const roles = await prisma.role.findMany({
    where: {
      role: {
        in: ["TA", "Tutor", "Student", "Professor"]
      }
    }
  });

  const taRole = roles.find(r => r.role === "TA");
  const tutorRole = roles.find(r => r.role === "Tutor");
  const studentRole = roles.find(r => r.role === "Student");
  const professorRole = roles.find(r => r.role === "Professor");

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

    // Create verification codes
    await tx.verificationCode.createMany({
      data: [
        {
          courseUuid: newCourse.courseUuid,
          roleUuid: taRole.roleUuid,
          veriCode: taCode,
          isActive: true
        },
        {
          courseUuid: newCourse.courseUuid,
          roleUuid: tutorRole.roleUuid,
          veriCode: tutorCode,
          isActive: true
        },
        {
          courseUuid: newCourse.courseUuid,
          roleUuid: studentRole.roleUuid,
          veriCode: studentCode,
          isActive: true
        }
      ]
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

  // Get role UUIDs
  const roles = await prisma.role.findMany({
    where: {
      role: {
        in: ["TA", "Tutor", "Student"]
      }
    }
  });

  const taRole = roles.find(r => r.role === "TA");
  const tutorRole = roles.find(r => r.role === "Tutor");
  const studentRole = roles.find(r => r.role === "Student");

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

    // Update verification codes (upsert to handle new codes)
    await tx.verificationCode.upsert({
      where: {
        courseUuidRoleUuid: {
          courseUuid: courseUuid,
          roleUuid: taRole.roleUuid
        }
      },
      update: {
        veriCode: taCode,
        isActive: true
      },
      create: {
        courseUuid: courseUuid,
        roleUuid: taRole.roleUuid,
        veriCode: taCode,
        isActive: true
      }
    });

    await tx.verificationCode.upsert({
      where: {
        courseUuidRoleUuid: {
          courseUuid: courseUuid,
          roleUuid: tutorRole.roleUuid
        }
      },
      update: {
        veriCode: tutorCode,
        isActive: true
      },
      create: {
        courseUuid: courseUuid,
        roleUuid: tutorRole.roleUuid,
        veriCode: tutorCode,
        isActive: true
      }
    });

    await tx.verificationCode.upsert({
      where: {
        courseUuidRoleUuid: {
          courseUuid: courseUuid,
          roleUuid: studentRole.roleUuid
        }
      },
      update: {
        veriCode: studentCode,
        isActive: true
      },
      create: {
        courseUuid: courseUuid,
        roleUuid: studentRole.roleUuid,
        veriCode: studentCode,
        isActive: true
      }
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
  areVerificationCodesUnique,
  areVerificationCodesUniqueForUpdate,
  getCourseWithVerificationCodes,
  createCourseWithVerificationCodes,
  updateCourseWithVerificationCodes
};
