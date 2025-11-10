# Conductor

**Conductor** is a web platform designed to streamline the management of large-scale software engineering courses (500+ students).
It provides utilities and insights that help teaching staff and students focus on the more meaningful aspects of software engineering, while automating repetitive or administrative tasks.

## Overview

The goal of **Conductor** is to:
- Automate time-consuming tasks involved in course management.
- Provide a consistent structure for collecting and evaluating observations.
- Support fair and transparent assessment for both individual students and project groups.
- Offer insights that help improve teaching efficiency and student learning outcomes.

## Structure

```
conductor-tool/
├── frontend/      # VanillaJS
├── backend/       # Node.js + Express (Port 8081)
├── database/      # PostgreSQL migrations
└── specs/         # Docs, ADRs
```

## Team Ownership

| Team | Feature | Frontend Folder | Backend Files |
|------|---------|----------------|---------------|
| **Auth** | Login, roles | `pages/auth/` | `auth*` files |
| **Directory** | Roster, profiles | `pages/directory/` | `directory*`, `team*` |
| **Attendance** | Meetings, check-in | `pages/attendance/` | `attendance*` |
| **Standup** | Daily standups | `pages/standup/` | `standup*` |

## Docs

- **[STRUCTURE_SUMMARY.md](STRUCTURE_SUMMARY.md)** - Quick overview
- **[codebase_structure.md](specs/code_guides/codebase_structure.md)** - Patterns & examples
- **[subteam_expectations.md](specs/code_guides/subteam_expectations.md)** - Team dependencies
- **Folder READMEs** - Check any folder for guidance

## Rules

1. **3-layer pattern:** Route → Controller → Service → Repository
2. **File naming:** Match your feature (`standupRoutes.js`, `standupService.js`)
3. **Don't mix layers:** Business logic goes in services, SQL goes in repositories
4. **Check folder READMEs** when unsure where code goes

## Tech Stack

- Frontend: HTML/CSS/VanillaJS
- Backend: Node.js + Express
- Database: PostgreSQL
- Auth: Auth.js + Google OAuth
