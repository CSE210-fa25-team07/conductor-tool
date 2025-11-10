// Mock data for standup demo
// NO BACKEND - Pure frontend demo with mock data

export const mockUsers = [
  {
    user_uuid: 'user-001',
    name: 'Alice Chen',
    email: 'alice@ucsd.edu',
    role: 'student'
  },
  {
    user_uuid: 'user-002',
    name: 'Bob Martinez',
    email: 'bob@ucsd.edu',
    role: 'student'
  },
  {
    user_uuid: 'user-003',
    name: 'Carol Davis',
    email: 'carol@ucsd.edu',
    role: 'student'
  },
  {
    user_uuid: 'user-004',
    name: 'David Kim',
    email: 'david@ucsd.edu',
    role: 'student'
  },
  {
    user_uuid: 'user-005',
    name: 'Eva Rodriguez',
    email: 'eva@ucsd.edu',
    role: 'ta'
  }
];

export const mockTeams = [
  {
    team_uuid: 'team-001',
    name: 'Team Alpha',
    course_uuid: 'course-001'
  },
  {
    team_uuid: 'team-002',
    name: 'Team Beta',
    course_uuid: 'course-001'
  }
];

export const mockCourses = [
  {
    course_uuid: 'course-001',
    name: 'CSE 110 - Software Engineering',
    term: 'Fall 2025'
  }
];

export const mockStandups = [
  {
    standup_uuid: 'standup-001',
    user_uuid: 'user-001',
    team_uuid: 'team-001',
    course_uuid: 'course-001',
    date_submitted: '2025-11-09T10:30:00Z',
    what_done: 'Implemented user authentication module. Fixed 3 bugs in the login flow. Reviewed 2 PRs from teammates.',
    what_next: 'Work on password reset functionality. Write unit tests for auth module.',
    blockers: '',
    reflection: 'Feeling good about the progress. Team collaboration is smooth.',
    sentiment_score: 0.8,
    sentiment_emoji: '😊',
    visibility: 'Team',
    created_at: '2025-11-09T10:30:00Z',
    updated_at: '2025-11-09T10:30:00Z'
  },
  {
    standup_uuid: 'standup-002',
    user_uuid: 'user-002',
    team_uuid: 'team-001',
    course_uuid: 'course-001',
    date_submitted: '2025-11-09T09:15:00Z',
    what_done: 'Set up database schema for user profiles. Created initial migration scripts.',
    what_next: 'Implement database connection pooling. Test migration on staging.',
    blockers: 'Having trouble with PostgreSQL connection timeout issues. Need help debugging.',
    reflection: 'A bit frustrated with the database issues but making progress.',
    sentiment_score: -0.2,
    sentiment_emoji: '😐',
    visibility: 'Team',
    created_at: '2025-11-09T09:15:00Z',
    updated_at: '2025-11-09T09:15:00Z'
  },
  {
    standup_uuid: 'standup-003',
    user_uuid: 'user-003',
    team_uuid: 'team-001',
    course_uuid: 'course-001',
    date_submitted: '2025-11-09T11:00:00Z',
    what_done: 'Designed UI wireframes for dashboard. Got feedback from team. Started HTML structure.',
    what_next: 'Continue building dashboard components. Set up routing.',
    blockers: '',
    reflection: 'Good progress. Looking forward to seeing the dashboard come together.',
    sentiment_score: 0.6,
    sentiment_emoji: '🙂',
    visibility: 'Team',
    created_at: '2025-11-09T11:00:00Z',
    updated_at: '2025-11-09T11:00:00Z'
  },
  {
    standup_uuid: 'standup-004',
    user_uuid: 'user-004',
    team_uuid: 'team-001',
    course_uuid: 'course-001',
    date_submitted: '2025-11-08T14:20:00Z',
    what_done: 'Researched API integration patterns. Wrote documentation for REST endpoints.',
    what_next: 'Implement API endpoints for user CRUD operations.',
    blockers: '',
    reflection: 'Productive day. Documentation is helping clarify the architecture.',
    sentiment_score: 0.7,
    sentiment_emoji: '😊',
    visibility: 'Team',
    created_at: '2025-11-08T14:20:00Z',
    updated_at: '2025-11-08T14:20:00Z'
  },
  {
    standup_uuid: 'standup-005',
    user_uuid: 'user-001',
    team_uuid: 'team-001',
    course_uuid: 'course-001',
    date_submitted: '2025-11-08T10:00:00Z',
    what_done: 'Attended team meeting. Planned sprint goals. Started auth module research.',
    what_next: 'Implement user authentication module.',
    blockers: '',
    reflection: 'Excited to start the auth work.',
    sentiment_score: 0.9,
    sentiment_emoji: '😄',
    visibility: 'Team',
    created_at: '2025-11-08T10:00:00Z',
    updated_at: '2025-11-08T10:00:00Z'
  },
  {
    standup_uuid: 'standup-006',
    user_uuid: 'user-002',
    team_uuid: 'team-001',
    course_uuid: 'course-001',
    date_submitted: '2025-11-08T09:30:00Z',
    what_done: 'Researched database options. Created initial schema draft.',
    what_next: 'Set up database schema for user profiles.',
    blockers: '',
    reflection: 'Making good progress on database design.',
    sentiment_score: 0.5,
    sentiment_emoji: '🙂',
    visibility: 'Team',
    created_at: '2025-11-08T09:30:00Z',
    updated_at: '2025-11-08T09:30:00Z'
  },
  {
    standup_uuid: 'standup-007',
    user_uuid: 'user-001',
    team_uuid: 'team-002',
    course_uuid: 'course-001',
    date_submitted: '2025-11-09T10:45:00Z',
    what_done: 'Code review for Team Beta project. Provided feedback on architecture.',
    what_next: 'Continue cross-team collaboration.',
    blockers: '',
    reflection: 'Great to see what other teams are working on.',
    sentiment_score: 0.7,
    sentiment_emoji: '😊',
    visibility: 'Team',
    created_at: '2025-11-09T10:45:00Z',
    updated_at: '2025-11-09T10:45:00Z'
  }
];

