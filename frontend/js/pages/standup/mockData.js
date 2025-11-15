/**
 * @fileoverview Mock data for standup demo
 * NO BACKEND - Pure frontend demo with mock data
 * Using snake_case to match database schema conventions
 * @module standup/mockData
 */

/* eslint-disable camelcase */

/**
 * Mock user data
 * @type {Array<Object>}
 * @property {string} user_uuid - Unique user identifier
 * @property {string} name - User's full name
 * @property {string} email - User's email address
 * @property {string} role - User's role (student, ta, instructor)
 * @property {string} github_username - GitHub username
 * @property {boolean} github_connected - Whether GitHub is connected
 */
export const mockUsers = [
  {
    user_uuid: "user-001",
    name: "Alice Chen",
    email: "alice@ucsd.edu",
    role: "student",
    github_username: "alicechen",
    github_connected: true
  },
  {
    user_uuid: "user-002",
    name: "Bob Martinez",
    email: "bob@ucsd.edu",
    role: "student",
    github_username: "bobmartinez",
    github_connected: true
  },
  {
    user_uuid: "user-003",
    name: "Carol Davis",
    email: "carol@ucsd.edu",
    role: "student",
    github_username: "caroldavis",
    github_connected: false
  },
  {
    user_uuid: "user-004",
    name: "David Kim",
    email: "david@ucsd.edu",
    role: "student",
    github_username: "davidkim",
    github_connected: true
  },
  {
    user_uuid: "user-005",
    name: "Eva Rodriguez",
    email: "eva@ucsd.edu",
    role: "ta",
    github_username: "evarodriguez",
    github_connected: true
  }
];

/**
 * Mock team data
 * @type {Array<Object>}
 * @property {string} team_uuid - Unique team identifier
 * @property {string} name - Team name
 * @property {string} course_uuid - Associated course identifier
 * @property {string} github_org - GitHub organization name
 * @property {string} github_org_url - GitHub organization URL
 */
export const mockTeams = [
  {
    team_uuid: "team-001",
    name: "Team Alpha",
    course_uuid: "course-001",
    github_org: "cse110-fa25-team-alpha",
    github_org_url: "https://github.com/cse110-fa25-team-alpha"
  },
  {
    team_uuid: "team-002",
    name: "Team Beta",
    course_uuid: "course-001",
    github_org: "cse110-fa25-team-beta",
    github_org_url: "https://github.com/cse110-fa25-team-beta"
  }
];

/**
 * Mock course data
 * @type {Array<Object>}
 * @property {string} course_uuid - Unique course identifier
 * @property {string} name - Course name
 * @property {string} term - Academic term
 */
export const mockCourses = [
  {
    course_uuid: "course-001",
    name: "CSE 110 - Software Engineering",
    term: "Fall 2025"
  }
];

/**
 * Mock standup submission data
 * @type {Array<Object>}
 * @property {string} standup_uuid - Unique standup identifier
 * @property {string} user_uuid - User who submitted the standup
 * @property {string} team_uuid - Team associated with standup
 * @property {string} course_uuid - Course associated with standup
 * @property {string} date_submitted - ISO timestamp of submission
 * @property {string} what_done - What was accomplished
 * @property {string} what_next - What will be worked on next
 * @property {string} blockers - Any blockers or issues
 * @property {string} reflection - Personal reflection
 * @property {number} sentiment_score - Sentiment score (-1 to 1)
 * @property {string} sentiment_emoji - Emoji representing sentiment
 * @property {string} visibility - Visibility level (Team, Instructor, Private)
 * @property {string} created_at - ISO timestamp of creation
 * @property {string} updated_at - ISO timestamp of last update
 */
