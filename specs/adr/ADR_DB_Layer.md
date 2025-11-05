# Architecture Decision Record (ADR)

**ADR #:** 005  
**Title:** Database Technology – PostgreSQL  
**Date:** 2025-11-04  
**Status:** Proposed  

---

## 1. Context
The application needs a reliable relational database to manage users, teams, attendance, and standups.  
- Should integrate seamlessly with Node.js backend.  
- Expected user scale: 10000+.  

---

## 2. Decision
Select **PostgreSQL** as the database engine.  
Postgres offers strong consistency, relational modeling, and robust tooling for data integrity.

---

## 3. Alternatives Considered
- **MySQL:** Similar relational model but weaker JSON and indexing support.  
- **MongoDB:** Flexible schema but unnecessary for structured academic data.  

---

## 4. Consequences
**Positive:**  
- Easy integration via `pg` library in Node.js.  
- Strong data integrity and relational capabilities.  

**Negative:**  
- Heavier setup for local environments.  
- Requires containerized deployment for consistency.  

---

## 5. Implementation Notes
- Database container connected to backend via Docker network.  
- Schema includes `students`, `instructors`, `courses`, `teams`, and `attendance`. Will include more tables within features to be determined.

---

## 6. References
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)  
- [10/31 Meeting Notes – DB Structure Section]
