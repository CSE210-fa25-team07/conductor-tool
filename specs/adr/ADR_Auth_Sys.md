# Architecture Decision Record (ADR)

**ADR #:** 004  
**Title:** Authentication System – Auth.js and Google OAuth Integration  
**Date:** 2025-11-04  
**Status:** Proposed  

---

## 1. Context
The Conductor tool requires secure, role-based user authentication.  
- UCSD students should log in with institutional emails to gain immediate access
- Extension students with non-UCSD emails require manual approval from system admin
We only need basic auth and course membership for now. Users sign up/sign in with Google OAuth (UCSD or non-UCSD emails allowed). A professor should be able to create a unique course code. Everyone else must have that code—either during signup or later—to join a course.


---

## 2. Decision
- Use **Auth.js** for session and authentication management and **Google OAuth** for identity verification.  
- a **course code** to gate enrollment and lightweight roles.
- This simplifies authentication and ensures compatibility with UCSD’s Google-based login infrastructure.  
- UCSD students will have direct google sign-in, leading to automatic account creation after the initial sign up.  
- Extension students will have a pending approval status after direct google sign-in, requiring manual admin activation.  
- **Professor flow:** A user marked as `role='professor'` can create a course; the system generates a unique `course_code` (e.g., short random string).
- **Student/TA/TL/Tutor flow:** Join a course by submitting a valid `course_code` either during signup or later from a “Join Course” page.
- **Roles (minimal):** `professor` (owns course), `student`, `ta`, `tl`, `tutor`

This keeps the path simple: Google OAuth → (optional) enter course code → in.

---

## 3. Alternatives Considered
- **Firebase Auth:** Managed service, but introduces vendor lock-in.  
- **Invite links (signed URL) instead of codes** More implementation (link signing, expiry); harder to share in large classes.
- **Restrict to @ucsd.edu only** Blocks collaborators/guests; adds friction.

---

## 4. Consequences
**Positive:**  
- Secure and familiar authentication flow for users.  
- Simplifies session handling with built-in role hooks.  
- Database-backed sessions enable custom approval workflows for extension students
- Works with any Google account (no domain hurdles).

**Negative:**  
- Dependency on third-party OAuth service availability.  
- Extension sutdents may find two-step approval process slower than direct access
- Requires admin interface for managing extension student approvals
- Anyone with the code can join (code leakage risk)

---

## 5. Implementation Notes
- UCSD login through Google Sign-In.  
- Auth.js middleware integrates with Express.  
- Database stores user roles and session tokens.  
- Random code generation for verification.

---

## 6. References
- [UCSD Google Authentication Integration Docs]  
- [Auth.js Documentation](https://authjs.dev)  
- [Initial Technical Design from 10/31 Meeting]
