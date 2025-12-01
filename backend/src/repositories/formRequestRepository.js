/**
 * Form Request Repository
 * Handles data operations for access request forms.
 * @module formRequest/repository
 */

import { getPrisma } from "../utils/db.js";

const prisma = getPrisma();

/**
 * Create a new form request entry in the database using the provided information. Fails if a request with the same email already exists.
 * @param {string} firstName 
 * @param {string} lastName 
 * @param {string} email 
 * @param {string} relatedInstitution 
 * @param {string} verificationCode 
 * @returns {Promise<Object|null>} Created form request or null if failed
 */
async function createFormRequest(firstName, lastName, email, relatedInstitution, verificationCode) {
  try {
    return await prisma.formRequest.create({
      data: {
        firstName,
        lastName,
        email,
        relatedInstitution,
        verificationCode
      }
    });
  } catch {
    return null;
  }
}

export {
  createFormRequest
};
