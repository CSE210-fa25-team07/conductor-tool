**Title:** Class Directory & Group/User Profile Page
**Date:** 2025-12-05  

---

## 1. Context

The Conductor tool requires a centralized, reliable, and easy-to-navigate location for all users (Professors, TAs, Tutors, and Students) to see who is in the course.

This feature reads from the central user database (managed by the User Management feature) and presenting this information in a structured, role-appropriate, and domain-specific way to provide context for all other features (like Attendance and Work Journals).

---

## 2. Decision

We implemented a centralized Class Directory as a core "read" interface for the main application's user database. The system follows a **3-layer architecture pattern** (Route → Service → Repository) consistent with the application's vanilla HTML/CSS/JS and Node.js/Express stack.

### Architecture Overview

**Backend Structure:**
- **Routes Layer** (`backend/src/routes/api/directoryApi.js`): RESTful API endpoints
- **Service Layer** (`backend/src/services/directoryService.js`): Business logic, authorization, and validation
- **Repository Layer** (`backend/src/repositories/directoryRepository.js`): Database queries using Prisma ORM
- **DTO Layer** (`backend/src/dtos/directoryDto.js`): Data transformation for consistent API responses

**Frontend Structure:**
- **Main Router** (`frontend/js/pages/directory/main.js`): View routing and navigation
- **Page Modules**: Dashboard, People, Group, My, TeamProfile
- **API Client** (`frontend/js/api/directoryApi.js`): HTTP requests to backend
- **Templates** (`frontend/html/directory/`): HTML templates for each view

### Primary Views Implemented

1. **Dashboard Page** (`dashboard.js`): Course overview with statistics, staff list, and quick navigation
   - Displays course information, enrollment stats, team count
   - Shows teaching staff with office hours
   - Provides navigation to other directory views

2. **People Page** (`people.js`): Searchable and filterable course roster
   - Pagination support (default 20 items per page, max 100)
   - Role-based filtering (all, student, instructor, ta)
   - Displays users as cards with name, photo, role
   - Links to individual user profiles

3. **Group Page** (`group.js`): Team listing and navigation
   - Paginated team list (default 12 teams per page)
   - Students automatically redirected to their team profile if they have exactly one team
   - Staff can view all teams
   - Each team card shows team name, TA assignment, and member count

4. **Team Profile Page** (`teamProfile.js`): Detailed team information
   - Team name, course, assigned TA
   - Team links (Team Page URL, Repository URL) - editable by team leaders
   - Team statistics (member count, standup submissions)
   - Team member list with profiles
   - Authorization: Team members OR staff can view

5. **My/User Profile Page** (`my.js`): Individual user profile
   - Dynamic content based on viewer's role (FERPA compliance)
   - Shows: name, pronouns, photo, email, bio, phone, GitHub username
   - Displays user's courses and teams
   - Staff profiles include: office location, research interests, personal website
   - Users can edit their own profile (PUT `/v1/api/directory/profile`)

### API Endpoints

**Read Operations:**
- `GET /v1/api/directory/courses/:courseUuid` - Course overview
- `GET /v1/api/directory/courses/:courseUuid/staff` - Course staff list
- `GET /v1/api/directory/courses/:courseUuid/roster` - Course roster (paginated, filterable)
- `GET /v1/api/directory/courses/:courseUuid/teams` - Course teams (paginated)
- `GET /v1/api/directory/users/:userUuid` - User profile
- `GET /v1/api/directory/profile` - Current user's profile
- `GET /v1/api/directory/teams/:teamUuid` - Team profile

**Write Operations:**
- `PUT /v1/api/directory/profile` - Update current user's profile (self-edit only)
- `PUT /v1/api/directory/teams/:teamUuid/links` - Update team links (team leader only)
- `PUT /v1/api/directory/courses/:courseUuid/links` - Update course links (professor only)

### Authorization & Permissions

**Role-Based Access Control:**
- **Students**: Can view their own team, course roster, and profiles of users in shared courses
- **Team Leaders**: Can edit team links (Team Page URL, Repository URL) for their team
- **Staff (TA/Professor)**: Can view all teams, all user profiles, and course statistics
- **Professors**: Can edit course links (Syllabus URL, Canvas URL)

**Authorization Checks:**
- Course enrollment verification for roster/team access
- Team membership OR staff role for team profile access
- Shared course enrollment for user profile access
- Role verification for link editing (team leader)

### Data Handling

**Pagination:**
- Roster: Default 20 items/page, max 100
- Teams: Default 20 items/page, max 100
- Server-side pagination with total count and page metadata

**Data Transformation:**
- DTOs ensure consistent API response structure
- Handles multiple roles per user (e.g., Student + Team Leader)
- Combines roles in roster display (e.g., "Student, Team Leader")

**User Profile Updates:**
- Self-service profile editing
- Validation for all fields (name length, phone format, GitHub username format, URL format)
- Session name update on profile change

---

## 3. Alternatives Considered

**Use Slack/Discord Profiles:**

Pros: Students are already using these tools.

Cons: Rejected. This approach is unstructured, not searchable/filterable, and offers no role-based permissions for viewing sensitive data. It directly conflicts with the core problem of scattered information. And we don't have enough time to integrate Slack/Discord profiles with our conductor tool.

**Maintain a Central Google Sheet:**

Pros: Simple to create.

Cons: Rejected. This is not a scalable application, has a poor UI, and presents significant security and privacy (FERPA) risks, as it's difficult to enforce role-based view permissions.

**GraphQL API:**

Pros: Flexible queries, single endpoint.

