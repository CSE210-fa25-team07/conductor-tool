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

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "Not authenticated"
      });
    }

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
      });
    }

    res.status(200).json({
      success: true,
      course: courseDTO.toCourseDTO(course)
    });
  } catch {
    res.status(500).json({
      success: false,
      error: "Failed to fetch course"
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
      data: users
    });
  } catch {
    res.status(500).json({
      success: false,
      error: "Failed to fetch users for course"
    });
  }
}

async function getTeamsByCourseUUID(req, res) {
  try {
    const userId = req.session.user?.id;
    const courseUUID = req.params.courseUUID;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "Not authenticated"
      });
    }

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
      data: teams
    });
  } catch {
    res.status(500).json({
      success: false,
      error: "Failed to fetch teams for course"
    });
  }
}

export { getUserCourses, getUsersByCourseUUID, getTeamsByCourseUUID, getCourseByUUID };

