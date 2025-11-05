# Codebase Structure - Quick Start

## What's Here

Folder structure + READMEs explaining where to put code. **No prescriptive "do this" lists** - just guidelines on organization.

---

## Project Layout

```
conductor-tool/
├── frontend/          # VanillaJS (Port 8080)
├── backend/           # Node.js + Express (Port 8081)
├── database/          # PostgreSQL migrations
└── specs/             # Docs, ADRs
```

---

## Team Ownership

| Team | Feature | Frontend | Backend |
|------|---------|----------|---------|
| **Auth** | Login, roles | `pages/auth/` | `auth*` files |
| **Directory** | Roster, profiles | `pages/directory/` | `directory*`, `team*` files |
| **Attendance** | Meetings, check-in | `pages/attendance/` | `attendance*`, `meeting*` files |
| **Standup** | Daily standups | `pages/standup/` | `standup*` files |

**Organize within your folders however you want.**

---

## Shared Code (Coordinate These)

### Auth Team Implements First
- `frontend/src/js/api/apiClient.js` - Everyone uses this
- `backend/src/middleware/authMiddleware.js` - Everyone needs this
- `backend/src/middleware/rbacMiddleware.js` - Everyone needs this

### Directory Team (Others Need)
- `backend/src/repositories/teamRepository.js` - Team membership checks

**Other teams wait for these before starting routes.**

---

## 3-Layer Pattern

Backend follows this:

```
Route → Controller → Service → Repository
```

- **Route:** URL mapping + middleware
- **Controller:** Extract request data, return response
- **Service:** Business logic
- **Repository:** SQL queries

Don't mix layers. See [codebase_structure.md](specs/code_guides/codebase_structure.md) for examples.

---

## File Naming

One feature = matching files across layers:

- `standupRoutes.js`
- `standupController.js`
- `standupService.js`
- `standupRepository.js`

---

## Quick Start

```bash
cp .env.example .env
docker-compose up --build

# Frontend: http://localhost:8080
# Backend: http://localhost:8081
```

---

## Where to Learn More

- **[codebase_structure.md](specs/code_guides/codebase_structure.md)** - Quick reference with patterns
- **[subteam_expectations.md](specs/code_guides/subteam_expectations.md)** - Team ownership + dependencies
- **Folder READMEs** - Check any folder for specific guidance

---

**Build your features however you want. The structure just keeps things organized.**
