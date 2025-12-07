-- Connect to conductor_tool database
\c conductor_tool

-- ============================================
-- SAMPLE DATA FOR ALL TABLES
-- Ensures every table has test data for development
-- ============================================

-- ============================================
-- 1. CLASS TERMS
-- ============================================
INSERT INTO class_term (year, season, start_date, end_date, is_active) VALUES
    (2024, 'Fall', '2024-09-23', '2024-12-14', false),
    (2025, 'Winter', '2025-01-06', '2025-03-21', false),
    (2025, 'Spring', '2025-03-31', '2025-06-13', false),
    (2025, 'Fall', '2025-09-25', '2025-12-13', true)
ON CONFLICT (year, season) DO NOTHING;

-- ============================================
-- 2. USERS (18 total: 5 professors/admins, 3 TAs, 10 students)
-- ============================================
INSERT INTO users (email, first_name, last_name, github_username, bio, pronouns, phone_number, last_login) VALUES
    -- Professors & Admins
    ('powell@ucsd.edu', 'Thomas', 'Powell', 'tpowell', 'Professor of Software Engineering', 'he/him', '858-534-1001', NOW() - INTERVAL '2 hours'),
    ('jones@ucsd.edu', 'Sarah', 'Jones', 'sjones', 'Associate Professor, HCI Research', 'she/her', '858-534-1002', NOW() - INTERVAL '1 day'),
    ('johnson@ucsd.edu', 'Michael', 'Johnson', 'mjohnson', 'Associate Professor, Distributed Systems', 'he/him', '858-534-1003', NOW() - INTERVAL '3 hours'),
    ('williams@ucsd.edu', 'Jennifer', 'Williams', 'jwilliams', 'Assistant Professor, Machine Learning', 'she/her', '858-534-1004', NOW() - INTERVAL '5 hours'),
    ('brown@ucsd.edu', 'Robert', 'Brown', 'rbrown', 'Professor of Computer Science', 'he/him', '858-534-1005', NOW() - INTERVAL '4 hours'),

    -- TAs
    ('ta_alice@ucsd.edu', 'Alice', 'Anderson', 'alice-ta', 'PhD student researching Software Testing', 'she/her', '858-534-2001', NOW() - INTERVAL '3 hours'),
    ('ta_bob@ucsd.edu', 'Bob', 'Brown', 'bob-ta', 'MS student, Systems and Architecture', 'he/him', '858-534-2002', NOW() - INTERVAL '5 hours'),
    ('ta_carol@ucsd.edu', 'Carol', 'Chen', 'carol-ta', 'PhD student in HCI and Accessibility', 'she/her', '858-534-2003', NOW() - INTERVAL '1 day'),
    
    -- Students
    ('david@ucsd.edu', 'David', 'Davis', 'ddavis', 'CS Senior, interested in full-stack dev', 'he/him', '858-555-0001', NOW() - INTERVAL '4 hours'),
    ('emma@ucsd.edu', 'Emma', 'Evans', 'eevans', 'CS Junior, passionate about mobile apps', 'she/her', '858-555-0002', NOW() - INTERVAL '6 hours'),
    ('frank@ucsd.edu', 'Frank', 'Foster', 'ffoster', 'CS Senior, DevOps enthusiast', 'he/him', '858-555-0003', NOW() - INTERVAL '2 days'),
    ('grace@ucsd.edu', 'Grace', 'Garcia', 'ggarcia', 'CS Junior, UI/UX focused', 'she/her', '858-555-0004', NOW() - INTERVAL '8 hours'),
    ('henry@ucsd.edu', 'Henry', 'Harris', 'hharris', 'CS Junior, backend specialist', 'he/him', '858-555-0005', NOW() - INTERVAL '1 day'),
    ('iris@ucsd.edu', 'Iris', 'Isa', 'iisa', 'CS Junior, data science interested', 'she/her', '858-555-0006', NOW() - INTERVAL '12 hours'),
    ('jack@ucsd.edu', 'Jack', 'Jackson', 'jjackson', 'CS Senior, security focused', 'he/him', '858-555-0007', NOW() - INTERVAL '3 days'),
    ('kelly@ucsd.edu', 'Kelly', 'King', 'kking', 'CS Junior, ML enthusiast', 'she/her', '858-555-0008', NOW() - INTERVAL '10 hours'),
    ('leo@ucsd.edu', 'Leo', 'Lopez', 'llopez', 'CS Senior, game dev interested', 'he/him', '858-555-0009', NOW() - INTERVAL '1 day'),
    ('maya@ucsd.edu', 'Maya', 'Martinez', 'mmartinez', 'CS Junior, cloud computing focused', 'she/her', '858-555-0010', NOW() - INTERVAL '5 hours')
ON CONFLICT (email) DO NOTHING;

-- ============================================
-- 3. STAFF PROFILES (for professors and TAs)
-- ============================================
DO $$
DECLARE
    v_user_uuid UUID;
