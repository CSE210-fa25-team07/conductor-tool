/**
 * Centralized session checking for protected routes
 * @module middleware/auth
 */

import * as userRepository from "../repositories/userRepository.js";

/**
 * Middleware to check if user is authenticated
 * Redirects to "/" if not authenticated
 * Sets no-cache headers to prevent back button access after logout
 * @param {Request} req
 * @param {Response} res
 * @param {NextFunction} next
 */
export function checkSession(req, res, next) {
  if (!req.session.user) {
    return res.redirect("/");
  }
  // Prevent browser from caching protected pages (back button after logout)
  res.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
  next();
}

/**
 * Middleware to check if user exists in session and database
 * Redirects to "/logout" if not authenticated or user not found
 * Sets no-cache headers to prevent back button access after logout
 * @param {Request} req
 * @param {Response} res
 * @param {NextFunction} next
 */
export async function checkUserFromSession(req, res, next) {
  if (!req.session.user) {
    return res.redirect("/logout");
  }
  const check = await userRepository.getUserByUuid(req.session.user.id);
  if (!check) {
    return res.redirect("/logout");
  }
  res.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
  next();
}

/**
 * Middleware to check if user is authenticated (for API routes)
 * Returns 401 if not authenticated
 * @param {Request} req
 * @param {Response} res
 * @param {NextFunction} next
 */
export async function checkApiSession(req, res, next) {
  if (!req.session.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const check = await userRepository.getUserByUuid(req.session.user.id);
  if (!check) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}
