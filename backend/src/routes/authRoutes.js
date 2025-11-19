/**
 * @module authentication/routes
 */
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import * as userService from "../services/userService.js";

const __filename = fileURLToPath(import.meta.url);
export const __dirname = path.dirname(__filename);

const router = express.Router();

/**
 * Serves verification page for new users
 * @name GET /auth/verification
 * @status IN USE
 */
router.get("/verification", (req, res) => {
  res.sendFile(path.join(__dirname, "../../../frontend/html/auth/verification.html"));
});

/**
 * Serves access restriction page for non-UCSD emails
 * @name GET /auth/request-access
 * @status IN USE
 */
router.get("/request-access", (req, res) => {
  res.sendFile(path.join(__dirname, "../../../frontend/html/auth/request-access.html"));
});

/**
 * Request form page
 * @name GET /auth/request-form
 * @status IN USE
 */
router.get("/request-form", (req, res) => {
  res.sendFile(path.join(__dirname, "../../../frontend/html/auth/request-form.html"));
});

/**
 * Get a user by email
 *
 * @name GET /auth/users
 * @param {string} req.query.email - Email address to search for
 * @returns {Object} 200 - User object
 * @returns {Object} 404 - User not found
 * @returns {Object} 400 - Missing email parameter
 * @status NOT IN USE - Debug/testing endpoint for checking if user exists
 */
router.get("/users", async (req, res) => {
  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: "Email query parameter is required"
      });
    }

    const user = await userService.getUserByEmail(email);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found"
      });
    }

    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get all users
 *
 * @name GET /auth/users/all
 * @returns {Object} 200 - Array of all users
 * @status NOT IN USE - Debug/testing endpoint (security risk - remove in production)
 */
router.get("/users/all", async (req, res) => {
  try {
    const users = await userService.getAllUsers();

    res.status(200).json({
      success: true,
      count: users.length,
      users
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get current session user
 *
 * @name GET /auth/session
 * @returns {Object} 200 - Current user from session
 * @returns {Object} 401 - Not authenticated
 * @status IN USE - Frontend fetches current user session data (refer to line 90 of frontend/js/pages/auth/auth.js)
 */
router.get("/session", async (req, res) => {
  try {
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
 * @name POST /auth/verify
 * @param {string} req.body.code - Verification code
 * @returns {Object} 200 - Success, user created
 * @returns {Object} 400 - Invalid code or error
 * @returns {Object} 401 - Not authenticated
 * @status IN USE - Verifies code and creates user in database
 */
router.post("/verify", express.json(), async (req, res) => {
  try {
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

    // Check if user already exists in database
    const existingUser = await userService.getUserByEmail(profile.email);
    if (existingUser) {
      return res.status(200).json({
        success: true,
        message: "User already exists",
        user: existingUser
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

    res.status(200).json({
      success: true,
      message: "User verified and created successfully",
      user: newUser
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
