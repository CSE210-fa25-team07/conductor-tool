# Architecture Decision Record (ADR)

**ADR #:** 007  
**Title:** Attendance Functionality  
**Date:** 2025-12-04  
**Status:** Implemented

---

## 1. Context

As a part of the conductor app for a software engineering course, there should be a way to manage students' attendance and the meetings throughout the quarter. The system needs to address:

- **Course Staff Requirements:** Consistent way of recording students' attendance throughout various meetings (lectures, discussions, office hours, team meetings)
- **Team Lead Requirements:** Ability to keep track of who attends team meetings
- **Student Requirements:** Clear way of submitting attendance, tracking past attendance, and viewing upcoming meetings

The attendance system, therefore, should have functionality for creating and modifying meetings, recording attendance for each meeting per user, and viewing attendance/meeting data.

---

## 2. Decision

Attendance is implemented as a module within the Conductor App, with primary focus of the module to handle meeting creation and management, as well as attendance recording via mapping meetings and participants (users).

### Tech Stack
- **Backend:** Node.js with Express.js (consistent with main application)
- **Frontend:** Vanilla HTML/CSS/JavaScript (consistent with application pattern)
- **Database:** PostgreSQL (same as main application)
- **Code Generation:** QR codes and alphanumeric codes for attendance verification

### Database Schema

**Meeting Table** (`meeting`)

- `meeting_uuid (UUID)` — Primary key
- `creator_uuid (UUID)` — User who created the meeting (auto-populated, FK to `users`)
- `course_uuid (UUID)` — Associated course (FK to `courses`)
- `meeting_type (INT)` — Type identifier (0=lecture, 1=discussion, etc.)
- `meeting_start_time (TIMESTAMPTZ)` — When meeting starts (UTC timezone)
- `meeting_end_time (TIMESTAMPTZ)` — When meeting ends (UTC timezone)
- `meeting_date (DATE)` — Date of meeting
- `meeting_title (VARCHAR 255)` — Title
- `meeting_description (TEXT)` — Optional description
- `meeting_location (VARCHAR 255)` — Optional physical location
- `is_recurring (BOOLEAN)` — Whether part of recurring series (default: false)
- `parent_meeting_uuid (UUID)` — Reference to parent meeting if recurring (nullable FK to `meeting`)

**Participants Table** (`participants`)

- `meeting_uuid (UUID)` — Foreign key to `meeting`
- `participant_uuid (UUID)` — Foreign key to `users`
- `present (BOOLEAN)` — Attendance status (default: false)
- `attendance_time (TIMESTAMPTZ)` — When attendance was recorded (nullable, UTC timezone)
- Primary Key: `(meeting_uuid, participant_uuid)`
- Foreign Key Constraints: CASCADE on delete

**Meeting Codes Table** (`meeting_codes`)

- `code_uuid (UUID)` — Primary key
- `meeting_uuid (UUID)` — Foreign key to `meeting`
- `meeting_code (VARCHAR 20)` — alphanumeric meeting code
- `qr_url (TEXT)` — URL to generated QR code
- `valid_start_datetime (TIMESTAMPTZ)` — Code active start time (UTC timezone)
- `valid_end_datetime (TIMESTAMPTZ)` — Code expiration time (UTC timezone)
- Foreign Key Constraints: CASCADE on delete

---

## 3. API Endpoints Specification

### Meeting Management

#### 1. GET /attendance/meeting/:id
**Intention:** Retrieve a specific meeting by UUID

**Request Parameters:**
- `req.params.id` (string, required) — UUID of the meeting

**Expected Response (200 OK):**
```json
{
  "success": true,
  "meeting": {
    "meetingUuid": "550e8400-e29b-41d4-a716-446655440000",
    "creatorUuid": "f1eb243f-b8c6-4d9f-be89-3a09ff5116ea",
    "courseUuid": "f1eb243f-b8c6-4d9f-be89-3a09ff5116ea",
    "meetingTitle": "Software Architecture Patterns",
    "meetingDescription": "Discussion of MVC, MVVM, and layered architecture",
    "meetingStartTime": "2025-12-01T10:00:00.000Z",
    "meetingEndTime": "2025-12-01T11:30:00.000Z",
    "meetingDate": "2025-12-01",
    "meetingLocation": "CSE 1202",
    "meetingType": 1,
    "isRecurring": false,
    "parentMeetingUuid": null
  }
}
```

