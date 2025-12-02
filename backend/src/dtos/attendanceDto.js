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

export {
  toMeetingDTO,
  toParticipantDTO,
  toParticipantListDTO,
  toMeetingListDTO
};
