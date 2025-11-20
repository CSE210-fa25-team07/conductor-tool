import express from "express";
import authRoutes from "./routes/web/authRoutes.js";
import googleRoutes from "./routes/googleRoutes.js";
import courseRoutes from "./routes/courseRoutes.js";
import apiRoutes from "./routes/apiRoutes.js";
import session from "express-session";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
export const __dirname = path.dirname(__filename);

const app = express();
const PORT = 8081;

app.use(express.json());

app.use(session({
  secret: process.env.SESSION_SECRET,    // signs the session ID cookie
  resave: false,             // don’t save session if nothing changed
  saveUninitialized: false,  // don’t create session until something is stored
  cookie: { secure: false }  // true if HTTPS/production
}));

// Middleware to check if user is authenticated
function checkSession(req, res, next) {
  if (!req.session.user) {
    return res.redirect("/");
  }
  next();
}

app.use(express.static(path.join(__dirname, "../../frontend")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../../frontend/html/auth/login.html"));
});

app.get("/dashboard", checkSession, (req, res) => {
  res.sendFile(path.join(__dirname, "../../frontend/html/dashboard/dashboard.html"));
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
  // Hardcode dev user session with what you need for testing
  req.session.user = {
    id: "18461b29-0e83-4dd6-a309-874d2acdf045",
    email: "dev@example.com",
    name: "John Doe"
  };
  res.redirect("/dashboard"); // Redirect to whatever endpoint you are testing
});

app.use("/auth", checkSession, authRoutes);

app.use("/google", googleRoutes);

app.use("/courses/:couresId", checkSession, courseRoutes);

app.use("/v1/api/", apiRoutes);

app.listen(PORT);
