/**
 * @module authentication/web
 */
import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
export const __dirname = path.dirname(__filename);

const router = express.Router();

/**
 * Serves verification page for new users
 * @name GET /auth/verification
 * @status IN USE
 */
router.get("/verification", (req, res) => {
  res.sendFile(path.join(__dirname, "../../../../frontend/html/auth/verification.html"));
});

/**
 * Serves access restriction page for non-UCSD emails
 * @name GET /auth/request-access
 * @status IN USE
 */
router.get("/request-access", (req, res) => {
  res.sendFile(path.join(__dirname, "../../../../frontend/html/auth/request-access.html"));
});

/**
 * Request form page
 * @name GET /auth/request-form
 * @status IN USE
 */
router.get("/request-form", (req, res) => {
  res.sendFile(path.join(__dirname, "../../../../frontend/html/auth/request-form.html"));
});

export default router;