export const mockStandups = [
  {
    standup_uuid: "standup-001",
    user_uuid: "user-001",
    team_uuid: "team-001",
    course_uuid: "course-001",
    date_submitted: "2025-11-09T10:30:00Z",
    what_done: "Implemented user authentication module. Fixed 3 bugs in the login flow. Reviewed 2 PRs from teammates.",
    what_next: "Work on password reset functionality. Write unit tests for auth module.",
    blockers: "",
    reflection: "Feeling good about the progress. Team collaboration is smooth.",
    sentiment_score: 0.8,
    sentiment_emoji: "😊",
    visibility: "Team",
    created_at: "2025-11-09T10:30:00Z",
    updated_at: "2025-11-09T10:30:00Z"
  },
  {
    standup_uuid: "standup-002",
    user_uuid: "user-002",
    team_uuid: "team-001",
    course_uuid: "course-001",
    date_submitted: "2025-11-09T09:15:00Z",
    what_done: "Set up database schema for user profiles. Created initial migration scripts.",
    what_next: "Implement database connection pooling. Test migration on staging.",
    blockers: "Having trouble with PostgreSQL connection timeout issues. Need help debugging.",
    reflection: "A bit frustrated with the database issues but making progress.",
    sentiment_score: -0.2,
    sentiment_emoji: "😐",
    visibility: "Team",
    created_at: "2025-11-09T09:15:00Z",
    updated_at: "2025-11-09T09:15:00Z"
  },
  {
    standup_uuid: "standup-003",
    user_uuid: "user-003",
    team_uuid: "team-001",
    course_uuid: "course-001",
    date_submitted: "2025-11-09T11:00:00Z",
    what_done: "Designed UI wireframes for dashboard. Got feedback from team. Started HTML structure.",
    what_next: "Continue building dashboard components. Set up routing.",
    blockers: "",
    reflection: "Good progress. Looking forward to seeing the dashboard come together.",
    sentiment_score: 0.6,
    sentiment_emoji: "🙂",
    visibility: "Team",
    created_at: "2025-11-09T11:00:00Z",
    updated_at: "2025-11-09T11:00:00Z"
  },
  {
    standup_uuid: "standup-004",
    user_uuid: "user-004",
    team_uuid: "team-001",
    course_uuid: "course-001",
    date_submitted: "2025-11-08T14:20:00Z",
    what_done: "Researched API integration patterns. Wrote documentation for REST endpoints.",
    what_next: "Implement API endpoints for user CRUD operations.",
    blockers: "",
    reflection: "Productive day. Documentation is helping clarify the architecture.",
    sentiment_score: 0.7,
    sentiment_emoji: "😊",
    visibility: "Team",
    created_at: "2025-11-08T14:20:00Z",
    updated_at: "2025-11-08T14:20:00Z"
  },
  {
    standup_uuid: "standup-005",
    user_uuid: "user-001",
    team_uuid: "team-001",
    course_uuid: "course-001",
    date_submitted: "2025-11-08T10:00:00Z",
    what_done: "Attended team meeting. Planned sprint goals. Started auth module research.",
    what_next: "Implement user authentication module.",
    blockers: "",
    reflection: "Excited to start the auth work.",
    sentiment_score: 0.9,
    sentiment_emoji: "😄",
    visibility: "Team",
    created_at: "2025-11-08T10:00:00Z",
    updated_at: "2025-11-08T10:00:00Z"
  },
  {
    standup_uuid: "standup-006",
    user_uuid: "user-002",
    team_uuid: "team-001",
    course_uuid: "course-001",
    date_submitted: "2025-11-08T09:30:00Z",
    what_done: "Researched database options. Created initial schema draft.",
    what_next: "Set up database schema for user profiles.",
    blockers: "",
    reflection: "Making good progress on database design.",
    sentiment_score: 0.5,
    sentiment_emoji: "🙂",
    visibility: "Team",
    created_at: "2025-11-08T09:30:00Z",
    updated_at: "2025-11-08T09:30:00Z"
  },
  {
    standup_uuid: "standup-007",
    user_uuid: "user-001",
    team_uuid: "team-002",
    course_uuid: "course-001",
    date_submitted: "2025-11-09T10:45:00Z",
    what_done: "Code review for Team Beta project. Provided feedback on architecture.",
    what_next: "Continue cross-team collaboration.",
    blockers: "",
    reflection: "Great to see what other teams are working on.",
    sentiment_score: 0.7,
    sentiment_emoji: "😊",
    visibility: "Team",
    created_at: "2025-11-09T10:45:00Z",
    updated_at: "2025-11-09T10:45:00Z"
  }
];

