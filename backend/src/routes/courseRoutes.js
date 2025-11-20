/**
 * Routes endpoints for all course-related web pages
 * Routes are dynamically wired from /courses/:courseId/
*/
import express from "express";
import directoryRoutes from "./web/directoryRoutes.js";
import standupRoutes from "./web/standupRoutes.js";
import attendanceRoutes from "./web/attendanceRoutes.js";

const router = express.Router();

router.use("/directory", directoryRoutes);

router.use("/standup", standupRoutes);

router.use("/attendance", attendanceRoutes);

export default router;
