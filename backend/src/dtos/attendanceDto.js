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
    meetingUuid: participantData.meetingUuid,
    present: participantData.present,
    attendanceTime: participantData.attendanceTime
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
