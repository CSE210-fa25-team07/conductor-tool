-- Connect to conductor_tool database
\c conductor_tool

-- Roles table
CREATE TABLE IF NOT EXISTS role (
    role_uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role VARCHAR(50) NOT NULL UNIQUE
);

-- Users table
CREATE TABLE IF NOT EXISTS users (
    user_uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    photo_url TEXT,
    pronouns VARCHAR(50),
    bio TEXT,
    phone_number VARCHAR(20),
    github_username VARCHAR(100),
    last_login TIMESTAMPTZ
);
-- Staffs table (additional profile data for staff users)
CREATE TABLE IF NOT EXISTS staffs (
    user_uuid UUID PRIMARY KEY REFERENCES users(user_uuid) ON DELETE CASCADE,
    office_location VARCHAR(255),
    research_interest TEXT,
    personal_website TEXT,
    is_prof BOOLEAN DEFAULT FALSE,
    is_system_admin BOOLEAN DEFAULT FALSE,
    is_lead_admin BOOLEAN DEFAULT FALSE
);
-- Class term table
CREATE TABLE IF NOT EXISTS class_term (
    term_uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    year INTEGER NOT NULL,
    season VARCHAR(20) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    CONSTRAINT unique_term UNIQUE (year, season)
);
-- Courses table
CREATE TABLE IF NOT EXISTS courses (
    course_uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_code VARCHAR(20) NOT NULL,
    course_name VARCHAR(255) NOT NULL,
    term_uuid UUID NOT NULL REFERENCES class_term(term_uuid) ON DELETE CASCADE,
    description TEXT,
    syllabus_url TEXT,
    canvas_url TEXT,
    lecture_uuid UUID,
    CONSTRAINT unique_course_term UNIQUE (course_code, term_uuid)
);
-- Course enrollment (many-to-many with role)
CREATE TABLE IF NOT EXISTS course_enrollment (
    user_uuid UUID NOT NULL REFERENCES users(user_uuid) ON DELETE CASCADE,
    course_uuid UUID NOT NULL REFERENCES courses(course_uuid) ON DELETE CASCADE,
    role_uuid UUID NOT NULL REFERENCES role(role_uuid) ON DELETE RESTRICT,
    enrollment_status VARCHAR(20) NOT NULL DEFAULT 'active',
    enrolled_at TIMESTAMPTZ,
    dropped_at TIMESTAMPTZ,
    PRIMARY KEY (user_uuid, course_uuid, role_uuid)
);
-- Verification codes for role-based enrollment
CREATE TABLE IF NOT EXISTS verification_codes (
    course_uuid UUID NOT NULL REFERENCES courses(course_uuid) ON DELETE CASCADE,
    role_uuid UUID NOT NULL REFERENCES role(role_uuid) ON DELETE CASCADE,
    veri_code VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    PRIMARY KEY (course_uuid, role_uuid)
);
-- Teams
CREATE TABLE IF NOT EXISTS teams (
    team_uuid     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_uuid   UUID NOT NULL REFERENCES courses(course_uuid)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    team_name     TEXT NOT NULL,
    team_page_url TEXT,
    repo_url      TEXT,
    team_ta_uuid  UUID REFERENCES users(user_uuid)
        ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT uq_team_name_per_course UNIQUE (course_uuid, team_name)
);
-- Team members
CREATE TABLE IF NOT EXISTS team_members (
    team_uuid  UUID NOT NULL REFERENCES teams(team_uuid)
        ON UPDATE CASCADE ON DELETE CASCADE,
    user_uuid  UUID NOT NULL REFERENCES users(user_uuid)
        ON UPDATE CASCADE ON DELETE CASCADE,
    joined_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    left_at    TIMESTAMPTZ,
    CONSTRAINT pk_team_members PRIMARY KEY (team_uuid, user_uuid),
    CONSTRAINT chk_left_after_join CHECK (left_at IS NULL OR left_at >= joined_at)
);
-- Standup entries
CREATE TABLE IF NOT EXISTS standup (
    standup_uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_uuid UUID NOT NULL REFERENCES users(user_uuid) ON DELETE CASCADE,
    team_uuid UUID NOT NULL REFERENCES teams(team_uuid) ON DELETE CASCADE,
    course_uuid UUID NOT NULL REFERENCES courses(course_uuid) ON DELETE CASCADE,
    date_submitted TIMESTAMPTZ,
    what_done TEXT,
    what_next TEXT,
    blockers TEXT,
    reflection TEXT,
    sentiment_score INTEGER,
    visibility VARCHAR(20),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- Standup comments
CREATE TABLE IF NOT EXISTS standup_comments (
    comment_uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    standup_uuid UUID NOT NULL REFERENCES standup(standup_uuid) ON DELETE CASCADE,
    commenter_uuid UUID NOT NULL REFERENCES users(user_uuid) ON DELETE CASCADE,
    comment_text TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- Standup notifications
CREATE TABLE IF NOT EXISTS standup_notifications (
    notif_uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_uuid UUID NOT NULL REFERENCES users(user_uuid) ON DELETE CASCADE,
    receiver_uuid UUID NOT NULL REFERENCES users(user_uuid) ON DELETE CASCADE,
    standup_uuid UUID NOT NULL REFERENCES standup(standup_uuid) ON DELETE CASCADE,
    message TEXT NOT NULL,
    status VARCHAR(10) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- Standup sentiment logs
CREATE TABLE IF NOT EXISTS standup_sentiment_logs (
    log_uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    standup_uuid UUID NOT NULL REFERENCES standup(standup_uuid) ON DELETE CASCADE,
    sentiment_score INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- Meetings
CREATE TABLE IF NOT EXISTS meeting (
    meeting_uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_uuid UUID NOT NULL REFERENCES users(user_uuid) ON DELETE CASCADE,
    course_uuid UUID NOT NULL REFERENCES courses(course_uuid) ON DELETE CASCADE,
    meeting_start_time TIMESTAMPTZ NOT NULL,
    meeting_end_time TIMESTAMPTZ NOT NULL,
    meeting_date DATE NOT NULL,
    meeting_title VARCHAR(255) NOT NULL,
    meeting_description TEXT,
    meeting_location VARCHAR(255),
    is_recurring BOOLEAN NOT NULL DEFAULT FALSE,
    parent_meeting_uuid UUID REFERENCES meeting(meeting_uuid) ON DELETE SET NULL,
    meeting_type INTEGER NOT NULL
);
-- Meeting codes (QR / attendance codes)
CREATE TABLE IF NOT EXISTS meeting_codes (
    code_uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    qr_url TEXT NOT NULL,
    meeting_code VARCHAR(20) NOT NULL,
    meeting_uuid UUID NOT NULL REFERENCES meeting(meeting_uuid) ON DELETE CASCADE,
    valid_start_datetime TIMESTAMPTZ NOT NULL,
    valid_end_datetime TIMESTAMPTZ NOT NULL
);
-- Participants (attendance)
CREATE TABLE IF NOT EXISTS participants (
    meeting_uuid UUID NOT NULL REFERENCES meeting(meeting_uuid) ON DELETE CASCADE,
    participant_uuid UUID NOT NULL REFERENCES users(user_uuid) ON DELETE CASCADE,
    present BOOLEAN NOT NULL DEFAULT FALSE,
    attendance_time TIMESTAMPTZ DEFAULT NULL,
    PRIMARY KEY (meeting_uuid, participant_uuid)
);
-- Form requests (for requesting access to the system)
CREATE TABLE IF NOT EXISTS form_request (
    request_uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    related_institution VARCHAR(255),
    verification_code VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

