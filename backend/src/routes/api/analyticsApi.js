/**
 * @module analytics/api
 */

import express from "express";
import { toStudentAnalyticsDto, toInstructorAnalyticsDto } from "../../dto/attendanceDto.js";
import * as attendanceService from "../../services/attendanceService.js";
import * as attendanceValidator from "../../validators/attendanceValidator.js";

const router = express.Router();

/**
 * Get student attendance analytics
 * @name GET /v1/api/analytics/student
 * @param {string} req.query.courseUuid - Course UUID (required)
 * @param {string} req.session.user.id - User UUID from session (required)
 * @param {string} [req.query.startDate] - Start date filter (optional, format: YYYY-MM-DD)
 * @param {string} [req.query.endDate] - End date filter (optional, format: YYYY-MM-DD)
 * @returns {Object} 200 - Student attendance analytics data
 * @returns {Object} 400 - Bad request (missing/invalid parameters)
 * @returns {Object} 403 - Not authorized
 * @returns {Object} 500 - Server error 
 */
router.get("/student", async (req, res) => {
  try {
    attendanceValidator.validateStudentAnalyticsRequest(req.query);

    const analytics = await attendanceService.getStudentAnalytics({
      userUuid: req.session.user?.id,
      courseUuid: req.query.courseUuid,
      startDate: req.query.startDate,
      endDate: req.query.endDate
    });

    const dto = toStudentAnalyticsDto(analytics);

    res.status(200).json({
      success: true,
      data: dto
    });
  } catch (error) {
    const statusCode = error.message.includes("required") || 
                      error.message.includes("must be") || 
                      error.message.includes("Invalid") ? 400 : 500;
    res.status(statusCode).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get instructor attendance analytics
 * @name GET /v1/api/analytics/instructor
 * @param {string} req.query.courseUuid - Course UUID (required)
 * @param {string} [req.query.startDate] - Start date filter (optional, format: YYYY-MM-DD)
 * @param {string} [req.query.endDate] - End date filter (optional, format: YYYY-MM-DD)
 * @param {string} [req.query.meetingType] - Meeting type filter (optional, integer)
 * @param {string} [req.query.teamUuid] - Team UUID filter (optional)
 * @returns {Object} 200 - Instructor attendance analytics data
 * @returns {Object} 400 - Bad request (missing/invalid parameters)
 * @returns {Object} 403 - Not authorized
 * @returns {Object} 500 - Server error 
 */
router.get("/instructor", async (req, res) => {
  try {
    // attendanceValidator.validateInstructorAnalyticsRequest(req.query);

    const analytics = await attendanceService.getInstructorAnalytics({
      courseUuid: req.query.courseUuid,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      meetingType: req.query.meetingType,
      teamUuid: req.query.teamUuid
    });

    const dto = toInstructorAnalyticsDto(analytics);

    res.status(200).json({
      success: true,
      data: dto
    });
  } catch (error) {
    const statusCode = error.message.includes("required") || 
                      error.message.includes("must be") || 
                      error.message.includes("Invalid") ? 400 : 500;
    res.status(statusCode).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get group/team attendance analytics
 * @name GET /v1/api/analytics/group
 * @param {string} req.query.groupId - Group/Team ID (required)
 * @returns {Object} 200 - Group analytics DTO
 */
router.get("/group", async (req, res) => {
  try {
    // You need to implement group analytics in your service and DTO
    const analytics = await attendanceService.getGroupAnalytics({
      groupId: req.query.groupId
    });
    // Assume you have a toGroupAnalyticsDto
    const dto = toGroupAnalyticsDto(analytics);
    res.status(200).json({
      success: true,
      data: dto
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
