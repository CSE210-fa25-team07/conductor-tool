/**
 * Mock Data for Dashboard Development
 * Contains sample data for all API endpoints
 */

export const mockData = {
  // Course overview data
  courseOverview: {
    course_uuid: 'course-123-uuid',
    course_code: 'CSE 210',
    course_name: 'Software Engineering',
    term_uuid: 'term-123-uuid',
    term_name: 'Fall 2024',
    description: 'Introduction to software engineering principles and practices',
    syllabus_url: 'https://example.com/syllabus.pdf',
    canvas_url: 'https://canvas.ucsd.edu/courses/12345',
    lecture_time: 'MWF 10:00 AM - 10:50 AM',
    lecture_location: 'WLH 2005',
    google_calendar_embed: null
  },

  // Student grade data
  studentGrade: {
    user_uuid: 'user-123-uuid',
    course_uuid: 'course-123-uuid',
    current_percentage: 87.5,
    current_letter_grade: 'B+',
    final_percentage: null,
    final_letter_grade: null,
    is_finalized: false
  },

  // Student assignments data
  studentAssignments: [
    {
      assignment_uuid: 'assignment-1-uuid',
      assignment_name: 'Homework 1: Requirements Analysis',
      assignment_category: 'Homework',
      points_possible: 100,
      points_earned: 95,
      percentage: 95.0,
      due_date: '2024-10-15T23:59:00Z',
      submitted_at: '2024-10-14T18:30:00Z',
      graded_at: '2024-10-16T10:00:00Z'
    },
    {
      assignment_uuid: 'assignment-2-uuid',
      assignment_name: 'Project Milestone 1: Pitch',
      assignment_category: 'Project',
      points_possible: 150,
      points_earned: 140,
      percentage: 93.3,
      due_date: '2024-10-22T23:59:00Z',
      submitted_at: '2024-10-22T22:45:00Z',
      graded_at: '2024-10-24T14:20:00Z'
    },
    {
      assignment_uuid: 'assignment-3-uuid',
      assignment_name: 'Quiz 1: Agile Methodologies',
      assignment_category: 'Quiz',
      points_possible: 50,
      points_earned: 42,
      percentage: 84.0,
      due_date: '2024-10-29T23:59:00Z',
      submitted_at: '2024-10-29T21:15:00Z',
      graded_at: '2024-10-30T09:00:00Z'
    },
    {
      assignment_uuid: 'assignment-4-uuid',
      assignment_name: 'Homework 2: Design Patterns',
      assignment_category: 'Homework',
      points_possible: 100,
      points_earned: 88,
      percentage: 88.0,
      due_date: '2024-11-05T23:59:00Z',
      submitted_at: '2024-11-05T23:30:00Z',
      graded_at: null
    },
    {
      assignment_uuid: 'assignment-5-uuid',
      assignment_name: 'Project Milestone 2: Architecture',
      assignment_category: 'Project',
      points_possible: 150,
      points_earned: null,
      percentage: null,
      due_date: '2024-11-12T23:59:00Z',
      submitted_at: null,
      graded_at: null
    }
  ],

  // Course staff data
  courseStaff: [
    {
      user_uuid: 'staff-1-uuid',
      first_name: 'Thomas',
      last_name: 'Powell',
      email: 'tpowell@ucsd.edu',
      staff_role: 'instructor',
      office_location: 'CSE 3220',
      office_hours: [
        {
          office_hour_uuid: 'oh-1-uuid',
          day_of_week: 2,
          start_time: '14:00:00',
          end_time: '15:30:00',
          location: 'CSE 3220',
          is_active: true
        },
        {
          office_hour_uuid: 'oh-2-uuid',
          day_of_week: 4,
          start_time: '14:00:00',
          end_time: '15:30:00',
          location: 'CSE 3220',
          is_active: true
        }
      ]
    },
    {
      user_uuid: 'staff-2-uuid',
      first_name: 'Sarah',
      last_name: 'Johnson',
      email: 'sjohnson@ucsd.edu',
      staff_role: 'ta',
      office_location: 'CSE B275',
      office_hours: [
        {
          office_hour_uuid: 'oh-3-uuid',
          day_of_week: 1,
          start_time: '10:00:00',
          end_time: '12:00:00',
          location: 'CSE B275',
          is_active: true
        },
        {
          office_hour_uuid: 'oh-4-uuid',
          day_of_week: 3,
          start_time: '15:00:00',
          end_time: '17:00:00',
          location: 'CSE B275',
          is_active: true
        }
      ]
    },
    {
      user_uuid: 'staff-3-uuid',
      first_name: 'Michael',
      last_name: 'Chen',
      email: 'mchen@ucsd.edu',
      staff_role: 'ta',
      office_location: 'CSE B260',
      office_hours: [
        {
          office_hour_uuid: 'oh-5-uuid',
          day_of_week: 2,
          start_time: '16:00:00',
          end_time: '18:00:00',
          location: 'CSE B260',
          is_active: true
        }
      ]
    }
  ],

  // Enrollment statistics (instructor only)
  enrollmentStats: {
    total_students: 523,
    active_students: 498,
    dropped_students: 25,
    average_grade: 82.45
  },

  // Assignment statistics (instructor only)
  assignmentStats: [
    {
      assignment_uuid: 'assignment-1-uuid',
      assignment_name: 'Homework 1: Requirements Analysis',
      assignment_category: 'Homework',
      points_possible: 100,
      due_date: '2024-10-15T23:59:00Z',
      is_published: true,
      total_students: 498,
      submissions_count: 487,
      graded_count: 487,
      average_score: 89.3,
      average_percentage: 89.3
    },
    {
      assignment_uuid: 'assignment-2-uuid',
      assignment_name: 'Project Milestone 1: Pitch',
      assignment_category: 'Project',
      points_possible: 150,
      due_date: '2024-10-22T23:59:00Z',
      is_published: true,
      total_students: 498,
      submissions_count: 492,
      graded_count: 492,
      average_score: 135.8,
      average_percentage: 90.5
    },
    {
      assignment_uuid: 'assignment-3-uuid',
      assignment_name: 'Quiz 1: Agile Methodologies',
      assignment_category: 'Quiz',
      points_possible: 50,
      due_date: '2024-10-29T23:59:00Z',
      is_published: true,
      total_students: 498,
      submissions_count: 495,
      graded_count: 495,
      average_score: 41.2,
      average_percentage: 82.4
    },
    {
      assignment_uuid: 'assignment-4-uuid',
      assignment_name: 'Homework 2: Design Patterns',
      assignment_category: 'Homework',
      points_possible: 100,
      due_date: '2024-11-05T23:59:00Z',
      is_published: true,
      total_students: 498,
      submissions_count: 476,
      graded_count: 245,
      average_score: 85.7,
      average_percentage: 85.7
    },
    {
      assignment_uuid: 'assignment-5-uuid',
      assignment_name: 'Project Milestone 2: Architecture',
      assignment_category: 'Project',
      points_possible: 150,
      due_date: '2024-11-12T23:59:00Z',
      is_published: true,
      total_students: 498,
      submissions_count: 0,
      graded_count: 0,
      average_score: null,
      average_percentage: null
    }
  ],

  // Recent enrollments (instructor only)
  recentEnrollments: [
    {
      user_uuid: 'student-1-uuid',
      first_name: 'Alice',
      last_name: 'Williams',
      email: 'awilliams@ucsd.edu',
      enrollment_status: 'active',
      enrolled_at: '2024-11-08T14:23:00Z'
    },
    {
      user_uuid: 'student-2-uuid',
      first_name: 'Bob',
      last_name: 'Martinez',
      email: 'bmartinez@ucsd.edu',
      enrollment_status: 'active',
      enrolled_at: '2024-11-07T09:15:00Z'
    },
    {
      user_uuid: 'student-3-uuid',
      first_name: 'Carol',
      last_name: 'Davis',
      email: 'cdavis@ucsd.edu',
      enrollment_status: 'active',
      enrolled_at: '2024-11-06T16:45:00Z'
    },
    {
      user_uuid: 'student-4-uuid',
      first_name: 'David',
      last_name: 'Garcia',
      email: 'dgarcia@ucsd.edu',
      enrollment_status: 'active',
      enrolled_at: '2024-11-05T11:30:00Z'
    },
    {
      user_uuid: 'student-5-uuid',
      first_name: 'Eva',
      last_name: 'Rodriguez',
      email: 'erodriguez@ucsd.edu',
      enrollment_status: 'active',
      enrolled_at: '2024-11-04T13:20:00Z'
    }
  ],

  // User role data - change 'role' to 'instructor' to see instructor view
  userRole: {
    user_uuid: 'user-123-uuid',
    course_uuid: 'course-123-uuid',
    role: 'instructor' // Change to 'instructor' or 'ta' to see instructor view
  }
};