**Error Responses:**

- `400 Bad Request` — Missing meeting UUID parameter
- `403 Forbidden` — Not authorized to view this meeting
- `404 Not Found` — Meeting not found

**Service Logic (`getMeetingByUUID`):**

- Validates meeting UUID parameter exists
- Fetches user context (enrollments, staff status, roles)
- Retrieves meeting from database
- Verifies user is authorized by checking:
  - User enrolled in course where meeting exists
  - User is participant in meeting, OR user is meeting creator, OR user has staff role (Professor/TA/Tutor/Team Leader)
- Returns meeting object with all details

---

#### 2. POST /attendance/meeting/
**Intention:** Create a new meeting with initial participants

**Request Body:**
```json
{
  "courseUUID": "f1eb243f-b8c6-4d9f-be89-3a09ff5116ea",
  "meetingTitle": "Weekly Standup",
  "meetingStartTime": "2025-12-02T14:00:00Z",
  "meetingEndTime": "2025-12-02T15:00:00Z",
  "meetingDate": "2025-12-02",
  "meetingDescription": "Team progress discussion",
  "meetingLocation": "CSE 3140",
  "meetingType": 0,
  "isRecurring": false,
  "participants": ["f1eb243f-b8c6-4d9f-be89-3a09ff5116ea", "f1eb243f-b8c6-4d9f-be89-3a09ff5116ea", "f1eb243f-b8c6-4d9f-be89-3a09ff5116ea"]
}
```

**Expected Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "meeting": {
      "meetingUuid": "550e8400-e29b-41d4-a716-446655440001",
      "creatorUuid": "f1eb243f-b8c6-4d9f-be89-3a09ff5116ea",
      "courseUuid": "f1eb243f-b8c6-4d9f-be89-3a09ff5116ea",
      "meetingTitle": "Weekly Standup",
      "meetingStartTime": "2025-12-02T14:00:00.000Z",
      "meetingEndTime": "2025-12-02T15:00:00.000Z",
      "meetingDate": "2025-12-02",
      "meetingType": 0,
      "isRecurring": false,
      "parentMeetingUuid": null,
      "meetingDescription": "Team progress discussion",
      "meetingLocation": "CSE 3140"
    },
    "participants": [
      { "participantUuid": "f1eb243f-b8c6-4d9f-be89-3a09ff5116ea", "meetingUuid": "550e8400-e29b-41d4-a716-446655440001", "present": false, "attendanceTime": null },
      { "participantUuid": "f1eb243f-b8c6-4d9f-be89-3a09ff5116ea", "meetingUuid": "550e8400-e29b-41d4-a716-446655440001", "present": false, "attendanceTime": null },
      { "participantUuid": "f1eb243f-b8c6-4d9f-be89-3a09ff5116ea", "meetingUuid": "550e8400-e29b-41d4-a716-446655440001", "present": false, "attendanceTime": null }
    ]
  }
}
```

**Error Responses:**

- `400 Bad Request` — Validation error (missing required fields, invalid times, end before start)

**Service Logic (`createMeeting`):**

- Auto-populates `creatorUUID` from session user
- Validates all required fields present (courseUUID, title, times, date)
- Verifies user enrolled in active course
- Deduplicates participant list and filters invalid entries
- Validates all participant UUIDs exist as users
- Validates all participants enrolled in the course
- Creates meeting record with provided data
- Automatically adds creator as participant (present=false)
- Adds all unique participants to database
- Returns meeting and participants data

---

#### 3. PATCH /attendance/meeting/:id
**Intention:** Update an existing meeting

**Request Parameters:**

- `req.params.id` (string, required) — UUID of meeting to update

**Request Body:**
```json
{
  "meetingTitle": "Updated Title",
  "meetingDescription": "Updated description",
  "meetingLocation": "CSE 2140",
  "meetingStartTime": "2025-12-02T15:00:00Z",
  "meetingEndTime": "2025-12-02T16:00:00Z"
}
```

**Expected Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "meetingUuid": "550e8400-e29b-41d4-a716-446655440001",
    "creatorUuid": "f1eb243f-b8c6-4d9f-be89-3a09ff5116ea",
    "courseUuid": "f1eb243f-b8c6-4d9f-be89-3a09ff5116ea",
    "meetingTitle": "Updated Title",
    "meetingDescription": "Updated description",
    "meetingLocation": "CSE 2140",
    "meetingStartTime": "2025-12-02T15:00:00.000Z",
    "meetingEndTime": "2025-12-02T16:00:00.000Z",
    "meetingDate": "2025-12-02",
    "meetingType": 1,
    "isRecurring": false,
    "parentMeetingUuid": null
  }
}
```

