/**
 * Attendance Service
 * @module attendance/service
 *
 * Business logic layer for attendance and meeting management.
 */

import * as attendanceRepository from "../repositories/attendanceRepository.js";
import * as attendanceValidator from "../validators/attendanceValidator.js";
import * as userContextRepository from "../repositories/userContextRepository.js"
import RoleEnum from "../enums/role.js";
import * as attendanceDTO from "../dtos/attendanceDto.js";

/**
 * Get a Meeting object by UUID
 * @param {string} req.param.id -- UUID of the meeting
 * @returns {Object} 403 - Not permitted
 * @returns {Object} 200 - Meeting object
 * @returns {Object} 404 - Meeting not found
 * @returns {Object} 400 - Missing meeting UUID parameter
 * @status IN USE
 */
async function getMeetingByUUID(req, res) {
    const meetingUUID = req.param.id;
    if (!meetingUUID) {
        return res.status(400).json({
            success: false,
            error: "Meeting UUID parameter is required"
        });
    }

    const { userContext } = await userContextRepository.getUserContext(req.session.user.id);

    const meeting = attendanceRepository.getMeetingByUUID(meetingUUID);

    if (!meeting) {
        return res.status(404).json({
            success: false,
            error: "Meeting not found"
        });
    }

    const isInCourse = userContext.enrollments.course.courseUUID === meeting.courseUUID;
    if (!isInCourse) {
        return res.status(403).json({
            success: false,
            error: "Not authorized to view this meeting"
        });
    }

    const isInMeeting = meeting.partcipants.contains(userContext.user.userUUID) || meeting.creatorUUID === userContext.user.userUUID;
    const specialPerms = [RoleEnum.PROFESSOR, RoleEnum.TA, RoleEnum.TUTOR, RoleEnum.TEAM_LEADER].includes(userContext.enrollments.role.roleName);    

    if (!(isInMeeting || specialPerms)) {
        return res.status(403).json({
            success: false,
            error: "Not authorized to view this meeting"
        });
    }

    return res.status(200).json({
        success: true,
        meeting
    });
}

/**
 * Create meeting from data
 * @param {Object} req -- Request data, containing UserUUID and Meeting data
 * @param {Object} res -- Response
 */
async function createMeeting(req, res) {
    const userUUID = req.session.user.id;
    await attendanceValidator.validateCreateMeetingData(req.body);
    const { 
        courseUUID,
        meetingStartTime,
        meetingEndTime,
        meetingDate,
        meetingTitle,
        meetingDescription,
        meetingLocation,
        meetingType,
        isRecurring,
        participants
    } = req.body;

    const { userContext } = await userContextRepository.getUserContext(userUUID);
    const isInActiveCourse = (
        userContext.enrollments.course.courseUUID === courseUUID
        && userContext.enrollments.course.term.isActive
    );
    if (!isInActiveCourse) {
        return res.status(403).json({
            success: false,
            error: "Not authroized to create meeting for this course"
        });
    }

    const meeting = await attendanceRepository.createMeeting({
        creatorUUID: userUUID,
        courseUUID,
        meetingStartTime,
        meetingEndTime,
        meetingDate,
        meetingTitle,
        meetingDescription,
        meetingLocation,
        isRecurring: isRecurring || false
    });

    const createdParticipants = await this.createParticipants(
        { body: participants.map(participant => ({
            ...participant,
            meetingUUID: meeting.meetingUUID
        })),
        session: req.session
    }, res);

    const meetingCode = await createMeetingCode(req, res);

    return res.status(201).json({
        success: true,
        data: {
            meeting: attendanceDTO.toMeetingDTO(meeting),
            participants: createdParticipants.data,
            meetingCode: meetingCode,
        }
    });
}

/**
 * Updates meeting data
 * @param {Object} req - request, where body contains meeting dataa
 * @param {Object} res - response
 * @returns {Object} 200 - Meeting updated
 * @returns {Object} 403 - Not permitted
 * @returns {Object} 404 - Meeting not found
 * @returns {Object} 400 - Missing meeting UUID parameter
 * @status IN USE
 */
