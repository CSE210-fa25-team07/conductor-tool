/**
 * @module authentication/routes
 */
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import * as authService from "../services/authService.js";

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
 * Get current session user
 *
 * @name GET /auth/session
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
 * @name POST /auth/verify
 * @param {string} req.body.code - Verification code
 * @returns {Object} 200 - Success, user created
 * @returns {Object} 400 - Invalid code or error
 * @returns {Object} 401 - Not authenticated
 * @status IN USE - Verifies code and creates user in database
 */
router.post("/verify", express.json(), async (req, res) => {
  try {
    return await authService.verifyCode(req, res);
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
