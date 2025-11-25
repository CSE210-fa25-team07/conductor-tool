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

    if (meetingType && typeof meetingType !== "integer") {
        throw new Error("meetingType must be an integer");
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
        present
    } = participantData;

    if (present === undefined || typeof present !== "boolean") {
        throw new Error("present field is required and must be a boolean");
    }

    return true;
}