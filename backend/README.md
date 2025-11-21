# Backend

Node.js + Express API. Port 8081.

## Folders

- `src/routes/web` - HTTP routes for servicing web pages(one file per team) (deprecated)
- `src/routes/api` - HTTP endpoints for APIs
- `src/services/` - Business logic (one file per team)
- `src/repositories/` - Database queries (one file per table)
- `src/dtos/` - Data Transfer Objects for shaping API responses
- `src/validators/` - Validation logic for any types of input
- `tests/` - Unit and integration tests

## 3-Layer Pattern

Route → Service → Repository

## Express Session
The `express` session keeps track of the logged-in user with information that the database can use to query. For development purposes, you can fill values of `req.session.user` with dummy data to test your features.

### Example
 ```js
 app.get("/endpoint", (req, res) => {
  const user = req.session.user;
  /**
  These fields can be available and passed into your query:
  user.id
  user.email
  */
});
```
## Accessing Session Data through Frontend
Calling fetch on the API endpoint will query a response with the session information. Example below
#### frontend/js/pages/auth/auth.js
```js
const sessionResponse = await fetch("/v1/api/auth/session", {
      credentials: "include"
    });

    if (!sessionResponse.ok) {
      alert("Session expired. Please log in again.");
      window.location.href = "/";
      return;
    }

    const sessionData = await sessionResponse.json();
    const isUCSDEmail = sessionData.user.email.endsWith("@ucsd.edu");
```

### Hardcoding Session
For dev testing without proper Google OAuth, you can hardcode a session for dev purposes in `server.js`
```js
app.use(session({
  secret: process.env.SESSION_SECRET,  // signs the session ID cookie (for dev: you can change this to any random string to bypass)
  resave: false,             // don’t save session if nothing changed
  saveUninitialized: false,  // don’t create session until something is stored
  cookie: { secure: false }  // true if HTTPS/production
}));

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
```
Ensure you first go to `localhost:8081/dev-login` to hardcode your session when testing.

**Check each folder's README for details.**
