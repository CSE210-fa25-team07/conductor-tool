/**
 * User Validator
 *
 * Validates user data and coordinates with the repository.
 */

/**
 * Validate user data
 * @param {Object} userData - User data to validate
 * @throws {Error} If validation fails
 * @status IN USE
 */
async function validateUserData(userData) {
  const { firstName, lastName, email } = userData;

  if (!firstName || typeof firstName !== "string" || firstName.trim().length === 0) {
    throw new Error("First name is required and must be a non-empty string");
  }

  if (!lastName || typeof lastName !== "string" || lastName.trim().length === 0) {
    throw new Error("Last name is required and must be a non-empty string");
  }

  if (!email || typeof email !== "string") {
    throw new Error("Email is required and must be a string");
  }

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new Error("Invalid email format");
  }
}

export {
  validateUserData
};
