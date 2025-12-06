/**
 * Form Request Repository
 * Handles data operations for access request forms.
 * @module formRequest/repository
 */

import { getPrisma } from "../utils/db.js";

const prisma = getPrisma();

/**
 * Create a new form request entry in the database using the provided information. Fails if a request with the same email already exists.
 * @param {string} firstName
 * @param {string} lastName
 * @param {string} email
 * @param {string} relatedInstitution
 * @param {string} verificationCode
 * @returns {Promise<Object|null>} Created form request or null if failed
 */
async function createFormRequest(firstName, lastName, email, relatedInstitution, verificationCode) {
  try {
    return await prisma.formRequest.create({
      data: {
        firstName,
        lastName,
        email,
        relatedInstitution,
        verificationCode
      }
    });
  } catch {
    return null;
  }
}

/**
 * Get all pending form requests with course and role information
 * @returns {Promise<Array>} List of all form requests with related data
 */
async function getAllFormRequests() {
  const requests = await prisma.formRequest.findMany({
    orderBy: {
      createdAt: "desc"
    }
  });

  // Enrich each request with course and role information
  const enrichedRequests = await Promise.all(
    requests.map(async (request) => {
      // Look up the verification code to get course and role info
      const verificationCode = await prisma.verificationCode.findUnique({
        where: { veriCode: request.verificationCode },
        include: {
          course: {
            include: {
              term: true
            }
          },
          role: true
        }
      });

      return {
        ...request, // Spread all properties from the original request object
        courseInfo: verificationCode ? {
          courseCode: verificationCode.course.courseCode,
          season: verificationCode.course.term.season,
          year: verificationCode.course.term.year,
          role: verificationCode.role.role
        } : null
      };
    })
  );

  return enrichedRequests;
}

/**
 * Get a form request by UUID
 * @param {string} requestUuid
 * @returns {Promise<Object|null>} Form request or null if not found
 */
async function getFormRequestByUuid(requestUuid) {
  return await prisma.formRequest.findUnique({
    where: {
      requestUuid
    }
  });
}

/**
 * Delete a form request by UUID
 * @param {string} requestUuid
 * @returns {Promise<Object|null>} Deleted form request or null if not found
 */
async function deleteFormRequest(requestUuid) {
  try {
    return await prisma.formRequest.delete({
      where: {
        requestUuid
      }
    });
  } catch {
    return null;
  }
}

/**
 * Approve a form request - creates user, enrolls in course, and deletes request atomically
 * @param {string} requestUuid - UUID of the request to approve
 * @param {Object} userData - User data (firstName, lastName, email)
 * @param {string} courseUuid - UUID of the course to enroll in
 * @param {string} roleUuid - UUID of the role for enrollment
 * @returns {Promise<Object>} Result with created user and course info
 */
async function approveFormRequestTransaction(requestUuid, userData, courseUuid, roleUuid) {
  return await prisma.$transaction(async (tx) => {
    // Create the user
    const newUser = await tx.user.create({
      data: {
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email
      }
    });

    // Enroll user in course
    await tx.courseEnrollment.create({
      data: {
        userUuid: newUser.userUuid,
        roleUuid: roleUuid,
        courseUuid: courseUuid,
        enrollmentStatus: "active"
      }
    });

    // Delete the request
    await tx.formRequest.delete({
      where: {
        requestUuid
      }
    });

    return newUser;
  });
}

export {
  createFormRequest,
  getAllFormRequests,
  getFormRequestByUuid,
  deleteFormRequest,
  approveFormRequestTransaction
};
