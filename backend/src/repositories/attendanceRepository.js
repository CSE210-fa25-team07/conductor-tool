/**
 * @module attendance/repository
 */

import { getPrisma } from "../utils/db.js";

const prisma = getPrisma();

/**
 * Create a new meeting
 * @param {Object} meetingData
 * @returns {Promise<Object>} Created meeting
 */
async function createMeeting(meetingData) {
    const meeting = await prisma.meeting.create({
        data: {
            creatorUUID: meetingData.creatorUUID,
            courseUUID: meetingData.courseUUID,
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

async function getMeetingByUUID(meetingUUID) {
    const meeting = await prisma.meeting.findUnique({
        where: { meetingUUID }
    });
    return meeting;
}

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

async function deleteMeeting(meetingUUID) {
    await prisma.meeting.delete({
        where: { meetingUUID }
    });
}

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

async function getParticipant(meetingUUID, userUUID) {
    const participant = await prisma.participant.findFirst({
        where: {
            meetingUUID,
            userUUID
        }
    });
    return participant;
}

async function createParticipants(participantsData) {
    const createdParticipants = await prisma.participant.createMany({
        data: participantsData,
        skipDuplicates: true
    });
    return createdParticipants;
}

async function getParticipantListByParams(params) {
    const { meetingUUID, courseUUID, participantUUID, present } = params;

    const whereClause = {
        meetingUUID,
        courseUUID
    };

    // If participantUUID is provided, find participation for one user
    if (participantUUID) {
        whereClause.participantUUID = participantUUID;
    }

    if (present !== undefined) {
        whereClause.present = present;
    }

    const participants = await prisma.participant.findMany({
        where: whereClause
    });
    return participants;
}

async function updateParticipant(meetingUUID, userUUID, present) {
    const updatedParticipant = await prisma.participant.update({
        where: {
            meetingUUID,
            userUUID
        },
        data: {
            present
        }
    });
    return updatedParticipant;
}

async function deleteParticipant(meetingUUID, userUUID) {
    const deletedCount = await prisma.participant.delete({
        where: {
            meetingUUID,
            userUUID
        }
    });

    return deletedCount !== 0;
}   

export {
    createMeeting,
    getMeetingByUUID,
    updateMeeting,
    deleteMeeting,
    getMeetingListByParams
};

