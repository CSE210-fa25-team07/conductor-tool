# Database Schema Diagram

## Visual Entity-Relationship Diagram

```
┌─────────────────┐
│     terms       │
│─────────────────│
│ term_uuid (PK)  │
│ name            │
│ year            │
│ season          │
│ start_date      │
│ end_date        │
│ is_active       │
└─────────────────┘
         │
         │ 1:M
         ▼
┌──────────────────────────┐
│       courses            │
│──────────────────────────│
│ course_uuid (PK)         │
│ course_code              │
│ course_name              │
│ term_uuid (FK)           │
│ description              │
│ syllabus_url             │
│ canvas_url               │
│ lecture_time             │
│ lecture_location         │
│ google_calendar_embed    │
└──────────────────────────┘
         │
         ├──────────────────────────┬─────────────────┐
         │ 1:M                      │ 1:M             │ 1:M
         ▼                          ▼                 ▼
┌─────────────────────┐    ┌──────────────────┐   ┌─────────────────────┐
│    is_enrolled      │    │  course_staff    │   │    assignments      │
│─────────────────────│    │──────────────────│   │─────────────────────│
│ user_uuid (PK,FK)   │    │ user_uuid (PK,FK)│   │ assignment_uuid(PK) │
│ course_uuid (PK,FK) │    │ course_uuid (PK) │   │ course_uuid (FK)    │
│ enrollment_status   │    │ staff_role       │   │ assignment_name     │
│ enrolled_at         │    └──────────────────┘   │ assignment_category │
│ dropped_at          │              │            │ points_possible     │
│ current_percentage  │              │ 1:M        │ due_date            │
│ current_letter_gr.  │              ▼            │ description         │
│ final_percentage    │       ┌──────────────┐   │ is_published        │
│ final_letter_grade  │       │office_hours  │   └─────────────────────┘
│ is_finalized        │       │──────────────│            │
└─────────────────────┘       │office_hour_  │            │ 1:M
                              │ uuid (PK)    │            ▼
                              │user_uuid(FK) │   ┌─────────────────────┐
                              │course_uuid   │   │ assignment_grades   │
                              │day_of_week   │   │─────────────────────│
                              │start_time    │   │ user_uuid (PK,FK)   │
                              │end_time      │   │ assignment_uuid(PK) │
                              │location      │   │ points_earned       │
                              │is_active     │   │ submitted_at        │
                              └──────────────┘   │ graded_at           │
                                                 │ grader_notes        │
                                                 │ student_notes       │
                                                 └─────────────────────┘


┌──────────────────────┐              ┌──────────────────────┐
│        users         │              │   staff_profiles     │
│──────────────────────│ 1:1          │──────────────────────│
│ user_uuid (PK)       │◄─────────────│ user_uuid (PK,FK)    │
│ email                │              │ office_location      │
│ first_name           │              │ office_phone         │
│ last_name            │              │ research_interests   │
│ photo_url            │              │ personal_website     │
│ pronouns             │              └──────────────────────┘
│ gender               │
│ year (smallint)      │
│ phone_number         │
│ personal_page_url    │
│ github_username      │
│ majors[]             │
│ minors[]             │
│ bio                  │
│ is_system_admin      │
│ is_active            │
│ last_login           │
└──────────────────────┘


         courses (1) ──────┐
                           │
                           │ 1:M
                           ▼
                  ┌─────────────────────┐
                  │       teams         │
                  │─────────────────────│
                  │ team_uuid (PK)      │ ← Globally unique
                  │ course_uuid (FK)    │
                  │ team_name           │
                  │ team_number         │
                  │ team_page_url       │
                  │ repo_url            │
                  │ mission_doc_url     │
                  │ code_of_conduct_url │
                  │ video_intro_url     │
                  │ project_name        │
                  │ project_description │
                  │ pitch_doc_url       │
                  │ project_site_url    │
                  └─────────────────────┘
                           │
         ┌─────────────────┴─────────────────┐
         │ 1:M                                │ 1:1
         ▼                                    ▼
┌──────────────────────┐          ┌──────────────────────┐
│   team_members       │          │ team_ta_assignments  │
│──────────────────────│          │──────────────────────│
│ team_member_uuid(PK) │          │ team_uuid (PK,FK)    │
│ team_uuid (FK)       │          │ ta_user_uuid (FK)    │
│ user_uuid (FK) ───┐  │          │ course_uuid (FK)     │
│ is_team_leader    │  │          │ assigned_at          │
│ joined_at         │  │          └──────────────────────┘
│ left_at           │  │                      │
└───────────────────┘  │                      │
                       │                      │
                       └────► users ◄─────────┘
                              (connects to both tables)
```

## Table Groups

### Authentication & Users
- **users**: Core user accounts (leaner design, staff fields moved out)
  - Roles determined by relationships, not stored in users table
  - Exception: `is_system_admin` flag for system administrators
  - `year` field is SMALLINT for proper sorting
