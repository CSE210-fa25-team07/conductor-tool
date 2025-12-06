/**
 * Verification code repository for managing verification codes in the database
 *
 * @module verificationCode/repository
 */

import { getPrisma } from "../utils/db.js";

const prisma = getPrisma();

/**
 * Find an active course by its verification code
 * @param {string} code - Verification code
 * @returns {Promise<Object>} - Course object if found, otherwise null
 */
async function findCourseByVerificationCode(code) {
  return await prisma.verificationCode.findUnique({
    where: { veriCode: code, isActive: true }
  });
}

/**
 * Check if verification codes are unique (not already used)
 * @param {Array<string>} codes - Array of verification codes to check
 * @returns {Promise<boolean>} True if all codes are unique
 */
async function areVerificationCodesUnique(codes) {
  const existingCodes = await prisma.verificationCode.findMany({
    where: {
      veriCode: {
        in: codes
      },
      isActive: true
    }
  });

  return existingCodes.length === 0;
}

/**
 * Check if verification codes are unique for update (excluding current course)
 * @param {string} courseUuid - The UUID of the course being updated
 * @param {Array<string>} codes - Array of verification codes to check
 * @returns {Promise<boolean>} True if all codes are unique
 */
async function areVerificationCodesUniqueForUpdate(courseUuid, codes) {
  const existingCodes = await prisma.verificationCode.findMany({
    where: {
      veriCode: {
        in: codes
      },
      isActive: true,
      courseUuid: {
        not: courseUuid
      }
    }
  });

  return existingCodes.length === 0;
}

/**
 * Get verification codes for a course with role information
 * @param {string} courseUuid - The UUID of the course
 * @returns {Promise<Object>} Object containing TA, Tutor, and Student codes
 */
async function getVerificationCodesByCourseUuid(courseUuid) {
  const verificationCodes = await prisma.verificationCode.findMany({
    where: {
      courseUuid: courseUuid
    },
    include: {
      role: true
    }
  });

  // Map verification codes to their roles
  const taCode = verificationCodes.find(vc => vc.role.role === "TA")?.veriCode || "";
  const tutorCode = verificationCodes.find(vc => vc.role.role === "Tutor")?.veriCode || "";
  const studentCode = verificationCodes.find(vc => vc.role.role === "Student")?.veriCode || "";

  return {
    taCode,
    tutorCode,
    studentCode
  };
}

/**
 * Create verification codes for a course
 * @param {Object} tx - Prisma transaction client
 * @param {string} courseUuid - The UUID of the course
 * @param {Object} codes - Object containing taCode, tutorCode, and studentCode
 * @returns {Promise<void>}
 */
async function createVerificationCodes(tx, courseUuid, codes) {
  const { taCode, tutorCode, studentCode } = codes;

  // Get role UUIDs
  const roles = await tx.role.findMany({
    where: {
      role: {
        in: ["TA", "Tutor", "Student"]
      }
    }
  });

  const taRole = roles.find(r => r.role === "TA");
  const tutorRole = roles.find(r => r.role === "Tutor");
  const studentRole = roles.find(r => r.role === "Student");

  // Create verification codes
  await tx.verificationCode.createMany({
    data: [
      {
        courseUuid: courseUuid,
        roleUuid: taRole.roleUuid,
        veriCode: taCode,
        isActive: true
      },
      {
        courseUuid: courseUuid,
        roleUuid: tutorRole.roleUuid,
        veriCode: tutorCode,
        isActive: true
      },
      {
        courseUuid: courseUuid,
        roleUuid: studentRole.roleUuid,
        veriCode: studentCode,
        isActive: true
      }
    ]
  });
}

/**
 * Update verification codes for a course
 * @param {Object} tx - Prisma transaction client
 * @param {string} courseUuid - The UUID of the course
 * @param {Object} codes - Object containing taCode, tutorCode, and studentCode
 * @returns {Promise<void>}
 */
async function updateVerificationCodes(tx, courseUuid, codes) {
  const { taCode, tutorCode, studentCode } = codes;

  // Get role UUIDs
  const roles = await tx.role.findMany({
    where: {
      role: {
        in: ["TA", "Tutor", "Student"]
      }
    }
  });

  const taRole = roles.find(r => r.role === "TA");
  const tutorRole = roles.find(r => r.role === "Tutor");
  const studentRole = roles.find(r => r.role === "Student");

  // Update verification codes (upsert to handle new codes)
  await tx.verificationCode.upsert({
    where: {
      // Prisma requires snake_case for composite unique constraints
      // eslint-disable-next-line camelcase
      courseUuid_roleUuid: {
        courseUuid: courseUuid,
        roleUuid: taRole.roleUuid
      }
    },
    update: {
      veriCode: taCode,
      isActive: true
    },
    create: {
      courseUuid: courseUuid,
      roleUuid: taRole.roleUuid,
      veriCode: taCode,
      isActive: true
    }
  });

  await tx.verificationCode.upsert({
    where: {
      // Prisma requires snake_case for composite unique constraints
      // eslint-disable-next-line camelcase
      courseUuid_roleUuid: {
        courseUuid: courseUuid,
        roleUuid: tutorRole.roleUuid
      }
    },
    update: {
      veriCode: tutorCode,
      isActive: true
    },
    create: {
      courseUuid: courseUuid,
      roleUuid: tutorRole.roleUuid,
      veriCode: tutorCode,
      isActive: true
    }
  });

  await tx.verificationCode.upsert({
    where: {
      // Prisma requires snake_case for composite unique constraints
      // eslint-disable-next-line camelcase
      courseUuid_roleUuid: {
        courseUuid: courseUuid,
        roleUuid: studentRole.roleUuid
      }
    },
    update: {
      veriCode: studentCode,
      isActive: true
    },
    create: {
      courseUuid: courseUuid,
      roleUuid: studentRole.roleUuid,
      veriCode: studentCode,
      isActive: true
    }
  });
}

export {
  findCourseByVerificationCode,
  areVerificationCodesUnique,
  areVerificationCodesUniqueForUpdate,
  getVerificationCodesByCourseUuid,
  createVerificationCodes,
  updateVerificationCodes
};