/**
 * Mock comment data
 * @type {Array<Object>}
 * @property {string} comment_uuid - Unique comment identifier
 * @property {string} standup_uuid - Standup being commented on
 * @property {string} commenter_uuid - User who made the comment
 * @property {string} comment_text - Comment text content
 * @property {string} created_at - ISO timestamp of creation
 * @property {string} updated_at - ISO timestamp of last update
 */
export const mockComments = [
  {
    comment_uuid: "comment-001",
    standup_uuid: "standup-002",
    commenter_uuid: "user-001",
    comment_text: "I can help with the PostgreSQL timeout issue! I dealt with this last week. Let's pair up after class.",
    created_at: "2025-11-09T09:30:00Z",
    updated_at: "2025-11-09T09:30:00Z"
  },
  {
    comment_uuid: "comment-002",
    standup_uuid: "standup-002",
    commenter_uuid: "user-003",
    comment_text: "Check the connection pool settings in your config. That usually helps.",
    created_at: "2025-11-09T10:00:00Z",
    updated_at: "2025-11-09T10:00:00Z"
  },
  {
    comment_uuid: "comment-003",
    standup_uuid: "standup-001",
    commenter_uuid: "user-005",
    comment_text: "Great progress on the auth module! Make sure to include edge cases in your tests.",
    created_at: "2025-11-09T11:00:00Z",
    updated_at: "2025-11-09T11:00:00Z"
  }
];

/**
 * Mock notification data
 * @type {Array<Object>}
 * @property {string} notif_uuid - Unique notification identifier
 * @property {string} sender_uuid - User who triggered the notification
 * @property {string} receiver_uuid - User receiving the notification
 * @property {string} standup_uuid - Related standup
 * @property {string} message - Notification message
 * @property {string} status - Status (Read/Unread)
 * @property {string} created_at - ISO timestamp of creation
 */
export const mockNotifications = [
  {
    notif_uuid: "notif-001",
    sender_uuid: "user-001",
    receiver_uuid: "user-002",
    standup_uuid: "standup-002",
    message: "Alice Chen commented on your standup",
    status: "Unread",
    created_at: "2025-11-09T09:30:00Z"
  },
  {
    notif_uuid: "notif-002",
    sender_uuid: "user-003",
    receiver_uuid: "user-002",
    standup_uuid: "standup-002",
    message: "Carol Davis commented on your standup",
    status: "Unread",
    created_at: "2025-11-09T10:00:00Z"
  },
  {
    notif_uuid: "notif-003",
    sender_uuid: "user-005",
    receiver_uuid: "user-001",
    standup_uuid: "standup-001",
    message: "Eva Rodriguez commented on your standup",
    status: "Read",
    created_at: "2025-11-09T11:00:00Z"
  }
];

/**
 * Gets a user by their unique identifier
 * @function getUserById
 * @param {string} userId - The user UUID to search for
 * @returns {Object|undefined} The user object or undefined if not found
 */
export function getUserById(userId) {
  return mockUsers.find(u => u.user_uuid === userId);
}

/**
 * Gets a team by their unique identifier
 * @function getTeamById
 * @param {string} teamId - The team UUID to search for
 * @returns {Object|undefined} The team object or undefined if not found
 */
export function getTeamById(teamId) {
  return mockTeams.find(t => t.team_uuid === teamId);
}

/**
 * Gets all standups for a specific team
 * @function getStandupsByTeam
 * @param {string} teamId - The team UUID to filter by
 * @returns {Array<Object>} Array of standup objects for the team
 */
export function getStandupsByTeam(teamId) {
  return mockStandups.filter(s => s.team_uuid === teamId);
}

