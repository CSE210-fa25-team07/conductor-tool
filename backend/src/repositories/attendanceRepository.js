/**
 * @module attendance/repository
 */

import { getPrisma } from "../utils/db.js";

const prisma = getPrisma();

/**
 * Create a new meeting
 * @param {string} meetingData
 * @returns {Promise<Object>} Created meeting
 * @throws {Error} on database error
 */
/**
 * Create a new meeting
 * @param {Object} meetingData - Meeting data with creatorUUID, courseUUID, etc.
 * @returns {Promise<Object>} Created meeting
 * @throws {Error} on database error
 */
async function createMeeting(meetingData) {
  const data = {
    creatorUuid: meetingData.creatorUUID,
    courseUuid: meetingData.courseUUID,
    meetingStartTime: new Date(meetingData.meetingStartTime),
    meetingEndTime: new Date(meetingData.meetingEndTime),
    meetingDate: new Date(meetingData.meetingDate),
    meetingTitle: meetingData.meetingTitle,
    meetingType: meetingData.meetingType || 0
  };

  const parentUUID = meetingData.parentMeetingUUID || meetingData.parentMeetingUuid;

  if (parentUUID?.trim()) {
    data.parentMeetingUuid = parentUUID;
    data.isRecurring = true;
  } else if (meetingData.isRecurring) {
    data.isRecurring = true;
    data.parentMeetingUuid = null;
  } else {
    data.isRecurring = false;
    data.parentMeetingUuid = null;
  }

  if (meetingData.meetingDescription !== undefined) {
    data.meetingDescription = meetingData.meetingDescription;
  }

  if (meetingData.meetingLocation !== undefined) {
    data.meetingLocation = meetingData.meetingLocation;
  }

  return await prisma.meeting.create({ data });
}

/**
 * Get meeting by UUID
 * @param {string} meetingUUID to fetch meeting by
 * @returns {Promise<Object>} Meeting object
 * @throws {Error} on database error
 */
async function getMeetingByUUID(meetingUUID) {
  const meeting = await prisma.meeting.findUnique({
    where: { meetingUuid:  meetingUUID }
  });
  return meeting;
}

/**
 * Update meeting by UUID with update data
 * @param {string} meetingUUID to update
 * @param {Object} updateData with update fields (fill all fields, if no change, pass existing value)
 * @returns {Promise<Object>} Updated meeting object
 * @returns {Error} on database error
 */
async function updateMeeting(meetingUUID, updateData) {
  const updatedMeeting = await prisma.meeting.update({
    where: { meetingUuid: meetingUUID },
    data: {
      meetingEndTime: updateData.meetingEndTime ? new Date(updateData.meetingEndTime) : undefined,
      meetingDate: updateData.meetingDate ? new Date(updateData.meetingDate) : undefined,
      meetingTitle: updateData.meetingTitle,
      meetingDescription: updateData.meetingDescription,
      meetingLocation: updateData.meetingLocation,
      isRecurring: updateData.isRecurring,
      parentMeetingUuid: updateData.parentMeetingUUID ?? updateData.parentMeetingUuid ?? undefined
    }
  });
  return updatedMeeting;
}

/**
 * Delete meeting by UUID
 * @param {string} meetingUUID to delete
 * @returns {Promise<boolean>} true if deleted
 * @throws {Error} on database error
 */
async function deleteMeeting(meetingUUID) {
  await prisma.meeting.delete({
    where: { meetingUuid: meetingUUID }
  });
  return true;
}

/**
 * Get multiple meetings by parameters.
 * Provide courseUUID to filter meetings by.
 * If userUUID is provided, only meetings where the user is a creator or participant are returned.
 * If isStaff is true, all meetings for the course are returned.
 * @param {Object} params conatining courseUUID, userUUID, isStaff
 * @returns {Promise<Array>} List of meeting objects
 * @throws {Error} on database error
 */
async function getMeetingListByParams(params) {
  const { courseUUID, userUUID, isStaff } = params;

  let meetings;
  if (isStaff) {
    meetings = await prisma.meeting.findMany({
      where: { courseUuid: courseUUID }
    });
  } else {
    meetings = await prisma.meeting.findMany({
      where: {
        courseUuid: courseUUID,
        OR: [
          { creatorUuid: userUUID },
          {
            participants: {
              some: { participantUuid: userUUID }
            }
          }
        ]
      }
    });
  }
  return meetings;
}

/**
 * Get single participant record by meetingUUID and participantUUID
 * @param {string} participantUUID
 * @param {string} meetingUUID
 * @returns {Promise<Object>} Participant object
 * @throws {Error} on database error
 */
async function getParticipant(participantUUID, meetingUUID) {
  const participant = await prisma.participant.findUnique({
    where: {
      // Prisma composite unique key name
      // eslint-disable-next-line camelcase
      meetingUuid_participantUuid: {
        meetingUuid: meetingUUID,
        participantUuid: participantUUID
      }
    }
  });
  return participant;
}

/**
 * Create multiple participants from their data
 * @param {Array<Object>} participantsData array of Objects containing participant data
 * @returns {Promise<Array<Object>>} Created participant objects
 * @throws {Error} on database error
 */
async function createParticipants(participantsData) {
  const createdParticipants = await prisma.participant.createMany({
    data: participantsData,
    skipDuplicates: true
  });
  return createdParticipants;
}

/**
 * Get multiple participants by parameters.
 * meetingUUID and courseUUID are required -- all participants for that meeting
 * @param {Object} params -- meetingUUID, courseUUID, participantUUID, present
 * @returns
 */
