# Architecture Decision Record (ADR)

**ADR #:** 007  
**Title:** Attendance Functionality  
**Date:** 2025-11-05  
**Status:** Proposed

---

## 1. Context
As a part of the conductor app for a software engineering course, there should be a way to manage students' attendance and the meetings throughout the quarter. Therefore, the issues identified are: 

- The course staff should have a consistent way of recording students' attendance throughout various meetings held as a part of the course (e.g. lectures, discussions, office hours, team meetings). 
- The team leads should also have the ability to keep track of who attends the team meetings. 
- The students themselves should have a clear way of submitting their attendance, keeping track of their past attendance, and seeing what meetings are upcoming

---

## 2. Decision

Implement Attendance as its own **microservice** due to the need to separate concerns between the attendance logic and other functionality of the Conductor App. This will allow us to handle many attendance records without hurting the performance of other app features, and also will save us in the case the Attendance microservice is down, but other core features of the overall Conductor App are still needed.

The Attendance view is integrated into the Dashboard of the Conductor App (details TBD after Dashboard feature set is finalized)

Use **Node.js** with **Express.js** (consistent with the rest of the application) for backend logic, vanilla HTML/CSS/JS for front end implementation (also consistent with other parts of the application).

Use **Postgres** database (the same as the rest of the application) with the following schemas:

#### Meeting
- **meeting_uuid (UUID)** -- primary key, not null
- **owners_uuid (array[UUID])** -- not null, must contain at least one UUID, can add co-owners at the creation stage or after creating
- **meeting_type (ID or UUID)** -- not null
- **meeting_datetime (datetime)** -- not null
- **meeting_title (varchar)** -- not null 
- **meeting_description (varchar)**
- **participants (array[UUID])** -- not null, but array can be empty

#### Attendance
- **meeting_uuid (UUID)** -- foreign key referencing Meeting
- **student_uuid (UUID)** -- foreign key referencing Student
- **attendance_datetime (datetime)** -- not null

Both meeting_uuid and student_uuid constitute primary key

#### Meeting Codes
- **code_uuid (UUID)** -- primary key
- **meeting_uuid (UUID)** -- foreign key referencing Meeting
- **alphanumeric_code (varchar)** -- not null
- **qr_code (varchar)** -- not null, a link to a mediafile
- **create_datetime (datetime)** -- not null, when the code was generated (not the meeting start time)
- **expiration_datetime (datetime)** -- not null, when the code is set to expire


---

## 3. Alternatives Considered
Considering event/queue based approach (e.g. RabbitMQ) to handle multiple attendance records at the time.

Pros:

- Would solve the issue with many (100+) simultaneous HTTP requests.

Cons:

- Way more complex.
- Requires a separate container/worker to handle.

---

## 4. Consequences
Positive:

- Integration with the calendar system, allowing students and course staff to easily see the attendance and expected meetings at a glance.
- Small amount of tables needed to keep track of meetings and attendance. Tables reference existing tables (e.g. Student) to create cohesion with the rest of the database.
- Consistent tech stack with the rest of the app.
- Microservice architecture allows us to separate the logic from the main app, boosting performance (i.e. conductor doesn't need to wait for the attendance logic to finish to do other tasks).

Negative:

- Currently, not real time (i.e. no way to update and record attendance in real time, relies on HTTP requests).
- The code is not place sensitive (i.e. anyone with the code could record attendance, even if not physically present). This is out of scope, as any kind of spatial solution (i.e. geolocation) could violate privacy concerns.
- Microservice architecture essentially requires us to write a smaller version of the Conductor App in a separate environment (although it will only be backend and data layers, as UI can be delegated to the Conductor App itself).

---

## 5. Implementation Notes
Specifics:

- A meeting owner can generate multiple attendance codes to record attendance. Each new generated code will replace the old code in the interface, however the old code will still be valid until it expires. 

Dependencies:

- A way to generate QR codes to record students' attendance.
- A way to generate alphanumeric codes to record students' attendance.

Issues to be resolved:

- A way to record attendance during the recording period before writing to database (as each HTTP request can take time), and show attendance *in real time* to the meeting owner during the attendance recording process.

---

## 6. References
- [Initial Technical Design from 10/31 Meeting]