BEGIN
    -- Professor Powell (Lead Admin)
    SELECT user_uuid INTO v_user_uuid FROM users WHERE email = 'powell@ucsd.edu';
    INSERT INTO staffs (user_uuid, is_prof, is_system_admin, is_lead_admin, office_location, research_interest, personal_website)
    VALUES (v_user_uuid, true, true, true, 'CSE 3110', 'Agile Development, Team Collaboration, Software Quality', 'https://tpowell.ucsd.edu')
    ON CONFLICT (user_uuid) DO NOTHING;

    -- Professor Jones (Regular Professor - not admin)
    SELECT user_uuid INTO v_user_uuid FROM users WHERE email = 'jones@ucsd.edu';
    INSERT INTO staffs (user_uuid, is_prof, is_system_admin, is_lead_admin, office_location, research_interest, personal_website)
    VALUES (v_user_uuid, true, false, false, 'CSE 3120', 'HCI, UX Design, Accessibility Research', 'https://sjones.ucsd.edu')
    ON CONFLICT (user_uuid) DO NOTHING;

    -- Professor Johnson (Admin)
    SELECT user_uuid INTO v_user_uuid FROM users WHERE email = 'johnson@ucsd.edu';
    INSERT INTO staffs (user_uuid, is_prof, is_system_admin, is_lead_admin, office_location, research_interest, personal_website)
    VALUES (v_user_uuid, true, true, false, 'CSE 3130', 'Distributed Systems, Cloud Computing, Microservices', 'https://mjohnson.ucsd.edu')
    ON CONFLICT (user_uuid) DO NOTHING;

    -- Professor Williams (Admin)
    SELECT user_uuid INTO v_user_uuid FROM users WHERE email = 'williams@ucsd.edu';
    INSERT INTO staffs (user_uuid, is_prof, is_system_admin, is_lead_admin, office_location, research_interest, personal_website)
    VALUES (v_user_uuid, true, true, false, 'CSE 3140', 'Machine Learning, AI, Neural Networks', 'https://jwilliams.ucsd.edu')
    ON CONFLICT (user_uuid) DO NOTHING;

    -- Professor Brown (Admin)
    SELECT user_uuid INTO v_user_uuid FROM users WHERE email = 'brown@ucsd.edu';
    INSERT INTO staffs (user_uuid, is_prof, is_system_admin, is_lead_admin, office_location, research_interest, personal_website)
    VALUES (v_user_uuid, true, true, false, 'CSE 3150', 'Algorithms, Data Structures, Complexity Theory', 'https://rbrown.ucsd.edu')
    ON CONFLICT (user_uuid) DO NOTHING;

    -- TA Alice
    SELECT user_uuid INTO v_user_uuid FROM users WHERE email = 'ta_alice@ucsd.edu';
    INSERT INTO staffs (user_uuid, is_prof, is_system_admin, is_lead_admin, office_location, research_interest, personal_website)
    VALUES (v_user_uuid, false, false, false, 'CSE 2140', 'Automated Testing, CI/CD', NULL)
    ON CONFLICT (user_uuid) DO NOTHING;
    
    -- TA Bob
    SELECT user_uuid INTO v_user_uuid FROM users WHERE email = 'ta_bob@ucsd.edu';
    INSERT INTO staffs (user_uuid, is_prof, is_system_admin, is_lead_admin, office_location, research_interest, personal_website)
    VALUES (v_user_uuid, false, false, false, 'CSE 2145', 'Software Architecture, Design Patterns', NULL)
    ON CONFLICT (user_uuid) DO NOTHING;
    
    -- TA Carol
    SELECT user_uuid INTO v_user_uuid FROM users WHERE email = 'ta_carol@ucsd.edu';
    INSERT INTO staffs (user_uuid, is_prof, is_system_admin, is_lead_admin, office_location, research_interest, personal_website)
    VALUES (v_user_uuid, false, false, false, 'CSE 2150', 'User Experience, Interaction Design', 'https://cchen.me')
    ON CONFLICT (user_uuid) DO NOTHING;
END $$;

-- ============================================
-- 4. COURSES
-- ============================================
DO $$
DECLARE
    v_fall_2024 UUID;
    v_winter_2025 UUID;
    v_spring_2025 UUID;
    v_fall_2025 UUID;
BEGIN
    SELECT term_uuid INTO v_fall_2024 FROM class_term WHERE year = 2024 AND season = 'Fall';
    SELECT term_uuid INTO v_winter_2025 FROM class_term WHERE year = 2025 AND season = 'Winter';
    SELECT term_uuid INTO v_spring_2025 FROM class_term WHERE year = 2025 AND season = 'Spring';
    SELECT term_uuid INTO v_fall_2025 FROM class_term WHERE year = 2025 AND season = 'Fall';

    INSERT INTO courses (course_code, course_name, term_uuid, description, syllabus_url, canvas_url) VALUES
        ('CSE210', 'Software Engineering', v_winter_2025, 'Principles and practices of large-scale software development', 'https://syllabus.ucsd.edu/cse210', 'https://canvas.ucsd.edu/courses/50001'),
        ('CSE110', 'Software Engineering', v_winter_2025, 'Introduction to software development and team collaboration', 'https://syllabus.ucsd.edu/cse110', 'https://canvas.ucsd.edu/courses/50002'),
        ('CSE210', 'Software Engineering', v_fall_2024, 'Principles and practices of large-scale software development', 'https://syllabus.ucsd.edu/cse210-f24', 'https://canvas.ucsd.edu/courses/49001'),
        ('CSE210', 'Software Engineering', v_fall_2025, 'Principles and practices of large-scale software development', 'https://syllabus.ucsd.edu/cse210-f25', 'https://canvas.ucsd.edu/courses/49002')
    ON CONFLICT (course_code, term_uuid) DO NOTHING;
END $$;

-- ============================================
-- 5. VERIFICATION CODES
-- ============================================
DO $$
DECLARE
    v_cse210_w25 UUID;
    v_cse110_w25 UUID;
    v_role_ta UUID;
    v_role_student UUID;
    v_role_tutor UUID;
BEGIN
    SELECT course_uuid INTO v_cse210_w25 FROM courses c JOIN class_term t ON c.term_uuid = t.term_uuid 
        WHERE c.course_code = 'CSE210' AND t.year = 2025 AND t.season = 'Winter';
    SELECT course_uuid INTO v_cse110_w25 FROM courses c JOIN class_term t ON c.term_uuid = t.term_uuid 
        WHERE c.course_code = 'CSE110' AND t.year = 2025 AND t.season = 'Winter';
    
    SELECT role_uuid INTO v_role_ta FROM role WHERE role = 'TA';
    SELECT role_uuid INTO v_role_student FROM role WHERE role = 'Student';
    SELECT role_uuid INTO v_role_tutor FROM role WHERE role = 'Tutor';
    
    INSERT INTO verification_codes (course_uuid, role_uuid, veri_code, is_active) VALUES
        (v_cse210_w25, v_role_ta, 'CSE210-TA-WINTER25', true),
        (v_cse210_w25, v_role_student, 'CSE210-STU-WINTER25', true),
        (v_cse110_w25, v_role_ta, 'CSE110-TA-WINTER25', true),
        (v_cse110_w25, v_role_student, 'CSE110-STU-WINTER25', true),
        (v_cse110_w25, v_role_tutor, 'CSE110-TUTOR-WINTER25', true)
    ON CONFLICT (course_uuid, role_uuid) DO NOTHING;
END $$;

