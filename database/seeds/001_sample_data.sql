-- Sample Data for Conductor Tool
-- Provides test users, courses, enrollments, and teams for development

-- ============================================
-- USERS
-- ============================================

-- Professors
INSERT INTO users (email, first_name, last_name, github_username, bio, pronouns) VALUES
    ('powell@ucsd.edu', 'Thomas', 'Powell', 'tpowell', 'Professor of Software Engineering at UCSD', 'he/him'),
    ('jones@ucsd.edu', 'Sarah', 'Jones', 'sjones', 'Associate Professor, HCI and Software Design', 'she/her')
ON CONFLICT (email) DO NOTHING;

-- TAs
INSERT INTO users (email, first_name, last_name, github_username, bio, pronouns) VALUES
    ('ta_alice@ucsd.edu', 'Alice', 'Anderson', 'alice-ta', 'PhD student, Software Engineering', 'she/her'),
    ('ta_bob@ucsd.edu', 'Bob', 'Brown', 'bob-ta', 'Masters student, Computer Science', 'he/him'),
    ('ta_carol@ucsd.edu', 'Carol', 'Chen', 'carol-ta', 'PhD student, HCI', 'she/her')
ON CONFLICT (email) DO NOTHING;

-- Students
INSERT INTO users (email, first_name, last_name, github_username, bio, pronouns) VALUES
    ('student1@ucsd.edu', 'David', 'Davis', 'ddavis', 'CS major, class of 2025', 'he/him'),
    ('student2@ucsd.edu', 'Emma', 'Evans', 'eevans', 'CS major, class of 2025', 'she/her'),
    ('student3@ucsd.edu', 'Frank', 'Foster', 'ffoster', 'CS major, class of 2025', 'he/him'),
    ('student4@ucsd.edu', 'Grace', 'Garcia', 'ggarcia', 'CS major, class of 2025', 'she/her'),
    ('student5@ucsd.edu', 'Henry', 'Harris', 'hharris', 'CS major, class of 2026', 'he/him'),
    ('student6@ucsd.edu', 'Iris', 'Isa', 'iisa', 'CS major, class of 2026', 'she/her'),
    ('student7@ucsd.edu', 'Jack', 'Jackson', 'jjackson', 'CS major, class of 2026', 'he/him'),
    ('student8@ucsd.edu', 'Kelly', 'King', 'kking', 'CS major, class of 2026', 'she/her'),
    ('student9@ucsd.edu', 'Leo', 'Lopez', 'llopez', 'CS major, class of 2025', 'he/him'),
    ('student10@ucsd.edu', 'Maya', 'Martinez', 'mmartinez', 'CS major, class of 2025', 'she/her')
ON CONFLICT (email) DO NOTHING;

-- ============================================
-- STAFF PROFILES
-- ============================================

-- Get user UUIDs for professors
DO $$
DECLARE
    powell_uuid UUID;
    jones_uuid UUID;
BEGIN
    SELECT user_uuid INTO powell_uuid FROM users WHERE email = 'powell@ucsd.edu';
    SELECT user_uuid INTO jones_uuid FROM users WHERE email = 'jones@ucsd.edu';

    -- Create staff profiles
    INSERT INTO staff_profiles (user_uuid, is_prof, is_system_admin, office_location, research_interests, personal_website)
    VALUES
        (powell_uuid, true, true, 'CSE Building 3110', 'Software Engineering, Agile Development, Team Collaboration', 'https://tpowell.ucsd.edu'),
        (jones_uuid, true, false, 'CSE Building 3120', 'HCI, UX Design, Accessibility', 'https://sjones.ucsd.edu')
    ON CONFLICT (user_uuid) DO NOTHING;
END $$;

-- ============================================
-- TERMS
-- ============================================

INSERT INTO term (year, season, start_date, end_date, is_active) VALUES
    (2024, 'Fall', '2024-09-23', '2024-12-14', false),
    (2025, 'Winter', '2025-01-06', '2025-03-21', true),
    (2025, 'Spring', '2025-03-31', '2025-06-13', false)
ON CONFLICT (year, season) DO NOTHING;

-- ============================================
-- COURSES
-- ============================================

DO $$
DECLARE
    fall_2024_uuid UUID;
    winter_2025_uuid UUID;
BEGIN
    SELECT term_uuid INTO fall_2024_uuid FROM term WHERE year = 2024 AND season = 'Fall';
    SELECT term_uuid INTO winter_2025_uuid FROM term WHERE year = 2025 AND season = 'Winter';

    INSERT INTO courses (course_code, course_name, term_uuid, description, syllabus_url, canvas_url)
    VALUES
        ('CSE210', 'Software Engineering', winter_2025_uuid,
         'Introduction to software development and maintenance, emphasizing modern techniques and methods.',
         'https://syllabus.ucsd.edu/cse210', 'https://canvas.ucsd.edu/courses/12345'),
        ('CSE112', 'Advanced Software Engineering', winter_2025_uuid,
         'Advanced topics in software engineering including design patterns, architecture, and testing.',
         'https://syllabus.ucsd.edu/cse112', 'https://canvas.ucsd.edu/courses/12346'),
        ('CSE210', 'Software Engineering', fall_2024_uuid,
         'Introduction to software development and maintenance, emphasizing modern techniques and methods.',
         'https://syllabus.ucsd.edu/cse210-fall', 'https://canvas.ucsd.edu/courses/12347')
    ON CONFLICT (course_code, term_uuid) DO NOTHING;
