import express from "express";
import authRoutes from "./routes/web/authRoutes.js";
import classRoutes from "./routes/web/classRoutes.js";
import profileRoutes from "./routes/web/profileRoutes.js";
import googleRoutes from "./routes/googleRoutes.js";
import courseRoutes from "./routes/courseRoutes.js";
import apiRoutes from "./routes/apiRoutes.js";
import { checkSession } from "./utils/auth.js";
import session from "express-session";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
export const __dirname = path.dirname(__filename);

const app = express();
const PORT = 8081;

app.use(express.json());

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

app.get("/dashboard", checkSession, (req, res) => {
  res.sendFile(path.join(__dirname, "../../frontend/html/dashboard/dashboard.html"));
});

app.get("/dashboard/calendar", checkSession, (req, res) => {
  res.sendFile(path.join(__dirname, "../../frontend/html/dashboard/calendar.html"));
});

app.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/");
  });
});

/**
 * This is for devs to hardcode a user session without going through Google OAuth.
 * NOT FOR PRODUCTION USE.
 */
app.get("/dev-login", async (req, res) => {
  req.session.user = {
    id: "3e26dca6-0be8-4594-b36c-ed4925b6daf6",
    email: "powell@ucsd.edu",
    name: "Thomas Powell"
  };
  res.redirect("/dashboard");
});

app.use("/auth", checkSession, authRoutes);

app.use("/class", checkSession, classRoutes);

app.use("/profile", checkSession, profileRoutes);

app.use("/google", googleRoutes);

app.use("/courses/:courseId", checkSession, courseRoutes);

app.use("/v1/api/", apiRoutes);

app.listen(PORT);
