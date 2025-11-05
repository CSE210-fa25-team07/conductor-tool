# Architecture Decision Record (ADR)

**ADR #:** 004  
**Title:** Authentication System – Auth.js and Google OAuth Integration  
**Date:** 2025-11-04  
**Status:** Proposed  

---

## 1. Context
The Conductor tool requires secure, role-based user authentication.  
- UCSD students should log in with institutional emails.   
- Multi-tiered role system (Admin, Instructor, TA, Tutor, Team Leader, Student).  

---

## 2. Decision
Use **Auth.js** for session and authentication management and **Google OAuth** for identity verification.  
This simplifies authentication and ensures compatibility with UCSD’s Google-based login infrastructure.

---

## 3. Alternatives Considered
- **Firebase Auth:** Managed service, but introduces vendor lock-in.  
- **Custom JWT system:** Flexible but increases maintenance burden and potential security risks.  

---

## 4. Consequences
**Positive:**  
- Secure and familiar authentication flow for users.  
- Simplifies session handling with built-in role hooks.  

**Negative:**  
- Dependency on third-party OAuth service availability.  

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
