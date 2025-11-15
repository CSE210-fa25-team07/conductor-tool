# Subteam Guide

Quick reference for what each team owns and dependencies between teams.

---

## Team Ownership

| Team | Feature Area | Frontend Folder | Backend Files |
|------|--------------|----------------|---------------|
| **Auth** | Login, roles, permissions | `pages/auth/` | `auth*`, `user*` files |
| **Directory** | Roster, profiles, teams | `pages/directory/` | `directory*`, `team*` files |
| **Attendance** | Meetings, check-ins | `pages/attendance/` | `attendance*`, `meeting*` files |
| **Standup** | Daily standups, blockers | `pages/standup/` | `standup*` files |

---

## Shared Code (Important!)

Some files are used by multiple teams:

### Auth Team Owns (Everyone Needs)
- `frontend/src/js/api/apiClient.js` - Base API wrapper
- `backend/src/repositories/userRepository.js` - Shared with Directory

### Directory Team Owns (Attendance + Standup Need)
- `backend/src/repositories/teamRepository.js` - Team membership checks
- `frontend/src/js/components/userCard.js` - Shared with Standup

## General Rules

1. **File naming:** Match your feature (`standupService.js`, `attendanceRoutes.js`)
2. **3-layer pattern:** Route → Controller → Service → Repository
3. **One feature = matching files across layers:**
   - `standupRoutes.js` + `standupController.js` + `standupService.js` + `standupRepository.js`
4. **Tests:** Write tests in `tests/unit/` or `tests/integration/`

---

## Where Your Files Go

### Frontend
- API calls → `src/js/api/yourFeatureApi.js`
- Pages → `src/js/pages/yourFeature/`
- Shared UI → `src/js/components/`
- Tests → `src/js/__tests__/`

### Backend
- Routes → `src/routes/yourFeatureRoutes.js`
- Controllers → `src/controllers/yourFeatureController.js`
- Business logic → `src/services/yourFeatureService.js`
- DB queries → `src/repositories/yourFeatureRepository.js`
- Tests → `tests/unit/` or `tests/integration/`

### Database
- Schema → `migrations/###_create_yourFeature.sql`
- Dev data → `seeds/dev_yourFeature.sql`

---

**That's it.** Build your feature however you want within these folders. Check folder READMEs if you need hints on structure.
