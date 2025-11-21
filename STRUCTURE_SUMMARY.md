# Codebase Structure - Quick Start

## What's Here

Folder structure + READMEs explaining where to put code. **No prescriptive "do this" lists** - just guidelines on organization.

---

## Project Layout

```
conductor-tool/
├── frontend/          # VanillaJS
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

## 3-Layer Pattern

Backend follows this:

```
Route → Service → Repository
```

- **Route:** URL mapping
- **Service:** Business logic
- **Repository:** SQL queries

Don't mix layers. See [codebase_structure.md](specs/code_guides/codebase_structure.md) for examples.

---

## File Naming

One feature = matching files across layers:

- `standupRoutes.js`
- `standupService.js`
- `standupRepository.js`

---

**Build your features however you want. The structure just keeps things organized.**
