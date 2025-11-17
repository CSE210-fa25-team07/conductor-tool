import express from "express";
import authRoutes from "./routes/authRoutes.js";
import googleRoutes from "./routes/googleRoutes.js";
import coursesRoutes from "./routes/coursesRoutes.js";
import directoryRoutes from "./routes/directoryRoutes.js";
import attendanceRoutes from "./routes/attendanceRoutes.js";
import standupRoutes from "./routes/standupRoutes.js";
import roleRoutes from "./routes/roleRoutes.js";
import session from "express-session";
import path from "path";
import { fileURLToPath } from "url";
import { testConnection } from "./utils/db.js";

const __filename = fileURLToPath(import.meta.url);
export const __dirname = path.dirname(__filename);

const app = express();
const PORT = 8000;

app.use(express.json());

app.use(session({
  secret: process.env.SESSION_SECRET || 'conductor-dev-secret-key',    // signs the session ID cookie
  resave: false,             // don't save session if nothing changed
  saveUninitialized: false,  // don't create session until something is stored
  cookie: { secure: false }  // true if HTTPS/production
}));

// Middleware to check if user is authenticated
function checkSession(req, res, next) {
  if (!req.session.user) {
    return res.redirect("/");
  }
  next();
}

// Serve static files from frontend folder
app.use(express.static(path.join(__dirname, "../../frontend")));

// ============================================
// API ROUTES
// ============================================

// API routes for frontend data (no authentication required for development)
app.use("/api", roleRoutes);
app.use("/api/courses", coursesRoutes);
app.use("/api/class", directoryRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/journal", standupRoutes);

// ============================================
// AUTH ROUTES
// ============================================

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../../frontend/html/auth/login.html"));
});

app.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/");
  });
});

app.use("/auth", checkSession, authRoutes);
app.use("/google", googleRoutes);

// ============================================
// FRONTEND PAGE ROUTES
// ============================================

// Main dashboard
app.get("/dashboard", (req, res) => {
  res.sendFile(path.join(__dirname, "../../frontend/html/dashboard.html"));
});

// User profile
app.get("/profile", (req, res) => {
  res.sendFile(path.join(__dirname, "../../frontend/html/profile.html"));
});

// Course-specific routes (with course ID)
app.get("/course/:courseId/class", (req, res) => {
  res.sendFile(path.join(__dirname, "../../frontend/html/directory/class.html"));
});

app.get("/course/:courseId/calendar", (req, res) => {
  res.sendFile(path.join(__dirname, "../../frontend/html/attendance/calendar.html"));
});

app.get("/course/:courseId/journal", (req, res) => {
  res.sendFile(path.join(__dirname, "../../frontend/html/standup/journal.html"));
});

// Redirect old routes to dashboard (require course selection)
app.get("/class", (req, res) => res.redirect("/dashboard"));
app.get("/calendar", (req, res) => res.redirect("/dashboard"));
app.get("/journal", (req, res) => res.redirect("/dashboard"));

// ============================================
// START SERVER
// ============================================

app.listen(PORT, async () => {
  console.log(`\nConductor Server Running`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`Server URL: http://localhost:${PORT}`);

  // Test database connection
  console.log(`\n Database:`);
  const dbConnected = await testConnection();
  console.log(`   Status:     ${dbConnected ? '✓ Connected' : '✗ Failed'}`);

  console.log(`\n Frontend Pages:`);
  console.log(`   Dashboard:  http://localhost:${PORT}/dashboard`);
  console.log(`   Profile:    http://localhost:${PORT}/profile`);
  console.log(`   Course:     http://localhost:${PORT}/course/:id/class`);
  console.log(`   Course:     http://localhost:${PORT}/course/:id/calendar`);
  console.log(`   Course:     http://localhost:${PORT}/course/:id/journal`);
  console.log(`\n API Endpoints:`);
  console.log(`   Roles:      http://localhost:${PORT}/api/roles`);
  console.log(`   Auth:       http://localhost:${PORT}/api/auth/me`);
  console.log(`   Courses:    http://localhost:${PORT}/api/courses`);
  console.log(`   Attendance: http://localhost:${PORT}/api/attendance`);
  console.log(`   Journal:    http://localhost:${PORT}/api/journal`);
  console.log(`   Team:       http://localhost:${PORT}/api/journal/team`);
  console.log(`   People:     http://localhost:${PORT}/api/class/people`);
  console.log(`   Groups:     http://localhost:${PORT}/api/class/groups`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
});
