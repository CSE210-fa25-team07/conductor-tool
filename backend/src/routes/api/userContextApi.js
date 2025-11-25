/**
 * @module userContext/api
 */

import express from "express";
import * as userContextService from "../../services/userContextService.js";
import * as userService from "../../services/userService.js";

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

/**
 * Get user status by UUID
 * @name GET /v1/api/user-context/status
 * @returns {Object} 200 - User status with isProf, isSystemAdmin, isLeadAdmin flags
 * @returns {Object} 401 - Not authenticated
 */
router.get("/status", async (req, res) => {
  try {
    const userId = req.session.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "Not authenticated"
      });
    }

    const userStatus = await userService.getUserStatusByUuid(userId);

    return res.status(200).json({
      success: true,
      data: userStatus
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get user photo URL
 * @name GET /v1/api/user-context/photo
 * @returns {Object} 200 - User photo URL
 * @returns {Object} 401 - Not authenticated
 */
router.get("/photo", async (req, res) => {
  try {
    const userId = req.session.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "Not authenticated"
      });
    }

    const photoUrl = await userService.getUserPhotoUrl(userId);

    return res.status(200).json({
      success: true,
      data: { photoUrl }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
