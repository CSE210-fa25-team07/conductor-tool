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

---

## 2. Decision
- Use **Auth.js** for session and authentication management and **Google OAuth** for identity verification.  
- This simplifies authentication and ensures compatibility with UCSD’s Google-based login infrastructure.  
- UCSD students will have direct google sign-in, leading to automatic account creation after the initial sign up.  
- Extension students will have a pending approval status after direct google sign-in, requiring manual admin activation.  
- Once the account creations are successful, the records will be stored in the database to support future authentication.

---

## 3. Alternatives Considered
- **Firebase Auth:** Managed service, but introduces vendor lock-in.  
- **Custom JWT system:** Flexible but increases maintenance burden and potential security risks.  

---

## 4. Consequences
**Positive:**  
- Secure and familiar authentication flow for users.  
- Simplifies session handling with built-in role hooks.  
- Database-backed sessions enable custom approval workflows for extension students

**Negative:**  
- Dependency on third-party OAuth service availability.  
- Extension sutdents may find two-step approval process slower than direct access
- Requires admin interface for managing extension student approvals

---

## 5. Implementation Notes
- UCSD login through Google Sign-In.  
- Auth.js middleware integrates with Express.  
- Database stores user roles and session tokens.  

---

## 6. References
- [UCSD Google Authentication Integration Docs]  
- [Auth.js Documentation](https://authjs.dev)  
- [Initial Technical Design from 10/31 Meeting]
