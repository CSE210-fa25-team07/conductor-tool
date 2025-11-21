/**
 * @module userContext/repository
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

export {
  getUserContext
};