**Error Responses:**

- `400 Bad Request` — Missing meeting UUID or validation error
- `403 Forbidden` — Only meeting creator can update
- `404 Not Found` — Meeting not found

**Service Logic (`updateMeeting`):**

- Validates meeting UUID parameter
- Retrieves existing meeting
- Verifies user is meeting creator
- Verifies user in active course for the meeting
- Updates only provided fields (uses existing values for omitted fields)
- Validates time fields if provided (end after start)
- Saves updated meeting to database

---

#### 4. DELETE /attendance/meeting/:id
**Intention:** Delete a meeting (and optionally future recurring meetings)

**Request Parameters:**

- `req.params.id` (string, required) — UUID of meeting to delete

**Request Body:**
```json
{
  "deleteFuture": true
}
```

**Expected Response (200 OK):**
```json
{
  "success": true,
  "message": "Meeting deleted successfully"
}
```

**Error Responses:**

- `400 Bad Request` — Missing meeting UUID
- `403 Forbidden` — Not authorized to delete (not creator, or meeting in past)
- `404 Not Found` — Meeting not found

**Service Logic (`deleteMeeting`):**

- Validates meeting UUID parameter
- Retrieves meeting
- Verifies user is meeting creator
- Verifies user in active course
- Verifies meeting end time is in future (can't delete past meetings)
- Deletes meeting record
- If `deleteFuture=true` and meeting is recurring, deletes all future recurring meetings

---

#### 5. GET /attendance/meeting/list/:courseUUID
**Intention:** Retrieve all meetings for a course (filtered by user role)

**Request Parameters:**

- `req.params.courseUUID` (string, required) — UUID of the course

**Expected Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "meetingUuid": "550e8400-e29b-41d4-a716-446655440000",
      "creatorUuid": "f1eb243f-b8c6-4d9f-be89-3a09ff5116ea",
      "courseUuid": "f1eb243f-b8c6-4d9f-be89-3a09ff5116ea",
      "meetingTitle": "Lecture 1",
      "meetingStartTime": "2025-12-01T10:00:00.000Z",
      "meetingEndTime": "2025-12-01T11:30:00.000Z",
      "meetingDate": "2025-12-01",
      "meetingType": 1,
      "isRecurring": true,
      "parentMeetingUuid": null
    },
    {
      "meetingUuid": "550e8400-e29b-41d4-a716-446655440001",
      "creatorUuid": "f1eb243f-b8c6-4d9f-be89-3a09ff5116ea",
      "courseUuid": "f1eb243f-b8c6-4d9f-be89-3a09ff5116ea",
      "meetingTitle": "Team Meeting",
      "meetingStartTime": "2025-12-02T14:00:00.000Z",
      "meetingEndTime": "2025-12-02T15:00:00.000Z",
      "meetingDate": "2025-12-02",
      "meetingType": 2,
      "isRecurring": false,
      "parentMeetingUuid": null
    }
  ]
}
```

**Error Responses:**

- `400 Bad Request` — Missing course UUID
- `403 Forbidden` — Not enrolled in course
- `404 Not Found` — Course not found

**Service Logic (`getMeetingList`):**

- Validates course UUID parameter
- Retrieves user context and determines role in course
- Verifies user enrolled in course
- Checks if user has staff role (Professor, TA, Tutor)
- Returns filtered meetings:
  - If staff: ALL meetings in course
  - If non-staff: only meetings where user is participant or creator
- Returns array of meeting objects

---

### Participant Management

#### 6. GET /attendance/participant/:meeting/:id
**Intention:** Retrieve a specific participant's attendance record

**Request Parameters:**

- `req.params.meeting` (string, required) — UUID of the meeting
- `req.params.id` (string, required) — UUID of the participant

**Expected Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "participantUuid": "f1eb243f-b8c6-4d9f-be89-3a09ff5116ea",
    "meetingUuid": "f1eb243f-b8c6-4d9f-be89-3a09ff5116ea",
    "present": true,
    "attendanceTime": "2025-12-01T10:05:32.000Z"
  }
}
```

