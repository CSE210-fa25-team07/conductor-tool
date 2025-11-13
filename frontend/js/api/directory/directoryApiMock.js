/**
 * Mock Directory API - For Development Without Backend
 * Returns mock data with simulated network delays
 */

import { mockData } from "./mockData.js";

/**
 * Simulate network delay
 * @param {number} ms - Milliseconds to delay
 * @returns {Promise}
 */
function delay(ms = 300) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Get course overview information
 * @param {string} _courseUuid - Course UUID
 * @returns {Promise<Object>} Course details with term information
 */
export async function getCourseOverview() {
  await delay(400);
  return mockData.courseOverview;
}

/**
 * Get teaching staff and their office hours for a course
 * @param {string} _courseUuid - Course UUID
 * @returns {Promise<Array>} List of staff with office hours
 */
export async function getCourseStaff() {
  await delay(450);
  return mockData.courseStaff;
}

/**
 * Get enrollment statistics for a course (instructor only)
 * @param {string} _courseUuid - Course UUID
 * @returns {Promise<Object>} Enrollment stats (total, active, dropped, avg grade)
 */
export async function getEnrollmentStats() {
  await delay(400);
  return mockData.enrollmentStats;
}

/**
 * Get recent student enrollments (instructor only)
 * @param {string} courseUuid - Course UUID
 * @param {number} limit - Number of recent enrollments to fetch (default 10)
 * @returns {Promise<Array>} List of recent enrollments
 */
export async function getRecentEnrollments(courseUuid, limit = 10) {
  await delay(380);
  return mockData.recentEnrollments.slice(0, limit);
}

/**
 * Get current user's role in the course
 * @param {string} _courseUuid - Course UUID
 * @returns {Promise<Object>} User role information
 */
export async function getUserRole() {
  await delay(300);
  return mockData.userRole;
}

/**
 * Get user profile information including teams and staff info
 * @param {string} userUuid - User UUID
 * @returns {Promise<Object>} User profile with teams and staff information
 */
function attachTeamMembership(profile, userUuid) {
  if (!profile) {
    return profile;
  }

  const existingTeams = Array.isArray(profile.teams) ? [...profile.teams] : [];
  const teamProfiles = mockData.teamProfiles || {};

  Object.values(teamProfiles).forEach((teamProfile) => {
    if (!teamProfile || !teamProfile.team_info || !Array.isArray(teamProfile.members)) {
      return;
    }

    const match = teamProfile.members.find((member) => member.user_uuid === userUuid);
    if (!match) {
      return;
    }

    const teamInfo = teamProfile.team_info;
    const alreadyPresent = existingTeams.some((team) => team.team_uuid === teamInfo.team_uuid);
    if (alreadyPresent) {
      return;
    }

    /* eslint-disable camelcase */
    existingTeams.push({
      team_uuid: teamInfo.team_uuid,
      team_name: teamInfo.team_name,
      course_uuid: teamInfo.course_uuid,
      course_name: teamInfo.course_name,
      project_name: teamInfo.project_name,
      role: match.role || "Member",
      is_team_leader: Boolean(match.is_team_leader || (match.role && match.role.toLowerCase().includes("lead"))),
      joined_at: match.joined_at || null
    });
    /* eslint-enable camelcase */
  });

  profile.teams = existingTeams;
  return profile;
}

