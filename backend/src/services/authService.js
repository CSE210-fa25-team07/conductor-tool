/**
 * @module authentication/service
 * Authentication Service
 *
 * Business logic layer for authentication.
 */
import * as userService from "../services/userService.js";
import * as userRepository from "../repositories/userRepository.js";

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
 * Check the provided verification code and create user if valid
 * @param {*} req Request object that contains verification code
 * @param {*} res Response object
 * @returns Response status
 */
async function verifyCode(req, res) {
  const { code } = req.body;
  const profile = req.session.user;

  // TODO: Implement actual verification code validation
  // For now, accept any non-empty code
  if (!code || code.trim().length === 0) {
    return res.status(400).json({
      success: false,
      error: "Verification code is required"
    });
  }

  // Create user in database
  const nameParts = profile.name ? profile.name.split(" ") : ["", ""];
  const firstName = profile.given_name || nameParts[0] || "Unknown";
  const lastName = profile.family_name || nameParts.slice(1).join(" ") || "Unknown";

  const newUser = await userService.addUser({
    firstName,
    lastName,
    email: profile.email
  });

  req.session.user = {id: newUser.userUuid, email: newUser.email, name: profile.name};
  res.status(200).json({
    success: true,
    message: "User verified and created successfully",
    user: newUser
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

export { getSession, verifyCode, getDevUsers, devLogin };
