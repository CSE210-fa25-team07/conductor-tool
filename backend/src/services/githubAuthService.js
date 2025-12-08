/**
 * GitHub OAuth Service
 *
 * Business logic for GitHub OAuth token exchange and account linking.
 * @module github-oauth/service
 */
import fetch from "node-fetch";
import * as userRepository from "../repositories/userRepository.js";
import "dotenv/config";

const PORT = 8081;
const CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;
const REDIRECT_URI = `http://localhost:${PORT}/github/callback`;

/**
 * Exchange authorization code for access token and link GitHub to user account
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>} Redirects to standup page or error page
 */
async function exchangeCodeForTokens(req, res) {
  const code = req.query.code;
  const stateParam = req.query.state;

  if (!code) {
    return res.redirect("/dashboard?error=github_no_code");
  }

  // Parse state (base64 encoded JSON with userId and courseUuid)
  let stateData = {};
  try {
    stateData = JSON.parse(Buffer.from(stateParam, "base64").toString());
  } catch {
    return res.redirect("/dashboard?error=github_invalid_state");
  }

  // Verify state matches user ID (CSRF protection)
  if (stateData.userId !== req.session.user.id) {
    return res.redirect("/dashboard?error=github_invalid_state");
  }

  const courseUuid = stateData.courseUuid || "";

  // Helper to build redirect URL
  const getRedirectUrl = (params) => {
    if (courseUuid) {
      return `/courses/${courseUuid}/standup?${new URLSearchParams(params)}`;
    }
    return `/dashboard?${new URLSearchParams(params)}`;
  };

  try {
    // Exchange code for access token
    /* eslint-disable camelcase */
    const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      body: JSON.stringify({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        code: code,
        redirect_uri: REDIRECT_URI
      })
    });
    /* eslint-enable camelcase */

    const tokenData = await tokenRes.json();

    if (tokenData.error) {
      return res.redirect(getRedirectUrl({ error: "github_token_failed" }));
    }

    const accessToken = tokenData.access_token;

    // Fetch GitHub user profile
    const profileRes = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "Conductor-Tool"
      }
    });

    const profile = await profileRes.json();

    if (!profile.login) {
      return res.redirect(getRedirectUrl({ error: "github_profile_failed" }));
    }

    // Update user with GitHub info
    await userRepository.updateUserGitHub(req.session.user.id, {
      githubUsername: profile.login,
      githubAccessToken: accessToken
    });

    // Redirect back to standup page or dashboard with success message
    return res.redirect(getRedirectUrl({ github: "connected" }));

  } catch {
    return res.redirect(getRedirectUrl({ error: "github_failed" }));
  }
}

/**
 * Disconnect GitHub account from user profile
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>} JSON response
 */
async function disconnectGitHub(req, res) {
  try {
    await userRepository.updateUserGitHub(req.session.user.id, {
      githubUsername: null,
      githubAccessToken: null
    });

    return res.json({ success: true, message: "GitHub disconnected" });
  } catch {
    return res.status(500).json({ success: false, error: "Failed to disconnect GitHub" });
  }
}

export { exchangeCodeForTokens, disconnectGitHub };
