import express from "express";
import authRoutes from "./routes/web/authRoutes.js";
import profileRoutes from "./routes/web/profileRoutes.js";
import adminRoutes from "./routes/web/adminRoutes.js";
import googleRoutes from "./routes/googleRoutes.js";
import githubAuthRoutes from "./routes/githubAuthRoutes.js";
import courseRoutes from "./routes/courseRoutes.js";
import apiRoutes from "./routes/apiRoutes.js";
import { metricsCollector } from "./metrics/metricsMiddleware.js";
import { checkSession, checkUserFromSession } from "./utils/auth.js";
import session from "express-session";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
export const __dirname = path.dirname(__filename);

const app = express();
const PORT = 8081;

app.use(express.json());

// Metrics collection middleware (collect metrics for all requests)
app.use(metricsCollector);

app.use(session({
  secret: process.env.SESSION_SECRET,  // signs the session ID cookie (for dev: you can change this to any random string to bypass)
  resave: false,             // don’t save session if nothing changed
  saveUninitialized: false,  // don’t create session until something is stored
  cookie: { secure: false }  // true if HTTPS/production
}));

// Serve only assets statically (js, css, images) - HTML is served via protected routes
app.use("/js", express.static(path.join(__dirname, "../../frontend/js")));
app.use("/css", express.static(path.join(__dirname, "../../frontend/css")));
app.use("/images", express.static(path.join(__dirname, "../../frontend/images")));
// HTML pages/templates served via feature-specific routes (e.g., /standup/pages/:name)

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../../frontend/html/auth/login.html"));
});

app.get("/dashboard", checkUserFromSession, (req, res) => {
  res.sendFile(path.join(__dirname, "../../frontend/html/dashboard/dashboard.html"));
});

app.get("/metrics", checkUserFromSession, (req, res) => {
  res.sendFile(path.join(__dirname, "../../frontend/html/metrics/metrics.html"));
});

app.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/");
  });
});

/**
 * Development login page - allows selecting a user from the database.
 * NOT FOR PRODUCTION USE.
 */
app.get("/dev-login", (req, res) => {
  res.sendFile(path.join(__dirname, "../../frontend/html/auth/dev-users.html"));
});

app.use("/auth", checkSession, authRoutes);

app.use("/profile", checkUserFromSession, profileRoutes);

app.use("/admin", checkUserFromSession, adminRoutes);

app.use("/google", googleRoutes);

app.use("/github", githubAuthRoutes);

app.use("/courses", checkUserFromSession, courseRoutes);

app.use("/v1/api/", apiRoutes);

app.listen(PORT);
