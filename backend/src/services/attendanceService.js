/**
 * Attendance Service - business logic for meetings and attendance
 * @module attendance/service
 */

import * as attendanceRepository from "../repositories/attendanceRepository.js";
import * as attendanceValidator from "../validators/attendanceValidator.js";
import * as userContextRepository from "../repositories/userContextRepository.js";
import { RoleEnum } from "../enums/role.js";
import * as attendanceDTO from "../dtos/attendanceDto.js";
import * as userRepository from "../repositories/userRepository.js";
import * as courseRepository from "../repositories/courseRepository.js";

/**
 * Get a meeting by UUID
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

  const participants = await attendanceRepository.getParticipantListByParams({ meetingUUID: meeting.meetingUuid }, res);

  let isInMeeting = false;
  participants.forEach(participant => {
    if (participant.participantUuid === userContext.user.userUuid) {
      isInMeeting = true;
    }
  });
  isInMeeting = isInMeeting || meeting.creatorUuid === userContext.user.userUuid;
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
 * Create a new meeting
 */
async function createMeeting(req, res) {
  const userUUID = req.session.user.id;

  // TODO(bukhradze): This does not create recurring meetings!

  // Add creatorUUID to request body if not provided
  if (!req.body.creatorUUID || req.body.creatorUUID !== userUUID) {
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
    participants,
    parentMeetingUUID
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

  const uniqueParticipants = [...new Set(participants.filter(p => p && typeof p === "string" && p.trim() !== ""))];

  if (uniqueParticipants.length === 0) {
    // Meeting can be created without participants
  } else {
    const existingUsers = await userRepository.getUsersByUuids(
      uniqueParticipants
    );

    if (existingUsers.length !== uniqueParticipants.length) {
      const foundUuids = new Set(existingUsers.map(u => u.userUuid));
      const missingUuids = uniqueParticipants.filter(uuid => !foundUuids.has(uuid));
      if (missingUuids.length > 0) {
        return res.status(400).json({
          success: false,
          error: "One or more participants refer to non-existing users"
        });
      }
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
  }

  const meetingDataForRepository = {
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
  };

  if (parentMeetingUUID?.trim()) {
    meetingDataForRepository.parentMeetingUUID = parentMeetingUUID;
  }

  const meeting = await attendanceRepository.createMeeting(meetingDataForRepository);

  // Add creator as a participant (they should also see the meeting on their calendar)
  const allParticipants = [...new Set([userUUID, ...uniqueParticipants])];

  const createdParticipants = await attendanceRepository.createParticipants(
    allParticipants.map(participant => ({
      participantUuid: participant,
      meetingUuid: meeting.meetingUuid,
      present: false
    }))
  );

  // Create meeting code for the newly created meeting
  return res.status(201).json({
    success: true,
    data: {
      meeting: attendanceDTO.toMeetingDTO(meeting),
      participants: createdParticipants.data
    }
  });
}

/**
 * Update a meeting
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
      enrollment.course.courseUuid === courseUUID && enrollment.course.term.isActive
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
    meetingUUID: existingMeeting.meetingUuid,
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
 * Delete a meeting
 */
async function deleteMeeting(req, res) {
  const userUUID = req.session.user.id;
  const meetingUUID = req.params.id;
  const deleteFutureRaw = (req.body && req.body.deleteFuture !== undefined) ? req.body.deleteFuture : req.query?.deleteFuture;
  const deleteFuture = deleteFutureRaw === true || deleteFutureRaw === "true";

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
      enrollment.course.courseUuid === courseUUID && enrollment.course.term.isActive
    )
  );

  // Check if user is staff (Professor or TA) in the course
  const courseEnrollment = userContext.enrollments.find(
    enrollment => enrollment.course.courseUuid === courseUUID
  );
  const userRole = courseEnrollment?.role?.role;
  const isStaff = userRole === RoleEnum.PROFESSOR || userRole === RoleEnum.TA;
  const isCreator = existingMeeting.creatorUuid === userUUID;

  // Authorization check: allow deleting past meetings if deleteFuture is true
  // (user wants to delete future meetings, so allow deleting the past one too)
  const canDelete = (
    isInActiveCourse
        && (isCreator || isStaff)
        && (deleteFuture || existingMeeting.meetingEndTime > new Date())
  );
  if (!canDelete) {
    return res.status(403).json({
      success: false,
      error: "Not authorized to delete meeting for this course"
    });
  }

  if (deleteFuture) {
    const meetingDateObj = new Date(existingMeeting.meetingDate);
    const fromDate = new Date(Date.UTC(
      meetingDateObj.getUTCFullYear(),
      meetingDateObj.getUTCMonth(),
      meetingDateObj.getUTCDate(),
      0, 0, 0, 0
    ));
    await attendanceRepository.deleteFutureMeetingsByParentUUID(meetingUUID, fromDate);
  } else {
    await attendanceRepository.deleteMeeting(meetingUUID);
  }

  return res.status(200).json({
    success: true,
    message: "Meeting deleted successfully"
  });
}

