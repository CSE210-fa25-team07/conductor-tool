/**
 * Authentication handled by checkSession middleware in apiRoutes.js
 * @module standup/api
 */

import express from "express";
import * as standupService from "../../services/standupService.js";

const router = express.Router();

/**
 * Create a new standup
 * @name POST /v1/api/standups
 */
router.post("/", async (req, res) => {
  try {
    return await standupService.createStandup(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get current user's standups
 * @name GET /v1/api/standups/me
 */
router.get("/me", async (req, res) => {
  try {
    return await standupService.getUserStandups(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Update a standup
 * @name PUT /v1/api/standups/:standupId
 */
router.put("/:standupId", async (req, res) => {
  try {
    return await standupService.updateStandup(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Delete a standup
 * @name DELETE /v1/api/standups/:standupId
 */
router.delete("/:standupId", async (req, res) => {
  try {
    return await standupService.deleteStandup(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get standups for a team
 * @name GET /v1/api/standups/team/:teamId
 */
router.get("/team/:teamId", async (req, res) => {
  try {
    return await standupService.getTeamStandups(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get TA overview of standups
 * @name GET /v1/api/standups/ta/overview
 */
router.get("/ta/overview", async (req, res) => {
  try {
    return await standupService.getTAOverview(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get standups for a specific user (TA/Professor only)
 * @name GET /v1/api/standups/user/:userUuid
 */
router.get("/user/:userUuid", async (req, res) => {
  try {
    return await standupService.getStandupsByUser(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
