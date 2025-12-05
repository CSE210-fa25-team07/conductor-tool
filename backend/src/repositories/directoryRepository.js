/**
 * @module directory/repository
 */

import { getPrisma } from "../utils/db.js";

const prisma = getPrisma();


/**
 * Get course overview information
 * @param {string} courseUuid - Course UUID
 * @param {string} userUuid - Optional user UUID to filter team count (for students)
 * @returns {Promise<Object>} Course details with term information
 */
export async function getCourseOverview(courseUuid, userUuid = null) {
  // Build team where clause
  const teamWhereClause = { courseUuid };
  if (userUuid) {
    teamWhereClause.members = {
      some: {
        userUuid,
        leftAt: null
      }
    };
  }

  const [course, enrollments, teamCount] = await Promise.all([
    prisma.course.findUnique({
      where: { courseUuid },
      include: {
        term: {
          select: {
            year: true,
            season: true,
            startDate: true,
            endDate: true,
            isActive: true
          }
        }
      }
    }),
    prisma.courseEnrollment.findMany({
      where: { courseUuid },
      select: { userUuid: true }
    }),
    prisma.team.count({
      where: teamWhereClause
    })
  ]);

  // Count unique users (not enrollment records)
  const uniqueUserCount = new Set(enrollments.map(e => e.userUuid)).size;

  // Return course with custom counts
  return {
    ...course,
    _count: {
      enrollments: uniqueUserCount,
      teams: teamCount
    }
  };
}

/**
 * Get teaching staff and their office hours for a course
 * @param {string} courseUuid - Course UUID
 * @returns {Promise<Array>} List of staff with office hours
 */
export async function getCourseStaff(courseUuid) {
  const enrollments = await prisma.courseEnrollment.findMany({
    where: {
      courseUuid,
      enrollmentStatus: "active",
      role: {
        role: {
          in: ["Professor", "TA"]
        }
      }
    },
    include: {
      user: {
        select: {
          userUuid: true,
          firstName: true,
          lastName: true,
          email: true,
          photoUrl: true,
          staff: {
            select: {
              officeLocation: true,
              researchInterest: true,
              personalWebsite: true,
              isProf: true
            }
          }
        }
      },
      role: {
        select: {
          role: true
        }
      }
    },
    orderBy: [
      { role: { role: "asc" } },
      { user: { lastName: "asc" } }
    ]
  });

  return enrollments;
}

/**
 * Get enrollment statistics for a course (instructor only)
 * @param {string} courseUuid - Course UUID
 * @returns {Promise<Object>} Enrollment stats (total, active, dropped)
 */
export async function getEnrollmentStats(courseUuid) {
  // Get all enrollments and count unique users
  const [allEnrollments, activeEnrollments, droppedEnrollments] = await Promise.all([
    prisma.courseEnrollment.findMany({
      where: { courseUuid },
      select: { userUuid: true }
    }),
    prisma.courseEnrollment.findMany({
      where: {
        courseUuid,
        enrollmentStatus: "active"
      },
      select: { userUuid: true }
    }),
    prisma.courseEnrollment.findMany({
      where: {
        courseUuid,
        enrollmentStatus: "dropped"
      },
      select: { userUuid: true }
    })
  ]);

  // Count unique users (since users may have multiple roles like Student + Team Leader)
  const total = new Set(allEnrollments.map(e => e.userUuid)).size;
  const active = new Set(activeEnrollments.map(e => e.userUuid)).size;
  const dropped = new Set(droppedEnrollments.map(e => e.userUuid)).size;

  return {
    total,
    active,
    dropped
  };
}

/**
 * Get recent student enrollments (instructor only)
 * @param {string} courseUuid - Course UUID
 * @param {number} limit - Number of recent enrollments to fetch (default 10)
 * @returns {Promise<Array>} List of recent enrollments
 */
export async function getRecentEnrollments(courseUuid, limit = 10) {
  return await prisma.courseEnrollment.findMany({
    where: {
      courseUuid,
      enrollmentStatus: "active"
    },
    include: {
      user: {
        select: {
          userUuid: true,
          firstName: true,
          lastName: true,
          email: true,
          photoUrl: true
        }
      },
      role: {
        select: {
          role: true
        }
      }
    },
    orderBy: {
      enrolledAt: "desc"
    },
    take: limit
  });
}

/**
 * Get user profile by UUID
 * @param {string} userUuid - User UUID
 * @returns {Promise<Object>} User profile information
 */
export async function getUserProfile(userUuid) {
  return await prisma.user.findUnique({
    where: { userUuid },
    include: {
      staff: true,
      courseEnrollments: {
        where: {
          enrollmentStatus: "active"
        },
        include: {
          course: {
            select: {
              courseUuid: true,
              courseCode: true,
              courseName: true
            }
          },
          role: {
            select: {
              role: true
            }
          }
        }
      },
      teamMemberships: {
        where: {
          leftAt: null
        },
        include: {
          team: {
            select: {
              teamUuid: true,
              teamName: true,
              courseUuid: true
            }
          }
        }
      }
    }
  });
}

