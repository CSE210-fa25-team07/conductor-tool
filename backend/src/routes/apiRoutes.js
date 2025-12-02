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
import githubApis from "./api/githubApi.js";

const router = express.Router();

// Auth routes don't require session (checking/verifying session)
router.use("/auth", authApis);

// Protected routes - require authenticated session
router.use("/courses", checkApiSession, courseApis);

router.use("/directory", checkApiSession, directoryApis);

router.use("/standups", checkApiSession, standupApis);

router.use("/attendance", checkApiSession, attendanceApis);

router.use("/user-context", checkApiSession, userContextApis);

router.use("/github", checkApiSession, githubApis);

export default router;