/**
 * Gets all standups submitted by a specific user
 * @function getStandupsByUser
 * @param {string} userId - The user UUID to filter by
 * @returns {Array<Object>} Array of standup objects for the user
 */
export function getStandupsByUser(userId) {
  return mockStandups.filter(s => s.user_uuid === userId);
}

/**
 * Gets all comments for a specific standup
 * @function getCommentsByStandup
 * @param {string} standupId - The standup UUID to filter by
 * @returns {Array<Object>} Array of comment objects for the standup
 */
export function getCommentsByStandup(standupId) {
  return mockComments.filter(c => c.standup_uuid === standupId);
}

/**
 * Gets all notifications for a specific user
 * @function getNotificationsByUser
 * @param {string} userId - The user UUID to filter by
 * @returns {Array<Object>} Array of notification objects for the user
 */
export function getNotificationsByUser(userId) {
  return mockNotifications.filter(n => n.receiver_uuid === userId);
}

/**
 * Gets the count of unread notifications for a user
 * @function getUnreadNotificationCount
 * @param {string} userId - The user UUID to count for
 * @returns {number} Number of unread notifications
 */
export function getUnreadNotificationCount(userId) {
  return mockNotifications.filter(n => n.receiver_uuid === userId && n.status === "Unread").length;
}

/**
 * Mock GitHub repository data for team organizations
 * @type {Array<Object>}
 * @property {string} repo_uuid - Unique repository identifier
 * @property {string} team_uuid - Associated team identifier
 * @property {string} repo_name - Repository name
 * @property {string} repo_full_name - Full repository name with org
 * @property {string} description - Repository description
 * @property {string} last_activity - ISO timestamp of last activity
 */
export const mockGithubRepos = [
  {
    repo_uuid: "repo-001",
    team_uuid: "team-001",
    repo_name: "frontend-repo",
    repo_full_name: "cse110-fa25-team-alpha/frontend-repo",
    description: "Frontend application",
    last_activity: "2025-11-09T14:30:00Z"
  },
  {
    repo_uuid: "repo-002",
    team_uuid: "team-001",
    repo_name: "backend-repo",
    repo_full_name: "cse110-fa25-team-alpha/backend-repo",
    description: "Backend API server",
    last_activity: "2025-11-09T15:00:00Z"
  },
  {
    repo_uuid: "repo-003",
    team_uuid: "team-001",
    repo_name: "docs-repo",
    repo_full_name: "cse110-fa25-team-alpha/docs-repo",
    description: "Documentation",
    last_activity: "2025-11-08T10:00:00Z"
  },
  {
    repo_uuid: "repo-004",
    team_uuid: "team-002",
    repo_name: "main-repo",
    repo_full_name: "cse110-fa25-team-beta/main-repo",
    description: "Main project repository",
    last_activity: "2025-11-06T12:00:00Z"
  }
];

/**
 * Mock GitHub activity data (commits, PRs, reviews, issues)
 * @type {Array<Object>}
 * @property {string} activity_uuid - Unique activity identifier
 * @property {string} user_uuid - User who performed the activity
 * @property {string} repo_uuid - Repository where activity occurred
 * @property {string} activity_type - Type of activity (commit, pr, review, issue)
 * @property {string} activity_title - Title or description of activity
 * @property {string} activity_url - GitHub URL to the activity
 * @property {string} timestamp - ISO timestamp of activity
 */
