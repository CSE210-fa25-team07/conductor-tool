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
  const check = await userRepository.getUserByEmail(req.session.user.email);
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
  const check = await userRepository.getUserByEmail(req.session.user.email);
  if (!check) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}

/**
 * Middleware to check if user is a system administrator (for API routes)
 * Must be used after checkApiSession
 * Returns 403 if user is not a system admin
 * @param {Request} req
 * @param {Response} res
 * @param {NextFunction} next
 */
export async function checkSystemAdmin(req, res, next) {
  if (!req.session.user || !req.session.user.id) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const userStatus = await userRepository.getUserStatusByUuid(req.session.user.id);

  if (!userStatus.isSystemAdmin) {
    return res.status(403).json({
      success: false,
      error: "Forbidden: Only system administrators can access this resource"
    });
  }

  // Attach user info to req.user for use in route handlers
  req.user = {
    userUuid: req.session.user.id,
    email: req.session.user.email,
    isSystemAdmin: userStatus.isSystemAdmin,
    isLeadAdmin: userStatus.isLeadAdmin,
    isProf: userStatus.isProf
  };

  next();
}