**Error Responses:**

- `400 Bad Request` — Missing participant or meeting UUID
- `403 Forbidden` — Not authorized (not participant or creator)
- `404 Not Found` — Participant not found

**Service Logic (`getParticipant`):**

- Validates both UUIDs provided
- Retrieves participant record
- Checks authorization:
  - User is the participant themselves, OR
  - User is meeting creator
- Returns participant object with attendance status

---

#### 7. POST /attendance/participant/
**Intention:** Create one or more participant records

**Request Body:**
```json
{
  "participants": [
    {
      "participantUUID": "f1eb243f-b8c6-4d9f-be89-3a09ff5116ea",
      "meetingUUID": "f1eb243f-b8c6-4d9f-be89-3a09ff5116ea",
      "present": false
    },
    {
      "participantUUID": "f1eb243f-b8c6-4d9f-be89-3a09ff5116ea",
      "meetingUUID": "f1eb243f-b8c6-4d9f-be89-3a09ff5116ea",
      "present": false
    }
  ]
}
```

**Expected Response (201 Created):**
```json
{
  "success": true,
  "data": [
    { "participantUuid": "f1eb243f-b8c6-4d9f-be89-3a09ff5116ea", "meetingUuid": "f1eb243f-b8c6-4d9f-be89-3a09ff5116ea", "present": false, "attendanceTime": null },
    { "participantUuid": "f1eb243f-b8c6-4d9f-be89-3a09ff5116ea", "meetingUuid": "f1eb243f-b8c6-4d9f-be89-3a09ff5116ea", "present": false, "attendanceTime": null }
  ]
}
```

**Error Responses:**

- `400 Bad Request` — Missing participants array or invalid data
- `403 Forbidden` — Not authorized for one or more meetings
- `404 Not Found` — Participant or meeting not found

**Service Logic (`createParticipants`):**

- Validates participants array provided
- Validates each participant object structure
- Verifies all participant UUIDs exist
- Groups participants by meeting UUID
- For each meeting:
  - Retrieves meeting
  - Verifies user in active course for that meeting
  - Verifies user is creator or staff
- Creates all participant records in bulk
- Returns array of created participants

---

#### 8. PATCH /attendance/participant/
**Intention:** Update a participant's attendance status

**Request Body:**
```json
{
  "meetingUUID": "f1eb243f-b8c6-4d9f-be89-3a09ff5116ea",
  "participantUUID": "f1eb243f-b8c6-4d9f-be89-3a09ff5116ea",
  "present": true
}
```

**Expected Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "participantUuid": "f1eb243f-b8c6-4d9f-be89-3a09ff5116ea",
    "meetingUuid": "f1eb243f-b8c6-4d9f-be89-3a09ff5116ea",
    "present": true,
    "attendanceTime": "2025-12-01T10:05:32.000Z"
  }
}
```

**Error Responses:**

- `400 Bad Request` — Missing required fields
- `403 Forbidden` — Only meeting creator can update
- `404 Not Found` — Participant or meeting not found

**Service Logic (`updateParticipant`):**

- Validates meeting and participant UUIDs
- Retrieves participant record
- Retrieves meeting record
- Verifies user in active course for meeting
- Checks authorization: user must be meeting creator
- Updates participant record with new presence status
- Preserves existing attendance time
- Returns updated participant object

---

#### 9. DELETE /attendance/participant/:meeting/:id
**Intention:** Remove a participant from a meeting

**Request Parameters:**

- `req.params.meeting` (string, required) — UUID of the meeting
- `req.params.id` (string, required) — UUID of the participant

**Expected Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "message": "Participant deleted successfully"
  }
}
```

**Error Responses:**

- `400 Bad Request` — Missing meeting or participant UUID
- `403 Forbidden` — Not authorized to delete
- `404 Not Found` — Participant or meeting not found

**Service Logic (`deleteParticipant`):**

