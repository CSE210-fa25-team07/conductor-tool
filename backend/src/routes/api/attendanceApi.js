/**
 * @module attendance/api
 */
import express from "express";
import * as attendanceService from "../../services/attendanceService.js";
import { toStudentAnalyticsDto, toInstructorAnalyticsDto } from "../../dto/attendanceDto.js";
import {
  // validateInstructorAnalyticsRequest,
  validateStudentAnalyticsRequest
} from "../../validators/attendanceValidator.js";

const router = express.Router();


/**
 * Get Meeting by UUID
 * @name GET /attendance/meeting/:id
 * @param {string} req.params.id - Meeting UUID
 * @returns {Object} 200 - Meeting object
 * @returns {Object} 404 - Meeting not found
 * @returns {Object} 400 - Missing meeting UUID parameter
 * @status IN USE
 */
router.get("/meeting/:id", async (req, res) => {
  try {
    return await attendanceService.getMeetingByUUID(req, res);
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Create Meeting by data
 *
 * @name POST /attendance/meeting/
 * @param {Object} req.body -- Meeting data
 * @returns {Object} 200 - Meeting created
 * @returns {Object} 400 - Validation error
 * @status IN USE
 */
router.post("/meeting/", async (req, res) => {
  try {
    return await attendanceService.createMeeting(req, res);
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Update Meeting by UUID
 * @name PATCH /attendance/meeting/:id
 * @param {string} req.params.id - Meeting UUID
 * @param {Object} req.body -- Meeting data to update
 * @returns {Object} 200 - Meeting updated
 * @returns {Object} 400 - Missing meeting UUID parameter
 * @returns {Object} 404 - Meeting not found
 * @status IN USE
 */
router.patch("/meeting/:id", async (req, res) => {
  try {
    return await attendanceService.updateMeeting(req, res);
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Delete Meeting by UUID
 * @name DELETE /attendance/meeting/:id
 * @param {string} req.params.id - Meeting UUID
 * @returns {Object} 200 - Meeting deleted
 * @returns {Object} 404 - Meeting not found
 * @returns {Object} 400 - Missing meeting UUID parameter
 * @status IN USE
 */
router.delete("/meeting/:id", async (req, res) => {
  try {
    return await attendanceService.deleteMeeting(req, res);
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Returns a list of meetings for a course
 * @name GET /attendance/meeting/list/:courseUUID
 * @param {string} req.params.courseUUID - Course UUID
 * @returns {Object} 200 - List of meetings
 * @returns {Object} 400 - Missing course UUID parameter
 * @returns {Object} 403 - Not permitted
 * @returns {Object} 404 - Course not found
 * @status IN USE
 */
router.get("/meeting/list/:courseUUID", async (req, res) => {
  try {
    return await attendanceService.getMeetingList(req, res);
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get Participant by meeting and participant UUID
 * @name GET /attendance/participant/:meeting/:id
 * @param {string} req.params.meeting - Meeting UUID
 * @param {string} req.params.id - Participant UUID
 * @returns {Object} 200 - Participant object
 * @returns {Object} 400 - Missing Participant or Meeting UUID parameter
 * @returns {Object} 403 - Not permitted
 * @returns {Object} 404 - Participant not found
 * @status IN USE
 */
router.get("/participant/:meeting/:id", async (req, res) => {
  try {
    return await attendanceService.getParticipant(req, res);
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Create Participants
 * @param {Object} req.body -- Participant data
 * @returns {Object} 200 - Participant created
 * @returns {Object} 400 - Validation error
 * @status IN USE
 */
router.post("/participant/", async (req, res) => {
  try {
    return await attendanceService.createParticipants(req, res);
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

router.patch("/participant/", async (req, res) => {
  try {
    return await attendanceService.updateParticipant(req, res);
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

router.delete("/participant/:meeting/:id", async (req, res) => {
  try {
    return await attendanceService.deleteParticipant(req, res);
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

router.post("/participant/list/", async (req, res) => {
  try {
    return await attendanceService.getParticipantListByParams(req, res);
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

router.get("/meeting_code/:id", async (req, res) => {
  try {
    return await attendanceService.getMeetingCode(req, res);
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

router.get("/meeting_code/record/:meeting/:code", async (req, res) => {
  try {
    return await attendanceService.recordAttendanceViaCode(req, res);
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get student attendance analytics
 * @name GET /v1/api/attendance/analytics/student
 * @param {string} req.query.courseUuid - Course UUID (required)
 * @param {string} req.session.user.id - User UUID from session (required)
 * @param {string} [req.query.startDate] - Start date filter (optional, format: YYYY-MM-DD)
 * @param {string} [req.query.endDate] - End date filter (optional, format: YYYY-MM-DD)
 * @returns {Object} 200 - Student attendance analytics data
 * @returns {Object} 400 - Bad request (missing/invalid parameters)
 * @returns {Object} 403 - Not authorized
 * @returns {Object} 500 - Server error 
 */
router.get("/analytics/student", async (req, res) => {
  try {
    validateStudentAnalyticsRequest(req.query);

    // Get analytics from service
    const analytics = await attendanceService.getStudentAnalytics({
      userUuid: req.session.user?.id,
      courseUuid: req.query.courseUuid,
      startDate: req.query.startDate,
      endDate: req.query.endDate
    });

    // Format output
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
 * @name GET /v1/api/attendance/analytics/instructor
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
router.get("/analytics/instructor", async (req, res) => {
  try {
    // Fix: attendanceService.getInstructorAnalytics must exist and be exported
    if (typeof attendanceService.getInstructorAnalytics !== "function") {
      throw new Error("attendanceService.getInstructorAnalytics is not a function");
    }

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

export default router;
