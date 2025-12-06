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

  // Use transaction to atomically: create user, enroll in course, and delete request
  // This ensures data consistency - either all operations succeed or none do
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

export {
  addUserWithStaffStatus,
  getAllFormRequests,
  approveFormRequest,
  denyFormRequest
};
