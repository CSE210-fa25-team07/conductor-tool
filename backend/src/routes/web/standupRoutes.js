import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

/**
 * Serves the standup main page
 * @name GET /standup
 */
router.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../../../../frontend/html/standup/index.html"));
});

/**
 * Serves standup page templates
 * @name GET /standup/pages/:name
 */
router.get("/pages/:name", (req, res) => {
  const { name } = req.params;
  const pagePath = path.join(__dirname, `../../../../frontend/html/standup/${name}.html`);
  res.sendFile(pagePath, (err) => {
    if (err) {
      res.status(404).send("Page not found");
    }
  });
});

/**
 * Serves standup component templates
 * @name GET /standup/pages/components/:name
 */
router.get("/pages/components/:name", (req, res) => {
  const { name } = req.params;
  const pagePath = path.join(__dirname, `../../../../frontend/html/standup/components/${name}.html`);
  res.sendFile(pagePath, (err) => {
    if (err) {
      res.status(404).send("Component not found");
    }
  });
});

export default router;
