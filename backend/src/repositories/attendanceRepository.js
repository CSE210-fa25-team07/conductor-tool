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
async function createMeeting(meetingData) {
    const meeting = await prisma.Meeting.create({
        data: {
            creatorUuid: meetingData.creatorUUID,
            courseUuid: meetingData.courseUUID,
            meetingStartTime: new Date(meetingData.meetingStartTime),
            meetingEndTime: new Date(meetingData.meetingEndTime),
            meetingDate: new Date(meetingData.meetingDate),
            meetingTitle: meetingData.meetingTitle,
            meetingDescription: meetingData.meetingDescription,
            meetingLocation: meetingData.meetingLocation,
            isRecurring: meetingData.isRecurring
        }
    });
    return meeting;
}

/**
 * Get meeting by UUID
 * @param {string} meetingUUID to fetch meeting by
 * @returns {Promise<Object>} Meeting object
 * @throws {Error} on database error
 */
async function getMeetingByUUID(meetingUUID) {
    const meeting = await prisma.Meeting.findUnique({
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
        where: { meetingUUID },
        data: {
            meetingEndTime: updateData.meetingEndTime ? new Date(updateData.meetingEndTime) : undefined,
            meetingDate: updateData.meetingDate ? new Date(updateData.meetingDate) : undefined,
            meetingTitle: updateData.meetingTitle,
            meetingDescription: updateData.meetingDescription,
            meetingLocation: updateData.meetingLocation,
            isRecurring: updateData.isRecurring
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
        where: { meetingUUID }
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
            where: { courseUUID }
        });
    } else {
        meetings = await prisma.meeting.findMany({
            where: {
                courseUUID,
                OR: [
                    { creatorUUID: userUUID },
                    {
                        participants: {
                            some: { userUUID }
                        }
                    }
                ]
            }
        });
    }
    return meetings;
}

/**
 * Get single participant record by meetingUUID and userUUID
 * @param {string} meetingUUID 
 * @param {string} userUUID 
 * @returns {Promise<Object>} Participant object
 * @throws {Error} on database error
 */
async function getParticipant(meetingUUID, userUUID) {
    const participant = await prisma.participant.findFirst({
        where: {
            meetingUUID,
            userUUID
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
 * meetingUUID and courseUUID are required -- all participants for that meeting i
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
        whereClause.Meeting = {
            courseUuid: courseUUID
        };
    }

    // If participantUUID is provided, find participation for one user
    if (participantUUID) {
        whereClause.participantUuid = participantUUID;
    }

    // If present is provided, filter by it
    if (present !== undefined) {
        whereClause.present = present;
    }

    const participants = await prisma.Participant.findMany({
        where: whereClause
    });
    return participants;
}

/**
 * Updates participant's present status
 * @param {string} meetingUUID 
 * @param {string} userUUID 
 * @param {boolean} present 
 * @param {string} attendanceTime -- optional attendance time
 * @returns updated participant object
 */
async function updateParticipant(meetingUUID, userUUID, present, attendanceTime) {
    const updatedParticipant = await prisma.participant.update({
        where: {
            meetingUuid: meetingUUID,
            userUuid: userUUID
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
 * @param {string} userUUID 
 * @returns {boolean} true if deleted, false otherwise
 */
async function deleteParticipant(meetingUUID, participantUUID) {
    const deletedCount = await prisma.participant.delete({
        where: {
            meetingUuid: meetingUUID,
            participantUuid: participantUUID
        }
    });

    return deletedCount !== 0;
}   

async function createMeetingCode(meetingUUID, code) {
    const meetingCode = await prisma.meetingCode.create({
        data: {
            meetingUuid: meetingUUID,
            code: code
        }
    });
    return meetingCode;
}

async function getMeetingCode(meetingUUID) {
    const meetingCode = await prisma.meetingCode.findUnique({
        where: {
            meetingUuid: meetingUUID
        }
    });
    return meetingCode;
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
    deleteParticipant
};

