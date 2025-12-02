/**
 * @module course/service
 * Course Service
 *
 * Business logic layer for course operations.
 */
import * as courseRepository from "../repositories/courseRepository.js";
import * as courseDTO from "../dtos/courseDto.js";
import * as userContextRepository from "../repositories/userContextRepository.js";

/**
 * Get all courses for a user
 * @param {*} req Request object with authenticated user in session
 * @param {*} res Response object
 * @returns Response with list of courses
 */
async function getUserCourses(req, res) {
  try {
    const userId = req.session.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "Not authenticated"
      });
    }

    const courses = await courseRepository.getCoursesWithDetailsByUserId(userId);

    res.status(200).json({
      success: true,
      courses: courses
    });
  } catch {
    res.status(500).json({
      success: false,
      error: "Failed to fetch courses"
    });
  }
}

/**
<<<<<<< HEAD
 * Get available terms (current and next term)
 * @param {*} req Request object
 * @param {*} res Response object
 */
async function getAvailableTerms(req, res) {
  try {
    const userId = req.session.user?.id;
=======
 *
 * @param {Object} req
 * @param {Object} res
 * @returns {Object}  200 - Course object
 * @returns {Object}  400 - Missing course UUID parameter
 * @returns {Object}  401 - Not authenticated
 * @returns {Object}  403 - Not authorized to access this course
 * @returns {Object}  404 - Course not found
 * @returns {Object}  500 - Failed to fetch course
 */
async function getCourseByUUID(req, res) {
  try {
    const userId = req.session.user?.id;
    const courseUUID = req.params.courseUUID;
>>>>>>> 2c9930a (Formatting for frontend requests)

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "Not authenticated"
      });
    }

<<<<<<< HEAD
    const terms = await courseRepository.getAllActiveTerms();

    res.status(200).json({
      success: true,
      terms: terms
    });
  } catch {
    res.status(500).json({
      success: false,
      error: "Failed to fetch terms"
    });
  }
}

/**
 * Get course details for editing
 * @param {*} req Request object with courseUuid param
 * @param {*} res Response object
 */
async function getCourseForEdit(req, res) {
  try {
    const userId = req.session.user?.id;
    const courseUuid = req.params.courseUuid;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "Not authenticated"
      });
    }

    // Check if user is professor for this course
    const isProfessor = await courseRepository.isUserCourseProfessor(userId, courseUuid);

    if (!isProfessor) {
      return res.status(403).json({
        success: false,
        error: "Not authorized to edit this course"
      });
    }

    const course = await courseRepository.getCourseWithVerificationCodes(courseUuid);
=======
    const userContext = await userContextRepository.getUserContext(userId);
    const isEnrolled = userContext.enrollments.some(
      enrollment => enrollment.course.courseUuid === courseUUID
    );
    if (!isEnrolled) {
      return res.status(403).json({
        success: false,
        error: "Not authorized to access this course"
      });
    }

    const course = await courseRepository.getCourseByUuid(courseUUID);
>>>>>>> 2c9930a (Formatting for frontend requests)

    if (!course) {
      return res.status(404).json({
        success: false,
        error: "Course not found"
      });
    }

    res.status(200).json({
      success: true,
<<<<<<< HEAD
      course: course
=======
      course: courseDTO.toCourseDTO(course)
>>>>>>> 2c9930a (Formatting for frontend requests)
    });
  } catch {
    res.status(500).json({
      success: false,
<<<<<<< HEAD
      error: "Failed to fetch course data"
=======
      error: "Failed to fetch course"
>>>>>>> 2c9930a (Formatting for frontend requests)
    });
  }
}

async function getUsersByCourseUUID(req, res) {
  try {
    const userId = req.session.user?.id;
    const courseUUID = req.params.courseUUID;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "Not authenticated"
      });
    }

    // Check if user is a professor
    const userStatus = await userRepository.getUserStatusByUuid(userId);

    if (!userStatus.isProf) {
      return res.status(403).json({
        success: false,
        error: "Only professors can create courses"
      });
    }

    const {
      courseCode,
      courseName,
      termUuid,
      description,
      taCode,
      tutorCode,
      studentCode,
      syllabusUrl,
      canvasUrl
    } = req.body;

    // Validate course data
    try {
      await courseValidator.validateCourseData(req.body);
    } catch (validationError) {
      return res.status(400).json({
        success: false,
        error: validationError.message
      });
    }

    // Check if this professor already has a course with this code in this term
    const existingCourse = await courseRepository.findCourseByCodeTermAndProfessor(
      courseCode,
      termUuid,
      userId
    );

    if (existingCourse) {
      return res.status(409).json({
        success: false,
        error: "You already have a course with this code for the selected term"
      });
    }

    // Check if verification codes are unique
    const codesAreUnique = await verificationCodeRepository.areVerificationCodesUnique([
      taCode,
      tutorCode,
      studentCode
    ]);

    if (!codesAreUnique) {
      return res.status(409).json({
        success: false,
        error: "One or more verification codes are already in use. Please generate new codes."
      });
    }

    // Create the course with verification codes
    const newCourse = await courseRepository.createCourseWithVerificationCodes({
      courseCode,
      courseName,
      termUuid,
      description,
      syllabusUrl,
      canvasUrl,
      taCode,
      tutorCode,
      studentCode,
      instructorId: userId
    });

    res.status(201).json({
      success: true,
      course: newCourse
    });
  } catch {
    res.status(500).json({
      success: false,
      error: "Failed to create course"
    });
  }
}

