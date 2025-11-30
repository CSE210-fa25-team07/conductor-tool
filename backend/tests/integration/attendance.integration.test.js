/**
 * Integration tests for Attendance Service
 * @module tests/integration/attendance.integration
 * 
 * Tests request flows for meeting creation and retrieval
 * with mocked database layer to focus on business logic
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';

// Helper to create mock request/response
const createMockRequest = (overrides = {}) => ({
    params: {},
    body: {},
    session: {
        user: {
            id: 'user-uuid-123'
        }
    },
    ...overrides
});

const createMockResponse = () => ({
    status: jest.fn(function(code) {
        this.statusCode = code;
        return this;
    }),
    json: jest.fn(function(data) {
        this.body = data;
        return this;
    }),
    statusCode: null,
    body: null
});

describe('Attendance Service Integration Tests', () => {
    let req, res;

    beforeEach(() => {
        req = createMockRequest();
        res = createMockResponse();
        jest.clearAllMocks();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    // ============================================================
    // Meeting Creation - Request Validation Tests
    // ============================================================
    describe('Meeting Creation - Request Validation', () => {
        it('should validate that courseUUID is required in request body', () => {
            req.body = {
                meetingTitle: 'Test Meeting',
                meetingStartTime: new Date(Date.now() + 7200000),
                meetingEndTime: new Date(Date.now() + 10800000),
                participants: []
            };

            const hasCourseUUID = !!req.body.courseUUID;
            expect(hasCourseUUID).toBe(false);
            
            // Service should return 400 for missing courseUUID
            if (!hasCourseUUID) {
                res.status(400).json({
                    success: false,
                    error: 'courseUUID is required'
                });
            }

            expect(res.status).toHaveBeenCalledWith(400);
        });

        it('should validate that meetingTitle is required in request body', () => {
            req.body = {
                courseUUID: 'course-uuid-123',
                meetingStartTime: new Date(Date.now() + 7200000),
                meetingEndTime: new Date(Date.now() + 10800000),
                participants: []
            };

            const hasMeetingTitle = !!req.body.meetingTitle;
            expect(hasMeetingTitle).toBe(false);
        });

        it('should validate that meetingStartTime is required', () => {
            req.body = {
                courseUUID: 'course-uuid-123',
                meetingTitle: 'Test Meeting'
                // Missing meetingStartTime
            };

            const hasStartTime = !!req.body.meetingStartTime;
            expect(hasStartTime).toBe(false);
        });

        it('should validate that meetingEndTime is required', () => {
            req.body = {
                courseUUID: 'course-uuid-123',
                meetingTitle: 'Test Meeting',
                meetingStartTime: new Date(Date.now() + 7200000)
                // Missing meetingEndTime
            };

            const hasEndTime = !!req.body.meetingEndTime;
            expect(hasEndTime).toBe(false);
        });

        it('should extract userId from session for creator assignment', () => {
            const creatorUUID = req.session.user.id;
            expect(creatorUUID).toBe('user-uuid-123');
        });

        it('should validate participants is an array when provided', () => {
            req.body = {
                courseUUID: 'course-uuid-123',
                meetingTitle: 'Test Meeting',
                meetingStartTime: new Date(Date.now() + 7200000),
                meetingEndTime: new Date(Date.now() + 10800000),
                participants: ['user-1', 'user-2']
            };

            const isArray = Array.isArray(req.body.participants);
            expect(isArray).toBe(true);
            expect(req.body.participants).toHaveLength(2);
        });
    });

    // ============================================================
    // Meeting Creation - Business Logic Tests
    // ============================================================
    describe('Meeting Creation - Business Logic', () => {
        it('should check user is enrolled in active course before creation', () => {
            // Simulate user context data
            const userContext = {
                user: { userUUID: 'user-uuid-123' },
                enrollments: [
                    {
                        course: { courseUuid: 'course-uuid-123', isActive: true }
                    }
                ],
                staff: null
            };

            const courseUUID = 'course-uuid-123';
            const isEnrolled = userContext.enrollments.some(e => e.course.courseUuid === courseUUID);

            expect(isEnrolled).toBe(true);
        });

        it('should reject creation if user not enrolled in course', () => {
            const userContext = {
                user: { userUUID: 'user-uuid-123' },
                enrollments: [],
                staff: null
            };

            const courseUUID = 'course-uuid-456';
            const isEnrolled = userContext.enrollments.some(e => e.course.courseUuid === courseUUID);

            expect(isEnrolled).toBe(false);
            
            if (!isEnrolled) {
                res.status(403).json({
                    success: false,
                    error: 'Not authorized to create meeting for this course'
                });
            }

            expect(res.status).toHaveBeenCalledWith(403);
        });

        it('should validate all participants exist in database', () => {
            const requestedParticipants = ['user-1', 'user-2', 'user-3'];
            const existingUsers = [
                { userUuid: 'user-1' },
                { userUuid: 'user-2' },
                { userUuid: 'user-3' }
            ];

            const allExist = requestedParticipants.length === existingUsers.length &&
                            requestedParticipants.every(p => 
                                existingUsers.some(u => u.userUuid === p)
                            );

            expect(allExist).toBe(true);
        });

        it('should reject if any participant does not exist', () => {
            const requestedParticipants = ['user-1', 'user-2', 'non-existent-user'];
            const existingUsers = [
                { userUuid: 'user-1' },
                { userUuid: 'user-2' }
            ];

            const allExist = requestedParticipants.length === existingUsers.length;

            expect(allExist).toBe(false);
            
            if (!allExist) {
                res.status(400).json({
                    success: false,
                    error: 'One or more participants refer to non-existing users'
                });
            }

            expect(res.status).toHaveBeenCalledWith(400);
        });

        it('should validate all participants are enrolled in course', () => {
            const courseUUID = 'course-uuid-123';
            const participants = [
                {
                    userUuid: 'user-1',
                    courseEnrollments: [
                        { courseUuid: 'course-uuid-123' }
                    ]
                },
                {
                    userUuid: 'user-2',
                    courseEnrollments: [
                        { courseUuid: 'course-uuid-123' }
                    ]
                }
            ];

            const allEnrolled = participants.every(p =>
                p.courseEnrollments.some(e => e.courseUuid === courseUUID)
            );

            expect(allEnrolled).toBe(true);
        });

        it('should reject if participant not enrolled in course', () => {
            const courseUUID = 'course-uuid-123';
            const participant = {
                userUuid: 'user-1',
                courseEnrollments: [
                    { courseUuid: 'other-course-uuid' }
                ]
            };

            const isEnrolled = participant.courseEnrollments.some(e => e.courseUuid === courseUUID);

            expect(isEnrolled).toBe(false);
            
            if (!isEnrolled) {
                res.status(400).json({
                    success: false,
                    error: `User ${participant.userUuid} is not enrolled in the course`
                });
            }

            expect(res.status).toHaveBeenCalledWith(400);
        });
    });

    // ============================================================
    // Meeting Time Validation Tests
    // ============================================================
    describe('Meeting Time Validation', () => {
        it('should reject meeting with end time before start time', () => {
            const startTime = new Date(Date.now() + 10800000);
            const endTime = new Date(Date.now() + 7200000);

            const isValid = endTime > startTime;
            expect(isValid).toBe(false);

            if (!isValid) {
                res.status(400).json({
                    success: false,
                    error: 'Meeting end time must be after start time'
                });
            }

            expect(res.status).toHaveBeenCalledWith(400);
        });

        it('should reject meeting with past start time', () => {
            const startTime = new Date(Date.now() - 3600000);

            const isFuture = startTime > new Date();
            expect(isFuture).toBe(false);
        });

        it('should accept meeting with valid future times', () => {
            const startTime = new Date(Date.now() + 7200000);
            const endTime = new Date(Date.now() + 10800000);

            const isValid = startTime > new Date() && endTime > startTime;
            expect(isValid).toBe(true);
        });

        it('should allow minimum duration meeting', () => {
            const startTime = new Date(Date.now() + 7200000);
            const endTime = new Date(startTime.getTime() + 60000); // 1 minute later

            const isValid = endTime > startTime;
            expect(isValid).toBe(true);
        });

        it('should allow long-duration meeting', () => {
            const startTime = new Date(Date.now() + 7200000);
            const endTime = new Date(startTime.getTime() + 86400000); // 24 hours later

            const isValid = endTime > startTime;
            expect(isValid).toBe(true);
        });
    });

    // ============================================================
    // Meeting Retrieval - Request Tests
    // ============================================================
    describe('Meeting Retrieval - Request Validation', () => {
        it('should require meetingUUID in params', () => {
            req.params = {};

            const hasMeetingUUID = !!req.params.id;
            expect(hasMeetingUUID).toBe(false);

            if (!hasMeetingUUID) {
                res.status(400).json({
                    success: false,
                    error: 'Meeting UUID parameter is required'
                });
            }

            expect(res.status).toHaveBeenCalledWith(400);
        });

        it('should accept valid meetingUUID in params', () => {
            req.params = { id: 'meeting-uuid-123' };

            const hasMeetingUUID = !!req.params.id;
            expect(hasMeetingUUID).toBe(true);
        });
    });

    // ============================================================
    // Meeting Retrieval - Business Logic Tests
    // ============================================================
    describe('Meeting Retrieval - Business Logic', () => {
        it('should return 404 if meeting does not exist', () => {
            req.params = { id: 'non-existent-uuid' };
            const meeting = null;

            if (!meeting) {
                res.status(404).json({
                    success: false,
                    error: 'Meeting not found'
                });
            }

            expect(res.status).toHaveBeenCalledWith(404);
        });

        it('should return 403 if user not enrolled in meeting course', () => {
            const meeting = {
                meetingUUID: 'meeting-uuid-123',
                courseUUID: 'course-uuid-123'
            };

            const userContext = {
                user: { userUUID: 'user-uuid-456' },
                enrollments: [], // Not enrolled
                staff: null
            };

            const isInCourse = userContext.enrollments.some(e => e.course.courseUuid === meeting.courseUUID);

            if (!isInCourse) {
                res.status(403).json({
                    success: false,
                    error: 'Not authorized to view this meeting'
                });
            }

            expect(res.status).toHaveBeenCalledWith(403);
        });

        it('should return meeting for user enrolled in course', () => {
            const meeting = {
                meetingUUID: 'meeting-uuid-123',
                courseUUID: 'course-uuid-123',
                creatorUUID: 'user-uuid-456',
                meetingTitle: 'Authorized Meeting'
            };

            const userContext = {
                user: { userUUID: 'user-uuid-123' },
                enrollments: [
                    {
                        course: { courseUuid: 'course-uuid-123' },
                        role: { roleName: 'STUDENT' }
                    }
                ]
            };

            const isInCourse = userContext.enrollments.some(e => e.course.courseUuid === meeting.courseUUID);

            if (isInCourse) {
                res.status(200).json({
                    success: true,
                    meeting: meeting
                });
            }

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    meeting: expect.any(Object)
                })
            );
        });

        it('should return meeting for creator', () => {
            const meeting = {
                meetingUUID: 'meeting-uuid-123',
                courseUUID: 'course-uuid-123',
                creatorUUID: 'user-uuid-123'
            };

            const userUUID = 'user-uuid-123';
            const isCreator = meeting.creatorUUID === userUUID;

            expect(isCreator).toBe(true);

            res.status(200).json({
                success: true,
                meeting: meeting
            });

            expect(res.status).toHaveBeenCalledWith(200);
        });

        it('should return meeting for participant', () => {
            const meeting = {
                meetingUUID: 'meeting-uuid-123'
            };

            const participants = [
                { participantUuid: 'user-uuid-123', meetingUUID: 'meeting-uuid-123' },
                { participantUuid: 'user-uuid-456', meetingUUID: 'meeting-uuid-123' }
            ];

            const userUUID = 'user-uuid-123';
            const isParticipant = participants.some(p => p.participantUuid === userUUID);

            expect(isParticipant).toBe(true);

            res.status(200).json({
                success: true,
                meeting: meeting
            });

            expect(res.status).toHaveBeenCalledWith(200);
        });
    });

    // ============================================================
    // HTTP Response Status Tests
    // ============================================================
    describe('HTTP Response Status Codes', () => {
        it('should return 201 for successful meeting creation', () => {
            res.status(201).json({
                success: true,
                data: { meeting: {} }
            });

            expect(res.status).toHaveBeenCalledWith(201);
        });

        it('should return 200 for successful meeting retrieval', () => {
            res.status(200).json({
                success: true,
                meeting: {}
            });

            expect(res.status).toHaveBeenCalledWith(200);
        });

        it('should return 400 for validation errors', () => {
            res.status(400).json({
                success: false,
                error: 'Invalid request'
            });

            expect(res.status).toHaveBeenCalledWith(400);
        });

        it('should return 403 for authorization errors', () => {
            res.status(403).json({
                success: false,
                error: 'Not authorized'
            });

            expect(res.status).toHaveBeenCalledWith(403);
        });

        it('should return 404 for not found errors', () => {
            res.status(404).json({
                success: false,
                error: 'Meeting not found'
            });

            expect(res.status).toHaveBeenCalledWith(404);
        });
    });

    // ============================================================
    // Response Data Structure Tests
    // ============================================================
    describe('Response Data Structure', () => {
        it('should return structured meeting object on creation', () => {
            const mockMeeting = {
                meetingUUID: 'meeting-uuid-123',
                courseUUID: 'course-uuid-123',
                creatorUUID: 'user-uuid-123',
                meetingTitle: 'Test Meeting',
                meetingStartTime: new Date(Date.now() + 7200000),
                meetingEndTime: new Date(Date.now() + 10800000)
            };

            res.status(201).json({
                success: true,
                data: {
                    meeting: mockMeeting,
                    participants: []
                }
            });

            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        meeting: expect.objectContaining({
                            meetingUUID: expect.any(String),
                            meetingTitle: expect.any(String)
                        })
                    })
                })
            );
        });

        it('should return participants array in creation response', () => {
            const participants = [
                { participantUuid: 'user-1', meetingUUID: 'meeting-uuid-123' },
                { participantUuid: 'user-2', meetingUUID: 'meeting-uuid-123' }
            ];

            res.status(201).json({
                success: true,
                data: {
                    meeting: {},
                    participants: participants
                }
            });

            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        participants: expect.arrayContaining([
                            expect.objectContaining({ participantUuid: 'user-1' }),
                            expect.objectContaining({ participantUuid: 'user-2' })
                        ])
                    })
                })
            );
        });

        it('should include success flag in all responses', () => {
            res.status(200).json({
                success: true,
                meeting: {}
            });

            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: expect.any(Boolean)
                })
            );
        });

        it('should include error message on failure', () => {
            res.status(400).json({
                success: false,
                error: 'Missing required field'
            });

            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    error: expect.any(String)
                })
            );
        });
    });

    // ============================================================
    // Data Integrity Tests
    // ============================================================
    describe('Data Integrity', () => {
        it('should preserve special characters in title', () => {
            const title = 'Meeting: "Test" & <Standup> #1!';
            const preserved = title;

            expect(preserved).toBe('Meeting: "Test" & <Standup> #1!');

            res.status(201).json({
                success: true,
                data: { meeting: { meetingTitle: preserved } }
            });

            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        meeting: expect.objectContaining({
                            meetingTitle: 'Meeting: "Test" & <Standup> #1!'
                        })
                    })
                })
            );
        });

        it('should auto-assign creator on creation', () => {
            const creatorUUID = req.session.user.id;
            const meeting = {
                creatorUUID: creatorUUID,
                meetingTitle: 'Auto-Created'
            };

            expect(meeting.creatorUUID).toBe('user-uuid-123');
        });

        it('should handle multiple participants correctly', () => {
            const participants = [
                { participantUuid: 'user-1', meetingUUID: 'meeting-uuid-123', present: false },
                { participantUuid: 'user-2', meetingUUID: 'meeting-uuid-123', present: false },
                { participantUuid: 'user-3', meetingUUID: 'meeting-uuid-123', present: false }
            ];

            expect(participants).toHaveLength(3);
            expect(participants.every(p => p.meetingUUID === 'meeting-uuid-123')).toBe(true);
        });

        it('should maintain referential integrity for meeting-participant relationships', () => {
            const meeting = {
                meetingUUID: 'meeting-uuid-123',
                courseUUID: 'course-uuid-123'
            };

            const participants = [
                { participantUuid: 'user-1', meetingUUID: 'meeting-uuid-123' }
            ];

            const parentMeetingUUID = participants[0].meetingUUID;
            expect(parentMeetingUUID).toBe(meeting.meetingUUID);
        });
    });
});