/**
 * Get course roster with pagination and filtering
 * @param {string} courseUuid - Course UUID
 * @param {number} page - Page number (1-indexed)
 * @param {number} limit - Items per page
 * @param {string} filter - Role filter ("all", "student", "instructor", "ta")
 * @returns {Promise<Object>} Paginated roster data with counts
 */
export async function getCourseRoster(courseUuid, page = 1, limit = 20, filter = "all") {
  const whereClause = {
    courseUuid,
    enrollmentStatus: "active"
  };

  if (filter !== "all") {
    // Map filter values to actual database role names
    const roleMap = {
      "student": "Student",
      "instructor": "Professor",
      "ta": "TA"
    };

    const roleName = roleMap[filter.toLowerCase()] || filter;

    whereClause.role = {
      role: roleName
    };
  }

  // Get all enrollments for this course
  const allEnrollments = await prisma.courseEnrollment.findMany({
    where: whereClause,
    include: {
      user: {
        select: {
          userUuid: true,
          firstName: true,
          lastName: true,
          email: true,
          photoUrl: true,
          pronouns: true
        }
      },
      role: {
        select: {
          role: true
        }
      }
    },
    orderBy: [
      { user: { lastName: "asc" } },
      { user: { firstName: "asc" } }
    ]
  });

  // Group enrollments by user and combine roles
  const userMap = new Map();
  allEnrollments.forEach(enrollment => {
    const userUuid = enrollment.user.userUuid;
    if (userMap.has(userUuid)) {
      // User already exists, add role to their roles array
      userMap.get(userUuid).roles.push(enrollment.role.role);
    } else {
      // New user, create entry with roles array
      userMap.set(userUuid, {
        user: enrollment.user,
        roles: [enrollment.role.role]
      });
    }
  });

  // Convert map to array
  const uniqueUsers = Array.from(userMap.values());

  // Sort users by role priority (Professor > TA > Student) then by name
  const rolePriority = {
    "Professor": 1,
    "TA": 2,
    "Student": 3,
    "Team Leader": 3 // Team Leader has same priority as Student
  };

  uniqueUsers.sort((a, b) => {
    // Get minimum role priority for each user (in case they have multiple roles)
    const aPriority = Math.min(...a.roles.map(role => rolePriority[role] || 999));
    const bPriority = Math.min(...b.roles.map(role => rolePriority[role] || 999));

    // First sort by role priority
    if (aPriority !== bPriority) {
      return aPriority - bPriority;
    }

    // Then sort by last name
    const lastNameCompare = a.user.lastName.localeCompare(b.user.lastName);
    if (lastNameCompare !== 0) {
      return lastNameCompare;
    }

    // Finally sort by first name
    return a.user.firstName.localeCompare(b.user.firstName);
  });

  // Apply pagination to unique users
  const total = uniqueUsers.length;
  const skip = (page - 1) * limit;
  const paginatedUsers = uniqueUsers.slice(skip, skip + limit);

  // Convert back to enrollment format for DTO compatibility
  const enrollments = paginatedUsers.map(item => ({
    user: item.user,
    role: {
      role: item.roles.join(", ") // Combine roles with comma
    }
  }));

  return {
    enrollments,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit)
  };
}

/**
 * Get detailed team profile information
 * @param {string} teamUuid - Team UUID
 * @returns {Promise<Object>} Team profile including members and status
 */
export async function getTeamProfile(teamUuid) {
  return await prisma.team.findUnique({
    where: { teamUuid },
    include: {
      course: {
        select: {
          courseUuid: true,
          courseCode: true,
          courseName: true
        }
      },
      teamTa: {
        select: {
          userUuid: true,
          firstName: true,
          lastName: true,
          email: true,
          photoUrl: true
        }
      },
      members: {
        where: {
          leftAt: null
        },
        include: {
          user: {
            select: {
              userUuid: true,
              firstName: true,
              lastName: true,
              email: true,
              photoUrl: true,
              pronouns: true,
              githubUsername: true
            }
          }
        },
        orderBy: {
          user: {
            lastName: "asc"
          }
        }
      },
      _count: {
        select: {
          standups: true
        }
      }
    }
  });
}

/**
 * Get paginated list of teams/groups for a course
 * @param {string} courseUuid - Course UUID
 * @param {number} page - Page number (1-indexed)
 * @param {number} limit - Items per page
 * @param {string} userUuid - Optional user UUID to filter to only user's teams (for students)
 * @returns {Promise<Object>} Paginated team list with counts
 */
