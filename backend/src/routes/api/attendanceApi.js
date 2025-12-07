/**
 * @module attendance/api
 */
import express from "express";
import * as attendanceService from "../../services/attendanceService.js";

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
 * @name GET /attendance/participant/:id
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
 *
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

router.post("/meeting_code/:id", async (req, res) => {
  try {
    return await attendanceService.createMeetingCode(req, res);
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


export default router;
