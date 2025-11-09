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
│ final_percentage    │       ┌──────────────┐    │ is_published        │
│ final_letter_grade  │       │office_hours  │    └─────────────────────┘
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
         ┌─────────────────┴──────────────────┐
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