export const mockGithubActivity = [
  // Alice's activity
  {
    activity_uuid: "gh-001",
    user_uuid: "user-001",
    team_uuid: "team-001",
    activity_type: "commit",
    repo_name: "frontend-repo",
    timestamp: "2025-11-09T10:00:00Z",
    data: {
      sha: "abc123",
      message: "Fixed login bug in authentication flow",
      files_changed: 3,
      additions: 45,
      deletions: 12,
      url: "https://github.com/cse110-fa25-team-alpha/frontend-repo/commit/abc123"
    }
  },
  {
    activity_uuid: "gh-002",
    user_uuid: "user-001",
    team_uuid: "team-001",
    activity_type: "commit",
    repo_name: "frontend-repo",
    timestamp: "2025-11-09T08:30:00Z",
    data: {
      sha: "def456",
      message: "Updated README with setup instructions",
      files_changed: 1,
      additions: 20,
      deletions: 5,
      url: "https://github.com/cse110-fa25-team-alpha/frontend-repo/commit/def456"
    }
  },
  {
    activity_uuid: "gh-003",
    user_uuid: "user-001",
    team_uuid: "team-001",
    activity_type: "pull_request",
    repo_name: "backend-repo",
    timestamp: "2025-11-09T09:00:00Z",
    data: {
      number: 42,
      title: "Add authentication module",
      state: "open",
      additions: 234,
      deletions: 56,
      commits: 5,
      url: "https://github.com/cse110-fa25-team-alpha/backend-repo/pull/42"
    }
  },
  {
    activity_uuid: "gh-004",
    user_uuid: "user-001",
    team_uuid: "team-001",
    activity_type: "review",
    repo_name: "backend-repo",
    timestamp: "2025-11-09T07:00:00Z",
    data: {
      pr_number: 38,
      pr_title: "Database schema update",
      review_state: "approved",
      comments_count: 3,
      url: "https://github.com/cse110-fa25-team-alpha/backend-repo/pull/38"
    }
  },
  // Bob's activity
  {
    activity_uuid: "gh-005",
    user_uuid: "user-002",
    team_uuid: "team-001",
    activity_type: "commit",
    repo_name: "backend-repo",
    timestamp: "2025-11-09T09:00:00Z",
    data: {
      sha: "ghi789",
      message: "Implement database connection pooling",
      files_changed: 2,
      additions: 78,
      deletions: 23,
      url: "https://github.com/cse110-fa25-team-alpha/backend-repo/commit/ghi789"
    }
  },
  {
    activity_uuid: "gh-006",
    user_uuid: "user-002",
    team_uuid: "team-001",
    activity_type: "commit",
    repo_name: "backend-repo",
    timestamp: "2025-11-09T08:00:00Z",
    data: {
      sha: "jkl012",
      message: "Fix PostgreSQL timeout configuration",
      files_changed: 1,
      additions: 15,
      deletions: 8,
      url: "https://github.com/cse110-fa25-team-alpha/backend-repo/commit/jkl012"
    }
  },
  {
    activity_uuid: "gh-007",
    user_uuid: "user-002",
    team_uuid: "team-001",
    activity_type: "pull_request",
    repo_name: "backend-repo",
    timestamp: "2025-11-08T14:00:00Z",
    data: {
      number: 40,
      title: "Database migration scripts",
      state: "merged",
      additions: 156,
      deletions: 34,
      commits: 3,
      merged_at: "2025-11-09T10:00:00Z",
      url: "https://github.com/cse110-fa25-team-alpha/backend-repo/pull/40"
    }
  },
  {
    activity_uuid: "gh-008",
    user_uuid: "user-002",
    team_uuid: "team-001",
    activity_type: "issue",
    repo_name: "backend-repo",
    timestamp: "2025-11-09T06:30:00Z",
    data: {
      number: 15,
      title: "PostgreSQL connection timeout issue",
      state: "open",
      action: "created",
      url: "https://github.com/cse110-fa25-team-alpha/backend-repo/issues/15"
    }
  },
  // David's activity
  {
    activity_uuid: "gh-009",
    user_uuid: "user-004",
    team_uuid: "team-001",
    activity_type: "commit",
    repo_name: "docs-repo",
    timestamp: "2025-11-09T11:00:00Z",
    data: {
      sha: "mno345",
      message: "Update API documentation",
      files_changed: 2,
      additions: 67,
      deletions: 12,
      url: "https://github.com/cse110-fa25-team-alpha/docs-repo/commit/mno345"
    }
  },
  {
    activity_uuid: "gh-010",
    user_uuid: "user-004",
    team_uuid: "team-001",
    activity_type: "review",
    repo_name: "backend-repo",
    timestamp: "2025-11-09T09:30:00Z",
    data: {
      pr_number: 42,
      pr_title: "Add authentication module",
      review_state: "commented",
      comments_count: 2,
      url: "https://github.com/cse110-fa25-team-alpha/backend-repo/pull/42"
    }
  },
  // Carol - NO activity (not connected to GitHub)
  // Older activity for history
  {
    activity_uuid: "gh-011",
    user_uuid: "user-001",
    team_uuid: "team-001",
    activity_type: "commit",
    repo_name: "frontend-repo",
    timestamp: "2025-11-08T10:00:00Z",
    data: {
      sha: "pqr678",
      message: "Initial auth module setup",
      files_changed: 5,
      additions: 123,
      deletions: 0,
      url: "https://github.com/cse110-fa25-team-alpha/frontend-repo/commit/pqr678"
    }
  },
  {
    activity_uuid: "gh-012",
    user_uuid: "user-002",
    team_uuid: "team-001",
    activity_type: "commit",
    repo_name: "backend-repo",
    timestamp: "2025-11-07T14:00:00Z",
    data: {
      sha: "stu901",
      message: "Add database schema design",
      files_changed: 3,
      additions: 89,
      deletions: 0,
      url: "https://github.com/cse110-fa25-team-alpha/backend-repo/commit/stu901"
    }
  }
];

