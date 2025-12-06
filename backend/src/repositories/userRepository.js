/**
 * User Repository
 *
 * Handles data persistence for users in a JSON file.
 * Provides CRUD operations for user management.
 * @module user/repository
 */

import { getPrisma } from "../utils/db.js";

const prisma = getPrisma();

/**
 * Add a new user to the database
 * @param {Object} user - User object with firstName, lastName, and email
 * @returns {Promise<Object>} The added user
 * @status IN USE
 */
async function addUser(user) {
  // Check if user with email already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: user.email }
  });

  if (existingUser) {
    throw new Error("User with this email already exists");
  }

  const newUser = await prisma.user.create({
    data: {
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName
    }
  });

  return newUser;
}

/**
 * Add a new user with staff status to the database
 * @param {Object} user - User object with firstName, lastName, email
 * @param {Object} staffStatus - Staff status with isProf and isSystemAdmin flags
 * @returns {Promise<Object>} The added user with staff record
 * @status IN USE
 */
async function addUserWithStaffStatus(user, staffStatus) {
  // Check if user with email already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: user.email }
  });

  if (existingUser) {
    throw new Error("User with this email already exists");
  }

  // Create user and staff record in a transaction
  const result = await prisma.$transaction(async (tx) => {
    const newUser = await tx.user.create({
      data: {
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName
      }
    });

    // Only create staff record if user is a professor or system admin
    if (staffStatus.isProf || staffStatus.isSystemAdmin) {
      await tx.staff.create({
        data: {
          userUuid: newUser.userUuid,
          isProf: staffStatus.isProf || false,
          isSystemAdmin: staffStatus.isSystemAdmin || false,
          isLeadAdmin: false
        }
      });
    }

    return newUser;
  });

  return result;
}

/**
 * Get a user by email address
 * @param {string} email - Email address to search for
 * @returns {Promise<Object|null>} User object or null if not found
 * @status IN USE
 */
async function getUserByEmail(email) {
  const user = await prisma.user.findUnique({
    where: { email: email }
  });
  return user;
}

/**
 * Get all users from the database
 * @returns {Promise<Array>} Array of all users
 * @status DEV ONLY - For development login selection
 */
async function getAllUsers() {
  const users = await prisma.user.findMany({
    select: {
      userUuid: true,
      email: true,
      firstName: true,
      lastName: true
    },
    orderBy: {
      email: "asc"
    }
  });
  return users;
}

/**
 * Get a user by UUID
 * @param {string} userUuid - User UUID to search for
 * @returns {Promise<Object|null>} User object or null if not found
 * @status DEV ONLY - For development login selection
 */
async function getUserByUuid(userUuid) {
  const user = await prisma.user.findUnique({
    where: { userUuid: userUuid }
  });
  return user;
}

/**
 * Delete a user by UUID
 * If the user is a professor in any course, delete those courses as well
 * @param {string} userUuid - User UUID to delete
 * @returns {Promise<Object>} Result with deleted user and affected courses
 * @status IN USE
 */
async function deleteUserByUuid(userUuid) {
  // Find all course enrollments where user is a professor
  const professorEnrollments = await prisma.courseEnrollment.findMany({
    where: {
      userUuid: userUuid,
      role: {
        role: "Professor"
      }
    },
    include: {
      course: true
    }
  });

  const coursesToDelete = professorEnrollments.map(e => e.courseUuid);

  // Use transaction to delete courses and user atomically
  const result = await prisma.$transaction(async (tx) => {
    // Delete courses where user is a professor
    if (coursesToDelete.length > 0) {
      await tx.course.deleteMany({
        where: {
          courseUuid: {
            in: coursesToDelete
          }
        }
      });
    }

    // Delete the user (this will cascade delete enrollments, standups, etc.)
    const deletedUser = await tx.user.delete({
      where: { userUuid: userUuid }
    });

    return {
      deletedUser,
      deletedCoursesCount: coursesToDelete.length,
      deletedCourseUuids: coursesToDelete
    };
  });

  return result;
}

