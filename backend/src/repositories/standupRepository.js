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

async function getCourseStandups(courseUuid, filters = {}) {
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

export {
  createStandup,
  getUserStandups,
  getStandupById,
  updateStandup,
  deleteStandup,
  getTeamStandups,
  getCourseStandups
};
