# Dashboard Quick Start (Mock Data)

This guide helps you run the dashboard with mock data for development.

## Start the Server

### Option 1: Python (Recommended)

```bash
# Navigate to the frontend directory
cd conductor-tool/frontend

# Start the server
python3 -m http.server 8080
```

### Option 2: Node.js

```bash
# Install http-server globally (one time only)
npm install -g http-server

# Navigate to the frontend directory
cd conductor-tool/frontend

# Start the server
http-server -p 8080
```

## View the Pages

### Class Dashboard

#### Student View (Default)
Open in browser: `http://localhost:8080/html/directory/class-dashboard.html?course=test-course`

#### Instructor View
To see the instructor dashboard:
1. Edit `frontend/js/api/directory/mockData.js`
2. Find the `userRole` object (around line 9)
3. Change `user_uuid: "student-1-uuid"` to `user_uuid: "staff-1-uuid"`
4. Change `role: "student"` to `role: "instructor"`
5. Refresh the browser

### User Directory (Class Roster)

#### Roster Page
View all students and staff in the course: `http://localhost:8080/html/directory/user-directory.html?course=test-course`

**Features:**
- Paginated grid of user cards (12 per page)
- Filter by role (All, Students, Instructors, TAs)
- Click any card to navigate to that user's profile
- Shows 18 total users (15 students + 3 staff)
- Page navigation at the bottom

### User Profile Page

#### Student Profiles (15 total)
- Alice Williams (Junior, CS/Math): `http://localhost:8080/html/directory/user-profile.html?user=student-1-uuid`
- Bob Martinez (Senior, CompE): `http://localhost:8080/html/directory/user-profile.html?user=student-2-uuid`
- Carol Davis (Sophomore, CS/Business): `http://localhost:8080/html/directory/user-profile.html?user=student-3-uuid`
- David Garcia (Junior, CS/Data Science): `http://localhost:8080/html/directory/user-profile.html?user=student-4-uuid`
- Eva Rodriguez (Senior, CS/Design): `http://localhost:8080/html/directory/user-profile.html?user=student-5-uuid`
- Frank Chen (Sophomore, CS): `http://localhost:8080/html/directory/user-profile.html?user=student-6-uuid`
- Grace Kim (Junior, CS/Music): `http://localhost:8080/html/directory/user-profile.html?user=student-7-uuid`
- Henry Patel (Freshman, CS): `http://localhost:8080/html/directory/user-profile.html?user=student-8-uuid`
- Iris Wong (Sophomore, CompE): `http://localhost:8080/html/directory/user-profile.html?user=student-9-uuid`
- Jack Anderson (Senior, CS): `http://localhost:8080/html/directory/user-profile.html?user=student-10-uuid`
- Kelly Brown (Junior, CS/Statistics): `http://localhost:8080/html/directory/user-profile.html?user=student-11-uuid`
- Liam Taylor (Freshman, CS): `http://localhost:8080/html/directory/user-profile.html?user=student-12-uuid`
- Maya Singh (Sophomore, CS/Biology): `http://localhost:8080/html/directory/user-profile.html?user=student-13-uuid`
- Nathan Lee (Junior, CS/Economics): `http://localhost:8080/html/directory/user-profile.html?user=student-14-uuid`
- Olivia White (Senior, CS): `http://localhost:8080/html/directory/user-profile.html?user=student-15-uuid`

#### Staff Profiles
- Thomas Powell (Instructor): `http://localhost:8080/html/directory/user-profile.html?user=staff-1-uuid`
- Sarah Johnson (TA): `http://localhost:8080/html/directory/user-profile.html?user=staff-2-uuid`
- Michael Chen (TA): `http://localhost:8080/html/directory/user-profile.html?user=staff-3-uuid`

**Navigation from Dashboard:**
- Click on staff names in the "Teaching Staff" section to view their profiles
- Click on student names in the "Recent Enrollments" section (instructor view) to view their profiles
- All names are clickable and will navigate to the correct person's profile
- **"My Profile" button** in the top navigation bar:
  - Has a default link to student-1-uuid in the HTML
  - JavaScript immediately updates it by reading mockData directly (no async delay)
  - Student view (role: "student") → links to student-1-uuid (Alice Williams)
  - Instructor view (role: "instructor") → links to staff-1-uuid (Thomas Powell)
  - The link is identified by `id="myProfileLink"` in both HTML files
  - Both pages (dashboard, user-profile, and user-directory) update their navigation on load