async function updateMeeting(req, res) {
    const userUUID = req.session.user.id;
    const { meetingUUID } = req.params.id;

    if (!meetingUUID) {
        return res.status(400).json({
            success: false,
            error: "Meeting UUID parameter is required"
        });
    }

    await attendanceValidator.validateUpdateMeetingData(req.body);
    const { 
        meetingEndTime,
        meetingDate,
        meetingTitle,
        meetingDescription,
        meetingLocation,
        isRecurring
    } = req.body;

    const existingMeeting = await attendanceRepository.getMeetingByUUID(meetingUUID);
    if (!existingMeeting) {
        return res.status(404).json({
            success: false,
            error: "Meeting not found"
        });
    }
    const courseUUID = existingMeeting.courseUUID;

    const { userContext } = await userContextRepository.getUserContext(userUUID);
    const isInActiveCourse = (
        userContext.enrollments.course.courseUUID === courseUUID
        && userContext.enrollments.course.term.isActive
    );
    if (!isInActiveCourse) {
        return res.status(403).json({
            success: false,
            error: "Not authroized to update meeting for this course"
        });
    }

    const meeting = await attendanceRepository.updateMeeting({
        meetingUUID: existingMeeting.meetingUUID,
        meetingStartTime: meetingStartTime || existingMeeting.meetingStartTime,
        meetingEndTime: meetingEndTime || existingMeeting.meetingEndTime,
        meetingDate: meetingDate || existingMeeting.meetingDate,
        meetingTitle: meetingTitle || existingMeeting.meetingTitle,
        meetingDescription: meetingDescription || existingMeeting.meetingDescription,
        meetingLocation: meetingLocation || existingMeeting.meetingLocation,
        isRecurring: isRecurring || existingMeeting.isRecurring
    });

    return res.status(201).json({
        success: true,
        data: attendanceDTO.toMeetingDTO(meeting)
    });
}
async function deleteMeeting(req, res) {
    const userUUID = req.session.user.id;
    const { meetingUUID } = req.params.id;
    const { deleteFuture } = req.body;

    const existingMeeting = await attendanceRepository.getMeetingByUUID(meetingUUID);
    if (!existingMeeting) {
        return res.status(404).json({
            success: false,
            error: "Meeting not found"
        });
    }
    const courseUUID = existingMeeting.courseUUID;

    const { userContext } = await userContextRepository.getUserContext(userUUID);
    const canDelete = (
        userContext.enrollments.course.courseUUID === courseUUID
        && userContext.enrollments.course.term.isActive
        && meeting.creatorUUID === userUUID
        // This is in UTC, might be a problem
        && meeting.meetingEndDate > new Date()
    );
    if (!canDelete) {
        return res.status(403).json({
            success: false,
            error: "Not authroized to delete meeting for this course"
        });
    }

    await attendanceRepository.deleteMeeting(meetingUUID);

    if (meeting.isRecurring && deleteFuture) {
        await attendanceRepository.deleteMeetingByParentUUID(meeting.meetingUUID);
    }

    return res.status(200).json({
        success: true,
        message: "Meeting deleted successfully"
    });
}

/**
 * Gets meeting list by course UUID
 * @param {Object} req -- Request with user auth data and courseUUID param
 * @param {Object} res -- Response 
 * @returns {Object} 200 - Meeting list
 * @returns {Object} 400 - Missing course UUID parameter
 * @returns {Object} 403 - Not permitted
 * @returns {Object} 404 - Course not found
 * @status IN USE
 */