/**
 * Update an existing course
 * @param {*} req Request object with course data in body and courseUuid param
 * @param {*} res Response object
 */
async function updateCourse(req, res) {
  try {
    const userId = req.session.user?.id;
    const courseUuid = req.params.courseUuid;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "Not authenticated"
      });
    }

    // Check if user is professor for this course
    const isProfessor = await courseRepository.isUserCourseProfessor(userId, courseUuid);

    if (!isProfessor) {
      return res.status(403).json({
        success: false,
        error: "Not authorized to edit this course"
      });
    }

    const {
      courseCode,
      courseName,
      termUuid,
      description,
      taCode,
      tutorCode,
      studentCode,
      syllabusUrl,
      canvasUrl
    } = req.body;

    // Validate course data
    try {
      await courseValidator.validateCourseData(req.body);
    } catch (validationError) {
      return res.status(400).json({
        success: false,
        error: validationError.message
      });
    }

    // Check if verification codes are unique (excluding current course codes)
    const codesAreUnique = await verificationCodeRepository.areVerificationCodesUniqueForUpdate(
      courseUuid,
      [taCode, tutorCode, studentCode]
    );

    if (!codesAreUnique) {
      return res.status(409).json({
        success: false,
        error: "One or more verification codes are already in use. Please generate new codes."
      });
    }

    // Update the course with verification codes
    const updatedCourse = await courseRepository.updateCourseWithVerificationCodes(
      courseUuid,
      {
        courseCode,
        courseName,
        termUuid,
        description,
        syllabusUrl,
        canvasUrl,
        taCode,
        tutorCode,
        studentCode
      }
    );

    res.status(200).json({
      success: true,
      course: updatedCourse
=======
    const userContext = await userContextRepository.getUserContext(userId);
    const isEnrolled = userContext.enrollments.some(
      enrollment => enrollment.course.courseUuid === courseUUID
    );
    if (!isEnrolled) {
      return res.status(403).json({
        success: false,
        error: "Not authorized to access this course"
      });
    }

    const users = await courseRepository.getUsersByCourseUuid(courseUUID);

    res.status(200).json({
      success: true,
<<<<<<< HEAD
      data: courseDTO.toCourseWithUsersDTO(users)  
>>>>>>> 2c9930a (Formatting for frontend requests)
=======
      data: users
>>>>>>> 7043af7 (frontend integrations)
    });
  } catch {
    res.status(500).json({
      success: false,
<<<<<<< HEAD
      error: "Failed to update course"
=======
      error: "Failed to fetch users for course"
>>>>>>> 2c9930a (Formatting for frontend requests)
    });
  }
}

<<<<<<< HEAD
/**
 * Remove user from course (student leaving a course)
 * @param {*} req Request object with courseUuid param
 * @param {*} res Response object
 */
async function removeUserFromCourse(req, res) {
  try {
    const userId = req.session.user?.id;
    const courseUuid = req.params.courseUuid;
=======
async function getTeamsByCourseUUID(req, res) {
  try {
    const userId = req.session.user?.id;
    const courseUUID = req.params.courseUUID;
>>>>>>> 2c9930a (Formatting for frontend requests)

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "Not authenticated"
      });
    }

<<<<<<< HEAD
    // Remove the user from the course
    const result = await courseRepository.removeUserFromCourse(userId, courseUuid);

    if (result.count === 0) {
      return res.status(404).json({
        success: false,
        error: "Enrollment not found"
=======
    const userContext = await userContextRepository.getUserContext(userId);
    const isEnrolled = userContext.enrollments.some(
      enrollment => enrollment.course.courseUuid === courseUUID
    );
    if (!isEnrolled) {
      return res.status(403).json({
        success: false,
        error: "Not authorized to access this course"
      });
    }

    const course = await courseRepository.getCourseByUuid(courseUUID);

    if (!course) {
      return res.status(404).json({
        success: false,
        error: "Course not found"
>>>>>>> 2c9930a (Formatting for frontend requests)
      });
    }

    // Format teams with members
    const teams = (course.teams || []).map(team => {
      // Get team members if they exist
      const members = team.members ? team.members
        .filter(member => member.leftAt === null)
        .map(member => ({
          userUuid: member.userUuid,
          firstName: member.user?.firstName || null,
          lastName: member.user?.lastName || null,
          email: member.user?.email || null
        })) : [];

      return {
        teamUuid: team.teamUuid,
        teamName: team.teamName,
        members: members
      };
    });

    res.status(200).json({
      success: true,
<<<<<<< HEAD
<<<<<<< HEAD
      message: "Successfully removed from course"
=======
      data: courseDTO.toCourseWithTeamsDTO(course.teams)  
>>>>>>> 2c9930a (Formatting for frontend requests)
=======
      data: teams
>>>>>>> 7043af7 (frontend integrations)
    });
  } catch {
    res.status(500).json({
      success: false,
<<<<<<< HEAD
      error: "Failed to remove from course"
=======
      error: "Failed to fetch teams for course"
>>>>>>> 2c9930a (Formatting for frontend requests)
    });
  }
}

<<<<<<< HEAD
export {
  getUserCourses,
  getAvailableTerms,
  getCourseForEdit,
  createCourse,
  updateCourse,
  removeUserFromCourse
};
=======
export { getUserCourses, getUsersByCourseUUID, getTeamsByCourseUUID, getCourseByUUID };
>>>>>>> 2c9930a (Formatting for frontend requests)
