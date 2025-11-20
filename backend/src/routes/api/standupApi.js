/**
 * @module standup/api
 */

import express from "express";
import * as standupService from "../../services/standupService.js";

const router = express.Router();

/**
 * Get user context
 * @name GET /v1/api/standups/context
 * @returns {Object} 200 - User context
 * @returns {Object} 401 - Not authenticated
 */
router.get("/context", async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({
        success: false,
        error: "Not authenticated"
      });
    }
    return await standupService.getUserContext(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
