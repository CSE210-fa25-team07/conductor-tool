/**
 * @module admin/service
 * Admin Service
 *
 * Business logic layer for Admin management.
 */

import * as userRepository from "../repositories/userRepository.js";
import * as userValidator from "../validators/userValidator.js";
import * as formRequestRepository from "../repositories/formRequestRepository.js";
import * as verificationCodeRepository from "../repositories/verificationCodeRepository.js";

/**
 * Add a new user with staff status (admin function)
 * @param {Object} userData - User data with firstName, lastName, email, isProf, isSystemAdmin
 * @returns {Promise<Object>} The created user object
 * @status IN USE
 */
async function addUserWithStaffStatus(userData) {
  // Validate input
  userValidator.validateUserData(userData);

  // Normalize data
  const normalizedUser = {
    firstName: userData.firstName.trim(),
    lastName: userData.lastName.trim(),
    email: userData.email.trim().toLowerCase()
  };

  const staffStatus = {
    isProf: userData.isProf || false,
    isSystemAdmin: userData.isSystemAdmin || false
  };

  if (!staffStatus.isProf && !staffStatus.isSystemAdmin) {
    return await userRepository.addUser(normalizedUser);
  }

  return await userRepository.addUserWithStaffStatus(normalizedUser, staffStatus);
}

/**
 * Get all pending form requests
 * @returns {Promise<Array>} List of all form requests
 * @status IN USE
 */
async function getAllFormRequests() {
  return await formRequestRepository.getAllFormRequests();
}

/**
 * Approve a form request and create user account
 * @param {string} requestUuid - UUID of the request to approve
 * @returns {Promise<Object>} Result of approval
 * @status IN USE
 */
async function approveFormRequest(requestUuid) {
  const request = await formRequestRepository.getFormRequestByUuid(requestUuid);

  if (!request) {
    throw new Error("Request not found");
  }

  // Check if user already exists
  const existingUser = await userRepository.getUserByEmail(request.email);
  if (existingUser) {
    throw new Error("User with this email already exists");
  }

  // Verify the verification code is valid and get course info
  const courseInfo = await verificationCodeRepository.findCourseByVerificationCode(request.verificationCode);
  if (!courseInfo) {
    throw new Error("Invalid verification code");
  }

  // Use transaction to create user, enroll in course, and delete request
  const newUser = await formRequestRepository.approveFormRequestTransaction(
    requestUuid,
    {
      firstName: request.firstName,
      lastName: request.lastName,
      email: request.email
    },
    courseInfo.courseUuid,
    courseInfo.roleUuid
  );

  return {
    user: newUser,
    course: courseInfo
  };
}

/**
 * Deny a form request
 * @param {string} requestUuid - UUID of the request to deny
 * @returns {Promise<Object>} Deleted request
 * @status IN USE
 */
async function denyFormRequest(requestUuid) {
  const deleted = await formRequestRepository.deleteFormRequest(requestUuid);

  if (!deleted) {
    throw new Error("Request not found");
  }

  return deleted;
}

/**
 * Get all users with their staff status
 * @returns {Promise<Array>} List of all users with staff information
 * @status IN USE
 */
async function getAllUsersWithStaffStatus() {
  const users = await userRepository.getAllUsersWithStaffStatus();
  return users;
}

/**
 * Remove a user from the system (students and professors only, not admins)
 * @param {string} userUuid - UUID of the user to remove
 * @param {string} requestingUserUuid - UUID of the admin making the request
 * @returns {Promise<Object>} Result of deletion
 * @status IN USE
 */
async function removeUser(userUuid, requestingUserUuid) {
  // Get requesting user's staff status
  const requestingUserStatus = await userRepository.getUserStatusByUuid(requestingUserUuid);

  // Check if requesting user is admin
  if (!requestingUserStatus.isSystemAdmin) {
    throw new Error("Only admins can remove users");
  }
  // Get the user's staff status
  const userStatus = await userRepository.getUserStatusByUuid(userUuid);

  // Check if user is an admin (cannot be removed)
  if (userStatus.isSystemAdmin) {
    throw new Error("Cannot remove admin users. Demote to professor first.");
  }

  // Delete the user
  const result = await userRepository.deleteUserByUuid(userUuid);
  return result;
}

