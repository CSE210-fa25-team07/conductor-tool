/**
 * API endpoints for authentication and user session management
 * @module authentication/api
 */
import express from "express";
import * as authService from "../../services/authService.js";

const router = express.Router();

/**
 * Get current session user
 *
 * @name GET /v1/api/auth/session
 * @returns {Object} 200 - Current user from session
 * @returns {Object} 401 - Not authenticated
 * @status IN USE - Frontend fetches current user session data
 */
router.get("/session", async (req, res) => {
  try {
    return await authService.getSession(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Verify the logged in user's verification code; if valid, create an
 * account for the new user in the database, or return existing user.
 *
 * @name POST /v1/api/auth/verify
 * @param {string} req.body.code - Verification code
 * @returns {Object} 200 - Success, user created
 * @returns {Object} 400 - Invalid code or error
 * @returns {Object} 401 - Not authenticated
 * @status IN USE - Verifies code and creates user in database
 */
router.post("/verify", async (req, res) => {
  try {
    return await authService.verifyCode(req, res);
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get all users for dev login selection
 *
 * @name GET /v1/api/auth/dev-users
 * @returns {Object} 200 - Array of all users
 * @returns {Object} 500 - Server error
 * @status DEV ONLY - For development login user selection
 */
router.get("/dev-users", async (req, res) => {
  try {
    return await authService.getDevUsers(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Handle dev login for selected user
 *
 * @name POST /v1/api/auth/dev-login
 * @param {string} req.body.userId - User UUID to login as
 * @returns {Object} 200 - Success with redirect URL
 * @returns {Object} 400 - Missing userId
 * @returns {Object} 404 - User not found
 * @returns {Object} 500 - Server error
 * @status DEV ONLY - For development login
 */
router.post("/dev-login", async (req, res) => {
  try {
    return await authService.devLogin(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
