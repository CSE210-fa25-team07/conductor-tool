# Dashboard Quick Start (Mock Data)

This guide helps you run the dashboard with mock data for development.

## Start the Server

### Option 1: Python (Recommended)

```bash
# Navigate to the frontend directory (parent of public)
cd /Users/jerryhu/codes/cse210/conductor-tool/frontend

# Start the server
python3 -m http.server 8080
```

### Option 2: Node.js

```bash
# Install http-server globally (one time only)
npm install -g http-server

# Navigate to the frontend directory
cd /Users/jerryhu/codes/cse210/conductor-tool/frontend

# Start the server
http-server -p 8080
```

## View the Dashboard

### Student View (Default)
Open in browser: `http://localhost:8080/public/class-dashboard.html?course=test-course`

### Instructor View
To see the instructor dashboard:
1. Edit `/frontend/src/js/api/directory/mockData.js`
2. Change line: `role: 'student'` to `role: 'instructor'`
3. Refresh the browser (no copy needed!)

## Features You Can See

### Student View:
- Course header with logistics
- Current grade display (87.5% / B+)
- Assignments table with submissions and grades
- Teaching staff cards with office hours
- Navigation buttons

### Instructor View:
- Course header with logistics
- Enrollment statistics (523 students, 498 active)
- Assignment statistics (submissions, grading progress)
- Recent enrollments list
- Teaching staff cards with office hours
- Navigation buttons

## Switching to Real API

When the backend is ready:

1. In `/frontend/src/js/pages/directory/class-dashboard/index.js`, change:
   ```javascript
   import { getUserRole } from '../../../api/directory/directoryApiMock.js';
   ```
   to:
   ```javascript
   import { getUserRole } from '../../../api/directoryApi.js';
   ```

2. Make the same change in `studentView.js` and `instructorView.js`:
   ```javascript
   // Change from:
   import { ... } from '../../../api/directory/directoryApiMock.js';

   // To:
   import { ... } from '../../../api/directoryApi.js';
   ```

## File Structure

```
frontend/
├── src/
│   ├── css/
│   │   └── pages/
│   │       └── dashboard.css          # Combined styles (global + dashboard)
│   └── js/
│       ├── api/
│       │   ├── directoryApi.js        # Real API (for production)
│       │   └── directory/             # Directory-specific API files
│       │       ├── directoryApiMock.js  # Mock API wrapper
│       │       └── mockData.js          # Mock data
│       └── pages/
│           └── directory/
│               └── class-dashboard/   # Class dashboard feature
│                   ├── index.js       # Main controller
│                   ├── studentView.js # Student view
│                   └── instructorView.js # Instructor view
└── public/
    └── class-dashboard.html           # HTML page (references ../src files)
```

## Making Changes

All files are served directly from `/frontend/src/`. Just edit the files and refresh your browser:

- Edit CSS: `/frontend/src/css/pages/dashboard.css`
- Edit Mock Data: `/frontend/src/js/api/directory/mockData.js`
- Edit Views: `/frontend/src/js/pages/directory/class-dashboard/*.js`

**No copying needed!** The HTML references the src files directly.
