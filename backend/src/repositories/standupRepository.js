/**
 * @module standup/repository
 */

import { getPrisma } from "../utils/db.js";

const prisma = getPrisma();

async function createStandup(data) {
  return await prisma.standup.create({
    data: {
      userUuid: data.userUuid,
      teamUuid: data.teamUuid,
      courseUuid: data.courseUuid,
      dateSubmitted: data.dateSubmitted || new Date(),
      whatDone: data.whatDone,
      githubActivities: data.githubActivities || null,
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
  const where = {
    userUuid,
    course: {
      term: {
        isActive: true
      }
    }
  };

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
      const endDate = new Date(filters.endDate);
      endDate.setDate(endDate.getDate() + 1);
      where.dateSubmitted.lt = endDate;
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
      githubActivities: data.githubActivities,
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
  // Verify team's course is in an active term (same pattern as getCourseStandups)
  const team = await prisma.team.findFirst({
    where: {
      teamUuid,
      course: {
        term: {
          isActive: true
        }
      }
    }
  });

  if (!team) {
    return [];
  }

  // Query standups with simple filter (no nested relation filter)
  const where = { teamUuid };

  if (filters.startDate || filters.endDate) {
    where.dateSubmitted = {};
    if (filters.startDate) {
      where.dateSubmitted.gte = new Date(filters.startDate);
    }
    if (filters.endDate) {
      const endDate = new Date(filters.endDate);
      endDate.setDate(endDate.getDate() + 1);
      where.dateSubmitted.lt = endDate;
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

async function getCourseStandups(courseUuid, filters = {}) {
  // Verify course is in an active term
  const course = await prisma.course.findFirst({
    where: {
      courseUuid,
      term: {
        isActive: true
      }
    }
  });

  if (!course) {
    return [];
  }

  // Get all teams in the course
  const teams = await prisma.team.findMany({
    where: { courseUuid },
    select: { teamUuid: true }
  });

  const teamUuids = teams.map(t => t.teamUuid);

  const where = { teamUuid: { in: teamUuids } };

  if (filters.startDate || filters.endDate) {
    where.dateSubmitted = {};
    if (filters.startDate) {
      where.dateSubmitted.gte = new Date(filters.startDate);
    }
    if (filters.endDate) {
      const endDate = new Date(filters.endDate);
      endDate.setDate(endDate.getDate() + 1);
      where.dateSubmitted.lt = endDate;
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

/**
 * Get TA email for a team
 * @param {string} teamUuid - Team UUID
 * @returns {Promise<string|null>} TA email or null if no TA assigned
 */
async function getTAEmailByTeam(teamUuid) {
  const team = await prisma.team.findUnique({
    where: { teamUuid },
    include: {
      teamTa: {
        select: { email: true }
      }
    }
  });

  return team?.teamTa?.email || null;
}

export {
  createStandup,
  getUserStandups,
  getStandupById,
  updateStandup,
  deleteStandup,
  getTeamStandups,
  getCourseStandups,
  getTAEmailByTeam
};
