/**
 * Mock Data for Dashboard Development
 * Contains sample data for all API endpoints
 */

/* eslint-disable camelcase */
export const mockData = {
  // User role data - change both user_uuid and role to switch views
  userRole: {
    course_uuid: "course-123-uuid",

    // Change to "staff-1-uuid" for instructor view
    user_uuid: "student-1-uuid",
    // user_uuid: "staff-1-uuid",

    // Change to "instructor" or "ta" for instructor view
    role: "student"
    // role: "instructor"
  },

  // Course overview data
  courseOverview: {
    course_uuid: "course-123-uuid",
    course_code: "CSE 210",
    course_name: "Software Engineering",
    term_uuid: "term-123-uuid",
    term_name: "Fall 2024",
    description: "Introduction to software engineering principles and practices",
    syllabus_url: "https://example.com/syllabus.pdf",
    canvas_url: "https://canvas.ucsd.edu/courses/12345",
    lecture_time: "MWF 10:00 AM - 10:50 AM",
    lecture_location: "WLH 2005",
    google_calendar_embed: null
  },

  // Course staff data
  courseStaff: [
    {
      user_uuid: "staff-1-uuid",
      first_name: "Thomas",
      last_name: "Powell",
      email: "tpowell@ucsd.edu",
      staff_role: "instructor",
      office_location: "CSE 3220",
      office_hours: [
        {
          office_hour_uuid: "oh-1-uuid",
          day_of_week: 2,
          start_time: "14:00:00",
          end_time: "15:30:00",
          location: "CSE 3220",
          is_active: true
        },
        {
          office_hour_uuid: "oh-2-uuid",
          day_of_week: 4,
          start_time: "14:00:00",
          end_time: "15:30:00",
          location: "CSE 3220",
          is_active: true
        }
      ]
    },
    {
      user_uuid: "staff-2-uuid",
      first_name: "Sarah",
      last_name: "Johnson",
      email: "sjohnson@ucsd.edu",
      staff_role: "ta",
      office_location: "CSE B275",
      office_hours: [
        {
          office_hour_uuid: "oh-3-uuid",
          day_of_week: 1,
          start_time: "10:00:00",
          end_time: "12:00:00",
          location: "CSE B275",
          is_active: true
        },
        {
          office_hour_uuid: "oh-4-uuid",
          day_of_week: 3,
          start_time: "15:00:00",
          end_time: "17:00:00",
          location: "CSE B275",
          is_active: true
        }
      ]
    },
    {
      user_uuid: "staff-3-uuid",
      first_name: "Michael",
      last_name: "Chen",
      email: "mchen@ucsd.edu",
      staff_role: "ta",
      office_location: "CSE B260",
      office_hours: [
        {
          office_hour_uuid: "oh-5-uuid",
          day_of_week: 2,
          start_time: "16:00:00",
          end_time: "18:00:00",
          location: "CSE B260",
          is_active: true
        }
      ]
    }
  ],

  // Enrollment statistics (instructor only)
  enrollmentStats: {
    total_students: 523,
    active_students: 498,
    dropped_students: 25
  },

  // Recent enrollments (instructor only)
  recentEnrollments: [
    {
      user_uuid: "student-1-uuid",
      first_name: "Alice",
      last_name: "Williams",
      email: "awilliams@ucsd.edu",
      enrollment_status: "active",
      enrolled_at: "2024-11-08T14:23:00Z"
    },
    {
      user_uuid: "student-2-uuid",
      first_name: "Bob",
      last_name: "Martinez",
      email: "bmartinez@ucsd.edu",
      enrollment_status: "active",
      enrolled_at: "2024-11-07T09:15:00Z"
    },
    {
      user_uuid: "student-3-uuid",
      first_name: "Carol",
      last_name: "Davis",
      email: "cdavis@ucsd.edu",
      enrollment_status: "active",
      enrolled_at: "2024-11-06T16:45:00Z"
    },
    {
      user_uuid: "student-4-uuid",
      first_name: "David",
      last_name: "Garcia",
      email: "dgarcia@ucsd.edu",
      enrollment_status: "active",
      enrolled_at: "2024-11-05T11:30:00Z"
    },
    {
      user_uuid: "student-5-uuid",
      first_name: "Eva",
      last_name: "Rodriguez",
      email: "erodriguez@ucsd.edu",
      enrollment_status: "active",
      enrolled_at: "2024-11-04T13:20:00Z"
    }
  ],

  // User profile data (student example)
  userProfileStudent: {
    user: {
      user_uuid: "student-1-uuid",
      email: "awilliams@ucsd.edu",
      first_name: "Alice",
      last_name: "Williams",
      photo_url: null,
      pronouns: "she/her",
      gender: "Female",
      year: 3,
      phone_number: "(858) 555-0123",
      personal_page_url: "https://alicewilliams.dev",
      github_username: "awilliams42",
      majors: ["Computer Science", "Mathematics"],
      minors: ["Cognitive Science"],
      bio: "Junior studying CS and Math at UCSD. Passionate about machine learning and web development. Currently working on several open-source projects and looking to collaborate on innovative software solutions.",
      is_system_admin: false,
      is_active: true,
      last_login: "2024-11-10T15:30:00Z"
    },
    staff_profile: null,
    teams: [
      {
        team_uuid: "team-1-uuid",
        team_name: "Team Alpha",
        course_name: "CSE 210 - Software Engineering",
        course_uuid: "course-123-uuid",
        project_name: "TaskMaster Pro",
        is_team_leader: true,
        joined_at: "2024-09-25T10:00:00Z"
      },
      {
        team_uuid: "team-2-uuid",
        team_name: "Data Wizards",
        course_name: "CSE 158 - Recommender Systems",
        course_uuid: "course-456-uuid",
        project_name: "RecSys Engine",
        is_team_leader: false,
        joined_at: "2024-09-28T14:30:00Z"
      }
    ]
  },

  // User profile data (staff example - Thomas Powell)
  userProfileStaff1: {
    user: {
      user_uuid: "staff-1-uuid",
      email: "tpowell@ucsd.edu",
      first_name: "Thomas",
      last_name: "Powell",
      photo_url: null,
      pronouns: "he/him",
      gender: "Male",
      year: null,
      phone_number: null,
      personal_page_url: null,
      github_username: "prof-powell",
      majors: null,
      minors: null,
      bio: "Professor of Computer Science at UC San Diego. Research interests include software engineering, distributed systems, and computer science education.",
      is_system_admin: false,
      is_active: true,
      last_login: "2024-11-11T09:00:00Z"
    },
    staff_profile: {
      user_uuid: "staff-1-uuid",
      office_location: "CSE 3220",
      office_phone: "(858) 534-1234",
      research_interests: "Software Engineering, Distributed Systems, Programming Languages, Computer Science Education",
      personal_website: "https://cseweb.ucsd.edu/~tpowell"
    },
    teams: []
  },

  // User profile data (staff example - Sarah Johnson)
  userProfileStaff2: {
    user: {
      user_uuid: "staff-2-uuid",
      email: "sjohnson@ucsd.edu",
      first_name: "Sarah",
      last_name: "Johnson",
      photo_url: null,
      pronouns: "she/her",
      gender: "Female",
      year: null,
      phone_number: "(858) 555-0234",
      personal_page_url: null,
      github_username: "sjohnson-ta",
      majors: null,
      minors: null,
      bio: "PhD student and Teaching Assistant in Computer Science. Passionate about helping students learn software engineering and web development.",
      is_system_admin: false,
      is_active: true,
      last_login: "2024-11-11T08:30:00Z"
    },
    staff_profile: {
      user_uuid: "staff-2-uuid",
      office_location: "CSE B275",
      office_phone: "(858) 555-0234",
      research_interests: "Human-Computer Interaction, Web Technologies, CS Education",
      personal_website: null
    },
    teams: []
  },

  // User profile data (staff example - Michael Chen)
  userProfileStaff3: {
    user: {
      user_uuid: "staff-3-uuid",
      email: "mchen@ucsd.edu",
      first_name: "Michael",
      last_name: "Chen",
      photo_url: null,
      pronouns: "he/him",
      gender: "Male",
      year: null,
      phone_number: null,
      personal_page_url: null,
      github_username: "mchen-dev",
      majors: null,
      minors: null,
      bio: "Graduate student TA specializing in software testing and quality assurance. Enjoys helping students debug their code.",
      is_system_admin: false,
      is_active: true,
      last_login: "2024-11-10T19:45:00Z"
    },
    staff_profile: {
      user_uuid: "staff-3-uuid",
      office_location: "CSE B260",
      office_phone: null,
      research_interests: "Software Testing, Quality Assurance, DevOps",
      personal_website: null
    },
    teams: []
  },

  // User profile data (student example - Bob Martinez)
  userProfileStudent2: {
    user: {
      user_uuid: "student-2-uuid",
      email: "bmartinez@ucsd.edu",
      first_name: "Bob",
      last_name: "Martinez",
      photo_url: null,
      pronouns: "he/him",
      gender: "Male",
      year: 4,
      phone_number: "(858) 555-0345",
      personal_page_url: "https://bobmartinez.io",
      github_username: "bmartinez-dev",
      majors: ["Computer Engineering"],
      minors: [],
      bio: "Senior studying Computer Engineering. Interested in embedded systems and IoT. Currently working on my capstone project involving smart home automation.",
      is_system_admin: false,
      is_active: true,
      last_login: "2024-11-11T10:15:00Z"
    },
    staff_profile: null,
    teams: [
      {
        team_uuid: "team-3-uuid",
        team_name: "IoT Innovators",
        course_name: "CSE 210 - Software Engineering",
        course_uuid: "course-123-uuid",
        project_name: "SmartHome Hub",
        is_team_leader: false,
        joined_at: "2024-09-26T11:00:00Z"
      }
    ]
  },

  // User profile data (student example - Carol Davis)
  userProfileStudent3: {
    user: {
      user_uuid: "student-3-uuid",
      email: "cdavis@ucsd.edu",
      first_name: "Carol",
      last_name: "Davis",
      photo_url: null,
      pronouns: "she/her",
      gender: "Female",
      year: 2,
      phone_number: "(858) 555-0456",
      personal_page_url: null,
      github_username: "cdavis-code",
      majors: ["Computer Science"],
      minors: ["Business"],
      bio: "Sophomore studying Computer Science with a minor in Business. Interested in software product management and entrepreneurship. Looking to combine technical skills with business acumen.",
      is_system_admin: false,
      is_active: true,
      last_login: "2024-11-11T11:20:00Z"
    },
    staff_profile: null,
    teams: [
      {
        team_uuid: "team-4-uuid",
        team_name: "Product Pirates",
        course_name: "CSE 210 - Software Engineering",
        course_uuid: "course-123-uuid",
        project_name: "CollabBoard",
        is_team_leader: true,
        joined_at: "2024-09-25T13:00:00Z"
      }
    ]
  },

  // User profile data (student example - David Garcia)
  userProfileStudent4: {
    user: {
      user_uuid: "student-4-uuid",
      email: "dgarcia@ucsd.edu",
      first_name: "David",
      last_name: "Garcia",
      photo_url: null,
      pronouns: "he/him",
      gender: "Male",
      year: 3,
      phone_number: null,
      personal_page_url: "https://davidgarcia.dev",
      github_username: "dgarcia42",
      majors: ["Computer Science", "Data Science"],
      minors: [],
      bio: "Junior double majoring in CS and Data Science. Passionate about machine learning and AI applications. Currently researching natural language processing and working on several ML projects.",
      is_system_admin: false,
      is_active: true,
      last_login: "2024-11-10T16:45:00Z"
    },
    staff_profile: null,
    teams: [
      {
        team_uuid: "team-5-uuid",
        team_name: "AI Architects",
        course_name: "CSE 210 - Software Engineering",
        course_uuid: "course-123-uuid",
        project_name: "ML Pipeline Manager",
        is_team_leader: false,
        joined_at: "2024-09-27T09:30:00Z"
      }
    ]
  },

  // User profile data (student example - Eva Rodriguez)
  userProfileStudent5: {
    user: {
      user_uuid: "student-5-uuid",
      email: "erodriguez@ucsd.edu",
      first_name: "Eva",
      last_name: "Rodriguez",
      photo_url: null,
      pronouns: "she/her",
      gender: "Female",
      year: 4,
      phone_number: "(858) 555-0678",
      personal_page_url: null,
      github_username: "eva-codes",
      majors: ["Computer Science"],
      minors: ["Design"],
      bio: "Senior majoring in Computer Science with a minor in Design. Focused on UI/UX and frontend development. Passionate about creating accessible and beautiful user experiences.",
      is_system_admin: false,
      is_active: true,
      last_login: "2024-11-11T14:30:00Z"
    },
    staff_profile: null,
    teams: [
      {
        team_uuid: "team-6-uuid",
        team_name: "Design Driven",
        course_name: "CSE 210 - Software Engineering",
        course_uuid: "course-123-uuid",
        project_name: "Accessible Web Tools",
        is_team_leader: true,
        joined_at: "2024-09-25T14:00:00Z"
      }
    ]
  },

  // User profile data (student example - Frank Chen)
  userProfileStudent6: {
    user: {
      user_uuid: "student-6-uuid",
      email: "fchen@ucsd.edu",
      first_name: "Frank",
      last_name: "Chen",
      photo_url: null,
      pronouns: "he/him",
      gender: "Male",
      year: 2,
      phone_number: null,
      personal_page_url: null,
      github_username: "frank-chen",
      majors: ["Computer Science"],
      minors: [],
      bio: "Sophomore studying Computer Science. Interested in algorithms and data structures.",
      is_system_admin: false,
      is_active: true,
      last_login: "2024-11-10T12:00:00Z"
    },
    staff_profile: null,
    teams: []
  },

  // User profile data (student example - Grace Kim)
  userProfileStudent7: {
    user: {
      user_uuid: "student-7-uuid",
      email: "gkim@ucsd.edu",
      first_name: "Grace",
      last_name: "Kim",
      photo_url: null,
      pronouns: "she/her",
      gender: "Female",
      year: 3,
      phone_number: null,
      personal_page_url: null,
      github_username: "grace-k",
      majors: ["Computer Science"],
      minors: ["Music"],
      bio: "Junior majoring in CS with a passion for UI/UX design and creative coding.",
      is_system_admin: false,
      is_active: true,
      last_login: "2024-11-11T09:30:00Z"
    },
    staff_profile: null,
    teams: []
  },

  // User profile data (student example - Henry Patel)
  userProfileStudent8: {
    user: {
      user_uuid: "student-8-uuid",
      email: "hpatel@ucsd.edu",
      first_name: "Henry",
      last_name: "Patel",
      photo_url: null,
      pronouns: "he/him",
      gender: "Male",
      year: 1,
      phone_number: null,
      personal_page_url: null,
      github_username: "hpatel-dev",
      majors: ["Computer Science"],
      minors: [],
      bio: "Freshman exploring different areas of computer science. Eager to learn!",
      is_system_admin: false,
      is_active: true,
      last_login: "2024-11-11T08:00:00Z"
    },
    staff_profile: null,
    teams: []
  },

  // User profile data (student example - Iris Wong)
  userProfileStudent9: {
    user: {
      user_uuid: "student-9-uuid",
      email: "iwong@ucsd.edu",
      first_name: "Iris",
      last_name: "Wong",
      photo_url: null,
      pronouns: "she/her",
      gender: "Female",
      year: 2,
      phone_number: null,
      personal_page_url: null,
      github_username: "iris-wong",
      majors: ["Computer Engineering"],
      minors: [],
      bio: "Sophomore in Computer Engineering with interest in hardware-software integration.",
      is_system_admin: false,
      is_active: true,
      last_login: "2024-11-10T16:20:00Z"
    },
    staff_profile: null,
    teams: []
  },

  // User profile data (student example - Jack Anderson)
  userProfileStudent10: {
    user: {
      user_uuid: "student-10-uuid",
      email: "janderson@ucsd.edu",
      first_name: "Jack",
      last_name: "Anderson",
      photo_url: null,
      pronouns: "he/him",
      gender: "Male",
      year: 4,
      phone_number: null,
      personal_page_url: null,
      github_username: "jack-a",
      majors: ["Computer Science"],
      minors: [],
      bio: "Senior preparing for graduation. Interested in full-stack development.",
      is_system_admin: false,
      is_active: true,
      last_login: "2024-11-11T07:45:00Z"
    },
    staff_profile: null,
    teams: []
  },

  // User profile data (student example - Kelly Brown)
  userProfileStudent11: {
    user: {
      user_uuid: "student-11-uuid",
      email: "kbrown@ucsd.edu",
      first_name: "Kelly",
      last_name: "Brown",
      photo_url: null,
      pronouns: "she/her",
      gender: "Female",
      year: 3,
      phone_number: null,
      personal_page_url: null,
      github_username: "kelly-brown",
      majors: ["Computer Science"],
      minors: ["Statistics"],
      bio: "Junior interested in data science and machine learning applications.",
      is_system_admin: false,
      is_active: true,
      last_login: "2024-11-10T14:15:00Z"
    },
    staff_profile: null,
    teams: []
  },

  // User profile data (student example - Liam Taylor)
  userProfileStudent12: {
    user: {
      user_uuid: "student-12-uuid",
      email: "ltaylor@ucsd.edu",
      first_name: "Liam",
      last_name: "Taylor",
      photo_url: null,
      pronouns: "he/him",
      gender: "Male",
      year: 1,
      phone_number: null,
      personal_page_url: null,
      github_username: "liam-t",
      majors: ["Computer Science"],
      minors: [],
      bio: "Freshman excited to start my journey in computer science!",
      is_system_admin: false,
      is_active: true,
      last_login: "2024-11-11T10:30:00Z"
    },
    staff_profile: null,
    teams: []
  },

  // User profile data (student example - Maya Singh)
  userProfileStudent13: {
    user: {
      user_uuid: "student-13-uuid",
      email: "msingh@ucsd.edu",
      first_name: "Maya",
      last_name: "Singh",
      photo_url: null,
      pronouns: "she/her",
      gender: "Female",
      year: 2,
      phone_number: null,
      personal_page_url: null,
      github_username: "maya-singh",
      majors: ["Computer Science", "Biology"],
      minors: [],
      bio: "Sophomore double majoring in CS and Biology. Interested in bioinformatics.",
      is_system_admin: false,
      is_active: true,
      last_login: "2024-11-10T13:40:00Z"
    },
    staff_profile: null,
    teams: []
  },

  // User profile data (student example - Nathan Lee)
  userProfileStudent14: {
    user: {
      user_uuid: "student-14-uuid",
      email: "nlee@ucsd.edu",
      first_name: "Nathan",
      last_name: "Lee",
      photo_url: null,
      pronouns: "he/him",
      gender: "Male",
      year: 3,
      phone_number: null,
      personal_page_url: null,
      github_username: "nathan-lee",
      majors: ["Computer Science"],
      minors: ["Economics"],
      bio: "Junior interested in fintech and software engineering at scale.",
      is_system_admin: false,
      is_active: true,
      last_login: "2024-11-11T11:00:00Z"
    },
    staff_profile: null,
    teams: []
  },

  // User profile data (student example - Olivia White)
  userProfileStudent15: {
    user: {
      user_uuid: "student-15-uuid",
      email: "owhite@ucsd.edu",
      first_name: "Olivia",
      last_name: "White",
      photo_url: null,
      pronouns: "she/her",
      gender: "Female",
      year: 4,
      phone_number: null,
      personal_page_url: null,
      github_username: "olivia-w",
      majors: ["Computer Science"],
      minors: [],
      bio: "Senior studying CS. Passionate about cybersecurity and ethical hacking.",
      is_system_admin: false,
      is_active: true,
      last_login: "2024-11-10T17:30:00Z"
    },
    staff_profile: null,
    teams: []
  },

  // Course roster data for directory/roster page
  courseRoster: {
    course_name: "CSE 210 - Software Engineering",
    course_uuid: "course-123-uuid",
    // All users in the course (students + staff)
    users: [
      // Students
      {
        user_uuid: "student-1-uuid",
        first_name: "Alice",
        last_name: "Williams",
        email: "awilliams@ucsd.edu",
        photo_url: null,
        role: "student",
        year: 3
      },
      {
        user_uuid: "student-2-uuid",
        first_name: "Bob",
        last_name: "Martinez",
        email: "bmartinez@ucsd.edu",
        photo_url: null,
        role: "student",
        year: 4
      },
      {
        user_uuid: "student-3-uuid",
        first_name: "Carol",
        last_name: "Davis",
        email: "cdavis@ucsd.edu",
        photo_url: null,
        role: "student",
        year: 2
      },
      {
        user_uuid: "student-4-uuid",
        first_name: "David",
        last_name: "Garcia",
        email: "dgarcia@ucsd.edu",
        photo_url: null,
        role: "student",
        year: 3
      },
      {
        user_uuid: "student-5-uuid",
        first_name: "Eva",
        last_name: "Rodriguez",
        email: "erodriguez@ucsd.edu",
        photo_url: null,
        role: "student",
        year: 4
      },
      {
        user_uuid: "student-6-uuid",
        first_name: "Frank",
        last_name: "Chen",
        email: "fchen@ucsd.edu",
        photo_url: null,
        role: "student",
        year: 2
      },
      {
        user_uuid: "student-7-uuid",
        first_name: "Grace",
        last_name: "Kim",
        email: "gkim@ucsd.edu",
        photo_url: null,
        role: "student",
        year: 3
      },
      {
        user_uuid: "student-8-uuid",
        first_name: "Henry",
        last_name: "Patel",
        email: "hpatel@ucsd.edu",
        photo_url: null,
        role: "student",
        year: 1
      },
      {
        user_uuid: "student-9-uuid",
        first_name: "Iris",
        last_name: "Wong",
        email: "iwong@ucsd.edu",
        photo_url: null,
        role: "student",
        year: 2
      },
      {
        user_uuid: "student-10-uuid",
        first_name: "Jack",
        last_name: "Anderson",
        email: "janderson@ucsd.edu",
        photo_url: null,
        role: "student",
        year: 4
      },
      {
        user_uuid: "student-11-uuid",
        first_name: "Kelly",
        last_name: "Brown",
        email: "kbrown@ucsd.edu",
        photo_url: null,
        role: "student",
        year: 3
      },
      {
        user_uuid: "student-12-uuid",
        first_name: "Liam",
        last_name: "Taylor",
        email: "ltaylor@ucsd.edu",
        photo_url: null,
        role: "student",
        year: 1
      },
      {
        user_uuid: "student-13-uuid",
        first_name: "Maya",
        last_name: "Singh",
        email: "msingh@ucsd.edu",
        photo_url: null,
        role: "student",
        year: 2
      },
      {
        user_uuid: "student-14-uuid",
        first_name: "Nathan",
        last_name: "Lee",
        email: "nlee@ucsd.edu",
        photo_url: null,
        role: "student",
        year: 3
      },
      {
        user_uuid: "student-15-uuid",
        first_name: "Olivia",
        last_name: "White",
        email: "owhite@ucsd.edu",
        photo_url: null,
        role: "student",
        year: 4
      },
      // Staff
      {
        user_uuid: "staff-1-uuid",
        first_name: "Thomas",
        last_name: "Powell",
        email: "tpowell@ucsd.edu",
        photo_url: null,
        role: "instructor",
        office_location: "CSE 3220"
      },
      {
        user_uuid: "staff-2-uuid",
        first_name: "Sarah",
        last_name: "Johnson",
        email: "sjohnson@ucsd.edu",
        photo_url: null,
        role: "ta",
        office_location: "CSE B275"
      },
      {
        user_uuid: "staff-3-uuid",
        first_name: "Michael",
        last_name: "Chen",
        email: "mchen@ucsd.edu",
        photo_url: null,
        role: "ta",
        office_location: "CSE B260"
      }
    ]
  },

  teamProfiles: {
    "team-1-uuid": {
      team_info: {
        team_uuid: "team-1-uuid",
        team_name: "Team Alpha",
        course_uuid: "course-123-uuid",
        course_name: "CSE 210 - Software Engineering",
        project_name: "TaskMaster Pro",
        mission: "Automate weekly task planning for large student project teams.",
        summary: "Building a collaborative planning dashboard that syncs sprint notes, standups, and grading checkpoints in one surface.",
        repo_url: "https://github.com/conductor-tool/team-alpha",
        docs_url: "https://docs.example.com/team-alpha",
        chat_url: "https://chat.example.com/team-alpha",
        status_health: "On Track",
        status_summary: "Velocity increased 10% after adding backlog grooming. Finalizing integration tests.",
        status_updated: "2024-11-10",
        tags: ["Productivity", "Full Stack", "Accessibility"]
      },
      metrics: {
        current_sprint: "Sprint 4",
        story_points_completed: 26,
        velocity: 28,
        bug_count: 2
      },
      meeting_schedule: [
        {
          meeting_uuid: "team-1-meeting-1",
          title: "Sprint Planning",
          schedule: "Mondays • 6:00 PM • Zoom"
        },
        {
          meeting_uuid: "team-1-meeting-2",
          title: "Design Sync",
          schedule: "Wednesdays • 4:30 PM • Jacobs 2315"
        },
        {
          meeting_uuid: "team-1-meeting-3",
          title: "Office Hours",
          schedule: "Fridays • 2:00 PM • CSE Basement"
        }
      ],
      members: [
        {
          user_uuid: "student-1-uuid",
          name: "Alice Williams",
          role: "Team Lead",
          responsibilities: "Product direction, sprint facilitation, frontend architecture",
          pronouns: "she/her",
          email: "awilliams@ucsd.edu",
          github: "awilliams42"
        },
        {
          user_uuid: "student-6-uuid",
          name: "Frank Chen",
          role: "Backend Engineer",
          responsibilities: "Task ingestion service, database schema, CI workflows",
          pronouns: "he/him",
          email: "fchen@ucsd.edu",
          github: "frank-chen"
        },
        {
          user_uuid: "student-7-uuid",
          name: "Grace Kim",
          role: "UX Designer",
          responsibilities: "Interaction design, Figma prototypes, accessibility review",
          pronouns: "she/her",
          email: "gkim@ucsd.edu",
          github: "grace-k"
        },
        {
          user_uuid: "student-8-uuid",
          name: "Henry Patel",
          role: "QA & Release Manager",
          responsibilities: "Regression suites, release notes, triage of customer bugs",
          pronouns: "he/him",
          email: "hpatel@ucsd.edu",
          github: "hpatel-dev"
        }
      ],
      recent_updates: [
        {
          title: "Completed usability study",
          date: "2024-11-09",
          summary: "Ran 5 moderated sessions; action items created for sprint 4 backlog."
        },
        {
          title: "Integrated calendar sync",
          date: "2024-11-06",
          summary: "Course-wide calendar now mirrors sprint deadlines automatically."
        }
      ],
      upcoming_milestones: [
        {
          title: "Sprint 4 Demo",
          due_date: "2024-11-18",
          status: "Scheduled"
        },
        {
          title: "TA feedback incorporation",
          due_date: "2024-11-20",
          status: "In progress"
        }
      ],
      status_notes: [
        {
          author: "Alice Williams",
          date: "2024-11-08",
          sentiment: "positive",
          note: "Team has solid test coverage; only dependency is analytics API credentials."
        },
        {
          author: "Grace Kim",
          date: "2024-11-07",
          sentiment: "neutral",
          note: "Need clearer copy for capacity planning widget; scheduled design clinic."
        }
      ],
      resources: [
        {
          label: "Design Figma",
          url: "https://figma.com/team-alpha",
          type: "design"
        },
        {
          label: "Standup Notes",
          url: "https://docs.example.com/team-alpha/standups",
          type: "documentation"
        }
      ]
    },

    "team-2-uuid": {
      team_info: {
        team_uuid: "team-2-uuid",
        team_name: "Data Wizards",
        course_uuid: "course-456-uuid",
        course_name: "CSE 158 - Recommender Systems",
        project_name: "RecSys Engine",
        mission: "Deliver personalized course recommendations for incoming transfer students.",
        summary: "Exploring matrix factorization approaches with explainability dashboards.",
        repo_url: "https://github.com/conductor-tool/data-wizards",
        docs_url: "https://docs.example.com/data-wizards",
        chat_url: "https://chat.example.com/data-wizards",
        status_health: "At Risk",
        status_summary: "Cold-start evaluation blocked while waiting on anonymized dataset.",
        status_updated: "2024-11-08",
        tags: ["Machine Learning", "Recommender Systems"]
      },
      metrics: {
        current_sprint: "Sprint 3",
        story_points_completed: 18,
        velocity: 20,
        bug_count: 4
      },
      meeting_schedule: [
        {
          meeting_uuid: "team-2-meeting-1",
          title: "Model Review",
          schedule: "Tuesdays • 5:00 PM • Zoom"
        },
        {
          meeting_uuid: "team-2-meeting-2",
          title: "Data Cleaning Session",
          schedule: "Thursdays • 3:00 PM • CSE Basement"
        }
      ],
      members: [
        {
          user_uuid: "student-1-uuid",
          name: "Alice Williams",
          role: "Consulting PM",
          responsibilities: "Shared PM work between CSE 210 and 158 projects",
          pronouns: "she/her",
          email: "awilliams@ucsd.edu",
          github: "awilliams42"
        },
        {
          user_uuid: "student-4-uuid",
          name: "David Garcia",
          role: "ML Engineer",
          responsibilities: "Model experimentation, evaluation pipeline",
          pronouns: "he/him",
          email: "dgarcia@ucsd.edu",
          github: "dgarcia42"
        }
      ],
      recent_updates: [
        {
          title: "Hyperparameter sweep",
          date: "2024-11-02",
          summary: "Tuned baseline matrix-factorization; preparing neural CF prototype."
        }
      ],
      upcoming_milestones: [
        {
          title: "Dataset release",
          due_date: "2024-11-12",
          status: "Blocked"
        }
      ],
      status_notes: [
        {
          author: "David Garcia",
          date: "2024-11-07",
          sentiment: "neutral",
          note: "Need sanitized enrollment data to continue offline evaluation."
        }
      ],
      resources: [
        {
          label: "Experiment Tracking",
          url: "https://wandb.ai/data-wizards",
          type: "tooling"
        }
      ]
    },

    "team-3-uuid": {
      team_info: {
        team_uuid: "team-3-uuid",
        team_name: "IoT Innovators",
        course_uuid: "course-123-uuid",
        course_name: "CSE 210 - Software Engineering",
        project_name: "SmartHome Hub",
        mission: "Help student households automate daily chores using affordable IoT sensors.",
        summary: "Building a centralized dashboard for scheduling devices and monitoring energy usage.",
        repo_url: "https://github.com/conductor-tool/iot-innovators",
        docs_url: "https://docs.example.com/iot-innovators",
        chat_url: "https://chat.example.com/iot-innovators",
        status_health: "Needs Attention",
        status_summary: "Hardware procurement delays slowed integration tests.",
        status_updated: "2024-11-09",
        tags: ["IoT", "Embedded", "Web"]
      },
      metrics: {
        current_sprint: "Sprint 4",
        story_points_completed: 20,
        velocity: 22,
        bug_count: 5
      },
      meeting_schedule: [
        {
          meeting_uuid: "team-3-meeting-1",
          title: "Hardware Integration Lab",
          schedule: "Mondays • 3:00 PM • Makerspace"
        },
        {
          meeting_uuid: "team-3-meeting-2",
          title: "Sprint Retro",
          schedule: "Fridays • 11:00 AM • Zoom"
        }
      ],
      members: [
        {
          user_uuid: "student-2-uuid",
          name: "Bob Martinez",
          role: "Firmware Engineer",
          responsibilities: "ESP32 firmware, OTA updates, device provisioning",
          pronouns: "he/him",
          email: "bmartinez@ucsd.edu",
          github: "bmartinez-dev"
        },
        {
          user_uuid: "student-11-uuid",
          name: "Kelly Brown",
          role: "Data Engineer",
          responsibilities: "Telemetry ingestion, analytics dashboards",
          pronouns: "she/her",
          email: "kbrown@ucsd.edu",
          github: "kelly-brown"
        },
        {
          user_uuid: "student-12-uuid",
          name: "Liam Taylor",
          role: "Product Designer",
          responsibilities: "Mobile app wireframes, user interviews",
          pronouns: "he/him",
          email: "ltaylor@ucsd.edu",
          github: "liam-t"
        }
      ],
      recent_updates: [
        {
          title: "Prototype sensor network online",
          date: "2024-11-08",
          summary: "Kitchen and living room nodes reporting stable metrics."
        }
      ],
      upcoming_milestones: [
        {
          title: "Safety testing walkthrough",
          due_date: "2024-11-16",
          status: "Scheduled"
        }
      ],
      status_notes: [
        {
          author: "Bob Martinez",
          date: "2024-11-05",
          sentiment: "warning",
          note: "Waiting on TA approval for additional sensor budget."
        }
      ],
      resources: [
        {
          label: "Hardware BOM",
          url: "https://docs.example.com/iot-innovators/bom",
          type: "documentation"
        }
      ]
    },

    "team-4-uuid": {
      team_info: {
        team_uuid: "team-4-uuid",
        team_name: "Product Pirates",
        course_uuid: "course-123-uuid",
        course_name: "CSE 210 - Software Engineering",
        project_name: "CollabBoard",
        mission: "Give lab sections a lightweight retro and planning board that works offline.",
        summary: "Shipping a facilitation toolkit with templates, analytics, and prompts.",
        repo_url: "https://github.com/conductor-tool/product-pirates",
        docs_url: "https://docs.example.com/product-pirates",
        chat_url: "https://chat.example.com/product-pirates",
        status_health: "On Track",
        status_summary: "Design system finalized, backend API ready for integration.",
        status_updated: "2024-11-11",
        tags: ["Facilitation", "Design Systems"]
      },
      metrics: {
        current_sprint: "Sprint 3",
        story_points_completed: 24,
        velocity: 25,
        bug_count: 1
      },
      meeting_schedule: [
        {
          meeting_uuid: "team-4-meeting-1",
          title: "Sprint Demo Rehearsal",
          schedule: "Thursdays • 5:30 PM • Zoom"
        }
      ],
      members: [
        {
          user_uuid: "student-3-uuid",
          name: "Carol Davis",
          role: "Product Manager",
          responsibilities: "Roadmap, stakeholder feedback, facilitation scripts",
          pronouns: "she/her",
          email: "cdavis@ucsd.edu",
          github: "cdavis-code"
        },
        {
          user_uuid: "student-5-uuid",
          name: "Eva Rodriguez",
          role: "UX Lead",
          responsibilities: "Design system, prototypes, accessibility reviews",
          pronouns: "she/her",
          email: "erodriguez@ucsd.edu",
          github: "eva-codes"
        },
        {
          user_uuid: "student-13-uuid",
          name: "Maya Singh",
          role: "Insights Analyst",
          responsibilities: "Engagement metrics, qualitative synthesis",
          pronouns: "she/her",
          email: "msingh@ucsd.edu",
          github: "maya-singh"
        }
      ],
      recent_updates: [
        {
          title: "Ran dry run with TA staff",
          date: "2024-11-10",
          summary: "Collected feedback on retro template phrasing and flow."
        }
      ],
      upcoming_milestones: [
        {
          title: "Pilot with Monday lab",
          due_date: "2024-11-18",
          status: "Scheduled"
        }
      ],
      status_notes: [
        {
          author: "Carol Davis",
          date: "2024-11-09",
          sentiment: "positive",
          note: "Template iteration done; prepping facilitation guide PDF."
        }
      ],
      resources: [
        {
          label: "Retro Template",
          url: "https://docs.example.com/product-pirates/templates",
          type: "documentation"
        }
      ]
    },

    "team-5-uuid": {
      team_info: {
        team_uuid: "team-5-uuid",
        team_name: "AI Architects",
        course_uuid: "course-123-uuid",
        course_name: "CSE 210 - Software Engineering",
        project_name: "ML Pipeline Manager",
        mission: "Help CSE210 staff monitor ML coursework submissions and flag risk early.",
        summary: "Delivering a dashboard that scores model health, fairness, and deadline risk.",
        repo_url: "https://github.com/conductor-tool/ai-architects",
        docs_url: "https://docs.example.com/ai-architects",
        chat_url: "https://chat.example.com/ai-architects",
        status_health: "On Track",
        status_summary: "Pipeline deployed to staging; working on alerting rules.",
        status_updated: "2024-11-11",
        tags: ["Machine Learning", "Observability"]
      },
      metrics: {
        current_sprint: "Sprint 4",
        story_points_completed: 30,
        velocity: 30,
        bug_count: 1
      },
      meeting_schedule: [
        {
          meeting_uuid: "team-5-meeting-1",
          title: "Model Clinic",
          schedule: "Wednesdays • 7:00 PM • Zoom"
        },
        {
          meeting_uuid: "team-5-meeting-2",
          title: "TA Office Hours Sync",
          schedule: "Fridays • 12:00 PM • CSE B210"
        }
      ],
      members: [
        {
          user_uuid: "student-4-uuid",
          name: "David Garcia",
          role: "ML Engineer",
          responsibilities: "Model evaluation, drift detection, CI/CD integrations",
          pronouns: "he/him",
          email: "dgarcia@ucsd.edu",
          github: "dgarcia42"
        },
        {
          user_uuid: "student-9-uuid",
          name: "Iris Wong",
          role: "Frontend Engineer",
          responsibilities: "Dashboard UI, charting, accessibility QA",
          pronouns: "she/her",
          email: "iwong@ucsd.edu",
          github: "iris-wong"
        },
        {
          user_uuid: "student-14-uuid",
          name: "Nathan Lee",
          role: "Product Analyst",
          responsibilities: "Alert policy tuning, stakeholder interviews",
          pronouns: "he/him",
          email: "nlee@ucsd.edu",
          github: "nathan-lee"
        }
      ],
      recent_updates: [
        {
          title: "Alert service deployed",
          date: "2024-11-11",
          summary: "Email notifications wired to TA distribution list for failing builds."
        }
      ],
      upcoming_milestones: [
        {
          title: "Instructor demo",
          due_date: "2024-11-17",
          status: "In progress"
        }
      ],
      status_notes: [
        {
          author: "David Garcia",
          date: "2024-11-10",
          sentiment: "positive",
          note: "Latency improved after caching feature store queries."
        }
      ],
      resources: [
        {
          label: "Model Registry",
          url: "https://mlflow.example.com/ai-architects",
          type: "tooling"
        }
      ]
    },

    "team-6-uuid": {
      team_info: {
        team_uuid: "team-6-uuid",
        team_name: "Design Driven",
        course_uuid: "course-123-uuid",
        course_name: "CSE 210 - Software Engineering",
        project_name: "Accessible Web Tools",
        mission: "Provide quick accessibility audits for course project teams.",
        summary: "Developing a browser-based scanner with guided remediation checklists.",
        repo_url: "https://github.com/conductor-tool/design-driven",
        docs_url: "https://docs.example.com/design-driven",
        chat_url: "https://chat.example.com/design-driven",
        status_health: "Stable",
        status_summary: "Pilot extension ready; focusing on documentation polish.",
        status_updated: "2024-11-09",
        tags: ["Accessibility", "Browser Extensions"]
      },
      metrics: {
        current_sprint: "Sprint 3",
        story_points_completed: 22,
        velocity: 23,
        bug_count: 0
      },
      meeting_schedule: [
        {
          meeting_uuid: "team-6-meeting-1",
          title: "Accessibility Testing Session",
          schedule: "Tuesdays • 7:30 PM • Zoom"
        }
      ],
      members: [
        {
          user_uuid: "student-5-uuid",
          name: "Eva Rodriguez",
          role: "Project Lead",
          responsibilities: "Design strategy, accessibility audits, stakeholder sync",
          pronouns: "she/her",
          email: "erodriguez@ucsd.edu",
          github: "eva-codes"
        },
        {
          user_uuid: "student-10-uuid",
          name: "Jack Anderson",
          role: "Frontend Engineer",
          responsibilities: "Extension architecture, audit rule engine",
          pronouns: "he/him",
          email: "janderson@ucsd.edu",
          github: "jack-a"
        },
        {
          user_uuid: "student-15-uuid",
          name: "Olivia White",
          role: "Research Specialist",
          responsibilities: "Assistive technology testing, compliance research",
          pronouns: "she/her",
          email: "owhite@ucsd.edu",
          github: "olivia-w"
        }
      ],
      recent_updates: [
        {
          title: "Completed accessibility heuristics library",
          date: "2024-11-07",
          summary: "Documented WCAG mappings for 40+ common issues."
        }
      ],
      upcoming_milestones: [
        {
          title: "TA training session",
          due_date: "2024-11-19",
          status: "Scheduled"
        }
      ],
      status_notes: [
        {
          author: "Eva Rodriguez",
          date: "2024-11-08",
          sentiment: "positive",
          note: "Extension reviewers gave high marks; prepping release blog post."
        }
      ],
      resources: [
        {
          label: "Accessibility Checklist",
          url: "https://docs.example.com/design-driven/checklist",
          type: "documentation"
        }
      ]
    }
  }
};