DO $$
DECLARE
    v_cse210_f25 UUID;
    v_role_ta UUID;
    v_role_student UUID;
    v_role_tutor UUID;
BEGIN
    SELECT course_uuid INTO v_cse210_f25 FROM courses c JOIN class_term t ON c.term_uuid = t.term_uuid 
        WHERE c.course_code = 'CSE210' AND t.year = 2025 AND t.season = 'Fall';
    
    SELECT role_uuid INTO v_role_ta FROM role WHERE role = 'TA';
    SELECT role_uuid INTO v_role_student FROM role WHERE role = 'Student';
    SELECT role_uuid INTO v_role_tutor FROM role WHERE role = 'Tutor';
    
    INSERT INTO verification_codes (course_uuid, role_uuid, veri_code, is_active) VALUES
        (v_cse210_f25, v_role_ta, 'CSE210-TA-FALL25', true),
        (v_cse210_f25, v_role_student, 'CSE210-STU-FALL25', true)
    ON CONFLICT (course_uuid, role_uuid) DO NOTHING;
END $$;

-- ============================================
-- 6. COURSE ENROLLMENTS
-- ============================================
DO $$
DECLARE
    v_cse210_w25 UUID;
    v_cse110_w25 UUID;
    v_role_prof UUID;
    v_role_ta UUID;
    v_role_student UUID;
    v_role_lead UUID;
BEGIN
    SELECT course_uuid INTO v_cse210_w25 FROM courses c JOIN class_term t ON c.term_uuid = t.term_uuid 
        WHERE c.course_code = 'CSE210' AND t.year = 2025 AND t.season = 'Winter';
    SELECT course_uuid INTO v_cse110_w25 FROM courses c JOIN class_term t ON c.term_uuid = t.term_uuid 
        WHERE c.course_code = 'CSE110' AND t.year = 2025 AND t.season = 'Winter';
    
    SELECT role_uuid INTO v_role_prof FROM role WHERE role = 'Professor';
    SELECT role_uuid INTO v_role_ta FROM role WHERE role = 'TA';
    SELECT role_uuid INTO v_role_student FROM role WHERE role = 'Student';
    SELECT role_uuid INTO v_role_lead FROM role WHERE role = 'Team Leader';
    
    -- CSE210 Winter 2025
    INSERT INTO course_enrollment (user_uuid, course_uuid, role_uuid, enrollment_status, enrolled_at) VALUES
        ((SELECT user_uuid FROM users WHERE email = 'powell@ucsd.edu'), v_cse210_w25, v_role_prof, 'active', '2025-01-06'),
        ((SELECT user_uuid FROM users WHERE email = 'ta_alice@ucsd.edu'), v_cse210_w25, v_role_ta, 'active', '2025-01-06'),
        ((SELECT user_uuid FROM users WHERE email = 'ta_bob@ucsd.edu'), v_cse210_w25, v_role_ta, 'active', '2025-01-06'),
        ((SELECT user_uuid FROM users WHERE email = 'david@ucsd.edu'), v_cse210_w25, v_role_student, 'active', '2025-01-07'),
        ((SELECT user_uuid FROM users WHERE email = 'emma@ucsd.edu'), v_cse210_w25, v_role_student, 'active', '2025-01-07'),
        ((SELECT user_uuid FROM users WHERE email = 'frank@ucsd.edu'), v_cse210_w25, v_role_student, 'active', '2025-01-07'),
        ((SELECT user_uuid FROM users WHERE email = 'grace@ucsd.edu'), v_cse210_w25, v_role_student, 'active', '2025-01-07'),
        ((SELECT user_uuid FROM users WHERE email = 'henry@ucsd.edu'), v_cse210_w25, v_role_student, 'active', '2025-01-08'),
        ((SELECT user_uuid FROM users WHERE email = 'iris@ucsd.edu'), v_cse210_w25, v_role_student, 'active', '2025-01-08'),
        -- Team leaders
        ((SELECT user_uuid FROM users WHERE email = 'david@ucsd.edu'), v_cse210_w25, v_role_lead, 'active', '2025-01-15'),
        ((SELECT user_uuid FROM users WHERE email = 'grace@ucsd.edu'), v_cse210_w25, v_role_lead, 'active', '2025-01-15')
    ON CONFLICT (user_uuid, course_uuid, role_uuid) DO NOTHING;
    
    -- CSE110 Winter 2025
    INSERT INTO course_enrollment (user_uuid, course_uuid, role_uuid, enrollment_status, enrolled_at) VALUES
        ((SELECT user_uuid FROM users WHERE email = 'jones@ucsd.edu'), v_cse110_w25, v_role_prof, 'active', '2025-01-06'),
        ((SELECT user_uuid FROM users WHERE email = 'ta_carol@ucsd.edu'), v_cse110_w25, v_role_ta, 'active', '2025-01-06'),
        ((SELECT user_uuid FROM users WHERE email = 'jack@ucsd.edu'), v_cse110_w25, v_role_student, 'active', '2025-01-07'),
        ((SELECT user_uuid FROM users WHERE email = 'kelly@ucsd.edu'), v_cse110_w25, v_role_student, 'active', '2025-01-07'),
        ((SELECT user_uuid FROM users WHERE email = 'leo@ucsd.edu'), v_cse110_w25, v_role_student, 'active', '2025-01-07'),
        ((SELECT user_uuid FROM users WHERE email = 'maya@ucsd.edu'), v_cse110_w25, v_role_student, 'active', '2025-01-07')
    ON CONFLICT (user_uuid, course_uuid, role_uuid) DO NOTHING;
END $$;

DO $$
DECLARE
    v_cse210_f25 UUID;
    v_role_prof UUID;
    v_role_ta UUID;
    v_role_student UUID;
    v_role_lead UUID;
