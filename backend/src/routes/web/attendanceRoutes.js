import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

/**
 * Serves the attendance dashboard page
 * @name GET /attendance
 */
router.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../../../../frontend/html/attendance/dashboard.html"));
});

/**
 * Serves the attendance analysis page
 * @name GET /attendance/analysis
 */
router.get("/analysis", (req, res) => {
  res.sendFile(path.join(__dirname, "../../../../frontend/html/attendance/analysis.html"));
});

/**
 * Serves attendance page templates
 * @name GET /attendance/pages/:name
 */
router.get("/pages/:name", (req, res) => {
  const { name } = req.params;
  const pagePath = path.join(__dirname, `../../../../frontend/html/attendance/${name}.html`);
  res.sendFile(pagePath, (err) => {
    if (err) {
      res.status(404).send("Page not found");
    }
  });
});

/**
 * Serves attendance component templates
 * @name GET /attendance/pages/components/:name
 */
router.get("/pages/components/:name", (req, res) => {
  const { name } = req.params;
  const pagePath = path.join(__dirname, `../../../../frontend/html/attendance/components/${name}.html`);
  res.sendFile(pagePath, (err) => {
    if (err) {
      res.status(404).send("Component not found");
    }
  });
});

export default router;
