/** @module google-oauth2 */
import express from "express";
import "dotenv/config";
import * as googleService from "../services/googleService.js";

const router = express.Router();
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const BASE_URL = process.env.BASE_URL || "http://localhost:8081";
const REDIRECT_URI = `${BASE_URL}/google/callback`;
/**
 * Initiates Google OAuth login by redirecting the user to Google's OAuth consent screen to authenticate.
 *
 * @name GET /google/auth
 * @status IN USE
 */
router.get("/auth", (req, res) => {
  const redirectUrl =
    "https://accounts.google.com/o/oauth2/v2/auth?" +
    new URLSearchParams({
      "client_id": CLIENT_ID,
      "redirect_uri": REDIRECT_URI,
      "response_type": "code",
      "scope": "openid email profile"
    });
  res.redirect(redirectUrl);
});

/**
 * OAuth callback route for Google login.
 *
 * Handles the redirect from Google after the user authenticates.
 * Exchanges the authorization code for tokens, fetches the user's profile,
 * and stores it in the Express session.
 *
 * Redirects to /dashboard if the user exists, or to /auth/verification if new.
 *
 * @name GET /google/callback
 * @status IN USE
 */
router.get("/callback", async (req, res) => {
  return await googleService.exchangeCodeForTokens(req, res);
});

export default router;