BEGIN
    SELECT course_uuid INTO v_cse210_f25 FROM courses c JOIN class_term t ON c.term_uuid = t.term_uuid 
        WHERE c.course_code = 'CSE210' AND t.year = 2025 AND t.season = 'Fall';
    
    SELECT role_uuid INTO v_role_prof FROM role WHERE role = 'Professor';
    SELECT role_uuid INTO v_role_ta FROM role WHERE role = 'TA';
    SELECT role_uuid INTO v_role_student FROM role WHERE role = 'Student';
    SELECT role_uuid INTO v_role_lead FROM role WHERE role = 'Team Leader';
    
    INSERT INTO course_enrollment (user_uuid, course_uuid, role_uuid, enrollment_status, enrolled_at) VALUES
        ((SELECT user_uuid FROM users WHERE email = 'powell@ucsd.edu'), v_cse210_f25, v_role_prof, 'active', '2025-09-25'),
        ((SELECT user_uuid FROM users WHERE email = 'ta_alice@ucsd.edu'), v_cse210_f25, v_role_ta, 'active', '2025-09-25'),
        ((SELECT user_uuid FROM users WHERE email = 'ta_bob@ucsd.edu'), v_cse210_f25, v_role_ta, 'active', '2025-09-25'),
        ((SELECT user_uuid FROM users WHERE email = 'david@ucsd.edu'), v_cse210_f25, v_role_student, 'active', '2025-09-26'),
        ((SELECT user_uuid FROM users WHERE email = 'emma@ucsd.edu'), v_cse210_f25, v_role_student, 'active', '2025-09-26'),
        ((SELECT user_uuid FROM users WHERE email = 'frank@ucsd.edu'), v_cse210_f25, v_role_student, 'active', '2025-09-26'),
        ((SELECT user_uuid FROM users WHERE email = 'grace@ucsd.edu'), v_cse210_f25, v_role_student, 'active', '2025-09-26'),
        ((SELECT user_uuid FROM users WHERE email = 'henry@ucsd.edu'), v_cse210_f25, v_role_student, 'active', '2025-09-27'),
        ((SELECT user_uuid FROM users WHERE email = 'iris@ucsd.edu'), v_cse210_f25, v_role_student, 'active', '2025-09-27'),
        -- Team leaders
        ((SELECT user_uuid FROM users WHERE email = 'david@ucsd.edu'), v_cse210_f25, v_role_lead, 'active', '2025-10-01'),
        ((SELECT user_uuid FROM users WHERE email = 'grace@ucsd.edu'), v_cse210_f25, v_role_lead, 'active', '2025-10-01')
    ON CONFLICT (user_uuid, course_uuid, role_uuid) DO NOTHING;
END $$;

-- ============================================
-- 7. TEAMS
-- ============================================
DO $$
DECLARE
    v_cse210_w25 UUID;
    v_team_alpha UUID;
    v_team_beta UUID;
BEGIN
    SELECT course_uuid INTO v_cse210_w25 FROM courses c JOIN class_term t ON c.term_uuid = t.term_uuid 
        WHERE c.course_code = 'CSE210' AND t.year = 2025 AND t.season = 'Winter';
    
    INSERT INTO teams (course_uuid, team_name, team_page_url, repo_url, team_ta_uuid) VALUES
        (v_cse210_w25, 'Team Alpha', 'https://github.com/cse210-alpha', 'https://github.com/cse210-alpha/project', 
         (SELECT user_uuid FROM users WHERE email = 'ta_alice@ucsd.edu'))
    ON CONFLICT (course_uuid, team_name) DO NOTHING
    RETURNING team_uuid INTO v_team_alpha;
    
    IF v_team_alpha IS NULL THEN
        SELECT team_uuid INTO v_team_alpha FROM teams WHERE course_uuid = v_cse210_w25 AND team_name = 'Team Alpha';
    END IF;
    
    INSERT INTO teams (course_uuid, team_name, team_page_url, repo_url, team_ta_uuid) VALUES
        (v_cse210_w25, 'Team Beta', 'https://github.com/cse210-beta', 'https://github.com/cse210-beta/project', 
         (SELECT user_uuid FROM users WHERE email = 'ta_bob@ucsd.edu'))
    ON CONFLICT (course_uuid, team_name) DO NOTHING
    RETURNING team_uuid INTO v_team_beta;
    
    IF v_team_beta IS NULL THEN
        SELECT team_uuid INTO v_team_beta FROM teams WHERE course_uuid = v_cse210_w25 AND team_name = 'Team Beta';
    END IF;
    
    -- Team Alpha members
    INSERT INTO team_members (team_uuid, user_uuid, joined_at) VALUES
        (v_team_alpha, (SELECT user_uuid FROM users WHERE email = 'david@ucsd.edu'), '2025-01-15'),
        (v_team_alpha, (SELECT user_uuid FROM users WHERE email = 'emma@ucsd.edu'), '2025-01-15'),
        (v_team_alpha, (SELECT user_uuid FROM users WHERE email = 'frank@ucsd.edu'), '2025-01-15')
    ON CONFLICT (team_uuid, user_uuid) DO NOTHING;
    
    -- Team Beta members
    INSERT INTO team_members (team_uuid, user_uuid, joined_at) VALUES
        (v_team_beta, (SELECT user_uuid FROM users WHERE email = 'grace@ucsd.edu'), '2025-01-15'),
        (v_team_beta, (SELECT user_uuid FROM users WHERE email = 'henry@ucsd.edu'), '2025-01-15'),
        (v_team_beta, (SELECT user_uuid FROM users WHERE email = 'iris@ucsd.edu'), '2025-01-15')
    ON CONFLICT (team_uuid, user_uuid) DO NOTHING;
END $$;

 
DO $$
DECLARE
    v_cse210_f25 UUID;
    v_team_gamma UUID;
    v_team_delta UUID;