async function getParticipantListByParams(params) {
  const { meetingUUID, courseUUID, participantUUID, present } = params;

  const whereClause = {};

  // If meetingUUID is provided, filter by it
  if (meetingUUID) {
    whereClause.meetingUuid = meetingUUID;
  }

  // If courseUUID is provided, filter by it via Meeting relation
  if (courseUUID) {
    whereClause.meeting = {
      courseUuid: courseUUID
    };
  }

  // If participantUUID is provided, find participation for one user
  if (participantUUID) {
    whereClause.participantUuid = participantUUID;
  }

  if (present !== undefined) {
    whereClause.present = present;
  }

  const participants = await prisma.participant.findMany({
    where: whereClause,
    include: {
      participant: {
        select: {
          userUuid: true,
          firstName: true,
          lastName: true,
          email: true
        }
      }
    }
  });

  return participants;
}

/**
 * Updates participant's present status
 * @param {string} meetingUUID
 * @param {string} participantUUID
 * @param {boolean} present
 * @param {string} attendanceTime -- optional attendance time
 * @returns updated participant object
 */
async function updateParticipant(meetingUUID, participantUUID, present, attendanceTime) {
  const updatedParticipant = await prisma.participant.update({
    where: {
      // Prisma composite unique key name
      // eslint-disable-next-line camelcase
      meetingUuid_participantUuid: {
        meetingUuid: meetingUUID,
        participantUuid: participantUUID
      }
    },
    data: {
      present,
      attendanceTime: attendanceTime && present ? new Date(attendanceTime) : undefined
    }
  });
  return updatedParticipant;
}

/**
 * Deletes a participant by meetingUUID and participantUUID
 * @param {string} meetingUUID
 * @param {string} participantUUID
 * @returns {boolean} true if deleted, false otherwise
 */
async function deleteParticipant(meetingUUID, participantUUID) {
  await prisma.participant.delete({
    where: {
      // Prisma composite unique key name
      // eslint-disable-next-line camelcase
      meetingUuid_participantUuid: {
        meetingUuid: meetingUUID,
        participantUuid: participantUUID
      }
    }
  });

  return true;
}

/**
 * Create a meeting code for QR attendance tracking
 * @param {Object} codeData containing meetingUuid, meetingCode, qrUrl, validStartDatetime, validEndDatetime
 * @returns {Promise<Object>} Created meeting code object
 */
async function createMeetingCode(codeData) {
  const meetingCode = await prisma.meetingCode.create({
    data: {
      meetingUuid: codeData.meetingUuid,
      meetingCode: codeData.meetingCode,
      qrUrl: codeData.qrUrl,
      validStartDatetime: codeData.validStartDatetime,
      validEndDatetime: codeData.validEndDatetime
    }
  });
  return meetingCode;
}

/**
 * Get the most recent meeting code by meetingUUID
 * @param {string} meetingUUID
 * @returns {Promise<Object>} Meeting code object
 */
async function getMeetingCodeByMeetingUuid(meetingUUID) {
  // Get the most recent meeting code by validStartDatetime (most recent valid code)
  const meetingCode = await prisma.meetingCode.findFirst({
    where: { meetingUuid: meetingUUID },
    orderBy: { validStartDatetime: "desc" }
  });
  return meetingCode;
}

/**
 * Get meeting code by meetingUUID and code
 * @param {string} meetingUUID
 * @param {string} code
 * @returns {Promise<Object>} Meeting code object
 */
async function getMeetingCodeByMeetingUuidAndCode(meetingUUID, code) {
  const meetingCode = await prisma.meetingCode.findFirst({
    where: {
      meetingUuid: meetingUUID,
      meetingCode: code
    }
  });
  return meetingCode;
}

async function deleteMeetingByParentUUID(meetingUUID) {
  await prisma.meeting.deleteMany({
    where: { parentMeetingUuid: meetingUUID }
  });
  return true;
}

/**
 * Delete all future meetings in a recurring series by traversing linked list forward
 * @param {string} currentMeetingUUID - UUID of the current meeting being deleted
 * @param {Date} fromDate - Only delete meetings on or after this date
 * @returns {Promise<boolean>} true if deleted
 * @throws {Error} on database error
 */
async function deleteFutureMeetingsByParentUUID(currentMeetingUUID, fromDate) {
  const meetingsToDelete = new Set([currentMeetingUUID]);
  const toProcess = [currentMeetingUUID];

  while (toProcess.length > 0) {
    const currentUUID = toProcess.shift();

    const nextMeetings = await prisma.meeting.findMany({
      where: {
        parentMeetingUuid: currentUUID,
        meetingDate: { gte: fromDate }
      },
      select: { meetingUuid: true }
    });

    for (const meeting of nextMeetings) {
      if (!meetingsToDelete.has(meeting.meetingUuid)) {
        meetingsToDelete.add(meeting.meetingUuid);
        toProcess.push(meeting.meetingUuid);
      }
    }
  }

  if (meetingsToDelete.size > 0) {
    await prisma.meeting.deleteMany({
      where: { meetingUuid: { in: Array.from(meetingsToDelete) } }
    });
  }

  return true;
}

export {
  createMeeting,
  getMeetingByUUID,
  updateMeeting,
  deleteMeeting,
  getMeetingListByParams,
  getParticipant,
  createParticipants,
  getParticipantListByParams,
  updateParticipant,
  deleteParticipant,
  createMeetingCode,
  getMeetingCodeByMeetingUuid,
  getMeetingCodeByMeetingUuidAndCode,
  deleteMeetingByParentUUID,
  deleteFutureMeetingsByParentUUID
};

