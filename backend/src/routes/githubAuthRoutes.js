/**
 * GitHub OAuth Routes
 *
 * Handles GitHub OAuth flow for account linking (not login).
 * Users must already be logged in to connect their GitHub account.
 * @module github-oauth
 */
import express from "express";
import "dotenv/config";
import * as githubAuthService from "../services/githubAuthService.js";
import { checkUserFromSession } from "../utils/auth.js";

const router = express.Router();
const CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const BASE_URL = process.env.BASE_URL || "http://localhost:8081";
const REDIRECT_URI = `${BASE_URL}/github/callback`;

/**
 * Initiates GitHub OAuth flow by redirecting to GitHub's authorization page.
 * User must be logged in first.
 * Accepts optional ?courseUuid= to redirect back to standup page after auth.
 *
 * @name GET /github/auth
 */
router.get("/auth", checkUserFromSession, (req, res) => {
  const courseUuid = req.query.courseUuid || "";

  // Encode user ID and course UUID in state for callback
  const state = JSON.stringify({
    userId: req.session.user.id,
    courseUuid: courseUuid
  });

  /* eslint-disable camelcase */
  const redirectUrl =
    "https://github.com/login/oauth/authorize?" +
    new URLSearchParams({
      client_id: CLIENT_ID,
      redirect_uri: REDIRECT_URI,
      scope: "repo read:user",
      state: Buffer.from(state).toString("base64") // Base64 encode the state
    });
  /* eslint-enable camelcase */
  res.redirect(redirectUrl);
});

/**
 * OAuth callback route for GitHub.
 * Exchanges authorization code for access token and links to user account.
 *
 * @name GET /github/callback
 */
router.get("/callback", checkUserFromSession, async (req, res) => {
  return await githubAuthService.exchangeCodeForTokens(req, res);
});

/**
 * Disconnect GitHub account from user profile.
 *
 * @name POST /github/disconnect
 */
router.post("/disconnect", checkUserFromSession, async (req, res) => {
  return await githubAuthService.disconnectGitHub(req, res);
});

export default router;
