/**
 * @module google-oauth2/service
 * Google OAuth Service
 *
 * Business logic layer for Google OAuth.
 */
import fetch from "node-fetch";
import * as userService from "./userService.js";
import "dotenv/config";

const PORT = 8081;
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = `http://localhost:${PORT}/google/callback`;

/**
 * Exchange authorization code for tokens and fetch user profile
 * @param {*} req Request object that contains authorization code
 * @param {*} res Response object
 * @returns Response redirect (to dashboard, verification, or request access if successful; to home on failure)
 */
async function exchangeCodeForTokens(req, res) {
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
        req.session.user = {id: existingUser.userUuid, email: existingUser.email, name: profile.name};
        return res.redirect("/dashboard");
      }

      req.session.user.id = null;
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
}

export {
  exchangeCodeForTokens
};
