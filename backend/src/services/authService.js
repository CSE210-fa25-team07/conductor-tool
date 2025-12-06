/**
 * @module authentication/service
 * Authentication Service
 *
 * Business logic layer for authentication.
 */
import * as userService from "../services/userService.js";
import * as userRepository from "../repositories/userRepository.js";
import * as verificationCodeRepository from "../repositories/verificationCodeRepository.js";
import * as courseRepository from "../repositories/courseRepository.js";
import * as formRequestRepository from "../repositories/formRequestRepository.js";

/**
 * Get current user session data
 * @param {*} req Request object
 * @param {*} res Response object
 * @returns Response status and JSON data
 */
async function getSession(req, res) {
  if (!req.session.user) {
    return res.status(401).json({
      success: false,
      error: "Not authenticated"
    });
  }

  // Return user from session
  res.status(200).json({
    success: true,
    user: req.session.user
  });
}

/**
 * Verify that the code is valid and corresponds to a course
 * @param {*} req Request object containing verification code
 * @param {*} res Response object
 * @returns Response status
 */
async function verifyCode(req, res) {
  const { code } = req.body;

  // Check if provided code maps to a course
  const courseEnrollmentInfo = await verificationCodeRepository.findCourseByVerificationCode(code);
  if (!courseEnrollmentInfo) {
    return res.status(400).json({
      success: false,
      error: "Verification code is invalid"
    });
  }

  // Check if course is active
  const courseInfo = await courseRepository.getCourseByUuid(courseEnrollmentInfo.courseUuid);
  if (!courseInfo.term.isActive) {
    return res.status(400).json({
      success: false,
      error: "Course is not active"
    });
  }

  return res.status(200).json({
    success: true,
    courseInfo: courseEnrollmentInfo
  });
}

/**
 * Check the provided verification code and create user if valid
 * @param {*} req Request object that contains verification code
 * @param {*} res Response object
 * @returns Response status
 */
async function enrollUserByCode(req, res) {
  const { code } = req.body;
  const profile = req.session.user;

  // Check if provided code maps to a course
  const courseEnrollmentInfo = await verificationCodeRepository.findCourseByVerificationCode(code);
  if (!courseEnrollmentInfo) {
    return res.status(400).json({
      success: false,
      error: "Verification code is invalid"
    });
  }

  // Check if course is active
  const courseInfo = await courseRepository.getCourseByUuid(courseEnrollmentInfo.courseUuid);
  if (!courseInfo.term.isActive) {
    return res.status(400).json({
      success: false,
      error: "Course is not active"
    });
  }

  // Create user in database if not exists
  if (!req.session.user.id) {
    const nameParts = profile.name ? profile.name.split(" ") : ["", ""];
    const firstName = profile.given_name || nameParts[0] || "Unknown";
    const lastName = profile.family_name || nameParts.slice(1).join(" ") || "Unknown";

    const newUser = await userService.addUser({
      firstName,
      lastName,
      email: profile.email
    });
    req.session.user = {id: newUser.userUuid, email: newUser.email, name: profile.name};
  }

  // Enroll user to course
  const course = await courseRepository.enrollUserToCourse(
    req.session.user.id,
    courseEnrollmentInfo.courseUuid,
    courseEnrollmentInfo.roleUuid
  );

  if (!course) {
    return res.status(400).json({
      success: false,
      error: "User is already enrolled in this course"
    });
  }

  return res.status(200).json({
    success: true,
    message: "User verified and enrolled successfully"
  });
}

/**
 * Create an access request entry in the database with the provided info
 * @param {*} req Request object
 * @param {*} res Response object
 * @returns Response status
 */
async function requestAccess(req, res) {
  const { firstName, lastName, email, institution, verificationCode } = req.body;

  const user = await userRepository.getUserByEmail(email);
  if (user) {
    return res.status(400).json({
      success: false,
      error: "User with this email already exists"
    });
  }

  const response = await formRequestRepository.createFormRequest(firstName, lastName, email, institution, verificationCode);

  if (!response) {
    return res.status(500).json({
      success: false,
      error: "Request with this email already exists"
    });
  }

  res.status(200).json({
    success: true,
    message: "Access request submitted successfully"
  });
}

/**
 * Get all users for dev login selection
 * @param {*} req Request object
 * @param {*} res Response object
 * @returns Response with list of users
 * @status DEV ONLY - For development login selection
 */
async function getDevUsers(req, res) {
  try {
    const users = await userRepository.getAllUsers();
    res.status(200).json(users);
  } catch {
    res.status(500).json({
      success: false,
      error: "Failed to fetch users"
    });
  }
}

/**
 * Handle dev login for selected user
 * @param {*} req Request object with userId in body
 * @param {*} res Response object
 * @returns Response with redirect URL
 * @status DEV ONLY - For development login
 */
async function devLogin(req, res) {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: "User ID is required"
      });
    }

    // Get user from database
    const user = await userRepository.getUserByUuid(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found"
      });
    }

    // Set session
    req.session.user = {
      id: user.userUuid,
      email: user.email,
      name: `${user.firstName} ${user.lastName}`
    };

    res.status(200).json({
      success: true,
      redirectUrl: "/dashboard"
    });
  } catch {
    res.status(500).json({
      success: false,
      error: "Login failed"
    });
  }
}

export { getSession, verifyCode, getDevUsers, devLogin, enrollUserByCode, requestAccess };