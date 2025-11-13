/**
 * @module authentication
 */
import "dotenv/config";
import express from "express";
import fetch from "node-fetch";
import path from "path";
import { fileURLToPath } from "url";
import * as userService from "../services/userService.js";

const __filename = fileURLToPath(import.meta.url);
export const __dirname = path.dirname(__filename);

const router = express.Router();
const PORT = 8081;
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = `http://localhost:${PORT}/auth/google/callback`;

/**
 * Serves verification page for new users
 * @name GET /auth/verification
 * @status IN USE
 */
router.get("/verification", (req, res) => {
  res.sendFile(path.join(__dirname, "../../../frontend/html/auth/verification.html"));
});

/**
 * Serves access restriction page for non-UCSD emails
 * @name GET /auth/request-access
 * @status IN USE
 */
router.get("/request-access", (req, res) => {
  res.sendFile(path.join(__dirname, "../../../frontend/html/auth/request-access.html"));
});

/**
 * Request form page
 * @name GET /auth/request-form
 * @status IN USE
 */
router.get("/request-form", (req, res) => {
  res.sendFile(path.join(__dirname, "../../../frontend/html/auth/request-form.html"));
});

/**
 * Initiates Google OAuth login by redirecting the user to Google's OAuth consent screen to authenticate.
 *
 * @name GET /auth/google
 * @status IN USE
 */
router.get("/google", (req, res) => {
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
 * @name GET /auth/google/callback
 * @status IN USE
 */
router.get("/google/callback", async (req, res) => {
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
      
      // // User doesn't exist - check if UCSD email
      // const isUCSDEmail = profile.email.endsWith("@ucsd.edu");
      
      // if (isUCSDEmail) {
      //   // Case 2: New UCSD user -> redirect to verification page
      //   // They will be added to DB after verification
      //   return res.redirect("/auth/verification");
      // } else {
      //   // Case 3: Non-UCSD email -> redirect to request form (no DB entry)
      //   return res.redirect("/auth/request-access");
      // }

      // User doesn't exist -> send everyone to verification page
      return res.redirect("/auth/verification");
      
    } catch (error) {
      console.error("Error processing user:", error.message);
      return res.redirect("/");
    }
    
  } catch {
    res.redirect("/");
  }
});

/**
 * Get a user by email
 * 
 * @name GET /auth/users
 * @param {string} req.query.email - Email address to search for
 * @returns {Object} 200 - User object
 * @returns {Object} 404 - User not found
 * @returns {Object} 400 - Missing email parameter
 * @status NOT IN USE - Debug/testing endpoint for checking if user exists
 */
router.get("/users", async (req, res) => {
  try {
    const { email } = req.query;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        error: "Email query parameter is required"
      });
    }
    
    const user = await userService.getUserByEmail(email);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found"
      });
    }
    
    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get all users
 * 
 * @name GET /auth/users/all
 * @returns {Object} 200 - Array of all users
 * @status NOT IN USE - Debug/testing endpoint (security risk - remove in production)
 */
router.get("/users/all", async (req, res) => {
  try {
    const users = await userService.getAllUsers();
    
    res.status(200).json({
      success: true,
      count: users.length,
      users
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get current session user
 * 
 * @name GET /auth/session
 * @returns {Object} 200 - Current user from session
 * @returns {Object} 401 - Not authenticated
 * @status IN USE - Frontend fetches current user session data
 */
router.get("/session", async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({
        success: false,
        error: "Not authenticated"
      });
    }
    
    // Return user from session
    res.status(200).json({
      success: true,
      user: req.session.user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Verify the logged in user's verification code; if valid, create an
 * account for the new user in the database, or return existing user.
 * 
 * @name POST /auth/verify
 * @param {string} req.body.code - Verification code
 * @returns {Object} 200 - Success, user created
 * @returns {Object} 400 - Invalid code or error
 * @returns {Object} 401 - Not authenticated
 * @status IN USE - Verifies code and creates user in database
 */
router.post("/verify", express.json(), async (req, res) => {
  try {
    // Check if user is logged in
    if (!req.session.user) {
      return res.status(401).json({
        success: false,
        error: "Not authenticated"
      });
    }

    const { code } = req.body;
    const profile = req.session.user;

    // TODO: Implement actual verification code validation
    // For now, accept any non-empty code
    if (!code || code.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: "Verification code is required"
      });
    }

    // Check if user already exists in database
    const existingUser = await userService.getUserByEmail(profile.email);
    if (existingUser) {
      return res.status(200).json({
        success: true,
        message: "User already exists",
        user: existingUser
      });
    }

    // Create user in database
    const nameParts = profile.name ? profile.name.split(" ") : ["", ""];
    const firstName = profile.given_name || nameParts[0] || "Unknown";
    const lastName = profile.family_name || nameParts.slice(1).join(" ") || "Unknown";

    const newUser = await userService.addUser({
      firstName,
      lastName,
      email: profile.email
    });

    res.status(200).json({
      success: true,
      message: "User verified and created successfully",
      user: newUser
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
