/**
 * @module userContext/api
 */

import express from "express";
import * as userContextService from "../../services/userContextService.js";

const router = express.Router();

/**
 * Get user context
 * @name GET /v1/api/user-context
 * @returns {Object} 200 - User context including roles, enrollments, and teams
 * @returns {Object} 401 - Not authenticated
 */
router.get("/", async (req, res) => {
  try {
    return await userContextService.getUserContext(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
