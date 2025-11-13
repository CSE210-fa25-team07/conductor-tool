/** @module google-oauth2 */
import fetch from "node-fetch";
import express from "express";
import "dotenv/config";
import * as userService from "../services/userService.js";

const router = express.Router();
const PORT = 8081;
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = `http://localhost:${PORT}/google/callback`;
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
  const code = req.query.code;

  if (!code) {
    return res.send("Error: no code returned");
  }

  try {
    // Exchange code for tokens
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        "client_id": CLIENT_ID,
        "client_secret": CLIENT_SECRET,
        "redirect_uri": REDIRECT_URI,
        "grant_type": "authorization_code"
      })
    });

    const data = await tokenRes.json();

    // Fetch user profile
    const profileRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${data.access_token}` }
    });
    const profile = await profileRes.json();

    // Store user in session first
    req.session.user = profile;

    // Check if user exists in database
    try {
      const existingUser = await userService.getUserByEmail(profile.email);

      if (existingUser) {
        // Case 1: User already exists -> redirect to dashboard
        return res.redirect("/dashboard");
      }

      // User doesn't exist - check if UCSD email
      const isUCSDEmail = profile.email.endsWith("@ucsd.edu");

      if (isUCSDEmail) {
        // Case 2: New UCSD user -> redirect to verification page
        // They will be added to DB after verification
        return res.redirect("/auth/verification");
      } else {
        // Case 3: Non-UCSD email -> redirect to request form (no DB entry)
        return res.redirect("/auth/request-access");
      }

    } catch {
      return res.redirect("/");
    }

  } catch {
    res.redirect("/");
  }
});

export default router;