BEGIN
    SELECT course_uuid INTO v_cse210_f25 FROM courses c JOIN class_term t ON c.term_uuid = t.term_uuid 
        WHERE c.course_code = 'CSE210' AND t.year = 2025 AND t.season = 'Fall';
    
    INSERT INTO teams (course_uuid, team_name, team_page_url, repo_url, team_ta_uuid) VALUES
        (v_cse210_f25, 'Team Gamma', 'https://github.com/cse210-gamma', 'https://github.com/cse210-gamma/project', 
         (SELECT user_uuid FROM users WHERE email = 'ta_alice@ucsd.edu'))
    ON CONFLICT (course_uuid, team_name) DO NOTHING
    RETURNING team_uuid INTO v_team_gamma;
    
    IF v_team_gamma IS NULL THEN
        SELECT team_uuid INTO v_team_gamma FROM teams WHERE course_uuid = v_cse210_f25 AND team_name = 'Team Gamma';
    END IF;
    
    INSERT INTO teams (course_uuid, team_name, team_page_url, repo_url, team_ta_uuid) VALUES
        (v_cse210_f25, 'Team Delta', 'https://github.com/cse210-delta', 'https://github.com/cse210-delta/project', 
         (SELECT user_uuid FROM users WHERE email = 'ta_bob@ucsd.edu'))
    ON CONFLICT (course_uuid, team_name) DO NOTHING
    RETURNING team_uuid INTO v_team_delta;
    
    IF v_team_delta IS NULL THEN
        SELECT team_uuid INTO v_team_delta FROM teams WHERE course_uuid = v_cse210_f25 AND team_name = 'Team Delta';
    END IF;
    
    -- Team Gamma members
    INSERT INTO team_members (team_uuid, user_uuid, joined_at) VALUES
        (v_team_gamma, (SELECT user_uuid FROM users WHERE email = 'david@ucsd.edu'), '2025-09-30'),
        (v_team_gamma, (SELECT user_uuid FROM users WHERE email = 'emma@ucsd.edu'), '2025-09-30'),
        (v_team_gamma, (SELECT user_uuid FROM users WHERE email = 'frank@ucsd.edu'), '2025-09-30')
    ON CONFLICT (team_uuid, user_uuid) DO NOTHING;
    
    -- Team Delta members
    INSERT INTO team_members (team_uuid, user_uuid, joined_at) VALUES
        (v_team_delta, (SELECT user_uuid FROM users WHERE email = 'grace@ucsd.edu'), '2025-09-30'),
        (v_team_delta, (SELECT user_uuid FROM users WHERE email = 'henry@ucsd.edu'), '2025-09-30'),
        (v_team_delta, (SELECT user_uuid FROM users WHERE email = 'iris@ucsd.edu'), '2025-09-30')
    ON CONFLICT (team_uuid, user_uuid) DO NOTHING;
END $$;

-- ============================================
-- 8. STANDUPS
-- ============================================
DO $$
DECLARE
    v_team_alpha UUID;
    v_team_beta UUID;
    v_cse210_w25 UUID;
BEGIN
    SELECT course_uuid INTO v_cse210_w25 FROM courses c JOIN class_term t ON c.term_uuid = t.term_uuid 
        WHERE c.course_code = 'CSE210' AND t.year = 2025 AND t.season = 'Winter';
    SELECT team_uuid INTO v_team_alpha FROM teams WHERE course_uuid = v_cse210_w25 AND team_name = 'Team Alpha';
    SELECT team_uuid INTO v_team_beta FROM teams WHERE course_uuid = v_cse210_w25 AND team_name = 'Team Beta';
    
    -- Team Alpha standups
    INSERT INTO standup (user_uuid, team_uuid, course_uuid, date_submitted, what_done, what_next, blockers, reflection, sentiment_score, visibility) VALUES
        ((SELECT user_uuid FROM users WHERE email = 'david@ucsd.edu'), v_team_alpha, v_cse210_w25, NOW() - INTERVAL '1 day',
         'Set up project repository and CI/CD pipeline', 'Begin implementing authentication module', NULL, 
         'Good progress on infrastructure setup', 4, 'team'),
        ((SELECT user_uuid FROM users WHERE email = 'emma@ucsd.edu'), v_team_alpha, v_cse210_w25, NOW() - INTERVAL '1 day',
         'Created wireframes for main user interface', 'Start implementing UI components in React', 'Waiting for design feedback',
         'Making steady progress on design', 3, 'team'),
        ((SELECT user_uuid FROM users WHERE email = 'frank@ucsd.edu'), v_team_alpha, v_cse210_w25, NOW() - INTERVAL '1 day',
         'Researched best practices for Docker deployment', 'Set up development and staging environments', NULL,
         'Learning a lot about containerization', 4, 'team'),
        ((SELECT user_uuid FROM users WHERE email = 'david@ucsd.edu'), v_team_alpha, v_cse210_w25, NOW(),
         'Implemented JWT authentication', 'Add password reset functionality', NULL,
         'Auth system working well', 5, 'team'),
        ((SELECT user_uuid FROM users WHERE email = 'emma@ucsd.edu'), v_team_alpha, v_cse210_w25, NOW(),
         'Built main dashboard components', 'Connect components to backend API', NULL,
         'UI coming together nicely', 5, 'team'),
    
    -- Team Beta standups
        ((SELECT user_uuid FROM users WHERE email = 'grace@ucsd.edu'), v_team_beta, v_cse210_w25, NOW() - INTERVAL '2 days',
         'Designed database schema', 'Implement database migrations', NULL,
         'Schema design went smoothly', 4, 'team'),
        ((SELECT user_uuid FROM users WHERE email = 'henry@ucsd.edu'), v_team_beta, v_cse210_w25, NOW() - INTERVAL '2 days',
         'Set up Express.js server structure', 'Add API endpoints for user management', 'Need clarification on requirements',
         'Progress slower than expected', 2, 'team'),
        ((SELECT user_uuid FROM users WHERE email = 'iris@ucsd.edu'), v_team_beta, v_cse210_w25, NOW() - INTERVAL '2 days',
         'Wrote unit tests for utility functions', 'Add integration tests', NULL,
         'Testing framework configured well', 4, 'team'),
        ((SELECT user_uuid FROM users WHERE email = 'grace@ucsd.edu'), v_team_beta, v_cse210_w25, NOW() - INTERVAL '1 day',
         'Completed database migrations', 'Seed database with sample data', NULL,
         'Database is ready for development', 5, 'team'),
        ((SELECT user_uuid FROM users WHERE email = 'henry@ucsd.edu'), v_team_beta, v_cse210_w25, NOW(),
         'Added user CRUD endpoints', 'Implement authorization middleware', NULL,
         'Backend API taking shape', 4, 'team');
END $$;

-- ============================================
-- 9. STANDUP COMMENTS
-- ============================================
DO $$
DECLARE
    v_standup1 UUID;
    v_standup2 UUID;
