# ADR: Standup Tool

**Status:** Implemented
**Date:** 2025-12-05

## Context

Large software engineering courses need a way to track daily student progress, surface blockers early, and give TAs visibility across multiple teams without checking scattered tools.

## Decision

Build a role-based standup system with three integrated components:

1. **Standup CRUD** — Students submit daily standups with what they did, what's next, and blockers
2. **GitHub Integration** — Auto-populate standups with recent commits, PRs, and reviews via OAuth
3. **Blocker Alerts** — Immediate email to TA when a student reports a blocker

## Standup API

| Endpoint | Description |
|----------|-------------|
| POST /v1/api/standups | Create standup (team membership required) |
| GET /v1/api/standups/me | Get own standups with filters |
| PUT /v1/api/standups/:id | Update standup (owner only) |
| DELETE /v1/api/standups/:id | Delete standup (owner only) |
| GET /v1/api/standups/team/:teamId | Get team standups (member or staff) |
| GET /v1/api/standups/ta/overview | Get course overview (staff only) |
| GET /v1/api/standups/user/:userUuid | Get user standups (staff or teammate) |

## GitHub Integration

| Endpoint | Description |
|----------|-------------|
| GET /v1/api/github/status | Check if GitHub is connected |
| GET /v1/api/github/activity | Fetch raw activity (commits, PRs, reviews, issues) |
| GET /v1/api/github/auto-populate | Get formatted text for standup form |
| POST /github/disconnect | Disconnect GitHub account |

OAuth flow stores access token and username in user record. Fetches last 24h of activity by default.

## Blocker Email Notifications

When a standup includes a non-empty `blockers` field, the system emails the team's assigned TA via SendGrid. Includes student name, team, course, and blocker details. Email failures don't block standup creation.

## Authorization

| Action | Who Can Do It |
|--------|---------------|
| Create standup | Active team member |
| View/edit/delete own | Standup owner |
| View team standups | Team member or course staff |
| View course overview | Course staff (TA/Professor) |
| View specific user | Course staff or shared team member |

## Environment Variables

- `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` — GitHub OAuth app
- `SENDGRID_API_KEY`, `SENDGRID_FROM_EMAIL` — Email notifications

## References

- Standup: `standupApi.js`, `standupService.js`, `standupRepository.js`
- GitHub: `githubApi.js`, `githubService.js`, `githubAuthService.js`
- Email: `emailService.js`
