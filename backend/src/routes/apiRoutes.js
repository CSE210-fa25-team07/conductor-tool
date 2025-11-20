/**
 * Routes endpoints for all features' APIs
 * APIs are wired from /v1/api/
 */
import express from "express";
import directoryApis from "./api/directoryApi.js";
import standupApis from "./api/standupApi.js";
import attendanceApis from "./api/attendanceApi.js";
import authApis from "./api/authApi.js";

const router = express.Router();

router.use("/directory", directoryApis);

router.use("/standups", standupApis);

router.use("/attendance", attendanceApis);

router.use("/auth", authApis);

export default router;