- Validates both UUIDs provided
- Retrieves participant record
- Retrieves meeting record
- Verifies user in active course
- Checks authorization: user must be meeting creator
- Deletes participant record from database

---

#### 10. POST /attendance/participant/list/
**Intention:** Retrieve filtered list of participants

**Request Body:**
```json
{
  "meetingUUID": "f1eb243f-b8c6-4d9f-be89-3a09ff5116ea",
  "courseUUID": "f1eb243f-b8c6-4d9f-be89-3a09ff5116ea",
  "present": true
}
```

**Expected Response (200 OK):**
```json
{
  "success": true,
  "data": [
    { "participantUuid": "f1eb243f-b8c6-4d9f-be89-3a09ff5116ea", "meetingUuid": "f1eb243f-b8c6-4d9f-be89-3a09ff5116ea", "present": true, "attendanceTime": "2025-12-01T10:05:32.000Z" },
    { "participantUuid": "f1eb243f-b8c6-4d9f-be89-3a09ff5116ea", "meetingUuid": "f1eb243f-b8c6-4d9f-be89-3a09ff5116ea", "present": true, "attendanceTime": "2025-12-01T10:06:15.000Z" }
  ]
}
```

**Error Responses:**

- `400 Bad Request` — Missing filter parameters
- `403 Forbidden` — Not authorized for requested data
- `404 Not Found` — No participants found

**Service Logic (`getParticipantListByParams`):**

- Validates at least one filter parameter (meetingUUID or courseUUID)
- Checks user staff access level for course (if filtering by course)
- Retrieves meeting and course records if filtering by those
- Determines user permissions:
  - If staff in course: can see all
  - If meeting creator: can see all for that meeting
  - If meeting participant: can only see own record
- Applies authorization filters
- Queries participants with applied filters
- Returns array of matching participant objects

---

### Meeting Code Management

#### 11. POST /attendance/meeting_code/:id
**Intention:** Generate new meeting code (QR + alphanumeric) for attendance recording

**Request Parameters:**
- `req.params.id` (string, required) — UUID of the meeting

**Expected Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "codeUuid": "f1eb243f-b8c6-4d9f-be89-3a09ff5116ea",
    "qrUrl": "https://api.qrserver.com/v1/create-qr-code/?data=https://conductor-tool.ucsd.edu/attendance/record/f1eb243f-b8c6-4d9f-be89-3a09ff5116ea/code=MTG-550e8400&size=200x200",
    "meetingCode": "MTG-550e8400",
    "meetingUuid": "550e8400-e29b-41d4-a716-446655440000",
    "validStartDatetime": "2025-12-01T10:00:00.000Z",
    "validEndDatetime": "2025-12-01T11:30:00.000Z"
  }
}
```

**Error Responses:**
- `403 Forbidden` — Only meeting creator can generate code
- `404 Not Found` — Meeting not found

**Service Logic (`createMeetingCode`):**
- Validates meeting UUID parameter
- Retrieves meeting
- Checks authorization: user must be meeting creator
- Generates meeting code (format: "MTG-" + first 8 chars of meeting UUID)
- Constructs QR code URL with:
  - Meeting UUID
  - Meeting code
  - Redirect URL to recording endpoint
- Sets validity window:
  - Start: meeting start time
  - End: meeting end time
- Stores code record in database
- Returns code object with QR URL and validity times

---

#### 12. GET /attendance/meeting_code/:id
**Intention:** Retrieve current valid meeting code

**Request Parameters:**
- `req.params.id` (string, required) — UUID of the meeting

**Expected Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "codeUuid": "code-uuid-123",
    "qrUrl": "https://api.qrserver.com/v1/create-qr-code/?data=https://conductor-tool.ucsd.edu/attendance/record/?meeting=550e8400&code=MTG-550e8400&size=200x200",
    "meetingCode": "MTG-550e8400",
    "meetingUuid": "550e8400-e29b-41d4-a716-446655440000",
    "validStartDatetime": "2025-12-01T10:00:00.000Z",
    "validEndDatetime": "2025-12-01T11:30:00.000Z"
  }
}
```

**Error Responses:**

- `403 Forbidden` — Not authorized
- `404 Not Found` — Meeting or code not found

**Service Logic (`getMeetingCode`):**