- **staff_profiles**: Staff-specific information (1:1 with users)
  - Office location, research interests, etc.

### Academic Structure
- **terms**: Academic quarters/semesters
- **courses**: Course offerings (includes all metadata)

### Enrollments & Grades (Normalized)
- **is_enrolled**: Student enrollments + overall grades
- **assignments**: Assignment definitions (normalized - one row per assignment)
- **assignment_grades**: Student scores on assignments (links students to assignments)

### Staff
- **course_staff**: Teaching staff assignments (composite PK)
- **office_hours**: Staff availability

### Teams
- **teams**: Project teams/groups (globally unique UUIDs)
- **team_members**: Team membership
- **team_ta_assignments**: TA-to-team assignments (team_uuid as PK)

## Key Relationships

### One-to-One (1:1)
- `users` ↔ `staff_profiles`: Each staff member has one extended profile
- `teams` ↔ `team_ta_assignments`: Each team has exactly one assigned TA

### One-to-Many (1:M)
- `terms` → `courses`: A term contains many courses
- `courses` → `is_enrolled`: A course has many student enrollments
- `courses` → `course_staff`: A course has many staff members
- `courses` → `assignments`: A course has many assignments
- `courses` → `teams`: A course has many teams
- `users` → `is_enrolled`: A user can enroll in many courses
- `users` → `course_staff`: A user can be staff in many courses
- `users` → `team_members`: A user can be on many teams (across different courses)
- `teams` → `team_members`: A team has many members
- `course_staff` → `office_hours`: Staff can have multiple office hour slots
- `course_staff` → `team_ta_assignments`: A staff member (TA) can be assigned to multiple teams
- `assignments` → `assignment_grades`: An assignment has many student grades

### Many-to-Many (M:M)
These are implemented through junction tables with composite primary keys:

1. **Users ↔ Courses (Students)**
   - Junction: `is_enrolled`
   - Composite PK: (`user_uuid`, `course_uuid`)
   - A student can enroll in multiple courses
   - A course has multiple students
   - Also stores enrollment status and overall grades

2. **Users ↔ Courses (Staff)**
   - Junction: `course_staff`
   - Composite PK: (`user_uuid`, `course_uuid`)
   - A staff member can teach/assist multiple courses
   - A course has multiple staff members
   - Also stores staff role (instructor, ta, tutor)

3. **Users ↔ Teams**
   - Junction: `team_members`
   - A user can be on different teams (in different courses)
   - A team has multiple members

4. **Users ↔ Assignments**
   - Junction: `assignment_grades`
   - Composite PK: (`user_uuid`, `assignment_uuid`)
   - A user (student) can have grades for multiple assignments
   - An assignment has grades for multiple students
   - Also stores points_earned and submission/grading timestamps
   - **Normalized**: Assignment details (name, points_possible) stored once in `assignments` table

## Data Flow Examples

### Student Views Their Dashboard
1. Query `users` to get current user information
2. Query `is_enrolled` to get enrolled courses and current grades
3. Query `courses` for course details, logistics, and resource links
4. Query `terms` to display term information
5. Query `course_staff` to show teaching staff
6. Query `office_hours` to display when to get help

### Instructor Views Group Directory
1. Query `courses` to get course information
2. Query `teams` to get all teams in the course
3. Query `team_members` (count) to get team sizes
4. Query `team_ta_assignments` to show assigned TA for each team
5. Query `users` to get TA names and details

### User Views Another User's Profile
1. Query `users` to get all user information (profile is consolidated in users table)
2. Query `team_members` to find current team(s)
3. Query `teams` to get team details
4. Check requesting user's role:
   - If staff in same course → show all info
   - If student → hide sensitive info (phone, grades, etc.) per FERPA
   - If system admin → show all info

### Creating a New Team
1. Insert into `teams` table (team_uuid is globally unique)
2. Insert team members into `team_members`
3. Mark one member as `is_team_leader = true`
4. Insert TA assignment into `team_ta_assignments` using team_uuid as PK

### Enrolling a Student in a Course
1. Insert into `is_enrolled` with composite PK (`user_uuid`, `course_uuid`)
2. Set `enrollment_status = 'active'`
3. Initialize grade fields as NULL (will be populated as course progresses)

### Adding a TA to a Course
1. Insert into `course_staff` with composite PK (`user_uuid`, `course_uuid`)
2. Set `staff_role = 'ta'`
3. Optionally add office hours in `office_hours` table

## Composite Key Details

### is_enrolled
- **Primary Key**: (`user_uuid`, `course_uuid`)
- **No separate enrollment_uuid** - the relationship itself is the key
- References:
  - `user_uuid` → `users(user_uuid)`
  - `course_uuid` → `courses(course_uuid)`

### course_staff
- **Primary Key**: (`user_uuid`, `course_uuid`)
- **No separate staff_uuid** - the relationship itself is the key
- References:
  - `user_uuid` → `users(user_uuid)`
  - `course_uuid` → `courses(course_uuid)`