- **"Class Roster" button** → navigates to user-directory.html (roster page)
- "My Group" button links to placeholder page that doesn't exist yet (group-profile.html)

## Features You Can See

### Class Dashboard - Student View:
- Course header with logistics
- Teaching staff cards with office hours (clickable names link to profiles)
- Navigation buttons (Class Roster, My Group, My Profile)

### Class Dashboard - Instructor View:
- Course header with logistics
- Enrollment statistics (523 students, 498 active)
- Recent enrollments list (clickable names link to student profiles)
- Teaching staff cards with office hours (clickable names link to profiles)
- Navigation buttons (Class Roster, My Profile)

### User Directory (Roster):
- Paginated grid of user cards (12 per page, 2 pages total)
- Filter buttons (All, Students, Instructors, TAs) with counts
- User cards show photo, name, role badge, email, and metadata
- Clickable cards navigate to user profiles
- Page navigation (Previous, 1, 2, Next)
- Results count display

### User Profile Page:
- User photo and basic information
- Biography/About Me section
- Contact information (phone, personal website, GitHub)
- Academic information (majors, minors, year) - for students only
- Staff information (office location, research interests) - for staff users only
- Team membership cards with leader badge (links to team profile pages)

## Switching to Real API

When the backend is ready:

1. In `frontend/js/pages/directory/class-dashboard/index.js`, change:
   ```javascript
   import { getUserRole } from "../../../api/directory/directoryApiMock.js";
   import { mockData } from "../../../api/directory/mockData.js";
   ```
   to:
   ```javascript
   import { getUserRole } from "../../../api/directoryApi.js";
   ```

2. Update the `updateNavigationLinks()` function to use async:
   ```javascript
   async function updateNavigationLinks() {
     const roleData = await getUserRole("test-course");
     // ... rest of function
   }
   ```

3. Make similar changes in `studentView.js`, `instructorView.js`, `user-profile/index.js`, and `user-directory/directoryView.js`:
   ```javascript
   // Change from:
   import { ... } from "../../../api/directory/directoryApiMock.js";

   // To:
   import { ... } from "../../../api/directoryApi.js";
   ```

4. For `user-directory/index.js`, remove the mockData import:
   ```javascript
   // Remove:
   import { mockData } from "../../../api/directory/mockData.js";

   // Update updateNavigationLinks() to use async getUserRole()
   ```

## File Structure

```
frontend/
├── css/
│   └── pages/
│       └── directory/
│           ├── dashboard.css          # Dashboard styles
│           └── user-profile.css       # User profile page styles
├── js/
│   ├── api/
│   │   ├── apiClient.js               # HTTP client for backend API
│   │   ├── directoryApi.js            # Real API (for production)
│   │   └── directory/                 # Directory-specific API files
│   │       ├── directoryApiMock.js    # Mock API wrapper
│   │       └── mockData.js            # Mock data
│   └── pages/
│       └── directory/
│           ├── class-dashboard/       # Class dashboard feature
│           │   ├── index.js           # Main controller
│           │   ├── studentView.js     # Student view
│           │   └── instructorView.js  # Instructor view
│           ├── user-profile/          # User profile feature
│           │   ├── index.js           # Main controller
│           │   └── profileView.js     # Profile rendering
│           └── user-directory/        # User directory/roster feature
│               ├── index.js           # Main controller
│               └── directoryView.js   # Directory rendering with pagination
└── html/
    └── directory/
        ├── class-dashboard.html       # Dashboard HTML page
        ├── user-profile.html          # User profile HTML page
        └── user-directory.html        # User directory/roster HTML page
```

## Making Changes

Just edit the files and refresh your browser:

- Edit Dashboard CSS: `frontend/css/pages/directory/dashboard.css`
- Edit Profile CSS: `frontend/css/pages/directory/user-profile.css`
- Edit Directory CSS: `frontend/css/pages/directory/user-directory.css`
- Edit Mock Data: `frontend/js/api/directory/mockData.js`
- Edit Dashboard Views: `frontend/js/pages/directory/class-dashboard/*.js`
- Edit Profile View: `frontend/js/pages/directory/user-profile/profileView.js`
- Edit Directory View: `frontend/js/pages/directory/user-directory/directoryView.js`
- Edit HTML: `frontend/html/directory/*.html`

**No build step required!** The HTML files reference JS and CSS directly with relative paths.