Cons: Rejected. Team unfamiliarity, added complexity, REST is sufficient for current needs, and aligns with existing codebase patterns.

**Separate Frontend Framework (React/Vue):**

Pros: Component reusability, state management.

Cons: Rejected. Project uses vanilla JavaScript to avoid build tooling complexity and maintain simplicity. Current implementation achieves goals without framework overhead.

---

## 4. Consequences

### Positive

1. **Single Source of Truth**: Creates a centralized location for all user, role, and team information, solving a primary pain point for all user personas.

2. **Foundation for Other Features**: Provides the foundational "read" data that all other features (Attendance, Work Journal) link to.

3. **FERPA Compliance**: The dynamic, role-based API for profiles ensures students cannot see other students' private data, while TAs and Professors can. Authorization is enforced at the backend API layer, not just hidden on the frontend.

4. **Navigation Hub**: Establishes a clear navigation hub (the Dashboard) for the entire application.

5. **Scalability**: Pagination handles large class sizes (500+ students) efficiently.

6. **Maintainability**: 3-layer architecture (Route → Service → Repository) provides clear separation of concerns and makes the codebase maintainable.

7. **Type Safety**: Prisma ORM provides type-safe database access and reduces SQL injection risks.

8. **Consistent API**: DTOs ensure consistent response structures across all endpoints.

### Negative & Mitigations

1. **Permission Complexity**: The biggest risk is correctly managing who can see what.

   **Mitigation**: Authorization logic is enforced on the backend API layer, not just hidden on the frontend. All endpoints check user roles and relationships before returning data. Service layer handles all authorization checks.

2. **Performance**: Loading a roster with 500+ students, including photos, could be slow.

   **Mitigation**: Pagination is implemented on the Class Roster Page from day one. Default page size is 20 items, with a maximum of 100. Server-side pagination reduces data transfer.

3. **Data Integration Creep**: The profile page is intended to link to other features (Attendance, Journals).

   **Mitigation**: This feature's scope is primarily read-only. We built placeholders and defined clear API contracts. Profile editing is limited to self-service updates. Link editing (team/course links) is a minimal write operation that doesn't expand scope.

4. **Multiple Roles Handling**: Users can have multiple roles (e.g., Student + Team Leader), which complicates display and authorization.

   **Mitigation**: Repository layer groups enrollments by user and combines roles. Roster displays combined roles. Authorization checks verify specific roles when needed (e.g., team leader check for link editing).

5. **Frontend State Management**: Vanilla JavaScript requires manual state management.

   **Mitigation**: Each page module manages its own state. Navigation is handled through a centralized router. Session storage is used for course context.

---

## 5. Implementation Details

### Technology Stack

- **Backend**: Node.js with Express.js
- **Database**: PostgreSQL with Prisma ORM
- **Frontend**: Vanilla JavaScript, HTML, CSS
- **Authentication**: Express sessions with `checkApiSession` middleware

### Key Design Patterns

1. **3-Layer Architecture**: Route → Service → Repository
   - Routes handle HTTP requests/responses
   - Services contain business logic and authorization
   - Repositories handle database queries

2. **DTO Pattern**: Data Transfer Objects transform database models into API responses
   - Ensures consistent response structure
   - Hides internal database structure
   - Allows data transformation without changing database schema

3. **Repository Pattern**: Abstracts database access
   - Single source of truth for queries
   - Easier to test and maintain
   - Type-safe with Prisma

4. **Role-Based Authorization**: Authorization checks in service layer
   - Uses `userContextRepository` for role/membership checks
   - Returns 403 Forbidden for unauthorized access
   - Different data visibility based on viewer's role



### Special Features

1. **Student Team Redirect**: Students viewing the Group page are automatically redirected to their team profile if they have exactly one team.

2. **Link Editing**:
   - Team leaders can edit Team Page URL and Repository URL
   - Professors can edit Syllabus URL and Canvas URL
   - URLs are validated before saving
   - Changes persist for all users viewing the team/course

3. **Profile Editing**: Users can edit their own profile information (name, pronouns, bio, phone, GitHub username, staff info).

4. **Role-Based Filtering**: Roster can be filtered by role (all, student, instructor, ta).

5. **Pagination**: Both roster and teams support pagination with configurable page size.

---

## 6. Testing

The implementation includes comprehensive testing:

- **Integration Tests** (`backend/tests/integration/directoryApi.test.js`): Tests API endpoints with database
- **Unit Tests** (`backend/tests/unit/repositories/directoryRepository.test.js`): Tests repository functions

Tests cover:
- Authorization checks
- Pagination
- Filtering
- Data transformation
- Error handling

---

## 7. Future Considerations

1. **Search Functionality**: Currently filtering by role only. Future enhancement could add name/email search.

2. **Bulk Operations**: Currently no bulk operations. Future could add bulk team assignment or enrollment management.

3. **Export Functionality**: Could add CSV/PDF export of roster for administrative purposes.

4. **Photo Upload**: Currently photos are URLs. Future could add direct photo upload.

5. **Activity Feed**: Could add recent activity feed to dashboard (recent enrollments, team changes).

---

## 8. References

- [Initial Technical Design from 10/31 Meeting](specs/docs/Initial_Technical_Design_from_10_31_meeting.md)
- [Features and User Stories](specs/docs/Features_And_User_Stories.md)
- [Pitch Detailed Draft](specs/docs/Pitch_Detailed_Draft.md)
- [Backend Routes README](backend/src/routes/README.md)
- [Database README](database/README.md)
- [Prisma Guide](database/PRISMA_GUIDE.md)



