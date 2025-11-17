# Role-Based State Guide

## Goal
Standard pattern for sourcing a user's course-specific role in the frontend so every feature team can ship their own versions of a page without stepping on each other.

## Scope
- Vanilla JS frontend (`/frontend`)
- Roles tied to course enrollments (TA, Professor, Student, Team Lead, etc.)
- Shared helpers/components relied on by Directory, Attendance, Standup, and future features.

## High-Level Idea
1. Load the signed-in user + their course enrollments once when the app boots.
2. Keep that data in a global store (`js/utils/roleStore.js`).
3. Provide selectors + helpers so every page can ask "what role am I in this course?"
4. Each feature renders its own role-specific view based on the global store.

## Core Concepts
- **Active course** — whichever course ID the shell navigation is currently showing (URL-driven).
- **Active role** — role for the active course; falls back to `student` when none is found.
- **Roles by course** — map of `courseId → { roleId, roleName, teamId }` built from `course_enrollment` joins.
- **Role keywords** — canonical strings exported from the store (`student`, `ta`, `professor`, `lead`). Do not invent new spellings locally.

## Responsibilities
| Team | Responsibilities |
|------|-----------------|
| **Auth** | Implement `roleStore.js`, wire to `authApi` + `directoryApi`, expose mock data until backend ready. |
| **Directory** | Own enrollment/role API responses; ensure the payload contains course + role info required by the store. |
| **Attendance** | Read roles via store selectors and render TA/Professor tooling separately from student check-in views. |
| **Standup** | Same pattern as attendance; organize per-role components under `pages/standup/views/`. |
| **Shared/UI** | Provide reusable `RoleGate` and badges in `js/components/role/` when more than one feature needs them. |

## Data Flow
```
login → authApi.getCurrentUser()
      → directoryApi.getEnrollments(userId)
      → roleStore.setState({ user, rolesByCourse })
      → Feature entry points subscribe and render their variant
```

## Global Role Store
Location: `frontend/js/utils/roleStore.js` (create if missing).

### Shape
```javascript
const state = {
  user: null,
  rolesByCourse: {}, // { [courseId]: { roleId, roleName, teamId } }
  activeCourseId: null,
  activeRoleId: null,
};
```

### Public API
| Function | Description |
|----------|-------------|
| `initRoleState()` | Fetches user + enrollments, seeds the store, emits initial change. Call once per page load. |
| `setActiveCourse(courseId)` | Persists `courseId` (URL + sessionStorage) and updates `activeRoleId`. |
| `setActiveRole(roleId)` | Optional override when the user manually flips roles (future role switcher). |
| `getState()` | Returns a frozen copy of state (read-only). |
| `useRoleState(selector, handler)` | Subscribes to changes using a selector function. Returns an unsubscribe function. |
| `getRoleForCourse(courseId)` | Convenience getter for one course. |
| `ROLE_TYPES` | Exported constant list of allowed role keywords. |

### Implementation Notes
- Keep listeners in a `Set` and run them whenever state mutates; no framework required.
- Store should swallow fetch errors and default to `{}` so pages can still render placeholders.
- Cache `activeCourseId` in `sessionStorage` (or query string) to survive refreshes, matching navigation helpers in `js/components/navigation.js`.

## Feature Integration
Every HTML page has a single JS entry (e.g., `pages/standup/main.js`). Inside that file:

1. Call `initRoleState()` once (Auth team can noop it while backend is WIP).
2. Derive the active course from the URL via `getCourseIdFromUrl()` in `navigation.js`, then call `setActiveCourse(courseId)`.
3. Subscribe to role changes and render the correct view.

```javascript
import { initRoleState, setActiveCourse, useRoleState, ROLE_TYPES } from '../../utils/roleStore.js';
import { renderTaView, renderStudentView } from './views/index.js';
import { getCourseIdFromUrl } from '../../components/navigation.js';

async function bootstrap() {
  await initRoleState();
  setActiveCourse(getCourseIdFromUrl());

  return useRoleState(s => ({ role: s.activeRoleId }), ({ role }) => {
    root.innerHTML = '';
    (role === ROLE_TYPES.TA ? renderTaView : renderStudentView)();
  });
}

bootstrap();
```

### Folder Layout Per Feature
```
pages/<feature>/
├── main.js                # entry point (role-agnostic)
└── views/
    ├── shared/            # utilities/components reused across roles
    ├── student/
    ├── ta/
    └── professor/
```

- Each team works in its own role folder, so multiple people can code in parallel.
- Shared assets stay under `views/shared/` or `js/components/` if 2+ features use them.
- Feature routers (if any) simply choose which module to call rather than duplicating page shells.

## Role Guards & Shared UI
- Add `frontend/js/components/role/RoleGate.js` with helpers such as `renderIfRole(roleList, fn)` so teams avoid rewriting conditionals.
- Role badges, selectors, or switchers go in `components/role/` once they are used in more than one feature (per `components/README`).

## Testing
- Mock the store in `js/__tests__` by exporting a `createMockRoleStore` helper and resetting listeners between tests.
- Each feature should test its role router (e.g., TA view renders controls, student view hides them).

## Rollout Steps
1. Auth team lands `roleStore.js` with mock data + README snippet.
2. Feature teams import it immediately, wiring their render functions to selectors.
3. Once backend endpoints are ready, swap the mock fetch with real APIs—no feature code changes required.

## Quick Checklist
- [ ] `roleStore.js` initialized before feature code runs
- [ ] Feature entry point never directly fetches role data
- [ ] Each role variant lives in its own folder
- [ ] Shared role helpers live in `js/components/role/`
- [ ] Tests cover the role router path
- [ ] Navigation updates `setActiveCourse()` when URL changes

Done right, this pattern lets every team ship role-specific UX without waiting on another team or rewriting the same "what role am I?" logic in multiple places.
