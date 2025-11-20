/**
 * @module standup/repository
 */

import { getPrisma } from "../utils/db.js";

const prisma = getPrisma();

/**
 * Get user context including roles, courses, and teams
 * @param {string} userUuid
 * @param {string} [courseUuid]
 * @returns {Promise<Object>}
 */
async function getUserContext(userUuid) {
  const user = await prisma.user.findUnique({
    where: { userUuid },
    include: { staff: true }
  });

  if (!user) {
    throw new Error("User not found");
  }

  const enrollments = await prisma.courseEnrollment.findMany({
    where: {
      userUuid,
      enrollmentStatus: "active",
      course: { term: { isActive: true } }
    },
    include: {
      course: { include: { term: true } },
      role: true
    }
  });

  const teamMemberships = await prisma.teamMember.findMany({
    where: {
      userUuid,
      leftAt: null
    },
    include: {
      team: { include: { course: true } }
    }
  });

  return { user, enrollments, teamMemberships };
}

async function createStandup(data) {
  return await prisma.standup.create({
    data: {
      userUuid: data.userUuid,
      teamUuid: data.teamUuid,
      courseUuid: data.courseUuid,
      dateSubmitted: data.dateSubmitted || new Date(),
      whatDone: data.whatDone,
      whatNext: data.whatNext,
      blockers: data.blockers,
      reflection: data.reflection,
      sentimentScore: data.sentimentScore,
      visibility: data.visibility || "team"
    },
    include: {
      user: { select: { userUuid: true, firstName: true, lastName: true, email: true } },
      team: { select: { teamUuid: true, teamName: true } },
      course: { select: { courseUuid: true, courseCode: true, courseName: true } }
    }
  });
}

async function getUserStandups(userUuid, filters = {}) {
  const where = { userUuid };

  if (filters.courseUuid) {
    where.courseUuid = filters.courseUuid;
  }

  if (filters.teamUuid) {
    where.teamUuid = filters.teamUuid;
  }

  if (filters.startDate || filters.endDate) {
    where.dateSubmitted = {};
    if (filters.startDate) {
      where.dateSubmitted.gte = new Date(filters.startDate);
    }
    if (filters.endDate) {
      where.dateSubmitted.lte = new Date(filters.endDate);
    }
  }

  return await prisma.standup.findMany({
    where,
    include: {
      team: { select: { teamUuid: true, teamName: true } },
      course: { select: { courseUuid: true, courseCode: true, courseName: true } }
    },
    orderBy: { dateSubmitted: "desc" }
  });
}

async function getStandupById(standupUuid) {
  return await prisma.standup.findUnique({
    where: { standupUuid },
    include: {
      user: { select: { userUuid: true, firstName: true, lastName: true, email: true } },
      team: { select: { teamUuid: true, teamName: true } },
      course: { select: { courseUuid: true, courseCode: true, courseName: true } }
    }
  });
}

async function updateStandup(standupUuid, data) {
  return await prisma.standup.update({
    where: { standupUuid },
    data: {
      whatDone: data.whatDone,
      whatNext: data.whatNext,
      blockers: data.blockers,
      reflection: data.reflection,
      sentimentScore: data.sentimentScore,
      visibility: data.visibility,
      updatedAt: new Date()
    },
    include: {
      user: { select: { userUuid: true, firstName: true, lastName: true, email: true } },
      team: { select: { teamUuid: true, teamName: true } },
      course: { select: { courseUuid: true, courseCode: true, courseName: true } }
    }
  });
}

async function deleteStandup(standupUuid) {
  return await prisma.standup.delete({
    where: { standupUuid }
  });
}

async function getTeamStandups(teamUuid, filters = {}) {
  const where = { teamUuid };

  if (filters.startDate || filters.endDate) {
    where.dateSubmitted = {};
    if (filters.startDate) {
      where.dateSubmitted.gte = new Date(filters.startDate);
    }
    if (filters.endDate) {
      where.dateSubmitted.lte = new Date(filters.endDate);
    }
  }

  return await prisma.standup.findMany({
    where,
    include: {
      user: { select: { userUuid: true, firstName: true, lastName: true, email: true } },
      team: { select: { teamUuid: true, teamName: true } },
      course: { select: { courseUuid: true, courseCode: true, courseName: true } }
    },
    orderBy: { dateSubmitted: "desc" }
  });
}

async function checkTeamMembership(userUuid, teamUuid) {
  const membership = await prisma.teamMember.findFirst({
    where: {
      userUuid,
      teamUuid,
      leftAt: null
    }
  });
  return !!membership;
}

async function checkCourseStaffAccess(userUuid, teamUuid) {
  const team = await prisma.team.findUnique({
    where: { teamUuid },
    include: {
      course: {
        include: {
          enrollments: {
            where: {
              userUuid,
              role: { role: { in: ["Professor", "TA"] } }
            }
          }
        }
      }
    }
  });

  return team && team.course.enrollments.length > 0;
}

async function checkCourseStaffRole(userUuid, courseUuid) {
  const enrollment = await prisma.courseEnrollment.findFirst({
    where: {
      userUuid,
      courseUuid,
      role: { role: { in: ["Professor", "TA"] } }
    }
  });
  return !!enrollment;
}

async function getCourseOverview(courseUuid, filters = {}) {
  const course = await prisma.course.findUnique({
    where: { courseUuid },
    select: {
      courseUuid: true,
      courseCode: true,
      courseName: true
    }
  });

  if (!course) {
    throw new Error("Course not found");
  }

  const teams = await prisma.team.findMany({
    where: { courseUuid },
    include: {
      members: {
        where: { leftAt: null },
        select: { userUuid: true }
      }
    }
  });

  const teamsWithStandups = await Promise.all(
    teams.map(async (team) => {
      const where = { teamUuid: team.teamUuid };

      if (filters.startDate || filters.endDate) {
        where.dateSubmitted = {};
        if (filters.startDate) {
          where.dateSubmitted.gte = new Date(filters.startDate);
        }
        if (filters.endDate) {
          where.dateSubmitted.lte = new Date(filters.endDate);
        }
      }

      const latestStandup = await prisma.standup.findFirst({
        where,
        include: {
          user: { select: { userUuid: true, firstName: true, lastName: true, email: true } }
        },
        orderBy: { dateSubmitted: "desc" }
      });

      return {
        teamUuid: team.teamUuid,
        teamName: team.teamName,
        memberCount: team.members.length,
        latestStandup
      };
    })
  );

  return {
    course,
    teams: teamsWithStandups
  };
}

export {
  getUserContext,
  createStandup,
  getUserStandups,
  getStandupById,
  updateStandup,
  deleteStandup,
  getTeamStandups,
  checkTeamMembership,
  checkCourseStaffAccess,
  checkCourseStaffRole,
  getCourseOverview
};
