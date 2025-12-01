/**
 * Attendance Service
 * @module attendance/service
 *
 * Business logic layer for attendance and meeting management.
 */

import * as attendanceRepository from "../repositories/attendanceRepository.js";
import * as attendanceValidator from "../validators/attendanceValidator.js";
import * as userContextRepository from "../repositories/userContextRepository.js";
import { RoleEnum } from "../enums/role.js";
import * as attendanceDTO from "../dtos/attendanceDto.js";
import * as userRepository from "../repositories/userRepository.js";
import * as courseRepository from "../repositories/courseRepository.js";

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
  const meetingUUID = req.params.id;
  if (!meetingUUID) {
    return res.status(400).json({
      success: false,
      error: "Meeting UUID parameter is required"
    });
  }

  const userContext = await userContextRepository.getUserContext(req.session.user.id);

  const meeting = await attendanceRepository.getMeetingByUUID(meetingUUID);

  if (!meeting) {
    return res.status(404).json({
      success: false,
      error: "Meeting not found"
    });
  }

  let isInCourse = false;
  let courseEnrollment = null;
  userContext.enrollments.forEach(enrollment => {
    if (enrollment.course.courseUuid === meeting.courseUuid) {
      isInCourse = true;
      courseEnrollment = enrollment;
    }
  });
  if (!isInCourse) {
    return res.status(403).json({
      success: false,
      error: "Not authorized to view this meeting"
    });
  }

  const participants = await attendanceRepository.getParticipantListByParams({ meetingUUID: meeting.meetingUUID }, res);

  let isInMeeting = false;
  participants.forEach(participant => {
    if (participant.participantUuid === userContext.user.userUUID) {
      isInMeeting = true;
    }
  });
  isInMeeting = isInMeeting || meeting.creatorUUID === userContext.user.userUUID;
  const specialPerms = [RoleEnum.PROFESSOR, RoleEnum.TA, RoleEnum.TUTOR, RoleEnum.TEAM_LEADER].includes(courseEnrollment.role.roleName);

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

  // Add creatorUUID to request body if not provided
  if (!req.body.creatorUUID) {
    req.body.creatorUUID = userUUID;
  }

  attendanceValidator.validateCreateMeetingData(req.body);
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

  const userContext = await userContextRepository.getUserContext(userUUID);
  let isInActiveCourse = false;
  userContext.enrollments.forEach(enrollment => {
    if (enrollment.course.courseUuid === courseUUID && enrollment.course.term.isActive) {
      isInActiveCourse = true;
    }
  });
  isInActiveCourse = isInActiveCourse || (userContext.staff && userContext.staff.courses.some(course =>
    course.courseUuid === courseUUID && course.term.isActive
  ));

  if (!isInActiveCourse) {
    return res.status(403).json({
      success: false,
      error: "Not authroized to create meeting for this course"
    });
  }

  const existingUsers = await userRepository.getUsersByUuids(
    participants
  );
  if (existingUsers.length !== participants.length) {
    return res.status(400).json({
      success: false,
      error: "One or more participants refer to non-existing users"
    });
  }

  for (const user of existingUsers) {
    let isInCourse = false;
    user.courseEnrollments.forEach(enrollment => {
      if (enrollment.courseUuid === courseUUID) {
        isInCourse = true;
      }
    });
    if (!isInCourse) {
      return res.status(400).json({
        success: false,
        error: `User ${user.userUuid} is not enrolled in the course`
      });
    }
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
    meetingType,
    isRecurring: isRecurring || false
  });

  const createdParticipants = await attendanceRepository.createParticipants(
    participants.map(participant => ({
      participantUuid: participant,
      meetingUuid: meeting.meetingUuid,
      present: false
    }))
  );

  // Create meeting code for the newly created meeting
  let meetingCode = null;
  try {
    req.params = req.params || {};
    req.params.id = meeting.meetingUuid;
    meetingCode = await createMeetingCode(req, res);
  } catch (error) {
    // Don't fail the entire meeting creation if code creation fails
    console.error("Error creating meeting code:", error);
  }

  return res.status(201).json({
    success: true,
    data: {
      meeting: attendanceDTO.toMeetingDTO(meeting),
      participants: createdParticipants.data,
      meetingCode: meetingCode
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
  const meetingUUID = req.params.id;

  if (!meetingUUID) {
    return res.status(400).json({
      success: false,
      error: "Meeting UUID parameter is required"
    });
  }

  await attendanceValidator.validateUpdateMeetingData(req.body);
  const {
    meetingStartTime,
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
  const courseUUID = existingMeeting.courseUuid;

  const userContext = await userContextRepository.getUserContext(userUUID);
  const isInActiveCourse = (
    userContext.enrollments.some(enrollment =>
      enrollment.course.courseUUID === courseUUID && enrollment.course.term.isActive
    )
  );
  if (!isInActiveCourse) {
    return res.status(403).json({
      success: false,
      error: "Not authroized to update meeting for this course"
    });
  }

  if (existingMeeting.creatorUuid !== userUUID) {
    return res.status(403).json({
      success: false,
      error: "Only the meeting creator can update this meeting"
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

/**
 * Delete a meeting by UUID
 * @param {Object} req - Request with user auth data and meeting UUID in params
 * @param {Object} res - Response
 * @returns {Object} 200 - Meeting deleted successfully
 * @returns {Object} 400 - Missing meeting UUID parameter
 * @returns {Object} 403 - Not permitted
 * @returns {Object} 404 - Meeting not found
 * @status IN USE
 */
async function deleteMeeting(req, res) {
  const userUUID = req.session.user.id;
  const meetingUUID = req.params.id;
  const { deleteFuture } = req.body;

  const existingMeeting = await attendanceRepository.getMeetingByUUID(meetingUUID);
  if (!existingMeeting) {
    return res.status(404).json({
      success: false,
      error: "Meeting not found"
    });
  }
  const courseUUID = existingMeeting.courseUuid;

  const userContext = await userContextRepository.getUserContext(userUUID);
  const isInActiveCourse = (
    userContext.enrollments.some(enrollment =>
      enrollment.course.courseUUID === courseUUID && enrollment.course.term.isActive
    )
  );
  const canDelete = (
    isInActiveCourse
        && existingMeeting.creatorUuid === userUUID
        && existingMeeting.meetingEndTime > new Date()
  );
  if (!canDelete) {
    return res.status(403).json({
      success: false,
      error: "Not authroized to delete meeting for this course"
    });
  }

  await attendanceRepository.deleteMeeting(meetingUUID);

  if (existingMeeting.isRecurring && deleteFuture) {
    await attendanceRepository.deleteMeetingByParentUUID(existingMeeting.meetingUUID);
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

  const course = await courseRepository.getCourseByUuid(courseUUID);
  if (!course) {
    return res.status(404).json({
      success: false,
      error: "Course not found"
    });
  }

  const userContext = await userContextRepository.getUserContext(userUUID);
  let inCourse = false;
  let userRole = null;

  for (const enrollment of userContext?.enrollments || []) {
    if (enrollment.course.courseUuid === courseUUID) {
      inCourse = true;
      userRole = enrollment.role.role;
      break;
    }
  }

  if (!inCourse) {
    return res.status(403).json({
      success: false,
      error: "Not authorized to view meetings for this course"
    });
  }

  const isStaff = [RoleEnum.PROFESSOR, RoleEnum.TA, RoleEnum.TUTOR].includes(userRole);

  // Staff will see all meetings for the course, non-staff only ones where they are participant or owner
  const meetings = await attendanceRepository.getMeetingListByParams({
    courseUUID: courseUUID,
    userUUID: userUUID,
    isStaff: isStaff
  });

  return res.status(200).json({
    success: true,
    data: attendanceDTO.toMeetingListDTO(meetings)
  });
}

/**
 * Get a specific participant from a meeting
 * @param {Object} req - Request with participant UUID and meeting UUID in params
 * @param {Object} res - Response
 * @returns {Object} 200 - Participant object
 * @returns {Object} 400 - Missing participant or meeting UUID parameter
 * @returns {Object} 403 - Not permitted
 * @returns {Object} 404 - Participant not found
 * @status IN USE
 */
async function getParticipant(req, res) {
  const participantUUID = req.params.id;
  const meetingUUID = req.params.meeting;
  const userUUID = req.session.user.id;

  if (!participantUUID || !meetingUUID) {
    return res.status(400).json({
      success: false,
      error: "Participant UUID and Meeting UUID parameters are required"
    });
  }

  const participant = await attendanceRepository.getParticipant(participantUUID, meetingUUID);
  const meeting = await attendanceRepository.getMeetingByUUID(meetingUUID);

  if (!participant) {
    return res.status(404).json({
      success: false,
      error: "Participant not found"
    });
  }

  if (participant.participantUuid !== userUUID && meeting.creatorUuid !== userUUID) {
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

/**
 * Create multiple participants for a meeting
 * @param {Object} req - Request with participants array in body
 * @param {Object} res - Response
 * @returns {Object} 201 - Participants created successfully
 * @returns {Object} 400 - Missing participants data or invalid participant data
 * @returns {Object} 403 - Not permitted
 * @returns {Object} 404 - Meeting not found
 * @status IN USE
 */
async function createParticipants(req, res) {
  const participants = req.body.participants;
  if (!participants) {
    return res.status(400).json({
      success: false,
      error: "Participants data is required"
    });
  }
  participants.forEach(participant => attendanceValidator.validateParticipantData(participant));

  const userContext = await userContextRepository.getUserContext(req.session.user.id);

  const existingUsers = await userRepository.getUsersByUuids(
    participants.map(participant => participant.participantUUID)
  );
  if (existingUsers.length !== participants.length) {
    return res.status(400).json({
      success: false,
      error: "One or more participants refer to non-existing users"
    });
  }

  const seenMeetings = new Map();

  for (const participant of participants) {
    let meeting;
    if (!seenMeetings.has(participant.meetingUUID)) {
      meeting = await attendanceRepository.getMeetingByUUID(participant.meetingUUID);
      if (!meeting) {
        return res.status(404).json({
          success: false,
          error: `Meeting ${participant.meetingUUID} not found`
        });
      }
      seenMeetings.set(participant.meetingUUID, meeting);
    } else {
      meeting = seenMeetings.get(participant.meetingUUID);
    }
  }

  for (const meeting of seenMeetings.values()) {
    const isInActiveCourse = (
      userContext.enrollments.some(enrollment =>
        enrollment.course.courseUuid === meeting.courseUuid && enrollment.course.term.isActive
      )
    );
    if (!isInActiveCourse) {
      return res.status(403).json({
        success: false,
        error: "Not authroized to add participants for this meeting"
      });
    }

    if (meeting.creatorUuid !== req.session.user.id) {
      return res.status(403).json({
        success: false,
        error: "Only the meeting creator can add participants"
      });
    }
  }

  const createdParticipants = await attendanceRepository.createParticipants(
    participants.map(p => ({
      participantUuid: p.participantUUID,
      meetingUuid: p.meetingUUID,
      present: p.present || false
    }))
  );

  return res.status(201).json({
    success: true,
    data: attendanceDTO.toParticipantListDTO(createdParticipants)
  });
}

/**
 * Update a participant's attendance status
 * @param {Object} req - Request with meeting UUID, participant UUID, and attendance data in body
 * @param {Object} res - Response
 * @returns {Object} 200 - Participant updated successfully
 * @returns {Object} 400 - Missing participant or meeting UUID
 * @returns {Object} 403 - Not permitted
 * @returns {Object} 404 - Participant or meeting not found
 * @status IN USE
 */
async function updateParticipant(req, res) {
  const userUUID = req.session.user.id;
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

  const meeting = await attendanceRepository.getMeetingByUUID(meetingUUID);
  if (!meeting) {
    return res.status(404).json({
      success: false,
      error: "Meeting not found"
    });
  }

  const userContext = await userContextRepository.getUserContext(userUUID);
  const isInActiveCourse = (
    userContext.enrollments.some(enrollment =>
      enrollment.course.courseUUID === meeting.courseUUID && enrollment.course.term.isActive
    )
  );
  if (!isInActiveCourse) {
    return res.status(403).json({
      success: false,
      error: "Not authroized to update participants for this meeting"
    });
  }

  if (meeting.creatorUuid !== userUUID) {
    return res.status(403).json({
      success: false,
      error: "Only the meeting creator can update participants"
    });
  }

  const updatedParticipant = await attendanceRepository.updateParticipant(
    meetingUUID,
    participantUUID,
    present || participant.present,
    participant.attendanceTime
  );

  return res.status(200).json({
    success: true,
    data: attendanceDTO.toParticipantDTO(updatedParticipant)
  });
}

/**
 * Delete a participant from a meeting
 * @param {Object} req - Request with meeting UUID and participant UUID in params
 * @param {Object} res - Response
 * @returns {Object} 200 - Participant deleted successfully
 * @returns {Object} 400 - Missing participant or meeting UUID
 * @returns {Object} 403 - Not permitted
 * @returns {Object} 404 - Participant or meeting not found
 * @status IN USE
 */
async function deleteParticipant(req, res) {
  const userUUID = req.session.user.id;
  const {
    meetingUUID,
    participantUUID
  } = req.params;

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

  const meeting = await attendanceRepository.getMeetingByUUID(meetingUUID);
  if (!meeting) {
    return res.status(404).json({
      success: false,
      error: "Meeting not found"
    });
  }

  const userContext = await userContextRepository.getUserContext(userUUID);
  const isInActiveCourse = (
    userContext.enrollments.some(enrollment =>
      enrollment.course.courseUUID === meeting.courseUUID && enrollment.course.term.isActive
    )
  );
  if (!isInActiveCourse) {
    return res.status(403).json({
      success: false,
      error: "Not authroized to delete participants for this meeting"
    });
  }

  if (meeting.creatorUuid !== userUUID) {
    return res.status(403).json({
      success: false,
      error: "Only the meeting creator can delete participants"
    });
  }

  await attendanceRepository.deleteParticipant(meetingUUID, participantUUID);

  return res.status(200).json({
    success: true,
    data: {
      message: "Participant deleted successfully"
    }
  });
}

/**
 * Get a list of participants filtered by parameters
 * @param {Object} req - Request with meeting UUID, course UUID, and/or present filter in body
 * @param {Object} res - Response
 * @returns {Object} 200 - Participant list
 * @returns {Object} 400 - Missing required filter parameters
 * @returns {Object} 403 - Not permitted
 * @returns {Object} 404 - No participants found or meeting/course not found
 * @status IN USE
 */
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
  const userContext = await userContextRepository.getUserContext(userUUID);
  const meeting = await attendanceRepository.getMeetingByUUID(meetingUUID);
  const course = await attendanceRepository.getCourseByUUID(courseUUID);

  if (meetingUUID && !meeting) {
    return res.status(404).json({
      success: false,
      error: "Meeting not found"
    });
  }

  if (courseUUID && !course) {
    return res.status(404).json({
      success: false,
      error: "Course not found"
    });
  }

  if (courseUUID) {
    const isInCourse = userContext.enrollments.some(enrollment =>
      enrollment.course.courseUUID === courseUUID
    );
    if (!isInCourse && !isStaff) {
      return res.status(403).json({
        success: false,
        error: "Not authorized to view participants for this course"
      });
    }
  }

  if (meetingUUID && meeting.creatorUuid !== userUUID && !isStaff) {
    return res.status(403).json({
      success: false,
      error: "Not authorized to view participants for this meeting"
    });
  }

  if (!meetingUUID && !courseUUID) {
    return res.status(400).json({
      success: false,
      error: "At least one of meetingUUID or courseUUID must be provided"
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

/**
 * Create a meeting code for attendance recording
 * @param {Object} req - Request with meeting UUID in params and user auth data
 * @param {Object} res - Response
 * @returns {Object} 201 - Meeting code created successfully
 * @returns {Object} 403 - Not permitted
 * @returns {Object} 404 - Meeting not found
 * @status IN USE
 */
async function createMeetingCode(req, res) {
  const meetingUUID = req.params.id;
  const userUUID = req.session.user.id;

  const meeting = await attendanceRepository.getMeetingByUUID(meetingUUID);
  if (!meeting) {
    return res.status(404).json({
      success: false,
      error: "Meeting not found"
    });
  }

  if (meeting.creatorUuid !== userUUID) {
    return res.status(403).json({
      success: false,
      error: "Only the meeting creator can create meeting codes"
    });
  }

  const meetingCode = Math.random().toString(36).substring(2).substring(0, 6).toUpperCase();

  // TODO(bukhradze): replace hostname
  const HOSTNAME = "conductor-tool.ucsd.edu";
  const redirectURL = `https://${HOSTNAME}/attendance/record/?meeting=${meetingUUID}&code=${meetingCode}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${redirectURL}&size=200x200`;

  const validStartDatetime = meeting.meetingStartTime;
  const validEndDatetime = meeting.meetingEndTime;

  const codeData = {
    qrUrl: qrUrl,
    meetingUuid: meetingUUID,
    meetingCode: meetingCode,
    validStartDatetime: validStartDatetime,
    validEndDatetime: validEndDatetime
  };

  const createdCode = await attendanceRepository.createMeetingCode(codeData);

  return createdCode;
}

/**
 * Get meeting code for standalone endpoint (sends response)
 */
async function getMeetingCodeResponse(req, res) {
  const meetingUUID = req.params.id;
  const userUUID = req.session.user.id;

  const meeting = await attendanceRepository.getMeetingByUUID(meetingUUID);
  if (!meeting) {
    return res.status(404).json({
      success: false,
      error: "Meeting not found"
    });
  }

  if (meeting.creatorUuid !== userUUID) {
    return res.status(403).json({
      success: false,
      error: "Only the meeting creator can create meeting codes"
    });
  }

  const meetingCode = Math.random().toString(36).substring(2).substring(0, 6).toUpperCase();

  // TODO(bukhradze): replace hostname
  const HOSTNAME = "conductor-tool.ucsd.edu";
  const redirectURL = `https://${HOSTNAME}/attendance/record/?meeting=${meetingUUID}&code=${meetingCode}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${redirectURL}&size=200x200`;

  const validStartDatetime = meeting.meetingStartTime;
  const validEndDatetime = meeting.meetingEndTime;

  const codeData = {
    qrUrl: qrUrl,
    meetingUuid: meetingUUID,
    meetingCode: meetingCode,
    validStartDatetime: validStartDatetime,
    validEndDatetime: validEndDatetime
  };

  const createdCode = await attendanceRepository.createMeetingCode(codeData);

  return res.status(201).json({
    success: true,
    data: createdCode
  });
}

/**
 * Retrieve a meeting code by meeting UUID
 * @param {Object} req - Request with meeting UUID in params and user auth data
 * @param {Object} res - Response
 * @returns {Object} 200 - Meeting code data
 * @returns {Object} 403 - Not permitted
 * @returns {Object} 404 - Meeting or meeting code not found
 * @status IN USE
 */
async function getMeetingCode(req, res) {
  const meetingUUID = req.params.id;
  const userUUID = req.session.user.id;

  const meeting = await attendanceRepository.getMeetingByUUID(meetingUUID);
  if (!meeting) {
    return res.status(404).json({
      success: false,
      error: "Meeting not found"
    });
  }

  // Only the meeting creator can retrieve codes
  if (meeting.creatorUuid !== userUUID) {
    return res.status(403).json({
      success: false,
      error: "Only the meeting creator can retrieve meeting codes"
    });
  }

  const meetingCode = await attendanceRepository.getMeetingCodeByMeetingUuid(meetingUUID);
  if (!meetingCode) {
    return res.status(404).json({
      success: false,
      error: "Meeting code not found"
    });
  }

  return res.status(200).json({
    success: true,
    data: meetingCode
  });
}

/**
 * Record a participant's attendance using a meeting code
 * @param {Object} req - Request with meeting UUID and meeting code in params, user auth data in session
 * @param {Object} res - Response
 * @returns {Object} 200 - Attendance recorded successfully
 * @returns {Object} 403 - Code invalid or not a participant
 * @returns {Object} 404 - Meeting code not found
 * @status IN USE
 */
async function recordAttendanceViaCode(req, res) {
  const meetingUUID = req.params.meeting;
  const meetingCode = req.params.code;
  const userUUID = req.session.user.id;

  const participant = await attendanceRepository.getParticipant(userUUID, meetingUUID);
  if (!participant) {
    return res.status(403).json({
      success: false,
      error: "User is not a participant of this meeting"
    });
  }

  const meetingCodeData = await attendanceRepository.getMeetingCodeByMeetingUuidAndCode(meetingUUID, meetingCode);
  if (!meetingCodeData) {
    return res.status(404).json({
      success: false,
      error: "Meeting code not found"
    });
  }

  const now = new Date();
  if (now < meetingCodeData.validStartDatetime || now > meetingCodeData.validEndDatetime) {
    return res.status(403).json({
      success: false,
      error: "Meeting code is not valid at this time"
    });
  }

  const updatedParticipant = await attendanceRepository.updateParticipant(
    meetingUUID,
    userUUID,
    true,
    now
  );

  return res.status(200).json({
    success: true,
    data: attendanceDTO.toParticipantDTO(updatedParticipant)
  });
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
  getParticipantListByParams,
  getMeetingCode,
  recordAttendanceViaCode
};
