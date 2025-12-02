/**
 * Routes endpoints for all features' APIs
 * APIs are wired from /v1/api/
 */
import express from "express";
import { checkApiSession } from "../utils/auth.js";
import directoryApis from "./api/directoryApi.js";
import standupApis from "./api/standupApi.js";
import attendanceApis from "./api/attendanceApi.js";
import authApis from "./api/authApi.js";
import userContextApis from "./api/userContextApi.js";
import courseApis from "./api/courseApi.js";
import metricsApis from "../metrics/metricsApi.js";
import { excludeFromMetrics } from "../metrics/metricsMiddleware.js";

const router = express.Router();

// Metrics collection middleware
// Tracks all API routes except the metrics endpoints themselves
router.use(excludeFromMetrics([
  /^\/metrics/  // Don't track metrics API endpoints
]));

// Auth routes don't require session (checking/verifying session)
router.use("/auth", authApis);

// Protected routes - require authenticated session
router.use("/courses", checkApiSession, courseApis);

router.use("/directory", checkApiSession, directoryApis);

router.use("/standups", checkApiSession, standupApis);

router.use("/attendance", checkApiSession, attendanceApis);

router.use("/user-context", checkApiSession, userContextApis);

router.use("/metrics", checkApiSession, metricsApis);

export default router;