/**
 * Promote a professor to admin
 * @param {string} userUuid - UUID of the professor to promote
 * @param {string} requestingUserUuid - UUID of the admin making the request
 * @returns {Promise<Object>} Updated staff record
 * @status IN USE
 */
async function promoteProfessorToAdmin(userUuid, requestingUserUuid) {
  const requestingUserStatus = await userRepository.getUserStatusByUuid(requestingUserUuid);

  // Check if requesting user is admin
  if (!requestingUserStatus.isSystemAdmin) {
    throw new Error("Only admins can promote professors to admins");
  }

  // Get the user's staff status
  const userStatus = await userRepository.getUserStatusByUuid(userUuid);

  // Check if user is a professor
  if (!userStatus.isProf) {
    throw new Error("User must be a professor to be promoted to admin");
  }

  // Check if user is already an admin
  if (userStatus.isSystemAdmin) {
    throw new Error("User is already an admin");
  }

  // Promote the professor to admin
  const result = await userRepository.updateStaffStatus(userUuid, {
    isSystemAdmin: true
  });

  return result;
}

/**
 * Demote an admin to professor (only lead admin can do this)
 * @param {string} userUuid - UUID of the admin to demote
 * @param {string} requestingUserUuid - UUID of the lead admin making the request
 * @returns {Promise<Object>} Updated staff record
 * @status IN USE
 */
async function demoteAdminToProfessor(userUuid, requestingUserUuid) {
  // Get requesting user's status to verify they are lead admin
  const requestingUserStatus = await userRepository.getUserStatusByUuid(requestingUserUuid);

  if (!requestingUserStatus.isLeadAdmin) {
    throw new Error("Only the lead admin can demote admins to professors");
  }

  // Get the target user's staff status
  const userStatus = await userRepository.getUserStatusByUuid(userUuid);

  // Check if user is an admin
  if (!userStatus.isSystemAdmin) {
    throw new Error("User is not an admin");
  }

  // Check if user is lead admin (cannot demote lead admin this way)
  if (userStatus.isLeadAdmin) {
    throw new Error("Cannot demote lead admin. Transfer lead admin status first.");
  }

  // Demote the admin to professor
  const result = await userRepository.updateStaffStatus(userUuid, {
    isSystemAdmin: false
  });

  return result;
}

/**
 * Transfer lead admin status to another admin
 * @param {string} newLeadAdminUuid - UUID of the admin to become lead admin
 * @param {string} currentLeadAdminUuid - UUID of the current lead admin
 * @returns {Promise<Object>} Result with both updated records
 * @status IN USE
 */
async function transferLeadAdmin(newLeadAdminUuid, currentLeadAdminUuid) {
  // Get current lead admin status
  const currentLeadStatus = await userRepository.getUserStatusByUuid(currentLeadAdminUuid);

  if (!currentLeadStatus.isLeadAdmin) {
    throw new Error("Only the lead admin can transfer lead admin status");
  }

  // Get new lead admin status
  const newLeadStatus = await userRepository.getUserStatusByUuid(newLeadAdminUuid);

  // Check if new lead is an admin
  if (!newLeadStatus.isSystemAdmin) {
    throw new Error("Target user must be an admin to become lead admin");
  }

  // Check if new lead is already lead admin
  if (newLeadStatus.isLeadAdmin) {
    throw new Error("User is already the lead admin");
  }

  // Transfer lead admin status
  const result = await userRepository.transferLeadAdmin(currentLeadAdminUuid, newLeadAdminUuid);

  return result;
}

export {
  addUserWithStaffStatus,
  getAllFormRequests,
  approveFormRequest,
  denyFormRequest,
  getAllUsersWithStaffStatus,
  removeUser,
  promoteProfessorToAdmin,
  demoteAdminToProfessor,
  transferLeadAdmin
};
