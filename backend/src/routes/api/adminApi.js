/**
 * API endpoints for admin operations
 * All routes in this file are protected by checkSystemAdmin middleware
 * @module admin/api
 */
import express from "express";
import * as adminService from "../../services/adminService.js";

const router = express.Router();

/**
 * Add a new user with staff status (admin only)
 *
 * @name POST /v1/api/admin/users
 * @param {string} req.body.firstName - User's first name
 * @param {string} req.body.lastName - User's last name
 * @param {string} req.body.email - User's email address
 * @param {boolean} req.body.isProf - Whether user is a professor
 * @param {boolean} req.body.isSystemAdmin - Whether user is a system admin
 * @returns {Object} 200 - Success with created user
 * @returns {Object} 400 - Validation error or user already exists
 * @returns {Object} 403 - Forbidden (not a system admin)
 * @returns {Object} 500 - Server error
 * @status IN USE - Admin can add users with staff status
 */
router.post("/users", async (req, res) => {
  try {
    const { firstName, lastName, email, isProf, isSystemAdmin } = req.body;

    const newUser = await adminService.addUserWithStaffStatus({
      firstName,
      lastName,
      email,
      isProf,
      isSystemAdmin
    });

    res.status(200).json({
      success: true,
      message: "User created successfully",
      user: {
        userUuid: newUser.userUuid,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName
      }
    });
  } catch (error) {
    // Check if it's a validation error or duplicate user error
    if (error.message.includes("already exists") ||
        error.message.includes("required") ||
        error.message.includes("Invalid")) {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }

    // Other errors are server errors
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get all pending form requests
 *
 * @name GET /v1/api/admin/requests
 * @returns {Object} 200 - Success with list of requests
 * @returns {Object} 403 - Forbidden (not a system admin)
 * @returns {Object} 500 - Server error
 * @status IN USE - Admin can view all pending access requests
 */
router.get("/requests", async (req, res) => {
  try {
    const requests = await adminService.getAllFormRequests();

    res.status(200).json({
      success: true,
      requests
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Approve a form request
 *
 * @name POST /v1/api/admin/requests/:id/approve
 * @param {string} req.params.id - Request UUID
 * @returns {Object} 200 - Success with created user and course info
 * @returns {Object} 400 - Request not found or validation error
 * @returns {Object} 403 - Forbidden (not a system admin)
 * @returns {Object} 500 - Server error
 * @status IN USE - Admin can approve access requests
 */
router.post("/requests/:id/approve", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await adminService.approveFormRequest(id);

    res.status(200).json({
      success: true,
      message: "Request approved successfully",
      user: result.user,
      course: result.course
    });
  } catch (error) {
    if (error.message.includes("not found") ||
        error.message.includes("already exists") ||
        error.message.includes("Invalid")) {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Deny a form request
 *
 * @name DELETE /v1/api/admin/requests/:id
 * @param {string} req.params.id - Request UUID
 * @returns {Object} 200 - Success
 * @returns {Object} 400 - Request not found
 * @returns {Object} 403 - Forbidden (not a system admin)
 * @returns {Object} 500 - Server error
 * @status IN USE - Admin can deny access requests
 */
router.delete("/requests/:id", async (req, res) => {
  try {
    const { id } = req.params;

    await adminService.denyFormRequest(id);

    res.status(200).json({
      success: true,
      message: "Request denied successfully"
    });
  } catch (error) {
    if (error.message.includes("not found")) {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get all users with their staff status
 *
 * @name GET /v1/api/admin/users
 * @returns {Object} 200 - Success with list of all users
 * @returns {Object} 403 - Forbidden (not a system admin)
 * @returns {Object} 500 - Server error
 * @status IN USE - Admin can view all users with their staff status
 */
router.get("/users", async (req, res) => {
  try {
    const users = await adminService.getAllUsersWithStaffStatus();

    res.status(200).json({
      success: true,
      users
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Remove a user from the system
 *
 * @name DELETE /v1/api/admin/users/:id
 * @param {string} req.params.id - User UUID to remove
 * @returns {Object} 200 - Success with deletion result
 * @returns {Object} 400 - Validation error (e.g., trying to remove admin)
 * @returns {Object} 403 - Forbidden (not a system admin)
 * @returns {Object} 500 - Server error
 * @status IN USE - Admin can remove students and professors (not admins)
 */
router.delete("/users/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const requestingUserUuid = req.user.userUuid;

    const result = await adminService.removeUser(id, requestingUserUuid);

    res.status(200).json({
      success: true,
      message: "User removed successfully",
      result
    });
  } catch (error) {
    if (error.message.includes("Cannot remove") ||
        error.message.includes("not found")) {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }

    if (error.message.includes("Only admins")) {
      return res.status(403).json({
        success: false,
        error: error.message
      });
    }

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Promote a professor to admin
 *
 * @name POST /v1/api/admin/users/:id/promote
 * @param {string} req.params.id - User UUID to promote
 * @returns {Object} 200 - Success with updated staff record
 * @returns {Object} 400 - Validation error
 * @returns {Object} 403 - Forbidden (not a system admin)
 * @returns {Object} 500 - Server error
 * @status IN USE - Admin can promote professors to admin
 */
router.post("/users/:id/promote", async (req, res) => {
  try {
    const { id } = req.params;
    const requestingUserUuid = req.user.userUuid;

    const result = await adminService.promoteProfessorToAdmin(id, requestingUserUuid);

    res.status(200).json({
      success: true,
      message: "Professor promoted to admin successfully",
      staff: result
    });
  } catch (error) {
    if (error.message.includes("must be") ||
        error.message.includes("already")) {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }

    if (error.message.includes("Only admins")) {
      return res.status(403).json({
        success: false,
        error: error.message
      });
    }

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Demote an admin to professor (lead admin only)
 *
 * @name POST /v1/api/admin/users/:id/demote
 * @param {string} req.params.id - User UUID to demote
 * @returns {Object} 200 - Success with updated staff record
 * @returns {Object} 400 - Validation error
 * @returns {Object} 403 - Forbidden (not lead admin)
 * @returns {Object} 500 - Server error
 * @status IN USE - Lead admin can demote admins to professors
 */
router.post("/users/:id/demote", async (req, res) => {
  try {
    const { id } = req.params;
    const requestingUserUuid = req.user.userUuid;

    const result = await adminService.demoteAdminToProfessor(id, requestingUserUuid);

    res.status(200).json({
      success: true,
      message: "Admin demoted to professor successfully",
      staff: result
    });
  } catch (error) {
    if (error.message.includes("Only the lead admin")) {
      return res.status(403).json({
        success: false,
        error: error.message
      });
    }

    if (error.message.includes("is not") ||
        error.message.includes("Cannot demote")) {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Transfer lead admin status to another admin (lead admin only)
 *
 * @name POST /v1/api/admin/transfer-lead
 * @param {string} req.body.newLeadAdminUuid - UUID of admin to become lead
 * @returns {Object} 200 - Success with both updated records
 * @returns {Object} 403 - Forbidden (not lead admin)
 * @returns {Object} 500 - Server error
 * @status IN USE - Lead admin can transfer lead status to another admin
 */
router.post("/transfer-lead", async (req, res) => {
  try {
    const { newLeadAdminUuid } = req.body;
    const currentLeadAdminUuid = req.user.userUuid;

    const result = await adminService.transferLeadAdmin(newLeadAdminUuid, currentLeadAdminUuid);

    res.status(200).json({
      success: true,
      message: "Lead admin status transferred successfully",
      result
    });
  } catch (error) {
    if (error.message.includes("Only the lead admin") ||
        error.message.includes("must be") ||
        error.message.includes("already")) {
      return res.status(403).json({
        success: false,
        error: error.message
      });
    }

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
