/**
 * @module github/api
 * GitHub API Routes
 *
 * API endpoints for fetching GitHub activity.
 */
import express from "express";
import * as githubService from "../../services/githubService.js";

const router = express.Router();

/**
 * Get user's GitHub activity (raw data)
 * @name GET /v1/api/github/activity
 */
router.get("/activity", async (req, res) => {
  try {
    const userId = req.session.user.id;
    const hours = parseInt(req.query.hours) || 24;

    const activity = await githubService.fetchUserActivity(userId, hours);

    return res.json({
      success: true,
      data: activity
    });
  } catch (error) {
    if (error.message === "GitHub not connected") {
      return res.status(404).json({
        success: false,
        error: { code: "GITHUB_NOT_CONNECTED", message: "GitHub account not connected" }
      });
    }
    if (error.message === "GitHub token expired") {
      return res.status(401).json({
        success: false,
        error: { code: "GITHUB_TOKEN_EXPIRED", message: "GitHub token expired, please reconnect" }
      });
    }
    return res.status(500).json({
      success: false,
      error: { code: "INTERNAL_ERROR", message: "Failed to fetch GitHub activity" }
    });
  }
});

/**
 * Get formatted GitHub activity for standup auto-populate
 * @name GET /v1/api/github/auto-populate
 */
router.get("/auto-populate", async (req, res) => {
  try {
    const userId = req.session.user.id;
    const hours = parseInt(req.query.hours) || 24;

    const formattedText = await githubService.getFormattedActivity(userId, hours);

    return res.json({
      success: true,
      data: { formattedText }
    });
  } catch (error) {
    if (error.message === "GitHub not connected") {
      return res.status(404).json({
        success: false,
        error: { code: "GITHUB_NOT_CONNECTED", message: "GitHub account not connected" }
      });
    }
    if (error.message === "GitHub token expired") {
      return res.status(401).json({
        success: false,
        error: { code: "GITHUB_TOKEN_EXPIRED", message: "GitHub token expired, please reconnect" }
      });
    }
    return res.status(500).json({
      success: false,
      error: { code: "INTERNAL_ERROR", message: "Failed to fetch GitHub activity" }
    });
  }
});

/**
 * Get GitHub connection status for current user
 * @name GET /v1/api/github/status
 */
router.get("/status", async (req, res) => {
  try {
    const userId = req.session.user.id;
    const { getUserByUuid } = await import("../../repositories/userRepository.js");
    const user = await getUserByUuid(userId);

    return res.json({
      success: true,
      data: {
        connected: !!user?.githubAccessToken,
        username: user?.githubUsername || null
      }
    });
  } catch {
    return res.status(500).json({
      success: false,
      error: { code: "INTERNAL_ERROR", message: "Failed to get GitHub status" }
    });
  }
});

export default router;
