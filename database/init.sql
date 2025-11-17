-- Conductor Tool Database Schema
-- Auto-generated from TABLES.md
-- Creates all tables with proper relationships and constraints

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop tables in reverse dependency order (for clean reinstalls)
DROP TABLE IF EXISTS sentiment_logs CASCADE;
DROP TABLE IF EXISTS standup_notifications CASCADE;
DROP TABLE IF EXISTS standup_comments CASCADE;
DROP TABLE IF EXISTS standups CASCADE;
DROP TABLE IF EXISTS team_members CASCADE;
DROP TABLE IF EXISTS teams CASCADE;
DROP TABLE IF EXISTS meeting_codes CASCADE;
DROP TABLE IF EXISTS participants CASCADE;
DROP TABLE IF EXISTS meeting CASCADE;
DROP TABLE IF EXISTS verification_code CASCADE;
DROP TABLE IF EXISTS request_form CASCADE;
DROP TABLE IF EXISTS course_enrollment CASCADE;
DROP TABLE IF EXISTS courses CASCADE;
DROP TABLE IF EXISTS staff_profiles CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS role CASCADE;
DROP TABLE IF EXISTS term CASCADE;

-- Core Tables

-- Term Table
CREATE TABLE term (
    term_uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    year INTEGER NOT NULL,
    season VARCHAR(50) NOT NULL,
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP NOT NULL,
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_term UNIQUE (year, season)
);

