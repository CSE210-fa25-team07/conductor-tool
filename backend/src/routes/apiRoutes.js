/**
 * Routes endpoints for all features' APIs
 * APIs are wired from /v1/api/
 */
import express from "express";
import { checkApiSession, checkSystemAdmin } from "../utils/auth.js";
import directoryApis from "./api/directoryApi.js";
import standupApis from "./api/standupApi.js";
import attendanceApis from "./api/attendanceApi.js";
import authApis from "./api/authApi.js";
import userContextApis from "./api/userContextApi.js";
import courseApis from "./api/courseApi.js";
import githubApis from "./api/githubApi.js";
import metricsApis from "../metrics/metricsApi.js";
import adminApis from "./api/adminApi.js";

const router = express.Router();

// Note: Metrics API endpoints are excluded from tracking in metricsMiddleware.js
// to prevent feedback loop (metrics endpoints don't track themselves)

// Auth routes don't require session (checking/verifying session)
router.use("/auth", authApis);

// Protected routes - require authenticated session
router.use("/courses", checkApiSession, courseApis);

router.use("/directory", checkApiSession, directoryApis);

router.use("/standups", checkApiSession, standupApis);

router.use("/attendance", checkApiSession, attendanceApis);

router.use("/user-context", checkApiSession, userContextApis);

router.use("/github", checkApiSession, githubApis);

router.use("/metrics", checkApiSession, metricsApis);

router.use("/admin", checkApiSession, checkSystemAdmin, adminApis);

export default router;
