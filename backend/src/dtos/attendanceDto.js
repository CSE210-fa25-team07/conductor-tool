/**
 * @module attendance/dto
 */

/**
 * Convert meeting data to DTO format
 * @param {Object} meetingData - Meeting data from database
 * @returns {Object} Meeting DTO with both camelCase and PascalCase aliases
 */
function toMeetingDTO(meetingData) {
  return {
    meetingUuid: meetingData.meetingUuid,
    meetingUUID: meetingData.meetingUuid, // Alias for consistency with frontend
    creatorUuid: meetingData.creatorUuid,
    courseUuid: meetingData.courseUuid,
    meetingStartTime: meetingData.meetingStartTime,
    meetingEndTime: meetingData.meetingEndTime,
    meetingDate: meetingData.meetingDate,
    meetingTitle: meetingData.meetingTitle,
    meetingDescription: meetingData.meetingDescription,
    meetingLocation: meetingData.meetingLocation,
    isRecurring: meetingData.isRecurring,
    parentMeetingUuid: meetingData.parentMeetingUuid,
    parentMeetingUUID: meetingData.parentMeetingUuid, // Alias for consistency with frontend
    meetingType: meetingData.meetingType
  };
}

/**
 * Convert participant data to DTO format
 * @param {Object} participantData - Participant data from database
 * @returns {Object} Participant DTO
 */
function toParticipantDTO(participantData) {
  return {
    participantUuid: participantData.participantUuid,
    participantUUID: participantData.participantUuid, // Alias for consistency
    meetingUuid: participantData.meetingUuid,
    meetingUUID: participantData.meetingUuid, // Alias for consistency
    present: participantData.present,
    attendanceTime: participantData.attendanceTime,
    // The Prisma relation is called "participant" not "user"
    user: participantData.participant ? {
      userUuid: participantData.participant.userUuid,
      firstName: participantData.participant.firstName,
      lastName: participantData.participant.lastName,
      email: participantData.participant.email
    } : null
  };
}

/**
 * Convert array of participants to DTO format
 * @param {Array} participants - Array of participant data
 * @returns {Array} Array of participant DTOs
 */
function toParticipantListDTO(participants) {
  return participants.map(toParticipantDTO);
}

/**
 * Convert array of meetings to DTO format
 * @param {Array} meetings - Array of meeting data
 * @returns {Array} Array of meeting DTOs
 */
function toMeetingListDTO(meetings) {
  return meetings.map(toMeetingDTO);
}

export {
  toMeetingDTO,
  toParticipantDTO,
  toParticipantListDTO,
  toMeetingListDTO
};
