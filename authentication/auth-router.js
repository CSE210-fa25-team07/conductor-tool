/**
 * @module authentication
 */
import 'dotenv/config';
import express from 'express';
import fetch from 'node-fetch';

const router = express.Router();

const PORT = 3000;
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = `http://localhost:${PORT}/auth/google/callback`;

/**
 * Initiates Google OAuth login by redirecting the user to Google’s OAuth consent screen to authenticate.
 *
 * @name GET /auth/google
 */
router.get('/google', (req, res) => {
  const redirectUrl =
    'https://accounts.google.com/o/oauth2/v2/auth?' +
    new URLSearchParams({
      'client_id': CLIENT_ID,
      'redirect_uri': REDIRECT_URI,
      'response_type': 'code',
      'scope': 'openid email profile'
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
 * Redirects to /dashboard on success, or back to / on failure.
 *
 * @name GET /auth/google/callback
 */
router.get('/google/callback', async (req, res) => {
  const code = req.query.code;

  if (!code) {
    return res.send('Error: no code returned');
  }

  try {
    // Exchange code for tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        'client_id': CLIENT_ID,
        'client_secret': CLIENT_SECRET,
        'redirect_uri': REDIRECT_URI,
        'grant_type': 'authorization_code'
      })
    });

    const data = await tokenRes.json();

    // Fetch user profile
    const profileRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${data.access_token}` }
    });
    const profile = await profileRes.json();

    // Store user in session
    req.session.user = profile;
    res.redirect('/dashboard');
  } catch {
    res.redirect('/');
  }
});

export default router;
