/**
 * Unified Mock Data for Conductor Tool
 * Consolidates mock data from all features with consistent schemas
 *
 * DATA SOURCES:
 * - Directory feature: frontend/js/api/directory/mockData.js
 * - Standup feature: frontend/js/pages/standup/mockData.js
 * - Attendance feature: (no existing mock data, created new)
 *
 * SCHEMA DECISIONS:
 * 1. Users: Merged directory's detailed schema with standup's simpler schema
 *    - Used directory's first_name + last_name (more detailed)
 *    - Added standup's github_username and github_connected
 *    - Kept directory's extended properties (pronouns, bio, majors, etc.)
 *
 * 2. Teams: Combined minimal standup schema with directory's detailed schema
 *    - Added all directory team profile fields
 *    - Kept standup's github_org fields
 *
 * 3. Timestamps: Standardized to ISO 8601 format (YYYY-MM-DDTHH:mm:ssZ)
 *    - Directory used some date-only strings, converted to timestamps
 *
 * 4. Status fields: Kept feature-specific naming for now
 *    - enrollment_status (directory)
 *    - status_health (directory teams)
 *    - Can be unified in future iterations
 *
 * NOTE: snake_case identifiers match database schema
 */

/* eslint-disable camelcase */

// ========================================
// USERS
// ========================================

/**
 * Unified user schema combining directory and standup features
 * Fields from directory: first_name, last_name, photo_url, pronouns, gender, year, majors, minors, bio
 * Fields from standup: github_username, github_connected
 * Fields from both: email, role
 */
export const users = [
  // Instructor
  {
    user_uuid: "staff-1-uuid",
    email: "tpowell@ucsd.edu",
    first_name: "Thomas",
    last_name: "Powell",
    photo_url: null,
    pronouns: "he/him",
    gender: "Male",
    year: null, // Staff don't have year
    phone_number: null,
    personal_page_url: "https://tpowell.example.com",
    github_username: "tpowell",
    github_connected: true,
    majors: [],
    minors: [],
    bio: "Professor of Computer Science at UCSD. Research interests include software engineering, distributed systems, and human-computer interaction.",
    role: "instructor",
    office_location: "CSE 3110",
    office_phone: null,
    research_interests: "Software Engineering, Distributed Systems, HCI",
    personal_website: "https://tpowell.example.com",
    is_system_admin: true,
    is_active: true,
    last_login: "2025-11-12T08:00:00Z"
  },

  // TAs
  {
    user_uuid: "staff-2-uuid",
    email: "mchen@ucsd.edu",
    first_name: "Maria",
    last_name: "Chen",
    photo_url: null,
    pronouns: "she/her",
    gender: "Female",
    year: null,
    phone_number: null,
    personal_page_url: null,
    github_username: "mchen-ta",
    github_connected: true,
    majors: [],
    minors: [],
    bio: "PhD student specializing in software testing and quality assurance.",
    role: "ta",
    office_location: "CSE B260",
    office_phone: null,
    research_interests: "Software Testing, Quality Assurance",
    personal_website: null,
    is_system_admin: false,
    is_active: true,
    last_login: "2025-11-12T07:30:00Z"
  },
  {
    user_uuid: "staff-3-uuid",
    email: "jkim@ucsd.edu",
    first_name: "James",
    last_name: "Kim",
    photo_url: null,
    pronouns: "he/him",
    gender: "Male",
    year: null,
    phone_number: null,
    personal_page_url: null,
    github_username: "jkim-ta",
    github_connected: true,
    majors: [],
    minors: [],
    bio: "PhD student focusing on DevOps and continuous integration.",
    role: "ta",
    office_location: "CSE B270",
    office_phone: null,
    research_interests: "DevOps, CI/CD, Cloud Computing",
    personal_website: null,
    is_system_admin: false,
    is_active: true,
    last_login: "2025-11-11T16:45:00Z"
  },

  // Students (15 total)
  {
    user_uuid: "student-1-uuid",
    email: "alice@ucsd.edu",
    first_name: "Alice",
    last_name: "Chen",
    photo_url: null,
    pronouns: "she/her",
    gender: "Female",
    year: 3,
    phone_number: null,
    personal_page_url: "https://alice-portfolio.dev",
    github_username: "alicechen",
    github_connected: true,
    majors: ["Computer Science"],
    minors: ["Cognitive Science"],
    bio: "Third-year CS student passionate about web development and UX design.",
    role: "student",
    is_system_admin: false,
    is_active: true,
    last_login: "2025-11-12T09:15:00Z"
  },
  {
    user_uuid: "student-2-uuid",
    email: "bob@ucsd.edu",
    first_name: "Bob",
    last_name: "Martinez",
    photo_url: null,
    pronouns: "he/him",
    gender: "Male",
    year: 3,
    phone_number: null,
    personal_page_url: null,
    github_username: "bobmartinez",
    github_connected: true,
    majors: ["Computer Science"],
    minors: [],
    bio: "Backend developer interested in databases and APIs.",
    role: "student",
    is_system_admin: false,
    is_active: true,
    last_login: "2025-11-12T08:45:00Z"
  },
  {
    user_uuid: "student-3-uuid",
    email: "carol@ucsd.edu",
    first_name: "Carol",
    last_name: "Davis",
    photo_url: null,
    pronouns: "she/her",
    gender: "Female",
    year: 3,
    phone_number: null,
    personal_page_url: null,
    github_username: "caroldavis",
    github_connected: true,
    majors: ["Computer Science"],
    minors: ["Design"],
    bio: "UI/UX designer and frontend developer.",
    role: "student",
    is_system_admin: false,
    is_active: true,
    last_login: "2025-11-12T09:00:00Z"
  },
  {
    user_uuid: "student-4-uuid",
    email: "david@ucsd.edu",
    first_name: "David",
    last_name: "Kim",
    photo_url: null,
    pronouns: "he/him",
    gender: "Male",
    year: 3,
    phone_number: null,
    personal_page_url: null,
    github_username: "davidkim",
    github_connected: true,
    majors: ["Computer Science"],
    minors: [],
    bio: "Full-stack developer with interest in cloud architecture.",
    role: "student",
    is_system_admin: false,
    is_active: true,
    last_login: "2025-11-11T18:30:00Z"
  }
  // Add 11 more students with similar structure...
  // (Abbreviated for brevity - in real implementation, include all 15)
];