-- Role Table
CREATE TABLE role (
    role_uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role VARCHAR(50) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Users Table
CREATE TABLE users (
    user_uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL UNIQUE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    photo_url TEXT,
    pronouns VARCHAR(50),
    bio TEXT,
    phone_number VARCHAR(20),
    github_username VARCHAR(100),
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Staff Profiles Table
CREATE TABLE staff_profiles (
    user_uuid UUID PRIMARY KEY,
    office_location VARCHAR(255),
    research_interests TEXT,
    personal_website TEXT,
    is_prof BOOLEAN DEFAULT false,
    is_system_admin BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_staff_user FOREIGN KEY (user_uuid) REFERENCES users(user_uuid) ON DELETE CASCADE
);

-- Courses Table
CREATE TABLE courses (
    course_uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_code VARCHAR(50) NOT NULL,
    course_name VARCHAR(255) NOT NULL,
    term_uuid UUID NOT NULL,
    description TEXT,
    syllabus_url TEXT,
    canvas_url TEXT,
    lecture_uuid UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_course_term FOREIGN KEY (term_uuid) REFERENCES term(term_uuid) ON DELETE CASCADE,
    CONSTRAINT unique_course_term UNIQUE (course_code, term_uuid)
);

-- Course Enrollment Table
CREATE TABLE course_enrollment (
    user_uuid UUID NOT NULL,
    course_uuid UUID NOT NULL,
    role_uuid UUID NOT NULL,
    enrollment_status VARCHAR(50) DEFAULT 'active',
    enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    dropped_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_uuid, course_uuid, role_uuid),
    CONSTRAINT fk_enrollment_user FOREIGN KEY (user_uuid) REFERENCES users(user_uuid) ON DELETE CASCADE,
    CONSTRAINT fk_enrollment_course FOREIGN KEY (course_uuid) REFERENCES courses(course_uuid) ON DELETE CASCADE,
    CONSTRAINT fk_enrollment_role FOREIGN KEY (role_uuid) REFERENCES role(role_uuid) ON DELETE CASCADE
);

-- Meeting Table
CREATE TABLE meeting (
    meeting_uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    creator_uuid UUID NOT NULL,
    course_uuid UUID NOT NULL,
    meeting_type INTEGER NOT NULL,
    meeting_date DATE NOT NULL,
    meeting_start_time TIME NOT NULL,
    meeting_end_time TIME NOT NULL,
    location VARCHAR(255),
    meeting_description TEXT,
    is_recurring BOOLEAN DEFAULT false,
    parent_meeting_uuid UUID,
    day VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_meeting_creator FOREIGN KEY (creator_uuid) REFERENCES users(user_uuid) ON DELETE CASCADE,
    CONSTRAINT fk_meeting_course FOREIGN KEY (course_uuid) REFERENCES courses(course_uuid) ON DELETE CASCADE,
    CONSTRAINT fk_meeting_parent FOREIGN KEY (parent_meeting_uuid) REFERENCES meeting(meeting_uuid) ON DELETE CASCADE
);

-- Participants Table
CREATE TABLE participants (
    meeting_uuid UUID NOT NULL,
    participant_uuid UUID NOT NULL,
    present BOOLEAN DEFAULT false,
    attendance_time TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (meeting_uuid, participant_uuid),
    CONSTRAINT fk_participant_meeting FOREIGN KEY (meeting_uuid) REFERENCES meeting(meeting_uuid) ON DELETE CASCADE,
    CONSTRAINT fk_participant_user FOREIGN KEY (participant_uuid) REFERENCES users(user_uuid) ON DELETE CASCADE
);

-- Meeting Codes Table
CREATE TABLE meeting_codes (
    code_uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    meeting_code VARCHAR(50) NOT NULL UNIQUE,
    meeting_uuid UUID NOT NULL,
    qr_code_link TEXT,
    valid_start_datetime TIMESTAMP NOT NULL,
    valid_end_datetime TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_meeting_code_meeting FOREIGN KEY (meeting_uuid) REFERENCES meeting(meeting_uuid) ON DELETE CASCADE
);

-- Teams Table
CREATE TABLE teams (
    team_uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_uuid UUID NOT NULL,
    team_name VARCHAR(255) NOT NULL,
    team_page_url TEXT,
    repo_url TEXT,
    team_ta_uuid UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_team_course FOREIGN KEY (course_uuid) REFERENCES courses(course_uuid) ON DELETE CASCADE,
    CONSTRAINT fk_team_ta FOREIGN KEY (team_ta_uuid) REFERENCES users(user_uuid) ON DELETE SET NULL,
    CONSTRAINT unique_team_name_course UNIQUE (course_uuid, team_name)
);

-- Team Members Table
CREATE TABLE team_members (
    team_uuid UUID NOT NULL,
    user_uuid UUID NOT NULL,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    left_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (team_uuid, user_uuid),
    CONSTRAINT fk_team_member_team FOREIGN KEY (team_uuid) REFERENCES teams(team_uuid) ON DELETE CASCADE,
    CONSTRAINT fk_team_member_user FOREIGN KEY (user_uuid) REFERENCES users(user_uuid) ON DELETE CASCADE
);

-- Standups Table
CREATE TABLE standups (
    standup_uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_uuid UUID NOT NULL,
    team_uuid UUID NOT NULL,
    course_uuid UUID NOT NULL,
    date_submitted DATE NOT NULL,
    what_done TEXT,
    what_next TEXT,
    blockers TEXT,
    reflection TEXT,
    sentiment_score DECIMAL(3, 2),
    visibility VARCHAR(50) DEFAULT 'team',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_standup_user FOREIGN KEY (user_uuid) REFERENCES users(user_uuid) ON DELETE CASCADE,
    CONSTRAINT fk_standup_team FOREIGN KEY (team_uuid) REFERENCES teams(team_uuid) ON DELETE CASCADE,
    CONSTRAINT fk_standup_course FOREIGN KEY (course_uuid) REFERENCES courses(course_uuid) ON DELETE CASCADE
);

-- Standup Comments Table
CREATE TABLE standup_comments (
    comment_uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    standup_uuid UUID NOT NULL,
    commenter_uuid UUID NOT NULL,
    comment_text TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_comment_standup FOREIGN KEY (standup_uuid) REFERENCES standups(standup_uuid) ON DELETE CASCADE,
    CONSTRAINT fk_comment_user FOREIGN KEY (commenter_uuid) REFERENCES users(user_uuid) ON DELETE CASCADE
);

-- Standup Notifications Table
CREATE TABLE standup_notifications (
    notif_uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sender_uuid UUID NOT NULL,
    receiver_uuid UUID NOT NULL,
    standup_uuid UUID NOT NULL,
    message TEXT,
    status VARCHAR(50) DEFAULT 'unread',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_notification_sender FOREIGN KEY (sender_uuid) REFERENCES users(user_uuid) ON DELETE CASCADE,
    CONSTRAINT fk_notification_receiver FOREIGN KEY (receiver_uuid) REFERENCES users(user_uuid) ON DELETE CASCADE,
    CONSTRAINT fk_notification_standup FOREIGN KEY (standup_uuid) REFERENCES standups(standup_uuid) ON DELETE CASCADE
);

-- Sentiment Logs Table
CREATE TABLE sentiment_logs (
    log_uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    standup_uuid UUID NOT NULL,
    sentiment_score DECIMAL(3, 2),
    detected_keywords JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_sentiment_standup FOREIGN KEY (standup_uuid) REFERENCES standups(standup_uuid) ON DELETE CASCADE
);

-- Verification Code Table
CREATE TABLE verification_code (
    course_uuid UUID NOT NULL,
    role_uuid UUID NOT NULL,
    veri_code VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    PRIMARY KEY (course_uuid, role_uuid),
    CONSTRAINT fk_veri_course FOREIGN KEY (course_uuid) REFERENCES courses(course_uuid) ON DELETE CASCADE,
    CONSTRAINT fk_veri_role FOREIGN KEY (role_uuid) REFERENCES role(role_uuid) ON DELETE CASCADE
);

-- Request Form Table
CREATE TABLE request_form (
    form_uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    institution VARCHAR(255),
    verification_code VARCHAR(100),
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_github ON users(github_username);
CREATE INDEX idx_course_enrollment_user ON course_enrollment(user_uuid);
CREATE INDEX idx_course_enrollment_course ON course_enrollment(course_uuid);
CREATE INDEX idx_meeting_course ON meeting(course_uuid);
CREATE INDEX idx_meeting_date ON meeting(meeting_date);
CREATE INDEX idx_participants_user ON participants(participant_uuid);
CREATE INDEX idx_teams_course ON teams(course_uuid);
CREATE INDEX idx_standups_user ON standups(user_uuid);
CREATE INDEX idx_standups_team ON standups(team_uuid);
CREATE INDEX idx_standups_date ON standups(date_submitted);
CREATE INDEX idx_standup_comments_standup ON standup_comments(standup_uuid);
CREATE INDEX idx_standup_notifications_receiver ON standup_notifications(receiver_uuid);
CREATE INDEX idx_term_active ON term(is_active);

-- Insert default roles
INSERT INTO role (role) VALUES
    ('student'),
    ('ta'),
    ('professor'),
    ('admin'),
    ('lead')
ON CONFLICT (role) DO NOTHING;

-- Create a function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns
CREATE TRIGGER update_term_updated_at BEFORE UPDATE ON term FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_staff_profiles_updated_at BEFORE UPDATE ON staff_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON courses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_course_enrollment_updated_at BEFORE UPDATE ON course_enrollment FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_meeting_updated_at BEFORE UPDATE ON meeting FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_participants_updated_at BEFORE UPDATE ON participants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON teams FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_team_members_updated_at BEFORE UPDATE ON team_members FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_standups_updated_at BEFORE UPDATE ON standups FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_standup_comments_updated_at BEFORE UPDATE ON standup_comments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_request_form_updated_at BEFORE UPDATE ON request_form FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Conductor database schema initialized successfully!';
END $$;
