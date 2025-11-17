# Frontend Template Guide

Quick reference for Conductor frontend template architecture.

## Overview

- **Server**: Port 8000
- **Architecture**: Module-based ES6 with Express backend
- **Theme**: Light green (#4ADE80), minimal design
- **Routing**: Course-centric - features accessible after selecting a course

---

## Directory Structure

```
conductor-tool/
├── backend/src/
│   ├── server.js
│   └── routes/
│       ├── coursesRoutes.js      # Courses API
│       ├── directoryRoutes.js    # Directory/Class API
│       ├── attendanceRoutes.js   # Attendance API
│       └── standupRoutes.js      # Journal/Standup API
│
├── frontend/
│   ├── html/
│   │   ├── dashboard.html
│   │   ├── profile.html
│   │   ├── directory/class.html
│   │   ├── attendance/calendar.html
│   │   └── standup/journal.html
│   │
│   ├── js/
│   │   ├── components/navigation.js
│   │   └── pages/
│   │       ├── dashboard/main.js
│   │       ├── profile/main.js
│   │       ├── directory/class.js
│   │       ├── attendance/calendar.js
│   │       └── standup/journal.js
│   │
│   └── css/
│       ├── components/
│       │   ├── global.css
│       │   └── navigation.css
│       └── pages/
│           ├── dashboard.css
│           └── class.css
```

---

## API Routes

### Courses API (`coursesRoutes.js`)
- `GET /api/courses` - Get all courses
- `GET /api/courses/:id` - Get specific course

### Directory API (`directoryRoutes.js`)
- `GET /api/class/people` - Get class roster
- `GET /api/class/groups` - Get class groups
- `GET /api/class/stats` - Get class statistics

### Attendance API (`attendanceRoutes.js`)
- `GET /api/attendance` - Get attendance records
- `POST /api/attendance/checkin` - Check in to class
- `GET /api/attendance/qr` - Generate QR code

### Standup API (`standupRoutes.js`)
- `GET /api/journal` - Get journal entries
- `POST /api/journal` - Submit journal entry
- `GET /api/journal/team` - Get team statistics

---

## URL Patterns

```
/dashboard                    # Course selection
/profile                      # User profile
/course/:id/class            # Class feature (sub-pages: dashboard, people, group, my)
/course/:id/calendar         # Calendar feature (sub-pages: calendar, analysis)
/course/:id/journal          # Journal feature (sub-pages: dashboard, team)
```

---

## Key Concepts

### Course-Centric Architecture
- Users select course from dashboard first
- All features require a course context (`/course/:courseId/feature`)
- Auto-redirect to dashboard if no course selected

### Two-Level Navigation
1. **Top Nav**: Feature selection (Class, Calendar, Journal) + user profile
2. **Secondary Nav**: Feature sub-pages (sidebar, no title)

### Navigation Functions
```javascript
import { createTopNav, createSecondaryNav, getCourseIdFromUrl } from './components/navigation.js';

const courseId = getCourseIdFromUrl(); // Extract from URL
const topNav = createTopNav({ activeFeature: 'class', courseId, user });
const secondaryNav = createSecondaryNav({ feature: 'class', courseId, activePage: 'dashboard' });
```

---

## Theme

```css
--color-primary-green: #4ADE80;   /* Primary accent */
--color-bg-light: #F9FAFB;        /* Page background */
--color-white: #FFFFFF;           /* Cards */
--color-dark: #1F2937;            /* Primary text */
--color-gray: #6B7280;            /* Secondary text */
--color-light-gray: #E5E7EB;      /* Borders */
```

**Design**: Minimal, high contrast, light green accents, no animations

---

## Quick Reference

| Purpose | File Path |
|---------|-----------|
| Server | `backend/src/server.js` |
| Courses API | `backend/src/routes/coursesRoutes.js` |
| Directory API | `backend/src/routes/directoryRoutes.js` |
| Attendance API | `backend/src/routes/attendanceRoutes.js` |
| Standup API | `backend/src/routes/standupRoutes.js` |
| Navigation | `frontend/js/components/navigation.js` |
| Theme | `frontend/css/components/global.css` |
| Dashboard | `frontend/js/pages/dashboard/main.js` |
| Class | `frontend/js/pages/directory/class.js` |
| Calendar | `frontend/js/pages/attendance/calendar.js` |
| Journal | `frontend/js/pages/standup/journal.js` |

---

## Adding New Features

### 1. Create HTML
```html
<!-- frontend/html/your-feature/feature.html -->
<div id="top-navigation"></div>
<nav id="secondary-navigation"></nav>
<main class="main-content with-sidebar">
  <div id="page-content"></div>
</main>
<script type="module" src="../../js/pages/your-feature/main.js"></script>
```

### 2. Create JS Module
```javascript
// frontend/js/pages/your-feature/main.js
import { createTopNav, createSecondaryNav, getCourseIdFromUrl } from '../../components/navigation.js';

function initFeaturePage() {
  const courseId = getCourseIdFromUrl();
  if (!courseId) return window.location.href = '/dashboard';

  // Create navigation and load content
}
```

### 3. Add Route in server.js
```javascript
app.get("/course/:courseId/your-feature", (req, res) => {
  res.sendFile(path.join(__dirname, "../../frontend/html/your-feature/feature.html"));
});
```

### 4. Update navigation.js
Add to `navigationMap` and `features` array

---

## Server Commands

```bash
npm start              # Start server on port 8000
```

**URLs**:
- Dashboard: http://localhost:8000/dashboard
- Test Course: http://localhost:8000/course/test-routing/class

---

**Current State**: Template with routing placeholders. Mock data only. Replace with PostgreSQL when ready.

*Last Updated: November 2024*