export async function getUserProfile(userUuid) {
  await delay(450);

  // Return specific profile based on UUID
  const profileMap = {
    "staff-1-uuid": mockData.userProfileStaff1,
    "staff-2-uuid": mockData.userProfileStaff2,
    "staff-3-uuid": mockData.userProfileStaff3,
    "student-1-uuid": mockData.userProfileStudent,
    "student-2-uuid": mockData.userProfileStudent2,
    "student-3-uuid": mockData.userProfileStudent3,
    "student-4-uuid": mockData.userProfileStudent4,
    "student-5-uuid": mockData.userProfileStudent5,
    "student-6-uuid": mockData.userProfileStudent6,
    "student-7-uuid": mockData.userProfileStudent7,
    "student-8-uuid": mockData.userProfileStudent8,
    "student-9-uuid": mockData.userProfileStudent9,
    "student-10-uuid": mockData.userProfileStudent10,
    "student-11-uuid": mockData.userProfileStudent11,
    "student-12-uuid": mockData.userProfileStudent12,
    "student-13-uuid": mockData.userProfileStudent13,
    "student-14-uuid": mockData.userProfileStudent14,
    "student-15-uuid": mockData.userProfileStudent15
  };

  // Return specific profile if exists, otherwise return default based on type
  const template = profileMap[userUuid];
  if (template) {
    const profile = JSON.parse(JSON.stringify(template));
    return attachTeamMembership(profile, userUuid);
  }

  // Fallback: return default profile based on UUID pattern
  if (userUuid.includes("staff")) {
    const profile = JSON.parse(JSON.stringify(mockData.userProfileStaff1));
    return attachTeamMembership(profile, userUuid);
  }

  const profile = JSON.parse(JSON.stringify(mockData.userProfileStudent));
  return attachTeamMembership(profile, userUuid);
}

/**
 * Get course roster with pagination and filtering
 * @param {string} _courseUuid - Course UUID
 * @param {number} page - Page number (1-indexed)
 * @param {number} limit - Items per page
 * @param {string} filter - Role filter ("all", "student", "instructor", "ta")
 * @returns {Promise<Object>} Paginated roster data with counts
 */
export async function getCourseRoster(courseUuid, page = 1, limit = 12, filter = "all") {
  void courseUuid;
  await delay(400);

  // Get all users from roster
  const allUsers = [...mockData.courseRoster.users];

  // Apply filter
  let filteredUsers = allUsers;
  if (filter !== "all") {
    filteredUsers = allUsers.filter(user => user.role === filter);
  }

  // Calculate counts for filter buttons
  const counts = {
    all: allUsers.length,
    students: allUsers.filter(u => u.role === "student").length,
    instructors: allUsers.filter(u => u.role === "instructor").length,
    tas: allUsers.filter(u => u.role === "ta").length
  };

  // Calculate pagination
  const totalCount = filteredUsers.length;
  const totalPages = Math.ceil(totalCount / limit);
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;

  // Get page of users
  const pageUsers = filteredUsers.slice(startIndex, endIndex);

  /* eslint-disable camelcase */
  return {
    course_name: mockData.courseRoster.course_name,
    course_uuid: mockData.courseRoster.course_uuid,
    users: pageUsers,
    page: page,
    limit: limit,
    total_count: totalCount,
    total_pages: totalPages,
    counts: counts
  };
  /* eslint-enable camelcase */
}

/**
 * Get detailed team profile information
 * @param {string} teamUuid - Team UUID
 * @returns {Promise<Object>} Team profile including members and status
 */