async function getMeetingList(req, res) {
    const userUUID = req.session.user.id;
    const courseUUID = req.params.courseUUID;

    if (!courseUUID) {
        return res.status(400).json({
            success: false,
            error: "Course UUID parameter is required"
        });
    }

    const course = await attendanceRepository.getCourseByUUID(courseUUID);
    if (!course) {
        return res.status(404).json({
            success: false,
            error: "Course not found"
        });
    }

    const { userContext } = await userContextRepository.getUserContext(userUUID);
    userCourse = userContext.enrollments.course.courseUUID;
    if (courseUUID && courseUUID !== userCourse) {
        return res.status(403).json({
            success: false,
            error: "Not authorized to view meetings for this course"
        });
    }

    const isStaff = await userContextRepository.checkCourseStaffAccess(
        userUUID,
        courseUUID
    );

    // Staff will see all meetings for the course, non-staff only ones where they are participant or owner
    const meetings = await attendanceRepository.getMeetingListByParams({
        courseUUID: courseUUID,
        userUUID: userUUID,
        isStaff: isStaff,
    });

    return res.status(200).json({
        success: true,
        data: attendanceDTO.toMeetingListDTO(meetings)
    })

}
async function getParticipant(req, res) {
    const participantUUID = req.param.id;
    const meetingUUID = req.param.meeting;

    if (!participantUUID || !meetingUUID) {
        return res.status(400).json({
            success: false,
            error: "Participant UUID and Meeting UUID parameters are required"
        });
    }

    const participant = await attendanceRepository.getParticipant(participantUUID, meetingUUID);
    const meeting = await attendanceRepository.getMeetingByUUID(meetingUUID);

    if (participant !== userUUID && meeting.creatorUUID !== userUUID) {
        return res.status(403).json({
            success: false,
            error: "Not authorized to view this participant"
        });
    }

    return res.status(200).json({
        success: true,
        data: attendanceDTO.toParticipantDTO(participant)
    });
}
async function createParticipants(req, res) {
    const participants = req.body.participants;
    if (!participants) {
        return res.status(400).json({       
            success: false,
            error: "Participants data is required"
        });
    }
    participants.forEach(pariticpant => attendanceValidator.validateParticipantData(pariticpant));

    const userContext = await userContextRepository.getUserContext(req.session.user.id);

    const meeting = await attendanceRepository.getMeetingByUUID(participants[0].meetingUUID);
    if (!meeting) {
        return res.status(404).json({
            success: false,
            error: "Meeting not found"
        });
    }
    
    const isInActiveCourse = (
        userContext.enrollments.course.courseUUID === meeting.courseUUID
        && userContext.enrollments.course.term.isActive
    );
    if (!isInActiveCourse) {
        return res.status(403).json({
            success: false,
            error: "Not authroized to add participants for this meeting"
        });
    }

    if (meeting.creatorUUID !== req.session.user.id) {
        return res.status(403).json({
            success: false,
            error: "Only the meeting creator can add participants"
        });
    }

    const createdParticipants = await attendanceRepository.createParticipants(participants);
    
    return res.status(201).json({
        success: true,
        data: attendanceDTO.toParticipantListDTO(createdParticipants)
    });
}
async function updateParticipant(req, res) {
    const {
        meetingUUID,
        participantUUID,
        present
    } = req.body;

    if (!participantUUID || !meetingUUID) {
        return res.status(400).json({
            success: false,
            error: "Participant UUID and Meeting UUID parameters are required"
        });
    }

    const participant = await attendanceRepository.getParticipant(participantUUID, meetingUUID);
    if (!participant) {
        return res.status(404).json({
            success: false,
            error: "Participant not found"
        });
    }

    const meeting = await attendanceRepository.getMeetingByUUID(participants[0].meetingUUID);
    if (!meeting) {
        return res.status(404).json({
            success: false,
            error: "Meeting not found"
        });
    }
    
    const isInActiveCourse = (
        userContext.enrollments.course.courseUUID === meeting.courseUUID
        && userContext.enrollments.course.term.isActive
    );
    if (!isInActiveCourse) {
        return res.status(403).json({
            success: false,
            error: "Not authroized to update participants for this meeting"
        });
    }

    if (meeting.creatorUUID !== req.session.user.id) {
        return res.status(403).json({
            success: false,
            error: "Only the meeting creator can update participants"
        });
    }

    const updatedParticipant = await attendanceRepository.updateParticipant({
        participantUUID,
        meetingUUID,
        present: present || participant.present
    });

    return res.status(200).json({
        success: true,
        data: attendanceDTO.toParticipantDTO(updatedParticipant)
    }); 
}

