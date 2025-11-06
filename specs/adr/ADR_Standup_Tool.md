# Architecture Decision Record (ADR)

**ADR #:** 001
**Title:** Work Journal / Standup Tool Architecture
**Date:** 2025-11-05
**Status:** Proposed

---

## 1. Context

Large software engineering courses (500+ students across 80+ teams) face critical challenges: quiet students go unnoticed, struggling students fall behind undetected until week 7-8, teams lack transparency causing duplicated effort, technical blockers remain unresolved, and instructors lack objective contribution data.

**Requirements:**
- Daily standup under 2 minutes
- Auto-populate from GitHub to reduce manual entry
- Role-specific dashboards (Student, TA, Professor)
- Auto-escalate unresolved blockers to TAs
- Early warning system by week 3
- FERPA-compliant storage

**Current State:** Students use scattered tools (Slack, Discord, Google Docs) resulting in inconsistent participation, no TA visibility, and delayed intervention.

---

## 2. Decision

Build a role-based daily standup system with GitHub integration and automated escalation.

**Architecture:**
- **Frontend:** JavaScript, HTML, CSS
- **Backend:** Node.js with Express
- **Database:** PostgreSQL (users, teams, standups) + Redis (GitHub cache)
- **Real-time:** Socket.io for live dashboard updates
- **External APIs:** GitHub REST API v3 (OAuth), Slack Webhooks, SendGrid, Twilio

**Core Components:**
1. Daily standup form (GitHub auto-population, 3 questions, sentiment tracking, draft save)
2. Multi-view dashboards (Student feed, Team dashboard, Individual history, TA multi-team)
3. Alert system (immediate Slack notification, 4-hour auto-escalation to TA, email/SMS)
4. Analytics (participation tracking, sentiment trends, blocker resolution time)

**Data Flow:**
1. Student opens form → fetch last 24h GitHub activity (cached 15min)
2. Submit → save PostgreSQL → Socket.io broadcast to team dashboard
3. Blocker reported → Slack webhook fires → background job starts 4h timer
4. After 4h unresolved → SendGrid email + Twilio SMS to TA

---

## 3. Alternatives Considered

**Slack/Discord Bots:** No centralized analytics, poor escalation workflows. Rejected.

**LMS Extension (Canvas/Blackboard):** Limited API flexibility, poor real-time updates, restrictive UX. Rejected.

**Microservices Architecture:** Premature optimization, increased complexity for MVP. Rejected.

**GraphQL vs REST:** Team unfamiliar with GraphQL, GitHub API is REST-based, added complexity. Rejected.

---

## 4. Consequences

**Positive:**
- Standup time reduced from 5-10 min to under 2 min
- TAs get single dashboard vs 5+ Slack channels
- Proactive alerts catch at-risk students by week 3
- Objective grading data (commits + participation)

**Negative & Mitigations:**
- GitHub OAuth complexity → Use Passport.js
- Multi-role frontend complexity → Modular component design
- API rate limits (5000/hr) → Redis caching (15min TTL)
- FERPA compliance → Role-based access control, encrypt sensitive fields
- External service dependencies → Graceful degradation (manual entry if GitHub down)

---

## 5. Implementation Notes

### **Phase 1: Frontend (Week 1)**
- Build all UI components (standup form, feed view, team dashboard, TA multi-team)
- Implement role-based view switching
- Static mockups with sample data

### **Phase 2: Backend & Data (Week 2)**
- Node.js + Express setup
- PostgreSQL schema: users, teams, standups (yesterday, today, blockers, sentiment, github_commits, blocker_escalated, escalation_sent_at)
- REST endpoints: POST /api/standups, GET /api/standups/team/:id, GET /api/standups/student/:id, GET /api/teams/:id/health
- Redis caching layer

### **Phase 3: External Integration (Week 3+)**
- GitHub OAuth + background job (fetch commits/PRs hourly)
- Slack webhooks, SendGrid emails, Twilio SMS
- Socket.io for real-time updates
- BullMQ job queue for 4-hour escalation timers

**Key Patterns:** Repository pattern for data access, service layer for business logic, middleware for RBAC.


---

## 6. References

**Design Documents:** Conductor Pitch Document (Feature 4), Interactive demo wireframes

**Technical:** GitHub REST API v3, OAuth 2.0 RFC 8252, FERPA Guidelines, Socket.io docs

**Related ADRs:** ADR-002 (Authentication), ADR-003 (Database Selection), ADR-004 (Real-time Communication)

---

## Revision History
- **2025-11-05:** Initial draft