/**
 * Get user staff status by UUID
 * @param {string} userUuid - User UUID to search for
 * @returns {Promise<Object>} Object containing isProf, isSystemAdmin, and isLeadAdmin flags
 * @status IN USE
 */
async function getUserStatusByUuid(userUuid) {
  const staff = await prisma.staff.findUnique({
    where: { userUuid: userUuid }
  });

  if (!staff) {
    return {
      isProf: false,
      isSystemAdmin: false,
      isLeadAdmin: false
    };
  }

  return {
    isProf: staff.isProf || false,
    isSystemAdmin: staff.isSystemAdmin || false,
    isLeadAdmin: staff.isLeadAdmin || false
  };
}

/**
 * Get all users with their staff status
 * @returns {Promise<Array>} Array of all users with staff information
 * @status IN USE
 */
async function getAllUsersWithStaffStatus() {
  const users = await prisma.user.findMany({
    select: {
      userUuid: true,
      email: true,
      firstName: true,
      lastName: true,
      staff: {
        select: {
          isProf: true,
          isSystemAdmin: true,
          isLeadAdmin: true
        }
      }
    },
    orderBy: {
      lastName: "asc"
    }
  });

  // Transform the data to flatten staff status
  return users.map(user => ({
    userUuid: user.userUuid,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    isProf: user.staff?.isProf || false,
    isSystemAdmin: user.staff?.isSystemAdmin || false,
    isLeadAdmin: user.staff?.isLeadAdmin || false
  }));
}

/**
 * Update staff status for a user
 * @param {string} userUuid - User UUID to update
 * @param {Object} statusUpdates - Object with isProf, isSystemAdmin, or isLeadAdmin flags to update
 * @returns {Promise<Object>} Updated staff record
 * @status IN USE
 */
async function updateStaffStatus(userUuid, statusUpdates) {
  // Check if staff record exists
  const existingStaff = await prisma.staff.findUnique({
    where: { userUuid: userUuid }
  });

  if (!existingStaff) {
    // Create new staff record if it doesn't exist
    return await prisma.staff.create({
      data: {
        userUuid: userUuid,
        isProf: statusUpdates.isProf !== undefined ? statusUpdates.isProf : false,
        isSystemAdmin: statusUpdates.isSystemAdmin !== undefined ? statusUpdates.isSystemAdmin : false,
        isLeadAdmin: statusUpdates.isLeadAdmin !== undefined ? statusUpdates.isLeadAdmin : false
      }
    });
  }

  // Update existing staff record
  return await prisma.staff.update({
    where: { userUuid: userUuid },
    data: statusUpdates
  });
}

/**
 * Transfer lead admin status from one admin to another
 * @param {string} currentLeadAdminUuid - UUID of current lead admin
 * @param {string} newLeadAdminUuid - UUID of new lead admin
 * @returns {Promise<Object>} Result with both updated records
 * @status IN USE
 */
async function transferLeadAdmin(currentLeadAdminUuid, newLeadAdminUuid) {
  return await prisma.$transaction(async (tx) => {
    // Remove lead admin status from current lead
    const oldLead = await tx.staff.update({
      where: { userUuid: currentLeadAdminUuid },
      data: { isLeadAdmin: false }
    });

    // Add lead admin status to new lead
    const newLead = await tx.staff.update({
      where: { userUuid: newLeadAdminUuid },
      data: { isLeadAdmin: true }
    });

    return {
      oldLead,
      newLead
    };
  });
}

export {
  addUser,
  addUserWithStaffStatus,
  getUserByEmail,
  getAllUsers,
  getUserByUuid,
  deleteUserByUuid,
  getUserStatusByUuid,
  getAllUsersWithStaffStatus,
  updateStaffStatus,
  transferLeadAdmin
};
