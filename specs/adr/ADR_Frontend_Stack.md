# Architecture Decision Record (ADR)

**ADR #:** 002  
**Title:** Frontend Technology – HTML, CSS, and VanillaJS  
**Date:** 2025-11-04  
**Status:** Proposed  

---

## 1. Context
The team needed a simple, browser-compatible frontend for the Conductor app.  
- Must run in all browsers with no dependency on heavy frameworks.  
- UI is largely form-based (attendance, standup, class directory).
- Must withstand dependency changes over time.  
- The project emphasizes speed and low learning curve for contributors.  

---

## 2. Decision
Use **HTML, CSS, and Vanilla JavaScript** as the frontend stack with no external frameworks.  
This ensures simplicity, broad browser support, and direct control over DOM manipulation.

---

## 3. Alternatives Considered
- **React:** Modular and scalable but requires build setup (Webpack, Babel), adds uncertainty in the future, and overhead.  
- **Vue.js:** Easier than React but still introduces framework dependency, and adds uncertainty in the future.  
- **Svelte:** Compiles efficiently but unfamiliar to most contributors.  

---

## 4. Consequences
**Positive:**  
- Minimal dependencies and fast load times.  
- Easy for all team members to understand and contribute to.  
- Will withstand tool and dependency changes.

**Negative:**  
- Lacks reactive component system; more manual DOM handling.  
- Harder to scale UI complexity if features expand.  

---

## 5. Implementation Notes
- CSS avoids absolute pixels for responsive layout across environments.  
- JavaScript modules structured by feature folder.  
- Consider future refactor to lightweight library (e.g., HTMX partial integration).

---

## 6. References
- [Initial Technical Design Notes – Framework Selection]  
- [10/31 Meeting Miro Board](https://miro.com/app/board/uXjVN4iTFac=/?share_link_id=983680778424)
