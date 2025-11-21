import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

/**
 * Serves the class page
 * @name GET /class
 */
router.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../../../../frontend/html/class/index.html"));
});

export default router;