async function deleteParticipant(req, res) {
    const participantUUID = req.param.id;
    const meetingUUID = req.param.meeting;

    if (!participantUUID || !meetingUUID) {
        return res.status(400).json({
            success: false,
            error: "Participant UUID and Meeting UUID parameters are required"
        });
    }

    const participant = await attendanceRepository.getParticipant(participantUUID, meetingUUID);
    if (!participant) {
        return res.status(404).json({
            success: false,
            error: "Participant not found"
        });
    }

    const meeting = await attendanceRepository.getMeetingByUUID(participants[0].meetingUUID);
    if (!meeting) {
        return res.status(404).json({
            success: false,
            error: "Meeting not found"
        });
    }
    
    const isInActiveCourse = (
        userContext.enrollments.course.courseUUID === meeting.courseUUID
        && userContext.enrollments.course.term.isActive
    );
    if (!isInActiveCourse) {
        return res.status(403).json({
            success: false,
            error: "Not authroized to update participants for this meeting"
        });
    }

    if (meeting.creatorUUID !== req.session.user.id) {
        return res.status(403).json({
            success: false,
            error: "Only the meeting creator can update participants"
        });
    }

    const isDeleted = await attendanceRepository.deleteParticipant(participantUUID, meetingUUID);
    return res.status(isDeleted ? 200 : 503).json({
        success: isDeleted,
        message: `Participant deleted: ${isDeleted}}`
    });
}

async function getParticipantListByParams(req, res) {
    const {
        meetingUUID,
        courseUUID,
        present
    } = req.body;

    const userUUID = req.session.user.id;
    
    const isStaff = await userContextRepository.checkCourseStaffAccess(
        userUUID,
        courseUUID
    );
    const meeting = await attendanceRepository.getMeetingByUUID(meetingUUID);
    
    if (meetingUUID && meeting.creatorUUID != userUUID && !isStaff) {
        return res.status(403).json({
            success: false,
            error: "Not authorized to view participants for this meeting"
        });
    }
    
    if (meetingUUID && !meeting) {
        return res.status(404).json({
            success: false,
            error: "Meeting not found"
        });
    }

    const participants = await attendanceRepository.getParticipantListByParams({
        meetingUUID,
        courseUUID,
        participantUUID: isStaff ? null : userUUID,
        present
    });

    if (!participants || participants.length === 0) {
        return res.status(404).json({
            success: false,
            error: "No participants found by parameters"
        });
    }

    return res.status(200).json({
        success: true,
        data: attendanceDTO.toParticipantListDTO(participants)
    });
}

async function createMeetingCode(req, res) {
    const meetingUUID = req.params.id;

    const meeting = await attendanceRepository.getMeetingByUUID(meetingUUID);
    if (!meeting) {
        return res.status(404).json({
            success: false,
            error: "Meeting not found"
        });
    }

    let meetingCode = Math.random().toString(36).substring(2).substring(0, 6).toUpperCase();

    // TODO(bukhradze): replace hostname
    const HOSTNAME = "conductor-tool.ucsd.edu";
    let aWholeAssURL = `https://${HOSTNAME}/attendance/record/` + meetingCode;
    let QRCodeURL = `https://api.qrserver.com/v1/create-qr-code/?data=${aWholeAssURL}&size=200x200`;

    const validStartDatetime = new Date(`${meeting.meetingDate}T${meeting.meetingStartTime}`);
    const validEndDatetime = new Date(`${meeting.meetingDate}T${meeting.meetingEndTime}`);

    const codeData = {
        qrURL: QRCodeURL,
        meetingUUID: meeting.meetingUUID,
        meetingCode: meetingCode,
        validStartDatetime: validStartDatetime,
        validEndDatetime: validEndDatetime
    };

    await attendanceRepository.createMeetingCode(codeData);

    return codeData;
}

async function getMeetingCode(req, res) {
    // TODO(bukhradze): implement lol
}

async function recordAttendanceViaCode(req, res) {
    // TODO(bukhradze): implement lol
}

export {
    getMeetingByUUID,
    createMeeting,
    updateMeeting,
    deleteMeeting,
    getMeetingList,
    getParticipant,
    createParticipants,
    updateParticipant,
    deleteParticipant,
    getParticipantListByParams
}