# Architecture Decision Record (ADR)

**ADR #:** 008
**Title:** Class Directory & Group/User Profile Page
**Date:** 2025-11-05  
**Status:** Proposed  

---

## 1. Context
The Conductor tool requires a centralized, reliable, and easy-to-navigate location for all users (Professors, TAs, Tutors, and Students) to see who is in the course.

Currently, this information is scattered across disconnected systems like the Canvas roster, Slack profiles, and various spreadsheets. This makes it difficult to quickly find contact information, understand the class structure (e.g., which TAs are assigned to which teams), or see team compositions.

This feature must solve this by reading from the central user database (managed by the User Management feature) and presenting this information in a structured, role-appropriate, and domain-specific way to provide context for all other features (like Attendance and Work Journals).

---

## 2. Decision
We will implement a centralized Class Directory as a core "read" interface for the main application's user database. This system will be built around four primary views, consistent with the application's vanilla HTML/CSS/JS and Node.js/Express stack:


User Dashboard Page: A personalized landing page for the logged-in user, serving as a central navigation hub to their profile, their group, and the main roster.

Class Roster Page: A searchable and filterable list of all users in the course (Professors, TAs, Tutors, Students). This view will feature pagination to handle large class sizes (500+ students) and display users as "cards" (name, photo, role) that link to their profiles.

User Profile Page: A detailed view for a single individual. The information displayed on this page will be dynamic, controlled by the backend API based on the viewer's role to ensure FERPA compliance.

All profiles will show: Name, Pronunciation, Pronouns, Photo, Role.

Staff profiles will add: Contact Info, Availability (Office Hours) managed by other team.

Student profiles will add: Group, Contact Info, and placeholders for links to their Attendance and Work Journal data.

Group Information Page: A dedicated page for each project team, displaying the group name, logo, a list of members, and links to external resources (e.g., GitHub repo, Slack channel).

---

## 3. Alternatives Considered
Use Slack/Discord Profiles:

Pros: Students are already using these tools.

Cons: Rejected. This approach is unstructured, not searchable/filterable, and offers no role-based permissions for viewing sensitive data. It directly conflicts with the core problem of scattered information.

Maintain a Central Google Sheet:

Pros: Simple to create.

Cons: Rejected. This is not a scalable application, has a poor UI, and presents significant security and privacy (FERPA) risks, as it's difficult to enforce role-based view permissions.

---

## 4. Consequences
Positive:
Creates a single source of truth for all user, role, and team information, solving a primary pain point for all user personas.

Provides the foundational "read" data that all other features (Attendance, Work Journal) will link to.

The dynamic, role-based API for profiles allows for strong FERPA compliance by ensuring students cannot see other students' private data, while TAs and Professors can.

Establishes a clear navigation hub (the User Dashboard) for the entire application.

Negative & Mitigations:
Permission Complexity: The biggest risk is correctly managing who can see what.

Mitigation: This logic must be enforced on the backend API layer, not just hidden on the frontend. The API endpoint for a user profile (e.g., GET /api/users/:id) must return different data based on the authenticated viewer's role.

Performance: Loading a roster with 500+ students, including photos, will be slow.

Mitigation: Pagination must be implemented on the Class Roster Page from day one.

Data Integration Creep: The profile page is intended to link to other features (Attendance, Journals).

Mitigation: This team's scope is read-only. We will build placeholders and define clear API contracts for the other teams to provide data endpoints, rather than building data-collection features ourselves.

---

## 5. Implementation Notes
This feature is the primary "read" interface for the users, teams, and roles tables managed by the Authentication/User Management feature (see Feature 1 doc).

API Endpoints: Will require secure, role-aware REST endpoints, such as GET /api/users?role=TA, GET /api/users/:id, and GET /api/teams/:id.

Database Schema: Must coordinate closely with the User Management team to ensure the users table includes all necessary fields (Photo, Pronouns, Availability, etc.).

Profile Editing: This feature is read-only. All "Edit" buttons will link to the flows/pages built by the User Management team.

---

## 6. References
- [Initial Technical Design from 10/31 Meeting]