// Helper functions for GitHub data
export function getGithubActivityByUser(userId, hoursAgo = 24) {
  const cutoffTime = new Date(Date.now() - hoursAgo * 60 * 60 * 1000);
  return mockGithubActivity.filter(activity =>
    activity.user_uuid === userId && new Date(activity.timestamp) > cutoffTime
  );
}

export function getGithubActivityByTeam(teamId, hoursAgo = 24) {
  const cutoffTime = new Date(Date.now() - hoursAgo * 60 * 60 * 1000);
  return mockGithubActivity.filter(activity =>
    activity.team_uuid === teamId && new Date(activity.timestamp) > cutoffTime
  );
}

export function getReposByTeam(teamId) {
  return mockGithubRepos.filter(repo => repo.team_uuid === teamId);
}

export function getGithubStatsByUser(userId, days = 30) {
  const cutoffTime = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const activities = mockGithubActivity.filter(activity =>
    activity.user_uuid === userId && new Date(activity.timestamp) > cutoffTime
  );

  const commits = activities.filter(a => a.activity_type === "commit");
  const prs = activities.filter(a => a.activity_type === "pull_request");
  const reviews = activities.filter(a => a.activity_type === "review");
  const issues = activities.filter(a => a.activity_type === "issue");

  const totalAdditions = commits.reduce((sum, a) => sum + (a.data.additions || 0), 0);
  const totalDeletions = commits.reduce((sum, a) => sum + (a.data.deletions || 0), 0);

  return {
    total_commits: commits.length,
    total_prs: prs.length,
    prs_open: prs.filter(pr => pr.data.state === "open").length,
    prs_merged: prs.filter(pr => pr.data.state === "merged").length,
    total_reviews: reviews.length,
    total_issues: issues.length,
    lines_added: totalAdditions,
    lines_deleted: totalDeletions,
    activities: activities
  };
}

export function getGithubStatsByTeam(teamId, days = 7) {
  const cutoffTime = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const activities = mockGithubActivity.filter(activity =>
    activity.team_uuid === teamId && new Date(activity.timestamp) > cutoffTime
  );

  const commits = activities.filter(a => a.activity_type === "commit");
  const prs = activities.filter(a => a.activity_type === "pull_request");

  return {
    total_commits: commits.length,
    total_prs: prs.length,
    prs_open: prs.filter(pr => pr.data.state === "open").length,
    prs_merged: prs.filter(pr => pr.data.state === "merged").length,
    avg_commits_per_day: (commits.length / days).toFixed(1),
    activities: activities
  };
}

/**
 * Current logged in user for demo purposes
 * @type {Object}
 * @constant
 */
export const currentUser = mockUsers[0]; // Alice Chen
