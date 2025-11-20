# Backend

Node.js + Express API. Port 8081.

## Folders

- `src/routes/` - HTTP routes (one file per team)
- `src/services/` - Business logic (one file per team)
- `src/repositories/` - Database queries (one file per table)
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
Calling fetch on the endpoint will query a response with the session information. Example below
#### frontend/js/pages/auth/auth.js
```js
const sessionResponse = await fetch("/auth/session", {
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
/**
 * This is for devs to hardcode a user session without going through Google OAuth.
 * NOT FOR PRODUCTION USE.
 */
app.get("/dev-login", async (req, res) => {
  // Hardcoded dev user session with what you need for testing
  req.session.user = {
    id: "18461b29-0e83-4dd6-a309-874d2acdf045",
    email: "dev@example.com"
  };
  res.redirect("/dashboard"); // Redirect to whatever endpoint you are testing
});
```
Ensure you first go to `localhost:8081/dev-login` to hardcode your session when testing.

**Check each folder's README for details.**
