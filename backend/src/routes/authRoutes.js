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

router.get("/verification", (req, res) => {
  res.sendFile(path.join(__dirname, "../../../frontend/html/auth/verification.html"));
});

/**
 * Initiates Google OAuth login by redirecting the user to Google’s OAuth consent screen to authenticate.
 *
 * @name GET /auth/google
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
 * Exchanges the authorization code for tokens, fetches the user"s profile,
 * and stores it in the Express session.
 *
 * Redirects to /dashboard on success, or back to / on failure.
 *
 * @name GET /auth/google/callback
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

    // Store or update user in database
    try {
      const existingUser = await userService.getUserByEmail(profile.email);
      if (!existingUser) {
        // Extract first and last name from profile
        const nameParts = profile.name ? profile.name.split(" ") : ["", ""];
        const firstName = profile.given_name || nameParts[0] || "Unknown";
        const lastName = profile.family_name || nameParts.slice(1).join(" ") || "Unknown";
        
        await userService.addUser({
          firstName,
          lastName,
          email: profile.email
        });
      }
    } catch (error) {
      console.error("Error storing user:", error.message);
      // Continue even if user storage fails
    }

    // Store user in session
    req.session.user = profile;
    res.redirect("/auth/verification");
  } catch {
    res.redirect("/");
  }
});

/**
 * Create a new user (signup endpoint)
 * 
 * @name POST /auth/signup
 * @param {Object} req.body - User data with firstName, lastName, and email
 * @returns {Object} 201 - Created user object
 * @returns {Object} 400 - Validation error
 * @returns {Object} 409 - User already exists
 */
router.post("/signup", express.json(), async (req, res) => {
  try {
    const { firstName, lastName, email } = req.body;
    
    const newUser = await userService.addUser({ firstName, lastName, email });
    
    res.status(201).json({
      success: true,
      message: "User created successfully",
      user: newUser
    });
  } catch (error) {
    if (error.message.includes("already exists")) {
      return res.status(409).json({
        success: false,
        error: error.message
      });
    }
    
    res.status(400).json({
      success: false,
      error: error.message
    });
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

export default router;