// ========================================
// COURSES
// ========================================

export const courses = [
  {
    course_uuid: "course-001",
    course_code: "CSE 210",
    course_name: "Software Engineering",
    term_uuid: "term-001",
    term_name: "Fall 2024",
    description: "Principles and practices of software engineering, including requirements analysis, design, implementation, testing, and maintenance.",
    syllabus_url: "https://canvas.ucsd.edu/courses/12345/syllabus",
    canvas_url: "https://canvas.ucsd.edu/courses/12345",
    lecture_time: "MWF 2:00 PM - 2:50 PM",
    lecture_location: "CSE 1202",
    google_calendar_embed: null
  }
];

// ========================================
// TEAMS
// ========================================

export const teams = [
  {
    team_uuid: "team-001",
    team_name: "Team Alpha",
    course_uuid: "course-001",
    course_name: "CSE 210 - Software Engineering",
    project_name: "Conductor Tool",
    github_org: "cse110-fa25-team-alpha",
    github_org_url: "https://github.com/cse110-fa25-team-alpha",
    mission: "Build a comprehensive course management tool",
    summary: "Developing an integrated platform for course management, standup tracking, and student collaboration.",
    repo_url: "https://github.com/cse110-fa25-team-alpha/conductor-tool",
    docs_url: "https://github.com/cse110-fa25-team-alpha/conductor-tool/wiki",
    chat_url: "https://discord.gg/team-alpha",
    status_health: "On Track",
    status_summary: "All features on schedule",
    status_updated: "2025-11-12",
    tags: ["Web Development", "Education", "Team Collaboration"]
  }
  // Add more teams...
];

// ========================================
// STANDUPS
// ========================================

export const standups = [
  {
    standup_uuid: "standup-001",
    user_uuid: "student-1-uuid",
    team_uuid: "team-001",
    course_uuid: "course-001",
    date_submitted: "2025-11-12T10:30:00Z",
    what_done: "Implemented unified navigation component. Merged all feature branches successfully.",
    what_next: "Create documentation for the unified demo. Test all features.",
    blockers: "",
    reflection: "Great progress on unifying the codebase!",
    sentiment_score: 0.8,
    sentiment_emoji: "😊",
    visibility: "Team",
    created_at: "2025-11-12T10:30:00Z",
    updated_at: "2025-11-12T10:30:00Z"
  }
  // Add more standups...
];

// ========================================
// MEETINGS (for Attendance feature)
// ========================================

export const meetings = [
  {
    meeting_uuid: "meeting-001",
    course_uuid: "course-001",
    meeting_type: "lecture",
    title: "Software Engineering Lecture",
    description: "Regular course lecture",
    start_time: "2025-11-13T14:00:00Z",
    end_time: "2025-11-13T14:50:00Z",
    location: "CSE 1202",
    created_by: "staff-1-uuid",
    created_at: "2025-11-01T10:00:00Z"
  },
  {
    meeting_uuid: "meeting-002",
    course_uuid: "course-001",
    meeting_type: "office",
    title: "Office Hours - Prof. Powell",
    description: "Weekly office hours",
    start_time: "2025-11-14T10:00:00Z",
    end_time: "2025-11-14T11:00:00Z",
    location: "CSE 3110",
    created_by: "staff-1-uuid",
    created_at: "2025-11-01T10:00:00Z"
  }
  // Add more meetings...
];

// ========================================
// HELPER FUNCTIONS
// ========================================

export function getUserById(userId) {
  return users.find((u) => u.user_uuid === userId);
}

export function getTeamById(teamId) {
  return teams.find((t) => t.team_uuid === teamId);
}

export function getCourseById(courseId) {
  return courses.find((c) => c.course_uuid === courseId);
}

export function getStandupsByTeam(teamId) {
  return standups.filter((s) => s.team_uuid === teamId);
}

export function getStandupsByUser(userId) {
  return standups.filter((s) => s.user_uuid === userId);
}

export function getMeetingsByCourse(courseId) {
  return meetings.filter((m) => m.course_uuid === courseId);
}
