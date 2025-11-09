# Database Schema Documentation

## Overview

This directory contains the database schema and migrations for the Conductor Tool application. The schema is designed to support a large-scale course management system (500+ students) with role-based access control, team management, and comprehensive user profiles.

## Technology

- **Database**: PostgreSQL
- **Primary Keys**: UUIDs (using `gen_random_uuid()`) or Composite Keys
- **Extensions**: pgcrypto (for UUID generation)

## Schema Structure

### Core Entities

#### 1. Terms
Represents academic quarters/semesters.

**Table**: `terms`
- `term_uuid` (PK): Unique identifier
- `name`: Display name (e.g., "Fall 2024")
- `year`: Academic year
- `season`: "Fall", "Winter", "Spring", or "Summer"
- `start_date`, `end_date`: Term duration
- `is_active`: Whether this is the current active term

**Use Cases**:
- Class selection page: Display courses grouped by term, latest term first
- Filter courses by academic period

#### 2. Users
Central user table for all users in the system. Roles are determined by relationships to other tables (course_staff for staff roles, is_enrolled for students, team_members for team leaders).

**Table**: `users`
- `user_uuid` (PK): Unique identifier
- `email`: User's email (unique)
- `first_name`: User's first name
- `last_name`: User's last name
- `photo_url`: Profile photo URL
- `pronouns`: User's pronouns
- `gender`: User's gender
- `year`: Academic year as integer (1=Freshman, 2=Sophomore, 3=Junior, 4=Senior, 5=Graduate, etc.)
- `phone_number`: Contact number
- `personal_page_url`: Personal website
- `github_username`: GitHub username
- `majors[]`: Array of major(s) (for students)
- `minors[]`: Array of minor(s) (for students)
- `bio`: User biography
- `is_system_admin`: Boolean flag for system administrator role
- `is_active`: Account status
- `last_login`: Last login timestamp

**Role Determination**:
- **System Admin**: `is_system_admin = true`
- **Instructor/TA/Tutor**: Present in `course_staff` table with corresponding `staff_role`
- **Student**: Present in `is_enrolled` table
- **Team Leader**: Present in `team_members` table with `is_team_leader = true`
- Users can have multiple roles (e.g., a graduate student who is both a TA and enrolled in courses)

**Use Cases**:
- Authentication and authorization
- User directory/roster
- User profile page: Display comprehensive user information
- Class directory: Show student/staff details

#### 3. Staff_Profiles
Extended information for staff members (instructors, TAs, tutors). This is a 1:1 relationship with users who are staff.

**Table**: `staff_profiles`
- `user_uuid` (PK, FK): Reference to users table (serves as both PK and FK)
- `office_location`: Office location
- `office_phone`: Office phone number
- `research_interests`: Research interests (for faculty)
- `personal_website`: Academic/professional website

**Use Cases**:
- Staff profile page: Display staff-specific information
- Office hours display: Show where to find staff
- Faculty directory: List research interests

#### 4. Courses
Course offerings with all logistics and metadata.

**Table**: `courses`
- `course_uuid` (PK): Unique identifier
- `course_code`: Course code (e.g., "CSE210")
- `course_name`: Course name (e.g., "Software Engineering")
- `term_uuid` (FK): Reference to terms table
- `description`: Course description
- `syllabus_url`: Link to syllabus
- `canvas_url`: Canvas course link
- `lecture_time`: When lectures occur (e.g., "Tuesday & Thursday 2:00-3:20 PM")
- `lecture_location`: Where lectures are held
- `google_calendar_embed_url`: Embedded calendar URL

**Use Cases**:
- Class selection page
- Class dashboard: Display course information and logistics
- Quick access to course resources

### Enrollment and Grades

#### 5. Is_Enrolled
Student enrollments and their grades in courses. This table represents the relationship between a user and a course, storing both enrollment status and grade information.

**Table**: `is_enrolled`
- `user_uuid` (PK, FK): Reference to users table
- `course_uuid` (PK, FK): Reference to courses table
- `enrollment_status`: "active", "dropped", "completed", or "failed"
- `enrolled_at`: When the student enrolled
- `dropped_at`: When the student dropped (if applicable)
- `current_percentage`: Current overall percentage in the course
- `current_letter_grade`: Current letter grade
- `final_percentage`: Final percentage (when course is completed)
- `final_letter_grade`: Final letter grade
- `is_finalized`: Whether the grade is finalized

