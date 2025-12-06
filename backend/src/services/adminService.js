/**
 * @module admin/service
 * Admin Service
 *
 * Business logic layer for Admin management.
 */

import * as userRepository from "../repositories/userRepository.js";
import * as userValidator from "../validators/userValidator.js";

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
export {
  addUserWithStaffStatus
};