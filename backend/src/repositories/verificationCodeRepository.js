/**
 * Verification code repository for managing verification codes in the database
 *
 * @module verificationCode/repository
 */

import { getPrisma } from "../utils/db.js";

const prisma = getPrisma();

/**
 * Find a course by its verification code
 * @param {string} code - Verification code
 * @returns {Promise<Object>} - Course object if found, otherwise null
 */
async function findCourseByVerificationCode(code) {
  return await prisma.verificationCode.findUnique({
    where: { veriCode: code }
  });
}

export {
  findCourseByVerificationCode
};
