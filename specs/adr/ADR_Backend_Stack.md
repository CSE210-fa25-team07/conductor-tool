# Architecture Decision Record (ADR)

**ADR #:** 003  
**Title:** Backend Framework – Node.js with Express.js and HTMX  
**Date:** 2025-11-04  
**Status:** Proposed  

---

## 1. Context
The backend needed a lightweight server to handle user management, attendance, and journaling APIs.  
- Should integrate with PostgreSQL.  
- Should enable partial dynamic updates without a full frontend framework.  

---

## 2. Decision
Implement backend using **Node.js** with **Express.js** for routing and **HTMX** for minimal dynamic updates.  
This combination allows rapid API development, server-side rendering, and low client overhead.

---

## 3. Alternatives Considered
- **Flask/Django (Python):** Strong ecosystems but adds language heterogeneity and overhead.  
- **Spring Boot (Java):** Too heavy for project’s timeline and scale.  

---

## 4. Consequences
**Positive:**  
- Familiar JavaScript stack across frontend and backend.  
- Simple deployment and flexible REST endpoints.  

**Negative:**  
- Node.js single-threaded nature may need load balancing for scaling.  
- HTMX less common; limited debugging resources.  

---

## 5. Implementation Notes 
- HTMX used for partial HTML updates (e.g., standup logs).   

---

## 6. References
- [Initial Technical Design from 10/31 Meeting]  
- [Express.js Docs](https://expressjs.com)  
- [HTMX Docs](https://htmx.org)
