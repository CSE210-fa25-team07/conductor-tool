/**
 * @module standup/api
 */

import express from "express";
import * as standupService from "../../services/standupService.js";

const router = express.Router();

/**
 * Middleware to check if user is authenticated
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

router.get("/team/:teamId", checkAuth, async (req, res) => {
  try {
    return await standupService.getTeamStandups(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.get("/ta/overview", checkAuth, async (req, res) => {
  try {
    return await standupService.getTAOverview(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
