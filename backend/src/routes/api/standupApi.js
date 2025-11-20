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
function checkAuth(req, res, next) {
  if (!req.session.user) {
    return res.status(401).json({
      success: false,
      error: "Not authenticated"
    });
  }
  next();
}

router.get("/context", checkAuth, async (req, res) => {
  try {
    return await standupService.getUserContext(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.post("/", checkAuth, async (req, res) => {
  try {
    return await standupService.createStandup(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.get("/me", checkAuth, async (req, res) => {
  try {
    return await standupService.getUserStandups(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.put("/:standupId", checkAuth, async (req, res) => {
  try {
    return await standupService.updateStandup(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.delete("/:standupId", checkAuth, async (req, res) => {
  try {
    return await standupService.deleteStandup(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
