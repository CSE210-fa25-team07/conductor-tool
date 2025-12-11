/**
 * @module admin/web
 */
import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router({ mergeParams: true });

/**
 * Serves the admin dashboard page
 * @name GET /admin
 */
router.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../../../../frontend/html/admin/adminDashboard.html"));
});

/**
 * Serves admin page templates
 * @name GET /admin/pages/:name
 */
router.get("/pages/:name", (req, res) => {
  const { name } = req.params;
  const pagePath = path.join(__dirname, `../../../../frontend/html/admin/${name}.html`);
  res.sendFile(pagePath, (err) => {
    if (err) {
      res.status(404).send("Page not found");
    }
  });
});

export default router;
