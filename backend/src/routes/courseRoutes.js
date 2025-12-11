/**
 * Routes endpoints for all course-related web pages
 * Routes are dynamically wired from /courses/:courseId/
*/
import express from "express";
import directoryRoutes from "./web/directoryRoutes.js";
import standupRoutes from "./web/standupRoutes.js";
import attendanceRoutes from "./web/attendanceRoutes.js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
export const __dirname = path.dirname(__filename);

const router = express.Router({ mergeParams: true });

router.use("/:courseId/directory", directoryRoutes);

router.use("/:courseId/standup", standupRoutes);

router.use("/:courseId/attendance", attendanceRoutes);

router.use("/create", (req, res) => {
  res.sendFile(
    path.join(__dirname, "../../../frontend/html/courseConfig/createCourse.html")
  );
});

router.use("/:courseId/edit", (req, res) => {
  res.sendFile(
    path.join(__dirname, "../../../frontend/html/courseConfig/editCourse.html")
  );
});

export default router;