export const mockComments = [
  {
    comment_uuid: 'comment-001',
    standup_uuid: 'standup-002',
    commenter_uuid: 'user-001',
    comment_text: 'I can help with the PostgreSQL timeout issue! I dealt with this last week. Let\'s pair up after class.',
    created_at: '2025-11-09T09:30:00Z',
    updated_at: '2025-11-09T09:30:00Z'
  },
  {
    comment_uuid: 'comment-002',
    standup_uuid: 'standup-002',
    commenter_uuid: 'user-003',
    comment_text: 'Check the connection pool settings in your config. That usually helps.',
    created_at: '2025-11-09T10:00:00Z',
    updated_at: '2025-11-09T10:00:00Z'
  },
  {
    comment_uuid: 'comment-003',
    standup_uuid: 'standup-001',
    commenter_uuid: 'user-005',
    comment_text: 'Great progress on the auth module! Make sure to include edge cases in your tests.',
    created_at: '2025-11-09T11:00:00Z',
    updated_at: '2025-11-09T11:00:00Z'
  }
];

export const mockNotifications = [
  {
    notif_uuid: 'notif-001',
    sender_uuid: 'user-001',
    receiver_uuid: 'user-002',
    standup_uuid: 'standup-002',
    message: 'Alice Chen commented on your standup',
    status: 'Unread',
    created_at: '2025-11-09T09:30:00Z'
  },
  {
    notif_uuid: 'notif-002',
    sender_uuid: 'user-003',
    receiver_uuid: 'user-002',
    standup_uuid: 'standup-002',
    message: 'Carol Davis commented on your standup',
    status: 'Unread',
    created_at: '2025-11-09T10:00:00Z'
  },
  {
    notif_uuid: 'notif-003',
    sender_uuid: 'user-005',
    receiver_uuid: 'user-001',
    standup_uuid: 'standup-001',
    message: 'Eva Rodriguez commented on your standup',
    status: 'Read',
    created_at: '2025-11-09T11:00:00Z'
  }
];

// Helper functions
export function getUserById(userId) {
  return mockUsers.find(u => u.user_uuid === userId);
}

export function getTeamById(teamId) {
  return mockTeams.find(t => t.team_uuid === teamId);
}

export function getStandupsByTeam(teamId) {
  return mockStandups.filter(s => s.team_uuid === teamId);
}

export function getStandupsByUser(userId) {
  return mockStandups.filter(s => s.user_uuid === userId);
}

export function getCommentsByStandup(standupId) {
  return mockComments.filter(c => c.standup_uuid === standupId);
}

export function getNotificationsByUser(userId) {
  return mockNotifications.filter(n => n.receiver_uuid === userId);
}

export function getUnreadNotificationCount(userId) {
  return mockNotifications.filter(n => n.receiver_uuid === userId && n.status === 'Unread').length;
}

// Current logged in user (for demo purposes)
export const currentUser = mockUsers[0]; // Alice Chen