END $$;

-- ============================================
-- COURSE ENROLLMENTS
-- ============================================

DO $$
DECLARE
    cse210_winter_uuid UUID;
    cse112_winter_uuid UUID;
    powell_uuid UUID;
    jones_uuid UUID;
    ta_alice_uuid UUID;
    ta_bob_uuid UUID;
    ta_carol_uuid UUID;
    student1_uuid UUID;
    student2_uuid UUID;
    student3_uuid UUID;
    student4_uuid UUID;
    student5_uuid UUID;
    student6_uuid UUID;
    student7_uuid UUID;
    student8_uuid UUID;
    student9_uuid UUID;
    student10_uuid UUID;
    role_professor_uuid UUID;
    role_ta_uuid UUID;
    role_student_uuid UUID;
BEGIN
    -- Get course UUIDs
    SELECT course_uuid INTO cse210_winter_uuid FROM courses WHERE course_code = 'CSE210' AND term_uuid = (SELECT term_uuid FROM term WHERE year = 2025 AND season = 'Winter');
    SELECT course_uuid INTO cse112_winter_uuid FROM courses WHERE course_code = 'CSE112' AND term_uuid = (SELECT term_uuid FROM term WHERE year = 2025 AND season = 'Winter');

    -- Get user UUIDs
    SELECT user_uuid INTO powell_uuid FROM users WHERE email = 'powell@ucsd.edu';
    SELECT user_uuid INTO jones_uuid FROM users WHERE email = 'jones@ucsd.edu';
    SELECT user_uuid INTO ta_alice_uuid FROM users WHERE email = 'ta_alice@ucsd.edu';
    SELECT user_uuid INTO ta_bob_uuid FROM users WHERE email = 'ta_bob@ucsd.edu';
    SELECT user_uuid INTO ta_carol_uuid FROM users WHERE email = 'ta_carol@ucsd.edu';
    SELECT user_uuid INTO student1_uuid FROM users WHERE email = 'student1@ucsd.edu';
    SELECT user_uuid INTO student2_uuid FROM users WHERE email = 'student2@ucsd.edu';
    SELECT user_uuid INTO student3_uuid FROM users WHERE email = 'student3@ucsd.edu';
    SELECT user_uuid INTO student4_uuid FROM users WHERE email = 'student4@ucsd.edu';
    SELECT user_uuid INTO student5_uuid FROM users WHERE email = 'student5@ucsd.edu';
    SELECT user_uuid INTO student6_uuid FROM users WHERE email = 'student6@ucsd.edu';
    SELECT user_uuid INTO student7_uuid FROM users WHERE email = 'student7@ucsd.edu';
    SELECT user_uuid INTO student8_uuid FROM users WHERE email = 'student8@ucsd.edu';
    SELECT user_uuid INTO student9_uuid FROM users WHERE email = 'student9@ucsd.edu';
    SELECT user_uuid INTO student10_uuid FROM users WHERE email = 'student10@ucsd.edu';

    -- Get role UUIDs
    SELECT role_uuid INTO role_professor_uuid FROM role WHERE role = 'professor';
    SELECT role_uuid INTO role_ta_uuid FROM role WHERE role = 'ta';
    SELECT role_uuid INTO role_student_uuid FROM role WHERE role = 'student';

    -- CSE210 Winter 2025 Enrollments
    -- Professor
    INSERT INTO course_enrollment (user_uuid, course_uuid, role_uuid, enrollment_status) VALUES
        (powell_uuid, cse210_winter_uuid, role_professor_uuid, 'active');

    -- TAs
    INSERT INTO course_enrollment (user_uuid, course_uuid, role_uuid, enrollment_status) VALUES
        (ta_alice_uuid, cse210_winter_uuid, role_ta_uuid, 'active'),
        (ta_bob_uuid, cse210_winter_uuid, role_ta_uuid, 'active');

    -- Students
    INSERT INTO course_enrollment (user_uuid, course_uuid, role_uuid, enrollment_status) VALUES
        (student1_uuid, cse210_winter_uuid, role_student_uuid, 'active'),
        (student2_uuid, cse210_winter_uuid, role_student_uuid, 'active'),
        (student3_uuid, cse210_winter_uuid, role_student_uuid, 'active'),
        (student4_uuid, cse210_winter_uuid, role_student_uuid, 'active'),
        (student5_uuid, cse210_winter_uuid, role_student_uuid, 'active'),
        (student6_uuid, cse210_winter_uuid, role_student_uuid, 'active');

    -- CSE112 Winter 2025 Enrollments
    -- Professor
    INSERT INTO course_enrollment (user_uuid, course_uuid, role_uuid, enrollment_status) VALUES
        (jones_uuid, cse112_winter_uuid, role_professor_uuid, 'active');

    -- TAs
    INSERT INTO course_enrollment (user_uuid, course_uuid, role_uuid, enrollment_status) VALUES
        (ta_carol_uuid, cse112_winter_uuid, role_ta_uuid, 'active');

    -- Students (some overlap with CSE210)
    INSERT INTO course_enrollment (user_uuid, course_uuid, role_uuid, enrollment_status) VALUES
        (student5_uuid, cse112_winter_uuid, role_student_uuid, 'active'),
        (student6_uuid, cse112_winter_uuid, role_student_uuid, 'active'),
        (student7_uuid, cse112_winter_uuid, role_student_uuid, 'active'),
        (student8_uuid, cse112_winter_uuid, role_student_uuid, 'active'),
        (student9_uuid, cse112_winter_uuid, role_student_uuid, 'active'),
        (student10_uuid, cse112_winter_uuid, role_student_uuid, 'active');

EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error in course enrollments: %', SQLERRM;
END $$;

-- ============================================
-- TEAMS
-- ============================================

DO $$
DECLARE
    cse210_winter_uuid UUID;
    ta_alice_uuid UUID;
    ta_bob_uuid UUID;
    student1_uuid UUID;
    student2_uuid UUID;
    student3_uuid UUID;
    student4_uuid UUID;
    student5_uuid UUID;
    student6_uuid UUID;
    team1_uuid UUID;
    team2_uuid UUID;
    role_lead_uuid UUID;
BEGIN
    SELECT course_uuid INTO cse210_winter_uuid FROM courses WHERE course_code = 'CSE210' AND term_uuid = (SELECT term_uuid FROM term WHERE year = 2025 AND season = 'Winter');
    SELECT user_uuid INTO ta_alice_uuid FROM users WHERE email = 'ta_alice@ucsd.edu';
    SELECT user_uuid INTO ta_bob_uuid FROM users WHERE email = 'ta_bob@ucsd.edu';
    SELECT user_uuid INTO student1_uuid FROM users WHERE email = 'student1@ucsd.edu';
    SELECT user_uuid INTO student2_uuid FROM users WHERE email = 'student2@ucsd.edu';
    SELECT user_uuid INTO student3_uuid FROM users WHERE email = 'student3@ucsd.edu';
    SELECT user_uuid INTO student4_uuid FROM users WHERE email = 'student4@ucsd.edu';
    SELECT user_uuid INTO student5_uuid FROM users WHERE email = 'student5@ucsd.edu';
    SELECT user_uuid INTO student6_uuid FROM users WHERE email = 'student6@ucsd.edu';
    SELECT role_uuid INTO role_lead_uuid FROM role WHERE role = 'lead';

    -- Create teams
    INSERT INTO teams (course_uuid, team_name, team_page_url, repo_url, team_ta_uuid)
    VALUES
        (cse210_winter_uuid, 'Team Alpha', 'https://github.com/team-alpha', 'https://github.com/cse210/team-alpha', ta_alice_uuid)
    RETURNING team_uuid INTO team1_uuid;

    INSERT INTO teams (course_uuid, team_name, team_page_url, repo_url, team_ta_uuid)
    VALUES
        (cse210_winter_uuid, 'Team Beta', 'https://github.com/team-beta', 'https://github.com/cse210/team-beta', ta_bob_uuid)
    RETURNING team_uuid INTO team2_uuid;

    -- Add team members
    INSERT INTO team_members (team_uuid, user_uuid) VALUES
        (team1_uuid, student1_uuid),
        (team1_uuid, student2_uuid),
        (team1_uuid, student3_uuid);

    INSERT INTO team_members (team_uuid, user_uuid) VALUES
        (team2_uuid, student4_uuid),
        (team2_uuid, student5_uuid),
        (team2_uuid, student6_uuid);

    -- Make student1 and student4 team leads
    INSERT INTO course_enrollment (user_uuid, course_uuid, role_uuid, enrollment_status) VALUES
        (student1_uuid, cse210_winter_uuid, role_lead_uuid, 'active'),
        (student4_uuid, cse210_winter_uuid, role_lead_uuid, 'active')
    ON CONFLICT (user_uuid, course_uuid, role_uuid) DO NOTHING;

EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error in teams: %', SQLERRM;
END $$;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Sample data seeded successfully!';
    RAISE NOTICE 'Created:';
    RAISE NOTICE '  - 12 users (2 professors, 3 TAs, 10 students)';
    RAISE NOTICE '  - 3 terms (Fall 2024, Winter 2025, Spring 2025)';
    RAISE NOTICE '  - 3 courses';
    RAISE NOTICE '  - Course enrollments with various roles';
    RAISE NOTICE '  - 2 teams in CSE210';
END $$;
