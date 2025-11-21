import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router({ mergeParams: true });

/**
 * Serves the class shell page (directory view)
 * @name GET /directory
 */
router.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../../../../frontend/html/class/index.html"));
});

/**
 * Serves the class shell page (directory/group view)
 * @name GET /directory/group
 */
router.get("/group", (req, res) => {
  res.sendFile(path.join(__dirname, "../../../../frontend/html/class/index.html"));
});

/**
 * Serves the class shell page (directory/my view)
 * @name GET /directory/my
 */
router.get("/my", (req, res) => {
  res.sendFile(path.join(__dirname, "../../../../frontend/html/class/index.html"));
});

/**
 * Serves the class shell page (directory/people view)
 * @name GET /directory/people
 */
router.get("/people", (req, res) => {
  res.sendFile(path.join(__dirname, "../../../../frontend/html/class/index.html"));
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
