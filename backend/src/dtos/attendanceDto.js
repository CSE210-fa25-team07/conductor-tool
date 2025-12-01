/**
 * @module attendance/dto
 */


function toMeetingDTO(meetingData) {
    return {
        meetingUUID: meetingData.meetingUUID,
        creatorUUID: meetingData.creatorUUID,
        courseUUID: meetingData.courseUUID,
        meetingStartTime: meetingData.meetingStartTime,
        meetingEndTime: meetingData.meetingEndTime,
        meetingDate: meetingData.meetingDate,
        meetingTitle: meetingData.meetingTitle,
        meetingDescription: meetingData.meetingDescription,
        meetingLocation: meetingData.meetingLocation,
        isRecurring: meetingData.isRecurring,
        parentMeetingUUID: meetingData.parentMeetingUUID,
        createdAt: meetingData.createdAt,
        updatedAt: meetingData.updatedAt
    };
}

function toParticipantDTO(participantData) {
    return {
        participantUUID: participantData.participantUUID,
        meetingUUID: participantData.meetingUUID,
        userUUID: participantData.userUUID,
        status: participantData.status,
        checkInTime: participantData.checkInTime,
        createdAt: participantData.createdAt,
        updatedAt: participantData.updatedAt
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
}