export async function getCourseTeams(courseUuid, page = 1, limit = 20, userUuid = null) {
  const skip = (page - 1) * limit;

  // Build where clause
  const whereClause = { courseUuid };

  // If userUuid provided (student), filter to only teams the user is a member of
  if (userUuid) {
    whereClause.members = {
      some: {
        userUuid,
        leftAt: null
      }
    };
  }

  const [teams, total] = await Promise.all([
    prisma.team.findMany({
      where: whereClause,
      include: {
        teamTa: {
          select: {
            userUuid: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        _count: {
          select: {
            members: {
              where: {
                leftAt: null
              }
            }
          }
        }
      },
      orderBy: {
        teamName: "asc"
      },
      skip,
      take: limit
    }),
    prisma.team.count({
      where: whereClause
    })
  ]);

  return {
    teams,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit)
  };
}

/**
 * Check if a user is enrolled in a course
 * @param {string} userUuid - User UUID
 * @param {string} courseUuid - Course UUID
 * @returns {Promise<boolean>} True if user is enrolled
 */
export async function checkCourseEnrollment(userUuid, courseUuid) {
  const enrollment = await prisma.courseEnrollment.findFirst({
    where: {
      userUuid,
      courseUuid,
      enrollmentStatus: "active"
    }
  });
  return !!enrollment;
}

/**
 * Update user information by UUID
 * @param {string} userUuid - User UUID to update
 * @param {Object} userData - User data to update
 * @returns {Promise<Object>} Updated user object
 */
export async function updateUser(userUuid, userData) {
  const updatedUser = await prisma.user.update({
    where: { userUuid: userUuid },
    data: userData
  });

  return updatedUser;
}

/**
 * Update staff information by user UUID
 * @param {string} userUuid - User UUID to update staff info for
 * @param {Object} staffData - Staff data to update (officeLocation, researchInterest, personalWebsite)
 * @returns {Promise<Object>} Updated staff object
 */
export async function updateStaff(userUuid, staffData) {
  // Check if staff record exists
  const existingStaff = await prisma.staff.findUnique({
    where: { userUuid: userUuid }
  });

  if (!existingStaff) {
    throw new Error("Staff record not found for this user");
  }

  const updatedStaff = await prisma.staff.update({
    where: { userUuid: userUuid },
    data: staffData
  });

  return updatedStaff;
}

/**
 * Update course links by course UUID
 * @param {string} courseUuid - Course UUID
 * @param {Object} linksData - Links data to update (syllabusUrl, canvasUrl)
 * @returns {Promise<Object>} Updated course object
 */
export async function updateCourseLinks(courseUuid, linksData) {
  const updatedCourse = await prisma.course.update({
    where: { courseUuid: courseUuid },
    data: {
      syllabusUrl: linksData.syllabusUrl,
      canvasUrl: linksData.canvasUrl
    }
  });

  return updatedCourse;
}

/**
 * Get user's role in a specific course
 * @param {string} userUuid - User UUID
 * @param {string} courseUuid - Course UUID
 * @returns {Promise<string|null>} Role name or null if not enrolled
 */
export async function getUserRoleInCourse(userUuid, courseUuid) {
  const enrollment = await prisma.courseEnrollment.findFirst({
    where: {
      userUuid,
      courseUuid,
      enrollmentStatus: "active"
    },
    include: {
      role: true
    },
    orderBy: {
      role: {
        role: "asc"
      }
    }
  });

  return enrollment ? enrollment.role.role : null;
}

/**
 * Update team links by team UUID
 * @param {string} teamUuid - Team UUID
 * @param {Object} linksData - Links data to update (teamPageUrl, repoUrl)
 * @returns {Promise<Object>} Updated team object
 */
export async function updateTeamLinks(teamUuid, linksData) {
  // Always update both fields explicitly (even if null, to clear old values)
  const updatedTeam = await prisma.team.update({
    where: { teamUuid: teamUuid },
    data: {
      teamPageUrl: linksData.teamPageUrl,
      repoUrl: linksData.repoUrl
    }
  });

  return updatedTeam;
}

/**
 * Check if a user is a Team Leader for a specific team
 * User must be: 1) a member of the team, 2) have "Team Leader" role in the course
 * @param {string} userUuid - User UUID
 * @param {string} teamUuid - Team UUID
 * @returns {Promise<boolean>} True if user is team leader
 */
export async function checkTeamLeaderRole(userUuid, teamUuid) {
  // First check if user is a member of the team
  const team = await prisma.team.findUnique({
    where: { teamUuid },
    include: {
      course: true
    }
  });

  if (!team) {
    return false;
  }

  // Check team membership
  const isMember = await prisma.teamMember.findFirst({
    where: {
      userUuid,
      teamUuid,
      leftAt: null
    }
  });

  if (!isMember) {
    return false;
  }

  // Check if user has Team Leader role in this course
  const enrollment = await prisma.courseEnrollment.findFirst({
    where: {
      userUuid,
      courseUuid: team.courseUuid,
      enrollmentStatus: "active",
      role: { role: "Team Leader" }
    }
  });

  return !!enrollment;
}













