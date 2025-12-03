/**
 * @module attendance/dto
 */


function toMeetingDTO(meetingData) {
  return {
    meetingUuid: meetingData.meetingUuid,
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
    meetingType: meetingData.meetingType
  };
}

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

function toParticipantListDTO(participants) {
  return participants.map(toParticipantDTO);
}

function toMeetingListDTO(meetings) {
  return meetings.map(toMeetingDTO);
}

function toStudentAnalyticsDto(analytics) {
  return {
    userUuid: analytics.userUuid,
    courseUuid: analytics.courseUuid,
    attendanceByType: analytics.byMeetingType.map(t => ({
      meetingType: t.meetingType,
      totalMeetings: t.totalMeetings,
      attended: t.attended,
      percentage: Math.round(t.percentage * 100) / 100 // Round to 2 decimals
    }))
  };
}

function toInstructorAnalyticsDto(analytics) {
  return {
    courseUuid: analytics.courseUuid,
    timeline: analytics.meetings.map(m => ({
      date: m.meetingDate,
      meetingType: m.meetingType,
      meetingTitle: m.meetingTitle,
      totalParticipants: m.totalParticipants,
      attended: m.attended,
      attendancePercentage: Math.round(m.percentage * 100) / 100
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
