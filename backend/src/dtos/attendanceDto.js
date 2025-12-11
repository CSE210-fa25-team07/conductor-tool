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

/**
 * Convert raw analytics data to Student Analytics DTO
 * @param {Object} analytics - Raw analytics data
 * @returns {Object} Student Analytics DTO
 */
function toStudentAnalyticsDto(analytics) {
  return {
    userUuid: analytics.userUuid,
    courseUuid: analytics.courseUuid,
    attendanceByType: (analytics.attendanceByType || analytics.byMeetingType || []).map(t => ({
      meetingType: t.meetingType,
      totalMeetings: t.totalMeetings,
      attended: t.attended,
      percentage: Math.round(t.percentage * 100) / 100 // Round to 2 decimals
    }))
  };
}

/** Convert raw analytics data to Instructor Analytics DTO
 * @param {Object} analytics - Raw analytics data
 * @returns {Object} Instructor Analytics DTO
 */
function toInstructorAnalyticsDto(analytics) {
  return {
    courseUuid: analytics.courseUuid,
    timeline: (analytics.timeline || analytics.meetings || []).map(m => ({
      date: m.meetingDate || m.date,
      meetingType: m.meetingType,
      meetingTitle: m.meetingTitle,
      totalParticipants: m.totalParticipants,
      attended: m.attended,
      attendancePercentage: Math.round((m.attendancePercentage ?? m.percentage ?? 0) * 100) / 100
    }))
  };
}

export {
  toMeetingDTO,
  toParticipantDTO,
  toParticipantListDTO,
  toMeetingListDTO,
  toStudentAnalyticsDto,
  toInstructorAnalyticsDto
};
