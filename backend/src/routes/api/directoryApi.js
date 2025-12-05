/**
 * @module directory/api
 * Authentication handled by checkSession middleware in apiRoutes.js
 */

import express from "express";
import * as directoryService from "../../services/directoryService.js";

const router = express.Router();

/**
 * Get course overview
 * @name GET /v1/api/directory/courses/:courseUuid
 */
router.get("/courses/:courseUuid", async (req, res) => {
  try {
    return await directoryService.getCourseOverview(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get course staff
 * @name GET /v1/api/directory/courses/:courseUuid/staff
 */
router.get("/courses/:courseUuid/staff", async (req, res) => {
  try {
    return await directoryService.getCourseStaff(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get enrollment statistics (staff only)
 * @name GET /v1/api/directory/courses/:courseUuid/stats
 */
router.get("/courses/:courseUuid/stats", async (req, res) => {
  try {
    return await directoryService.getEnrollmentStats(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get recent enrollments (staff only)
 * @name GET /v1/api/directory/courses/:courseUuid/enrollments/recent
 */
router.get("/courses/:courseUuid/enrollments/recent", async (req, res) => {
  try {
    return await directoryService.getRecentEnrollments(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get course roster with pagination
 * @name GET /v1/api/directory/courses/:courseUuid/roster
 */
router.get("/courses/:courseUuid/roster", async (req, res) => {
  try {
    return await directoryService.getCourseRoster(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get course teams with pagination
 * @name GET /v1/api/directory/courses/:courseUuid/teams
 */
router.get("/courses/:courseUuid/teams", async (req, res) => {
  try {
    return await directoryService.getCourseTeams(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get user profile
 * @name GET /v1/api/directory/users/:userUuid
 */
router.get("/users/:userUuid", async (req, res) => {
  try {
    return await directoryService.getUserProfile(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get current user's own profile
 * @name GET /v1/api/directory/profile
 */
router.get("/profile", async (req, res) => {
  try {
    return await directoryService.getCurrentUserProfile(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Update current user's profile
 * @name PUT /v1/api/directory/profile
 */
router.put("/profile", async (req, res) => {
  try {
    return await directoryService.updateCurrentUserProfile(req, res);
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get team profile
 * @name GET /v1/api/directory/teams/:teamUuid
 */
router.get("/teams/:teamUuid", async (req, res) => {
  try {
    return await directoryService.getTeamProfile(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Update team links (team leader only)
 * @name PUT /v1/api/directory/teams/:teamUuid/links
 */
router.put("/teams/:teamUuid/links", async (req, res) => {
  try {
    return await directoryService.updateTeamLinks(req, res);
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Update course links (professor only)
 * @name PUT /v1/api/directory/courses/:courseUuid/links
 */
router.put("/courses/:courseUuid/links", async (req, res) => {
  try {
    return await directoryService.updateCourseLinks(req, res);
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
