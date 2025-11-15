# Standup Pages

**Team:** Standup

Standup form, team feed, dashboards. Organize however you want.

## Demo

A fully functional frontend demo is available with mock data and zero styling.

### Files

**JavaScript** (`frontend/js/pages/standup/`):
- `mockData.js` - Mock data for users, teams, standups, comments, notifications
- `standupForm.js` - Daily standup submission form (Student view)
- `teamDashboard.js` - Team standup feed and collaboration (Student/Team Lead view)
- `taDashboard.js` - Multi-team overview dashboard (TA/Instructor view)
- `individualHistory.js` - Personal standup history and stats (Student view)
- `main.js` - Main entry point with navigation between views

**HTML** (`frontend/html/standup/`):
- `index.html` - Main demo page (requires local server for ES modules)
- `standalone.html` - Standalone version (works directly in browser, all code inline)

### Running the Demo

**Option 1: Standalone (easiest)**
```bash
open frontend/html/standup/standalone.html
```

**Option 2: With local server (for modular version)**
```bash
cd frontend
python3 -m http.server 8080
# Open http://localhost:8080/html/standup/index.html
```

### Features Demonstrated

1. **Standup Form** - 3-question format, GitHub auto-populate, sentiment tracking
2. **Team Dashboard** - Feed view, blockers, comments, sentiment trends
3. **TA Dashboard** - Multi-team overview, alerts, at-risk student detection
4. **Individual History** - Personal stats, trends, filtering, export

### Note

Demo uses **zero CSS styling** - pure HTML elements only to show interactions and functionality.
