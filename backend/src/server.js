import express from "express";
import authRoutes from "./routes/authRoutes.js";
import session from "express-session";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
export const __dirname = path.dirname(__filename);

const app = express();
const PORT = 8081;

// Middleware for parsing JSON request bodies
app.use(express.json());

app.use(session({
  secret: process.env.SESSION_SECRET,    // signs the session ID cookie
  resave: false,             // don’t save session if nothing changed
  saveUninitialized: false,  // don’t create session until something is stored
  cookie: { secure: false }  // true if HTTPS/production
}));

app.use(express.static(path.join(__dirname, "../../frontend")));
// app.get("/", (req, res) => {
//   res.send("<a href='/auth/google'>Login with Google</a>");
// });
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../../frontend/html/auth/login.html"));
});

app.get("/dashboard", (req, res) => {
  if (!req.session.user) return res.redirect("/");

  const user = req.session.user;
  const pictureUrl = user.picture;

  res.send(`
    <h1>Welcome, ${user.name}</h1>
    <p>Email: ${user.email}</p>
    <img src="${pictureUrl}" alt="Profile Picture" onerror="this.onerror=null; this.src='https://upload.wikimedia.org/wikipedia/commons/a/ac/Default_pfp.jpg';" />
    <p><a href="/logout">Logout</a></p>
    <pre>${JSON.stringify(user, null, 2)}</pre>
  `);
});

app.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/");
  });
});

app.use("/auth", authRoutes);

app.listen(PORT);