- Validates meeting UUID parameter
- Retrieves meeting
- Checks authorization: meeting creator or course staff
- Queries most recent valid meeting code
- Validates code not expired
- Returns code object or 404 if no valid code exists

---

#### 13. GET /attendance/meeting_code/record/:meeting/:code
**Intention:** Record attendance for current user using meeting code

**Request Parameters:**
- `req.params.meeting` (string, required) — UUID of the meeting
- `req.params.code` (string, required) — 6-character alphanumeric code
- `req.query.meeting` (string, optional) — Alternative meeting UUID source (for QR redirect)

**Expected Response (200 OK):**
```json
{
  "success": true,
  "message": "Attendance recorded successfully"
}
```

**Error Responses:**

- `403 Forbidden` — Code invalid or user not a participant
- `404 Not Found` — Meeting or code not found

**Service Logic (`recordAttendanceViaCode`):**

- Extracts meeting UUID from params or query parameter
- Validates code parameter
- Retrieves meeting from database
- Retrieves meeting code record
- Validates code is active:
  - Current time between start and end datetime
  - Code exists and matches
- Retrieves participant record for current user
- Validates participant exists in meeting
- Updates participant record:
  - Sets present=true
  - Records attendance_time as current timestamp
- Returns success message

---

## 4. Alternatives Considered

**Event/Queue-Based Approach (e.g., RabbitMQ)**

- *Pros:* Would handle 100+ simultaneous attendance submissions efficiently
- *Cons:* Significantly more complex; requires separate worker/container; adds operational overhead

**Microservice Implementation**

- *Pros:* Decouples the logic from the rest of the app, allowing for a failsafe in case the main app is down.
- *Cons:* Not feasible in the current time constraints, significantly increases complexity and development time.

---

## 5. Consequences
**Positive:**

- Clear REST API design with intuitive endpoint hierarchy (meetings → participants → codes)
- Fine-grained authorization at every endpoint protects data privacy
- Automatic creator UUID prevents spoofing
- Staff vs. non-staff visibility rules align with course structure
- QR code generation enables easy mobile attendance recording
- Deduplication logic prevents accidental duplicate participants
- Supports recurring meetings with future deletion option

**Negative:**

- Not real-time; relies on HTTP requests (scalability limits at 100+ simultaneous users)
- No geolocation validation; code-based attendance doesn't verify physical presence
- Multiple database queries per request can impact performance under high load
- Microservice architecture requires maintaining separate codebase
- Code expiration tied only to meeting times (no early code revocation ability)
- Participant deletion doesn't cascade; may leave orphaned records if not careful

---

## 6. Implementation Notes

### Key Business Rules
1. **Auto-Population:** Creator UUID automatically set from session user
2. **Deduplication:** Participant lists deduplicated before database insertion
3. **Course Validation:** All meetings must belong to active course term
4. **Time Constraints:** End time must be after start time; past meetings cannot be deleted
5. **Code Validity:** Codes active only between meeting start and end times
6. **Staff Visibility:** Staff see all course meetings; non-staff see only their meetings
7. **Creator Inclusion:** Meeting creator automatically added as participant

### Authorization Matrix

| Operation | Requirement |
|-----------|-------------|
| Get Meeting | Course enrollment + (participant \| creator \| staff) |
| Create Meeting | Course enrollment in active term |
| Update Meeting | Creator + active course enrollment |
| Delete Meeting | Creator + future meeting + active course enrollment |
| Get Participants | Creator \| participant \| course staff |
| Create Participants | Course enrollment + meeting validation |
| Update Participant | Meeting creator + active course enrollment |
| Delete Participant | Meeting creator + active course enrollment |
| Get Participant List | Staff \| creator \| participant (filtered) |
| Create Code | Meeting creator |
| Get Code | Creator \| course staff |
| Record Attendance | Valid code + participant in meeting |

---

## 7. References
- [Initial Technical Design from 10/31 Meeting]
- API Routes: `/backend/src/routes/api/attendanceApi.js`
- Service Layer: `/backend/src/services/attendanceService.js`
- Repository Layer: `/backend/src/repositories/attendanceRepository.js`
- Data Transfer Objects: `/backend/src/dtos/attendanceDto.js`
- Validators: `/backend/src/validators/attendanceValidator.js`