**Primary Key**: Composite (`user_uuid`, `course_uuid`)

**Use Cases**:
- Class selection page: Show courses user is enrolled in
- Class roster: Display enrolled students
- Class dashboard: Display student's current overall grade
- Track enrollment history and final grades
- Grade reporting

#### 6. Assignments
Defines assignments for courses. Stores assignment metadata once per assignment (normalized).

**Table**: `assignments`
- `assignment_uuid` (PK): Unique identifier
- `course_uuid` (FK): Reference to courses table
- `assignment_name`: Name of assignment
- `assignment_category`: Category (Homework, Project, Exam, Participation, etc.)
- `points_possible`: Total points possible
- `due_date`: When the assignment is due
- `description`: Assignment description
- `is_published`: Whether assignment is visible to students
- `created_at`: When assignment was created
- **Unique Constraint**: (`course_uuid`, `assignment_name`)

**Use Cases**:
- Assignment management: Create and update assignments
- Course dashboard: Display upcoming assignments
- Grade calculations: Reference total points possible
- Consistent assignment details across all students

#### 7. Assignment_Grades
Individual assignment grades for students. References both assignments and is_enrolled tables.

**Table**: `assignment_grades`
- `user_uuid` (PK, FK): Reference to users table
- `assignment_uuid` (PK, FK): Reference to assignments table
- `points_earned`: Points earned by the student
- `submitted_at`: When the student submitted
- `graded_at`: When the assignment was graded
- `grader_notes`: Private notes from grader
- `student_notes`: Student's submission notes
- **Foreign Key**: (`user_uuid`, `course_uuid`) REFERENCES `is_enrolled`(`user_uuid`, `course_uuid`)
  - Note: `course_uuid` obtained via join through `assignment_uuid`

**Primary Key**: Composite (`user_uuid`, `assignment_uuid`)

**Benefits of Normalization**:
- Assignment details (name, points_possible, due_date) stored once in `assignments` table
- Changing assignment total points updates one row instead of hundreds
- No data redundancy across students
- Ensures consistency across all student grades

**Use Cases**:
- Class dashboard: Display detailed grade breakdown by assignment
- Grade tracking over time
- Assignment-level analytics
- Grading workflow

### Staff and Office Hours

#### 8. Course_Staff
Teaching staff assignments to courses. Determines who is an instructor, TA, or tutor for a course.

**Table**: `course_staff`
- `user_uuid` (PK, FK): Reference to users table
- `course_uuid` (PK, FK): Reference to courses table
- `staff_role`: "instructor", "ta", or "tutor"

**Primary Key**: Composite (`user_uuid`, `course_uuid`)

**Use Cases**:
- Class dashboard: Display teaching staff
- Determine user's staff role for a course
- Access control for staff-only features

#### 9. Office_Hours
Staff availability schedules.

**Table**: `office_hours`
- `office_hour_uuid` (PK): Unique identifier
- `user_uuid` (FK): Reference to users table
- `course_uuid` (FK): Reference to courses table
- `day_of_week`: 0 (Sunday) to 6 (Saturday)
- `start_time`: Start time
- `end_time`: End time
- `location`: Where office hours are held
- `is_active`: Whether currently active
- **Foreign Key**: (`user_uuid`, `course_uuid`) REFERENCES `course_staff`(`user_uuid`, `course_uuid`)

**Use Cases**:
- Class dashboard: Display office hours
- Student resource for getting help
- Staff scheduling

### Teams/Groups

#### 10. Teams
Project teams/groups within courses. Teams are globally unique (not scoped to a specific course).

**Table**: `teams`
- `team_uuid` (PK): Globally unique identifier
- `course_uuid` (FK): Reference to courses table
- `team_name`: Team name
- `team_number`: Optional numeric identifier for easier reference
- `team_page_url`: Team's page
- `repo_url`: Team's repository URL
- `mission_doc_url`: Mission statement document
- `code_of_conduct_url`: Code of conduct document
- `video_intro_url`: Team video introduction
- `project_name`: Project name
- `project_description`: Project description
- `pitch_doc_url`: Project pitch document
- `project_site_url`: Deployed project site URL
- **Unique Constraints**:
  - (`course_uuid`, `team_name`)
  - (`course_uuid`, `team_number`)