/**
 * Get meeting list by course UUID
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
 * Get a participant from a meeting
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
 * Create participants for a meeting
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
      enrollment.course.courseUuid === meeting.courseUuid && enrollment.course.term.isActive
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
      enrollment.course.courseUuid === meeting.courseUuid && enrollment.course.term.isActive
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
 * Get participants filtered by params (meetingUUID, courseUUID, present)
 */
async function getParticipantListByParams(req, res) {
  const {
    meetingUUID,
    courseUUID,
    present
  } = req.body;

  const userUUID = req.session.user.id;

  const userContext = await userContextRepository.getUserContext(userUUID);
  const meeting = await attendanceRepository.getMeetingByUUID(meetingUUID);

  // Determine the courseUUID - prefer from request, fallback to meeting's course
  const effectiveCourseUUID = courseUUID || (meeting ? meeting.courseUuid : null);
  const course = effectiveCourseUUID ? await courseRepository.getCourseByUuid(effectiveCourseUUID) : null;

  if (meetingUUID && !meeting) {
    return res.status(404).json({
      success: false,
      error: "Meeting not found"
    });
  }

  if (effectiveCourseUUID && !course) {
    return res.status(404).json({
      success: false,
      error: "Course not found"
    });
  }

  // Check if user is staff (Professor or TA) for the course
  const isStaff = effectiveCourseUUID ? await userContextRepository.checkCourseStaffRole(
    userUUID,
    effectiveCourseUUID
  ) : false;

  if (effectiveCourseUUID) {
    const isInCourse = userContext.enrollments.some(enrollment =>
      enrollment.course.courseUuid === effectiveCourseUUID
    );
    if (!isInCourse && !isStaff) {
      return res.status(403).json({
        success: false,
        error: "Not authorized to view participants for this course"
      });
    }
  }

  // Check if user is the creator of the meeting
  const isCreator = meetingUUID && meeting && meeting.creatorUuid === userUUID;

  // Check if user is a participant of the meeting
  let isParticipant = false;
  if (meetingUUID && meeting) {
    const userParticipation = await attendanceRepository.getParticipantListByParams({
      meetingUUID,
      participantUUID: userUUID
    });
    isParticipant = userParticipation && userParticipation.length > 0;
  }

  // Only allow if user is creator, staff, or a participant of the meeting
  if (meetingUUID && !isCreator && !isStaff && !isParticipant) {
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

  const participantFilter = (isStaff || isCreator || isParticipant) ? null : userUUID;

  const participants = await attendanceRepository.getParticipantListByParams({
    meetingUUID,
    courseUUID,
    participantUUID: participantFilter,
    present
  });

  if (!participants || participants.length === 0) {
    return res.status(200).json({
      success: true,
      data: []
    });
  }

  const participantDTOs = attendanceDTO.toParticipantListDTO(participants);

  return res.status(200).json({
    success: true,
    data: participantDTOs
  });
}

/**
 * Create a meeting code for attendance
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
  const redirectURL = `https://${HOSTNAME}/attendance/record/${meetingUUID}/${meetingCode}`;
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
 * Get meeting code by meeting UUID
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
 * Record attendance using a meeting code
 */
async function recordAttendanceViaCode(req, res) {
  // Accept meeting as either query param (from QR redirect) or route param
  const meetingUUID = req.query.meeting || req.params.meeting || req.params.id;
  const meetingCode = req.params.code || req.params.id;
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

  // Compare times in UTC - both Date objects represent absolute moments in time
  // meetingCodeData.validStartDatetime and validEndDatetime are stored in UTC (from database)
  // and represent the local time the user selected, converted to UTC
  const now = new Date(); // Current UTC time
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
  createMeetingCode,
  recordAttendanceViaCode
};