### team_ta_assignments
- **Primary Key**: `team_uuid`
- Since each team has exactly one TA, team_uuid alone is sufficient as PK
- **Composite Foreign Key**: (`ta_user_uuid`, `course_uuid`) → `course_staff`
- Also includes `course_uuid` to facilitate queries and maintain referential integrity

## Role Determination Logic

Unlike the original schema, roles are NOT stored in the users table. Instead, they are determined by relationships:

```
Is user a System Admin?
  → Check users.is_system_admin = true

Is user an Instructor for course X?
  → Check if exists in course_staff where course_uuid = X and staff_role = 'instructor'

Is user a TA for course X?
  → Check if exists in course_staff where course_uuid = X and staff_role = 'ta'

Is user a Tutor for course X?
  → Check if exists in course_staff where course_uuid = X and staff_role = 'tutor'

Is user a Student in course X?
  → Check if exists in is_enrolled where course_uuid = X

Is user a Team Leader for team Y?
  → Check if exists in team_members where team_uuid = Y and is_team_leader = true

Is user enrolled in ANY course?
  → Check if exists in is_enrolled with enrollment_status = 'active'
```

**Benefits of this approach**:
- Users can have different roles in different courses (e.g., TA in one course, student in another)
- More flexible and accurate representation of real-world scenarios
- No redundant role data to keep in sync

## Cascade Behaviors

### ON DELETE CASCADE
When these records are deleted, related records are automatically removed:

- Delete `terms` → Deletes associated `courses`
- Delete `courses` → Deletes `is_enrolled`, `course_staff`, `teams`
- Delete `users` → Deletes `is_enrolled`, `course_staff`, `team_members`
- Delete `teams` → Deletes `team_members`, `team_ta_assignments`
- Delete `is_enrolled` → Deletes `assignment_grades`
- Delete `course_staff` → Deletes `office_hours`, `team_ta_assignments`

This ensures referential integrity and prevents orphaned records.

## Indexes

Strategic indexes are created for:
- **Primary Keys**: Automatically indexed
- **Foreign Keys**: All FK columns have indexes for join performance
- **Lookup Fields**: `email`, `course_code`
- **Status Fields**: `is_active`, `enrollment_status`, `is_team_leader`, `is_system_admin`
- **Composite Keys**: Multi-column indexes on (`user_uuid`, `course_uuid`) for is_enrolled and course_staff
- **Temporal Fields**: `day_of_week` (for office hours queries)

These indexes optimize common query patterns used by the application.

## Schema Design Highlights

### 1. Normalization Improvements (Key Changes)
- **Assignment Normalization**: Assignment details stored once in `assignments` table
  - Eliminates redundancy: Changing `points_possible` updates 1 row instead of 500+
  - `assignment_grades` now only stores student-specific data (points_earned)
  - Cleaner separation: assignment definition vs. student performance

- **Staff Profile Separation**: Staff-only fields moved to `staff_profiles` table
  - Leaner `users` table focused on common attributes
  - Staff-specific fields (office_location, research_interests) in separate 1:1 table
  - Better data organization and query performance

### 2. Optimized Data Types
- **year field**: SMALLINT (1, 2, 3, 4, 5) instead of VARCHAR
  - Enables proper numeric sorting (no more "Sophomore" before "Senior" alphabetically)
  - Smaller storage footprint
  - Can easily calculate years (e.g., filter students in years 3+)

### 3. Simplified User Management
- **Leaner users table**: All common fields, no staff-specific bloat
- **Name Split**: `first_name` and `last_name` for better sorting and display
- **Dynamic Roles**: Roles determined by relationships, supporting multi-role users

### 4. Streamlined Courses
- **Merged Metadata**: Course logistics directly in courses table
- **Single Source**: All course information in one place

### 5. Unified Enrollment & Grades
- **is_enrolled table**: Combines enrollment status AND overall grades
- **Composite PK**: (`user_uuid`, `course_uuid`) - no separate enrollment_uuid
- **Failed Status**: enrollment_status can be 'failed' for students who didn't pass

### 6. Composite Keys for Staff
- **No staff_uuid**: course_staff uses composite PK (`user_uuid`, `course_uuid`)
- **Direct References**: Other tables reference staff via composite foreign keys
- **Simpler Joins**: Fewer tables to join for staff-related queries

### 7. Global Team IDs
- **team_uuid**: Globally unique across all courses and terms
- **course_uuid FK**: Establishes which course the team belongs to
- **Cross-course uniqueness**: Can identify any team by team_uuid alone

### 8. Efficient TA Assignments
- **team_uuid as PK**: Since one team = one TA, team_uuid serves as primary key
- **course_uuid included**: Enables easier queries and maintains referential integrity
- **Composite FK to course_staff**: (`ta_user_uuid`, `course_uuid`) ensures TA is actually staff for that course
