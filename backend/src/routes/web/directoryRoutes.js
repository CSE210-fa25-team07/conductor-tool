import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

/**
 * Serves the directory dashboard page
 * @name GET /directory
 */
router.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../../../../frontend/html/directory/dashboard.html"));
});

/**
 * Serves the group page
 * @name GET /directory/group
 */
router.get("/group", (req, res) => {
  res.sendFile(path.join(__dirname, "../../../../frontend/html/directory/group.html"));
});

/**
 * Serves the my page
 * @name GET /directory/my
 */
router.get("/my", (req, res) => {
  res.sendFile(path.join(__dirname, "../../../../frontend/html/directory/my.html"));
});

/**
 * Serves the people page
 * @name GET /directory/people
 */
router.get("/people", (req, res) => {
  res.sendFile(path.join(__dirname, "../../../../frontend/html/directory/people.html"));
});

/**
 * Serves directory page templates
 * @name GET /directory/pages/:name
 */
router.get("/pages/:name", (req, res) => {
  const { name } = req.params;
  const pagePath = path.join(__dirname, `../../../../frontend/html/directory/${name}.html`);
  res.sendFile(pagePath, (err) => {
    if (err) {
      res.status(404).send("Page not found");
    }
  });
});

/**
 * Serves directory component templates
 * @name GET /directory/pages/components/:name
 */
router.get("/pages/components/:name", (req, res) => {
  const { name } = req.params;
  const pagePath = path.join(__dirname, `../../../../frontend/html/directory/components/${name}.html`);
  res.sendFile(pagePath, (err) => {
    if (err) {
      res.status(404).send("Component not found");
    }
  });
});

export default router;
