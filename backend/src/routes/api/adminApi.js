/**
 * API endpoints for admin operations
 * All routes in this file are protected by checkSystemAdmin middleware
 * @module admin/api
 */
import express from "express";
import * as userService from "../../services/userService.js";

const router = express.Router();

/**
 * Add a new user with staff status (admin only)
 *
 * @name POST /v1/api/admin/users
 * @param {string} req.body.firstName - User's first name
 * @param {string} req.body.lastName - User's last name
 * @param {string} req.body.email - User's email address
 * @param {boolean} req.body.isProf - Whether user is a professor
 * @param {boolean} req.body.isSystemAdmin - Whether user is a system admin
 * @returns {Object} 200 - Success with created user
 * @returns {Object} 400 - Validation error or user already exists
 * @returns {Object} 403 - Forbidden (not a system admin)
 * @returns {Object} 500 - Server error
 * @status IN USE - Admin can add users with staff status
 */
router.post("/users", async (req, res) => {
  try {
    const { firstName, lastName, email, isProf, isSystemAdmin } = req.body;

    const newUser = await userService.addUserWithStaffStatus({
      firstName,
      lastName,
      email,
      isProf,
      isSystemAdmin
    });

    res.status(200).json({
      success: true,
      message: "User created successfully",
      user: {
        userUuid: newUser.userUuid,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName
      }
    });
  } catch (error) {
    // Check if it's a validation error or duplicate user error
    if (error.message.includes("already exists") ||
        error.message.includes("required") ||
        error.message.includes("Invalid")) {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }

    // Other errors are server errors
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
