/**
 * @module dev/api
 * DEV ONLY - API endpoints for development utilities
 * NOT FOR PRODUCTION USE
 */

import express from "express";
import * as userRepository from "../../repositories/userRepository.js";

const router = express.Router();

/**
 * Get all users for dev login selection
 * @name GET /v1/api/dev/users
 * @returns {Object} 200 - List of all users
 */
router.get("/users", async (req, res) => {
  try {
    const users = await userRepository.getAllUsers();
    res.json({
      success: true,
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
 * Set session to a specific user (dev login)
 * @name POST /v1/api/dev/login
 * @param {string} req.body.userId - User ID to log in as
 * @returns {Object} 200 - Success
 */
router.post("/login", async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: "userId is required"
      });
    }

    // Get user from database
    const user = await userRepository.getUserByEmail(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found"
      });
    }

    // Set session
    req.session.user = {
      id: user.id,
      email: user.email,
      name: `${user.firstName} ${user.lastName}`
    };

    res.json({
      success: true,
      message: "Session set successfully"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