**Use Cases**:
- Group profile page: Display team information and resources
- Group directory: List all teams in course
- Team management

#### 11. Team_Members
Team membership tracking.

**Table**: `team_members`
- `team_member_uuid` (PK): Unique identifier
- `team_uuid` (FK): Reference to teams table
- `user_uuid` (FK): Reference to users table
- `is_team_leader`: Whether this member is the team leader
- `joined_at`: When the member joined
- `left_at`: When the member left (if applicable)
- **Unique Constraint**: (`team_uuid`, `user_uuid`)

**Use Cases**:
- Group profile page: Display team member list
- User profile page: Show which team(s) a user belongs to
- Track team composition and leadership

#### 12. Team_TA_Assignments
TA assignments to teams (one TA per team).

**Table**: `team_ta_assignments`
- `team_uuid` (PK, FK): Reference to teams table (serves as both PK and FK since it's unique)
- `ta_user_uuid` (FK): Reference to users table
- `course_uuid` (FK): Reference to courses table
- `assigned_at`: When the assignment was made
- **Foreign Key**: (`ta_user_uuid`, `course_uuid`) REFERENCES `course_staff`(`user_uuid`, `course_uuid`)

**Primary Key**: `team_uuid` (since each team has exactly one TA)

**Use Cases**:
- Group profile page: Show the responsible TA
- TA dashboard: Show assigned teams
- Team-TA coordination

## Entity Relationships

```
terms (1) ←→ (M) courses
users (1) ←→ (1) staff_profiles
users (1) ←→ (M) is_enrolled ←→ (M) courses
users (1) ←→ (M) course_staff ←→ (M) courses
course_staff (1) ←→ (M) office_hours
courses (1) ←→ (M) assignments
courses (1) ←→ (M) teams
assignments (1) ←→ (M) assignment_grades ←→ (M) users
teams (1) ←→ (M) team_members ←→ (M) users
teams (1) ←→ (1) team_ta_assignments
course_staff (1) ←→ (M) team_ta_assignments
```

## Page-to-Table Mapping

### Class Dashboard Page

#### Student View
**Displays**: Course logistics, personal grades, staff, and navigation buttons
**Tables Used**:
- `courses` (course info, logistics, links)
- `terms` (term information)
- `course_staff` (teaching staff)
- `users` (staff details)
- `staff_profiles` (staff office locations)
- `office_hours` (office hours)
- `is_enrolled` (student's current overall grade)
- `assignments` (assignment details)
- `assignment_grades` (student's assignment scores)

**Query Pattern** (course info):
```sql
SELECT c.*, t.*
FROM courses c
JOIN terms t ON c.term_uuid = t.term_uuid
WHERE c.course_uuid = :course_uuid;
```

**Query Pattern** (student's overall grade):
```sql
SELECT current_percentage, current_letter_grade
FROM is_enrolled
WHERE user_uuid = :user_uuid AND course_uuid = :course_uuid;
```

**Query Pattern** (student's assignment grades):
```sql
SELECT a.assignment_name,
       a.assignment_category,
       a.points_possible,
       a.due_date,
       ag.points_earned,
       ROUND((ag.points_earned / a.points_possible) * 100, 2) as percentage,
       ag.submitted_at,
       ag.graded_at
FROM assignments a
LEFT JOIN assignment_grades ag ON a.assignment_uuid = ag.assignment_uuid
    AND ag.user_uuid = :user_uuid
WHERE a.course_uuid = :course_uuid
  AND a.is_published = true
ORDER BY a.due_date DESC;
```

**Query Pattern** (teaching staff and office hours):
```sql
SELECT u.first_name, u.last_name, u.email,
       cs.staff_role,
       sp.office_location,
       oh.day_of_week, oh.start_time, oh.end_time, oh.location
FROM course_staff cs
JOIN users u ON cs.user_uuid = u.user_uuid
LEFT JOIN staff_profiles sp ON u.user_uuid = sp.user_uuid
LEFT JOIN office_hours oh ON cs.user_uuid = oh.user_uuid AND cs.course_uuid = oh.course_uuid
WHERE cs.course_uuid = :course_uuid
ORDER BY cs.staff_role, u.last_name;
```

#### Instructor View
**Displays**: Course logistics, class statistics, roster overview, assignment management
**Tables Used**:
- `courses` (course info, logistics, links)
- `terms` (term information)
- `is_enrolled` (all student enrollments and grades)
- `users` (student information)
- `assignments` (all assignments)
- `assignment_grades` (grade statistics)
- `teams` (team information)
- `team_members` (team membership)

**Query Pattern** (course overview):
```sql
SELECT c.*, t.*
FROM courses c
JOIN terms t ON c.term_uuid = t.term_uuid
WHERE c.course_uuid = :course_uuid;
```

**Query Pattern** (enrollment statistics):
```sql
SELECT
    COUNT(*) as total_students,
    COUNT(CASE WHEN enrollment_status = 'active' THEN 1 END) as active_students,
    COUNT(CASE WHEN enrollment_status = 'dropped' THEN 1 END) as dropped_students,
    ROUND(AVG(current_percentage), 2) as average_grade
FROM is_enrolled
WHERE course_uuid = :course_uuid;
```

**Query Pattern** (assignment statistics):
```sql
SELECT a.assignment_name,
       a.assignment_category,
       a.points_possible,
       a.due_date,
       COUNT(ag.user_uuid) as submissions,
       ROUND(AVG(ag.points_earned), 2) as avg_points,
       ROUND(AVG((ag.points_earned / a.points_possible) * 100), 2) as avg_percentage
FROM assignments a
LEFT JOIN assignment_grades ag ON a.assignment_uuid = ag.assignment_uuid
WHERE a.course_uuid = :course_uuid
GROUP BY a.assignment_uuid, a.assignment_name, a.assignment_category, a.points_possible, a.due_date
ORDER BY a.due_date DESC;
```

**Query Pattern** (recent student enrollments):
```sql
SELECT u.first_name, u.last_name, u.email, e.enrolled_at
FROM is_enrolled e
JOIN users u ON e.user_uuid = u.user_uuid
WHERE e.course_uuid = :course_uuid
  AND e.enrollment_status = 'active'
ORDER BY e.enrolled_at DESC
LIMIT 10;
```

### Class Directory/Roster Page
**Displays**: List of all students in the course
**Tables Used**:
- `users` (user info and profile details)
- `is_enrolled` (students in course)

**Query Pattern**:
```sql
SELECT u.*
FROM is_enrolled e
JOIN users u ON e.user_uuid = u.user_uuid
WHERE e.course_uuid = :course_uuid
  AND e.enrollment_status = 'active'
ORDER BY u.last_name, u.first_name;
```

### User Profile Page
**Displays**: User's detailed information
**Tables Used**:
- `users` (all user information)
- `team_members` (team membership)
- `teams` (team details)

**Query Pattern**:
```sql
SELECT u.*, t.team_name, t.team_uuid
FROM users u
LEFT JOIN team_members tm ON u.user_uuid = tm.user_uuid AND tm.left_at IS NULL
LEFT JOIN teams t ON tm.team_uuid = t.team_uuid
WHERE u.user_uuid = :user_uuid;
```

### Group Profile Page
**Displays**: Team information, members, resources
**Tables Used**:
- `teams` (team info and resources)
- `team_members` (team members)
- `users` (member details)
- `team_ta_assignments` (responsible TA)
- `course_staff` (TA info)

**Query Pattern**:
```sql
-- Team info
SELECT t.*, c.course_name
FROM teams t
JOIN courses c ON t.course_uuid = c.course_uuid
WHERE t.team_uuid = :team_uuid;

-- Team members
SELECT u.*, tm.is_team_leader
FROM team_members tm
JOIN users u ON tm.user_uuid = u.user_uuid
WHERE tm.team_uuid = :team_uuid AND tm.left_at IS NULL
ORDER BY tm.is_team_leader DESC, u.last_name, u.first_name;

-- Responsible TA
SELECT u.first_name, u.last_name, u.email, u.photo_url
FROM team_ta_assignments tta
JOIN users u ON tta.ta_user_uuid = u.user_uuid
WHERE tta.team_uuid = :team_uuid;
```

### Group Directory Page (Instructor View)
**Displays**: List of all teams in the course
**Tables Used**:
- `teams` (team info)
- `team_members` (count members)
- `team_ta_assignments` (assigned TAs)

**Query Pattern**:
```sql
SELECT t.*,
       COUNT(tm.team_member_uuid) as member_count,
       u.first_name || ' ' || u.last_name as ta_name
FROM teams t
LEFT JOIN team_members tm ON t.team_uuid = tm.team_uuid AND tm.left_at IS NULL
LEFT JOIN team_ta_assignments tta ON t.team_uuid = tta.team_uuid
LEFT JOIN users u ON tta.ta_user_uuid = u.user_uuid
WHERE t.course_uuid = :course_uuid
GROUP BY t.team_uuid, ta_name
ORDER BY t.team_number;
```

## Design Principles

1. **Normalization**:
   - **Assignments normalized**: Assignment details (name, points_possible, due_date) stored once in `assignments` table
   - **Staff profiles separated**: Staff-specific fields (office_location, research_interests) in separate `staff_profiles` table
   - **Benefits**: Eliminates data redundancy, easier updates, maintains consistency
   - **Example**: Changing an assignment's total points updates 1 row instead of 500+ student rows

2. **Primary Keys**:
   - Single UUID for most tables
   - Composite keys for junction/relationship tables (`is_enrolled`, `course_staff`, `assignment_grades`)
   - `team_uuid` as PK in `team_ta_assignments` since it's unique (one TA per team)
   - `user_uuid` as PK in `staff_profiles` (1:1 relationship with users)

3. **Data Types**:
   - **year field**: SMALLINT instead of VARCHAR for proper sorting (1, 2, 3, 4, 5 for Freshman through Graduate)
   - **Arrays**: PostgreSQL arrays for majors[], minors[] to store multiple values
   - **UUIDs**: All primary keys use gen_random_uuid() for better scalability

4. **Role Management**:
   - Roles are determined by table relationships, not a single role column
   - Flexible: users can be students in some courses and TAs in others
   - `is_system_admin` is the only role stored directly in users table
   - Staff-specific data isolated in `staff_profiles` table

5. **Grades Architecture**:
   - Overall grades stored in `is_enrolled` table (user's relationship with course)
   - Assignment definitions in `assignments` table (one per assignment)
   - Student scores in `assignment_grades` table (links students to assignments)
   - `enrollment_status` includes "failed" for students who didn't pass

6. **Global Team IDs**:
   - `team_uuid` is globally unique across all courses and terms
   - `course_uuid` foreign key establishes which course the team belongs to
   - Uniqueness constraints within a course via (course_uuid, team_name)

7. **Composite Foreign Keys**:
   - Used extensively to maintain referential integrity
   - Examples: office_hours → course_staff, team_ta_assignments → course_staff
   - Ensures data consistency across related tables

8. **Soft Deletes**:
   - Some tables support soft deletes (e.g., `left_at` in team_members, `dropped_at` in is_enrolled)
   - Maintains historical data for auditing and analytics

9. **Timestamps**:
   - All tables include `created_at` and `updated_at` with automatic triggers
   - Enables tracking of data changes over time

10. **Data Validation**:
    - CHECK constraints for enum-like values and data integrity
    - Unique constraints to prevent duplicates
    - Foreign key constraints ensure referential integrity

11. **FERPA Compliance**:
    - Role-based visibility handled at API layer, not database layer
    - Sensitive student data only accessible based on user's role
    - Staff-specific information separated from general user data

## Security Considerations

- Sensitive student data (grades, contact info) should only be visible based on user role
- All queries should be parameterized to prevent SQL injection
- Database credentials should be stored in environment variables, never in code
- Access control is enforced at the API/service layer

## Future Enhancements

Tables that may be added in future migrations:
- `attendance_records` (for Attendance feature)
- `standups` (for Standup/Work Journal feature)
- `meetings` (for meeting management)
- `notifications` (for user notifications)
- `help_queue` (for tutor help queue)
- `faq_entries` (for FAQ system)
- `feedback_submissions` (for anonymous feedback)