export async function getTeamProfile(teamUuid) {
  await delay(420);

  /* eslint-disable camelcase */
  if (mockData.teamProfiles && mockData.teamProfiles[teamUuid]) {
    return mockData.teamProfiles[teamUuid];
  }

  // Derive basic information from user profiles if explicit profile is missing
  const derivedMembers = [];
  let derivedTeamInfo = null;

  Object.keys(mockData)
    .filter((key) => key.startsWith("userProfile"))
    .forEach((key) => {
      const profile = mockData[key];
      if (!profile || !profile.teams) {
        return;
      }

      const membership = profile.teams.find((team) => team.team_uuid === teamUuid);
      if (!membership) {
        return;
      }

      if (!derivedTeamInfo) {
        derivedTeamInfo = {
          team_uuid: membership.team_uuid,
          team_name: membership.team_name,
          course_uuid: membership.course_uuid,
          course_name: membership.course_name,
          project_name: membership.project_name,
          mission: "Team details coming soon.",
          summary: "This team has not added an overview yet.",
          repo_url: null,
          docs_url: null,
          chat_url: null,
          status_health: "Unknown",
          status_summary: "No status updates available.",
          status_updated: null,
          tags: []
        };
      }

      derivedMembers.push({
        user_uuid: profile.user.user_uuid,
        name: `${profile.user.first_name} ${profile.user.last_name}`,
        role: membership.is_team_leader ? "Team Leader" : "Contributor",
        responsibilities: null,
        pronouns: profile.user.pronouns,
        email: profile.user.email,
        github: profile.user.github_username
      });
    });

  if (derivedTeamInfo) {
    return {
      team_info: derivedTeamInfo,
      metrics: {},
      meeting_schedule: [],
      members: derivedMembers,
      recent_updates: [],
      upcoming_milestones: [],
      status_notes: [],
      resources: []
    };
  }

  // Final fallback if no data found at all
  return {
    team_info: {
      team_uuid: teamUuid,
      team_name: "Project Team",
      course_uuid: null,
      course_name: "Unknown Course",
      project_name: null,
      mission: "Team details have not been configured yet.",
      summary: "Once this team is set up, their overview and members will appear here.",
      repo_url: null,
      docs_url: null,
      chat_url: null,
      status_health: "Unknown",
      status_summary: "No data available.",
      status_updated: null,
      tags: []
    },
    metrics: {},
    meeting_schedule: [],
    members: [],
    recent_updates: [],
    upcoming_milestones: [],
    status_notes: [],
    resources: []
  };
  /* eslint-enable camelcase */
}

/**
 * Get paginated list of teams/groups for a course
 * @param {string} courseUuid - Course UUID
 * @param {number} page - Page number (1-indexed)
 * @param {number} limit - Items per page
 * @param {string} filter - Status filter (all, healthy, at-risk, critical, excellent)
 * @returns {Promise<Object>} Paginated team list with counts
 */
export async function getCourseTeams(courseUuid, page = 1, limit = 12, filter = "all") {
  void courseUuid; // Ignore courseUuid for mock data - return all teams
  await delay(450);

  /* eslint-disable camelcase */
  // Extract all teams from teamProfiles
  const allTeams = Object.values(mockData.teamProfiles || {})
    .map(teamProfile => ({
      team_uuid: teamProfile.team_info.team_uuid,
      team_name: teamProfile.team_info.team_name,
      project_name: teamProfile.team_info.project_name,
      status_health: teamProfile.team_info.status_health,
      tags: teamProfile.team_info.tags || [],
      member_count: teamProfile.members ? teamProfile.members.length : 0,
      course_uuid: teamProfile.team_info.course_uuid,
      course_name: teamProfile.team_info.course_name
    }));

  // Count teams by status
  const counts = {
    all: allTeams.length,
    healthy: allTeams.filter(t => t.status_health === "On Track").length,
    at_risk: allTeams.filter(t => t.status_health === "At Risk").length,
    critical: allTeams.filter(t => t.status_health === "Critical").length,
    excellent: allTeams.filter(t => t.status_health === "Excellent").length
  };

  // Apply filter
  let filteredTeams = allTeams;
  if (filter === "healthy") {
    filteredTeams = allTeams.filter(t => t.status_health === "On Track");
  } else if (filter === "at-risk") {
    filteredTeams = allTeams.filter(t => t.status_health === "At Risk");
  } else if (filter === "critical") {
    filteredTeams = allTeams.filter(t => t.status_health === "Critical");
  } else if (filter === "excellent") {
    filteredTeams = allTeams.filter(t => t.status_health === "Excellent");
  }

  // Calculate pagination
  const totalCount = filteredTeams.length;
  const totalPages = Math.ceil(totalCount / limit);
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;

  // Get page slice
  const paginatedTeams = filteredTeams.slice(startIndex, endIndex);

  // Get course name from courseOverview
  const courseName = mockData.courseOverview.course_name || "Unknown Course";

  return {
    teams: paginatedTeams,
    total_count: totalCount,
    total_pages: totalPages,
    current_page: page,
    course_name: courseName,
    counts: counts
  };
  /* eslint-enable camelcase */
}