BEGIN
    SELECT standup_uuid INTO v_standup1 FROM standup 
        WHERE user_uuid = (SELECT user_uuid FROM users WHERE email = 'david@ucsd.edu')
        ORDER BY created_at DESC LIMIT 1;
    
    SELECT standup_uuid INTO v_standup2 FROM standup 
        WHERE user_uuid = (SELECT user_uuid FROM users WHERE email = 'henry@ucsd.edu')
        ORDER BY created_at DESC LIMIT 1;
    
    INSERT INTO standup_comments (standup_uuid, commenter_uuid, comment_text) VALUES
        (v_standup1, (SELECT user_uuid FROM users WHERE email = 'ta_alice@ucsd.edu'), 
         'Great work on the authentication! Make sure to add rate limiting.'),
        (v_standup1, (SELECT user_uuid FROM users WHERE email = 'emma@ucsd.edu'),
         'Can you share the auth documentation so I can integrate it with the frontend?'),
        (v_standup2, (SELECT user_uuid FROM users WHERE email = 'ta_bob@ucsd.edu'),
         'Good progress! Let me know if you need help with the authorization logic.'),
        (v_standup2, (SELECT user_uuid FROM users WHERE email = 'grace@ucsd.edu'),
         'Looking good! We should sync on the API contract.');
END $$;

-- ============================================
-- 10. STANDUP NOTIFICATIONS
-- ============================================
DO $$
DECLARE
    v_standup1 UUID;
    v_standup2 UUID;
BEGIN
    SELECT standup_uuid INTO v_standup1 FROM standup 
        WHERE user_uuid = (SELECT user_uuid FROM users WHERE email = 'david@ucsd.edu')
        ORDER BY created_at DESC LIMIT 1;
    
    SELECT standup_uuid INTO v_standup2 FROM standup 
        WHERE user_uuid = (SELECT user_uuid FROM users WHERE email = 'henry@ucsd.edu')
        ORDER BY created_at DESC LIMIT 1;
    
    INSERT INTO standup_notifications (sender_uuid, receiver_uuid, standup_uuid, message, status) VALUES
        ((SELECT user_uuid FROM users WHERE email = 'ta_alice@ucsd.edu'),
         (SELECT user_uuid FROM users WHERE email = 'david@ucsd.edu'),
         v_standup1, 'Your TA commented on your standup', 'read'),
        ((SELECT user_uuid FROM users WHERE email = 'emma@ucsd.edu'),
         (SELECT user_uuid FROM users WHERE email = 'david@ucsd.edu'),
         v_standup1, 'Emma commented on your standup', 'unread'),
        ((SELECT user_uuid FROM users WHERE email = 'ta_bob@ucsd.edu'),
         (SELECT user_uuid FROM users WHERE email = 'henry@ucsd.edu'),
         v_standup2, 'Your TA commented on your standup', 'unread');
END $$;

-- ============================================
-- 11. STANDUP SENTIMENT LOGS
-- ============================================
INSERT INTO standup_sentiment_logs (standup_uuid, sentiment_score)
SELECT standup_uuid, sentiment_score
FROM standup
WHERE sentiment_score IS NOT NULL;

-- ============================================
-- 12. MEETINGS
-- ============================================
DO $$
DECLARE
    v_cse210_w25 UUID;
    v_cse110_w25 UUID;
    v_lecture1 UUID;
    v_lecture2 UUID;
    v_team_meeting UUID;
BEGIN
    SELECT course_uuid INTO v_cse210_w25 FROM courses c JOIN class_term t ON c.term_uuid = t.term_uuid 
        WHERE c.course_code = 'CSE210' AND t.year = 2025 AND t.season = 'Winter';
    SELECT course_uuid INTO v_cse110_w25 FROM courses c JOIN class_term t ON c.term_uuid = t.term_uuid 
        WHERE c.course_code = 'CSE110' AND t.year = 2025 AND t.season = 'Winter';
    
    -- CSE210 Lectures
    INSERT INTO meeting (creator_uuid, course_uuid, meeting_start_time, meeting_end_time, meeting_date, 
                        meeting_title, meeting_description, meeting_location, is_recurring, meeting_type) VALUES
        ((SELECT user_uuid FROM users WHERE email = 'powell@ucsd.edu'), v_cse210_w25,
         (CURRENT_DATE + INTERVAL '10 hours')::timestamptz, (CURRENT_DATE + INTERVAL '11.5 hours')::timestamptz, CURRENT_DATE,
         'Software Architecture Patterns', 'Discussion of MVC, MVVM, and layered architecture', 'CSE 1202', TRUE, 1)
    RETURNING meeting_uuid INTO v_lecture1;
    
    INSERT INTO meeting (creator_uuid, course_uuid, meeting_start_time, meeting_end_time, meeting_date,
                        meeting_title, meeting_description, meeting_location, is_recurring, parent_meeting_uuid, meeting_type) VALUES
        ((SELECT user_uuid FROM users WHERE email = 'powell@ucsd.edu'), v_cse210_w25,
         (CURRENT_DATE + INTERVAL '3 days' + INTERVAL '10 hours')::timestamptz, 
         (CURRENT_DATE + INTERVAL '3 days' + INTERVAL '11.5 hours')::timestamptz, 
         CURRENT_DATE + INTERVAL '3 days',
         'Software Architecture Patterns', 'Continuation: Microservices and Event-Driven Architecture', 
         'CSE 1202', FALSE, v_lecture1, 1);
    
    -- CSE210 Team Meeting
    INSERT INTO meeting (creator_uuid, course_uuid, meeting_start_time, meeting_end_time, meeting_date,
                        meeting_title, meeting_description, meeting_location, is_recurring, meeting_type) VALUES
        ((SELECT user_uuid FROM users WHERE email = 'ta_alice@ucsd.edu'), v_cse210_w25,
         (CURRENT_DATE + INTERVAL '1 day' + INTERVAL '14 hours')::timestamptz,
         (CURRENT_DATE + INTERVAL '1 day' + INTERVAL '15 hours')::timestamptz,
         CURRENT_DATE + INTERVAL '1 day',
         'Team Alpha Sprint Planning', 'Plan sprint tasks and assign work', 'CSE 3140', FALSE, 2)
    RETURNING meeting_uuid INTO v_team_meeting;
    
    -- CSE110 Lecture
    INSERT INTO meeting (creator_uuid, course_uuid, meeting_start_time, meeting_end_time, meeting_date,
                        meeting_title, meeting_description, meeting_location, is_recurring, meeting_type) VALUES
        ((SELECT user_uuid FROM users WHERE email = 'jones@ucsd.edu'), v_cse110_w25,
         (CURRENT_DATE + INTERVAL '2 days' + INTERVAL '13 hours')::timestamptz,
         (CURRENT_DATE + INTERVAL '2 days' + INTERVAL '14.5 hours')::timestamptz,
         CURRENT_DATE + INTERVAL '2 days',
         'Agile Methodologies Introduction', 'Overview of Scrum and Kanban', 'CSE 1001', TRUE, 1)
    RETURNING meeting_uuid INTO v_lecture2;
