/**
 * Attendance validator
 * @module attendance/validator
 */

/**
 *
 * @param {Object} meetingData -- encoded meeting data
 * @returns {boolean} true if valid, else throws Error
 * @throws {Error} validation error
 * @status IN USE
 */
function validateCreateMeetingData(meetingData) {
  const {
    creatorUUID,
    courseUUID,
    meetingStartTime,
    meetingEndTime,
    meetingDate,
    meetingTitle,
    meetingType,
    meetingDescription,
    meetingLocation,
    isRecurring
  } = meetingData;

  if (!creatorUUID || typeof creatorUUID !== "string" || creatorUUID.trim() === "") {
    throw new Error("creatorUUID is required and must be a string");
  }

  if (!courseUUID || typeof courseUUID !== "string" || courseUUID.trim() === "") {
    throw new Error("courseUUID is required and must be a string");
  }

  if (!meetingStartTime || isNaN(Date.parse(meetingStartTime))) {
    throw new Error("Invalid or missing meetingStartTime format");
  }

  if (!meetingEndTime || isNaN(Date.parse(meetingEndTime))) {
    throw new Error("Invalid or missing meetingEndTime format");
  }

  if (!meetingDate || isNaN(Date.parse(meetingDate))) {
    throw new Error("Invalid or missing meetingDate format");
  }

  if (!meetingTitle || typeof meetingTitle !== "string" || meetingTitle.trim() === "") {
    throw new Error("meetingTitle is required and must be a string");
  }

  if (meetingDescription && typeof meetingDescription !== "string") {
    throw new Error("meetingDescription must be a string");
  }

  if (meetingLocation && typeof meetingLocation !== "string") {
    throw new Error("meetingLocation must be a string");
  }

  if (isRecurring === undefined || typeof isRecurring !== "boolean") {
    throw new Error("isRecurring is required and must be a boolean");
  }

  if (meetingType && typeof meetingType !== "number") {
    throw new Error("meetingType must be a number");
  }

  return true;
}

function validateUpdateMeetingData(meetingData) {
  const {
    meetingEndTime,
    meetingDate,
    meetingTitle,
    meetingDescription,
    meetingLocation,
    isRecurring
  } = meetingData;

  if (meetingEndTime && isNaN(Date.parse(meetingEndTime))) {
    throw new Error("Invalid meetingEndTime format");
  }

  if (meetingDate && isNaN(Date.parse(meetingDate))) {
    throw new Error("Invalid meetingDate format");
  }

  if (meetingTitle && typeof meetingTitle !== "string" && meetingTitle.trim() === "") {
    throw new Error("meetingTitle must be a string");
  }

  if (meetingDescription && typeof meetingDescription !== "string") {
    throw new Error("meetingDescription must be a string");
  }

  if (meetingLocation && typeof meetingLocation !== "string") {
    throw new Error("meetingLocation must be a string");
  }

  if (isRecurring !== undefined && typeof isRecurring !== "boolean") {
    throw new Error("isRecurring must be a boolean");
  }

  return true;
}

function validateParticipantData(participantData) {
  const {
    present,
    participantUUID,
    meetingUUID
  } = participantData;

  if (present === undefined || typeof present !== "boolean") {
    throw new Error("present field is required and must be a boolean");
  }

  if (!participantUUID || typeof participantUUID !== "string" || participantUUID.trim() === "") {
    throw new Error("participantUUID is required and must be a string");
  }

  if (!meetingUUID || typeof meetingUUID !== "string" || meetingUUID.trim() === "") {
    throw new Error("meetingUUID is required and must be a string");
  }

  return true;
}

function validateParticipantListData(participants) {
  if (!Array.isArray(participants)) {
    throw new Error("participants must be an array");
  }

  participants.forEach(participantData => {
    validateParticipantData(participantData);
  });

  return true;
}

/**
 * Validate student analytics request
 * @param {Object} query - Request query parameters
 * @throws {Error} If validation fails
 */
function validateStudentAnalyticsRequest(query) {
  const { courseUuid, startDate, endDate } = query;

  if (!courseUuid || typeof courseUuid !== "string" || courseUuid.trim().length === 0) {
    throw new Error("courseUuid is required and must be a non-empty string");
  }

  // Validate dates if provided
  if (startDate && isNaN(Date.parse(startDate))) {
    throw new Error("startDate must be a valid date string (YYYY-MM-DD)");
  }

  if (endDate && isNaN(Date.parse(endDate))) {
    throw new Error("endDate must be a valid date string (YYYY-MM-DD)");
  }

  // Validate date range if both provided
  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (start > end) {
      throw new Error("startDate must be before or equal to endDate");
    }
  }
}

/**
 * Validate instructor analytics request
 * @param {Object} query - Request query parameters
 * @throws {Error} If validation fails
 */
function validateInstructorAnalyticsRequest(query) {
  const { courseUuid, startDate, endDate, meetingType, teamUuid } = query;

  // Use student validation as base
  validateStudentAnalyticsRequest({ courseUuid, startDate, endDate });

  // Additional validation for instructor-specific fields
  if (meetingType !== undefined) {
    const type = parseInt(meetingType);
    if (isNaN(type) || type < 0) {
      throw new Error("meetingType must be a positive integer");
    }
  }

  if (teamUuid !== undefined) {
    if (typeof teamUuid !== "string" || teamUuid.trim().length === 0) {
      throw new Error("teamUuid must be a non-empty string");
    }
  }
}

export {
  validateCreateMeetingData,
  validateUpdateMeetingData,
  validateParticipantData,
  validateParticipantListData,
  validateStudentAnalyticsRequest,
  validateInstructorAnalyticsRequest
};
