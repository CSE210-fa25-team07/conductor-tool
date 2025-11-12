/**
 * Mock Data for Dashboard Development
 * Contains sample data for all API endpoints
 */

/* eslint-disable camelcase */
export const mockData = {
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

  // User role data - change 'role' to 'instructor' to see instructor view
  userRole: {
    user_uuid: "user-123-uuid",
    course_uuid: "course-123-uuid",
    role: "instructor" // Change to 'instructor' or 'ta' to see instructor view
    // role: "student" // Change to 'instructor' or 'ta' to see instructor view
  }
};
