# Architecture Decision Record (ADR)

**ADR #:** 011  
**Title:** Admin Dashboard & Access Management  
**Date:** 2025-12-09  
**Status:** Implemented  

---

## 1. Context
The application requires a secure method to manage high-level user permissions and handle edge-case onboarding scenarios that standard authentication flows cannot address.

Specific constraints and needs identified:
- **Professor Onboarding:** Professors cannot "sign up" on their own; they must be manually entered into the system to prevent unauthorized course creation.
- **Hierarchy of Trust:** We need a way to differentiate between "Course Staff" (Professors) and "System Maintainers" (Admins), with a fail-safe "Lead Admin" to prevent any premature removal of Admins.
- **Extension Student Access:** Non-UCSD students (Extension) cannot automatically log in and require a manual approval queue as defined in previous authentication decisions.

---

## 2. Decision
We will implement a **Role-Based Admin Dashboard** that enforces a strict hierarchical power structure: `Lead Admin > Admin > Professor > Student`.

### 2.1 Hierarchy Rules
The system enforces the following logic in the service layer:
- **Lead Admin:** Single user. Can transfer "Lead" status, demote Admins, and perform all Admin actions. Cannot be removed or demoted (unless transferring power).
- **Admin:** Can promote Professors to Admin, remove Users (Students/Profs), and approve Requests. **Cannot** demote or remove other Admins.
- **Professor:** Base staff role. Can be promoted to Admin.
- **Student:** Base user role.

### 2.2 Core Modules
The Dashboard is divided into three functional views:

1. **Manage Users (`adminManageUsers`):**
   - Displays users categorized by role.
   - Provides context-aware action buttons (e.g., "Promote to Admin" only appears for Professors).
   - Enforces the rule that Admins must be demoted to Professors before they can be removed.

2. **Add User (`adminAddUser`):**
   - A manual entry form for onboarding Professors and Admins. (Can also add Students if needed.)
   - Automatically enforces that `isSystemAdmin` implies `isProf`.

3. **Request Forms (`adminRequestForms`):**
   - A review queue for Extension students requesting access.
   - Validates the `verificationCode` against active courses before approval.
   - On approval, creates the user and automatically enrolls them in the target course.

---

## 3. Alternatives Considered
- **CSV Bulk Upload for Professors:** *Rejected:* Professors are high-privilege accounts. Manual entry ensures accuracy and prevents accidental mass-granting of privileges.
- **Single "System Admin" Role (No Lead):** *Rejected:* Creates a "deadlock" risk where an Admin could accidentally (or maliciously) remove all others, locking everyone out of system management. The "Lead Admin" concept acts as the root anchor for controlling Admin roles.

---

## 4. Consequences
**Positive:**
- **Accountability:** The Lead Admin acts as the ultimate source of truth for system permissions.
- **Security:** "All Admins are Professors" inheritance simplifies the codebase (Admins inherently have Professor capabilities).
- **Flexibility:** Handles the complex edge case of Extension students without breaking the automatic flow for UCSD students.

**Negative:**
- **Bottleneck:** Professors are dependent on Admins for initial access; they cannot self-serve.
- **Risk:** If the Lead Admin account is lost (credentials forgotten), database intervention is required to appoint a new Lead.

---

## 5. Implementation Notes
- **Middleware Security:** All admin API routes are strictly protected by the `checkSystemAdmin` middleware to ensure no unauthorized access to sensitive endpoints.

- **Transactional Integrity:** The `approveFormRequest` function utilizes a database transaction to atomically create the user, enroll them in the specific course found via their verification code, and delete the request form, preventing data inconsistencies. Similarly `denyFormRequest` safely deletes the request without side effects.

- **Lead Transfer Logic:** The `transferLeadAdmin` function enforces an atomic operation that first validates the target user is already an existing System Admin and not already the Lead Admin before swapping statuses.

- **Promotion Logic:** The `promoteProfessorToAdmin` service ensures a valid escalation path by verifying the target is currently a Professor and not already an Admin before applying the update.

- **Demotion Safeguards:** The `demoteAdminToProfessor` function strictly enforces that only the *Lead Admin can perform this action, and it explicitly prevents the Lead Admin from being demoted (they must transfer lead status first).

- **Safe Removal:** The `removeUser` function includes a "fail-safe" check that prevents the deletion of any user marked as `isSystemAdmin`; admins must be demoted to professor status before they can be removed from the system.
---

## 6. References
- Codebase: `adminService.js`, `adminApi.js`, `adminManageUsers.js`
- [ADR 004 – Authentication System (Context for Extension Students)](./ADR_Auth_Sys.md)
- [ADR 003 – Backend Stack (Node/Express structure)](./ADR_Backend_Stack.md)