END $$;

DO $$
DECLARE
    v_cse210_f25 UUID;
    v_f_lecture1 UUID;
    v_f_team_meeting UUID;
BEGIN
    SELECT course_uuid INTO v_cse210_f25 FROM courses c JOIN class_term t ON c.term_uuid = t.term_uuid 
        WHERE c.course_code = 'CSE210' AND t.year = 2025 AND t.season = 'Fall';
    
    INSERT INTO meeting (creator_uuid, course_uuid, meeting_start_time, meeting_end_time, meeting_date, 
                        meeting_title, meeting_description, meeting_location, is_recurring, meeting_type) VALUES
        ((SELECT user_uuid FROM users WHERE email = 'powell@ucsd.edu'), v_cse210_f25,
         (DATE '2025-09-29' + INTERVAL '10 hours')::timestamptz, (DATE '2025-09-29' + INTERVAL '11.5 hours')::timestamptz, DATE '2025-09-29',
         'Software Architecture Patterns', 'Fall quarter: discussion of architecture and design', 'CSE 1202', TRUE, 1)
    RETURNING meeting_uuid INTO v_f_lecture1;
    
    INSERT INTO meeting (creator_uuid, course_uuid, meeting_start_time, meeting_end_time, meeting_date,
                        meeting_title, meeting_description, meeting_location, is_recurring, parent_meeting_uuid, meeting_type) VALUES
        ((SELECT user_uuid FROM users WHERE email = 'powell@ucsd.edu'), v_cse210_f25,
         (DATE '2025-10-02' + INTERVAL '10 hours')::timestamptz, 
         (DATE '2025-10-02' + INTERVAL '11.5 hours')::timestamptz, 
         DATE '2025-10-02',
         'Software Architecture Patterns', 'Continuation: Microservices and Event-Driven Architecture', 
         'CSE 1202', FALSE, v_f_lecture1, 1);
    
    INSERT INTO meeting (creator_uuid, course_uuid, meeting_start_time, meeting_end_time, meeting_date,
                        meeting_title, meeting_description, meeting_location, is_recurring, meeting_type) VALUES
        ((SELECT user_uuid FROM users WHERE email = 'ta_alice@ucsd.edu'), v_cse210_f25,
         (DATE '2025-10-01' + INTERVAL '14 hours')::timestamptz,
         (DATE '2025-10-01' + INTERVAL '15 hours')::timestamptz,
         DATE '2025-10-01',
         'Team Gamma Sprint Planning', 'Plan sprint tasks and assign work', 'CSE 3140', FALSE, 2)
    RETURNING meeting_uuid INTO v_f_team_meeting;
END $$;

-- ============================================
-- 13. MEETING CODES (QR codes for attendance)
-- ============================================
DO $$
DECLARE
    v_meeting UUID;
BEGIN
    SELECT meeting_uuid INTO v_meeting FROM meeting ORDER BY meeting_date LIMIT 1;
    
    INSERT INTO meeting_codes (qr_url, meeting_code, meeting_uuid, valid_start_datetime, valid_end_datetime)
    SELECT 
        'https://api.qrserver.com/v1/create-qr-code/?data=' || upper(substring(meeting_uuid::text from 1 for 6)) || '&size=200x200',
        upper(substring(meeting_uuid::text from 1 for 6)),
        meeting_uuid,
        meeting_start_time - INTERVAL '10 minutes',
        meeting_start_time + INTERVAL '15 minutes'
    FROM meeting;
END $$;

-- ============================================
-- 14. PARTICIPANTS (meeting attendance)
-- ============================================
DO $$
DECLARE
    v_meeting UUID;
    v_cse210_w25 UUID;
BEGIN
    SELECT course_uuid INTO v_cse210_w25 FROM courses c JOIN class_term t ON c.term_uuid = t.term_uuid 
        WHERE c.course_code = 'CSE210' AND t.year = 2025 AND t.season = 'Winter';
    
    -- Get first meeting
    SELECT meeting_uuid INTO v_meeting FROM meeting WHERE course_uuid = v_cse210_w25 ORDER BY meeting_date LIMIT 1;
    
    -- Add all CSE210 students as participants
    INSERT INTO participants (meeting_uuid, participant_uuid, present, attendance_time)
    SELECT 
        v_meeting,
        ce.user_uuid,
        CASE WHEN random() > 0.3 THEN true ELSE false END,  -- 70% attendance rate
        CASE WHEN random() > 0.3 THEN NOW() - INTERVAL '1 day' ELSE NULL END
    FROM course_enrollment ce
    JOIN role r ON ce.role_uuid = r.role_uuid
    WHERE ce.course_uuid = v_cse210_w25 
      AND r.role IN ('Student', 'Team Leader')
    ON CONFLICT (meeting_uuid, participant_uuid) DO NOTHING;
END $$;

