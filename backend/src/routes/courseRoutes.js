/**
 * Routes endpoints for all course-related pages
 * Routes are dynamically wired from /courses/:courseId/
*/
import express from "express";
import directoryRoutes from "./directoryRoutes.js";
import standupRoutes from "./standupRoutes.js";
import attendanceRoutes from "./attendanceRoutes.js";

const router = express.Router();

router.use("/directory", directoryRoutes);

router.use("/standup", standupRoutes);

router.use("/attendance", attendanceRoutes);

export default router;
