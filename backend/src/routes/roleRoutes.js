/**
 * Role Routes
 *
 * Defines HTTP routes for role and enrollment endpoints.
 * Maps URLs to controller functions.
 */

import express from "express";
import * as roleController from "../controllers/roleController.js";

const router = express.Router();

// Role endpoints
router.get("/roles", roleController.getAllRoles);

// User enrollment endpoints
router.get("/users/:userId/enrollments", roleController.getUserEnrollments);
router.get("/users/:userId/courses/:courseId/role", roleController.getUserRoleInCourse);

// Course enrollment endpoints
router.get("/courses/:courseId/enrollments", roleController.getCourseEnrollments);

// Current user endpoint
router.get("/auth/me", roleController.getCurrentUser);

export default router;