-- ============================================
-- 15. FORM REQUESTS
-- ============================================
INSERT INTO form_request (first_name, last_name, email, related_institution, verification_code, created_at) VALUES
    ('Nathan', 'Newman', 'nathan.newman@stanford.edu', 'Stanford University', 'CSE110-TA-WINTER25', NOW() - INTERVAL '2 days'),
    ('Olivia', 'Owens', 'olivia.owens@berkeley.edu', 'UC Berkeley', 'CSE210-STU-WINTER25', NOW() - INTERVAL '1 day'),
    ('Peter', 'Parker', 'peter.parker@mit.edu', 'MIT', 'CSE210-TA-WINTER25', NOW() - INTERVAL '5 days'),
    ('Quinn', 'Quinn', 'quinn@caltech.edu', 'Caltech', 'CSE110-STU-WINTER25', NOW() - INTERVAL '7 days'),
    ('Rachel', 'Roberts', 'rachel.r@ucla.edu', 'UCLA', 'CSE210-STU-WINTER25', NOW() - INTERVAL '3 hours'),
    ('Sam', 'Stevens', 'sam.stevens@usc.edu', 'USC', 'CSE110-TA-WINTER25', NOW() - INTERVAL '6 hours'),
    ('Tina', 'Turner', 'tina.t@ucsd.edu', 'UC San Diego', 'CSE210-TA-WINTER25', NOW() - INTERVAL '12 hours'),
    ('Uma', 'Underwood', 'uma.u@harvard.edu', 'Harvard University', 'CSE110-STU-WINTER25', NOW() - INTERVAL '18 hours'),
    ('Victor', 'Vance', 'victor.v@yale.edu', 'Yale University', 'CSE210-STU-WINTER25', NOW() - INTERVAL '4 days'),
    ('Wendy', 'Williams', 'wendy.w@princeton.edu', 'Princeton University', 'CSE110-TA-WINTER25', NOW() - INTERVAL '6 days'),
    ('Xavier', 'Xu', 'xavier.x@columbia.edu', 'Columbia University', 'CSE210-TA-WINTER25', NOW() - INTERVAL '8 days'),
    ('Yara', 'Yang', 'yara.y@cornell.edu', 'Cornell University', 'CSE110-STU-WINTER25', NOW() - INTERVAL '9 days'),
    ('Zoe', 'Zhang', 'zoe.z@duke.edu', 'Duke University', 'CSE210-STU-WINTER25', NOW() - INTERVAL '10 days'),
    ('Alice', 'Adams', 'alice.a@brown.edu', 'Brown University', 'CSE110-TUTOR-WINTER25', NOW() - INTERVAL '11 days'),
    ('Ben', 'Baker', 'ben.b@dartmouth.edu', 'Dartmouth College', 'CSE210-TA-WINTER25', NOW() - INTERVAL '1 hour'),
    ('Clara', 'Clark', 'clara.c@northwestern.edu', 'Northwestern University', 'CSE110-STU-WINTER25', NOW() - INTERVAL '2 hours'),
    ('Daniel', 'Davis', 'daniel.d@uchicago.edu', 'University of Chicago', 'CSE210-STU-WINTER25', NOW() - INTERVAL '8 hours'),
    ('Emily', 'Edwards', 'emily.e@upenn.edu', 'University of Pennsylvania', 'CSE110-TA-WINTER25', NOW() - INTERVAL '14 hours'),
    ('Frank', 'Fisher', 'frank.f@washu.edu', 'Washington University', 'CSE210-TA-WINTER25', NOW() - INTERVAL '16 hours'),
    ('Grace', 'Green', 'grace.g@vanderbilt.edu', 'Vanderbilt University', 'CSE110-STU-WINTER25', NOW() - INTERVAL '20 hours'),
    ('Henry', 'Hall', 'henry.h@rice.edu', 'Rice University', 'CSE210-STU-WINTER25', NOW() - INTERVAL '3 days'),
    ('Iris', 'Irving', 'iris.i@emory.edu', 'Emory University', 'CSE110-TUTOR-WINTER25', NOW() - INTERVAL '5 days'),
    ('Jack', 'Johnson', 'jack.j@georgetown.edu', 'Georgetown University', 'CSE210-TA-WINTER25', NOW() - INTERVAL '7 days'),
    ('Kate', 'King', 'kate.k@nyu.edu', 'New York University', 'CSE110-STU-WINTER25', NOW() - INTERVAL '12 days'),
    ('Leo', 'Lee', 'leo.l@cmu.edu', 'Carnegie Mellon University', 'CSE210-STU-WINTER25', NOW() - INTERVAL '13 days'),
    ('Maya', 'Moore', 'maya.m@gatech.edu', 'Georgia Tech', 'CSE110-TA-WINTER25', NOW() - INTERVAL '30 minutes'),
    ('Noah', 'Nelson', 'noah.n@umich.edu', 'University of Michigan', 'CSE210-TA-WINTER25', NOW() - INTERVAL '45 minutes'),
    ('Olivia', 'Oliver', 'olivia.o@uva.edu', 'University of Virginia', 'CSE110-STU-WINTER25', NOW() - INTERVAL '90 minutes'),
    ('Paul', 'Peterson', 'paul.p@unc.edu', 'UNC Chapel Hill', 'CSE210-STU-WINTER25', NOW() - INTERVAL '4 hours'),
    ('Quinn', 'Quaid', 'quinn.q@utexas.edu', 'UT Austin', 'CSE110-TUTOR-WINTER25', NOW() - INTERVAL '5 hours');


-- ============================================
-- SUCCESS MESSAGE
-- ============================================
DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'SAMPLE DATA POPULATED SUCCESSFULLY!';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Created data for ALL tables:';
    RAISE NOTICE '  ✓ 5 Roles (unchanged)';
    RAISE NOTICE '  ✓ 3 Terms (Fall 2024, Winter 2025, Spring 2025)';
    RAISE NOTICE '  ✓ 18 Users (5 professors/admins, 3 TAs, 10 students)';
    RAISE NOTICE '  ✓ 8 Staff Profiles (1 lead admin, 3 admins, 1 professor, 3 TAs)';
    RAISE NOTICE '  ✓ 3 Courses';
    RAISE NOTICE '  ✓ 5 Verification Codes';
    RAISE NOTICE '  ✓ 17 Course Enrollments';
    RAISE NOTICE '  ✓ 2 Teams';
    RAISE NOTICE '  ✓ 6 Team Members';
    RAISE NOTICE '  ✓ 10 Standups';
    RAISE NOTICE '  ✓ 4 Standup Comments';
    RAISE NOTICE '  ✓ 3 Standup Notifications';
    RAISE NOTICE '  ✓ 10 Sentiment Logs';
    RAISE NOTICE '  ✓ 4 Meetings';
    RAISE NOTICE '  ✓ 4 Meeting Codes';
    RAISE NOTICE '  ✓ 6 Participants (attendance records)';
    RAISE NOTICE '  ✓ 30 Form Requests';
    RAISE NOTICE '========================================';
END $$;
