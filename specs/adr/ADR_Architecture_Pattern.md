# Architecture Decision Record (ADR)

**ADR #:** 001  
**Title:** MVC Architecture with Multi-Container Deployment  
**Date:** 2025-11-04  
**Status:** Proposed  

---

## 1. Context
The project requires a scalable and modular architecture to support separate concerns across the frontend, backend, and database.  
- The system must support up to 1000 concurrent users.  
- Development teams are divided by feature modules (User Management, Attendance, Work Journal, etc.).  
- Current goal: lightweight deployment for local testing and later transition to cloud hosting.  

---

## 2. Decision
We will adopt an **MVC (Model–View–Controller)** structure deployed via **three Docker containers**:  
- Frontend (HTML/CSS/VanillaJS)
- Backend (Node.js)
- Database (PostgreSQL) 

This ensures clean separation of concerns, isolated environments, and simplified local development and integration testing.

---

## 3. Alternatives Considered
- **Monolithic Application:** Easier initial setup but limits scalability and parallel development.  
- **Microservices Architecture:** Higher scalability but introduces orchestration complexity and overhead not justified by project size.  

---

## 4. Consequences
**Positive:**  
- Improves maintainability and isolation of changes.  
- Easier to containerize and deploy via Docker Compose.  
- Enables independent scaling and debugging.  

**Negative:**  
- Requires setup of inter-container communication.  
- Increased complexity for small teams.  

---

## 5. Implementation Notes 
- Communication between backend and database through environment variables and network bridge.  
- Ensure persistent data storage using Docker volumes.

---

## 6. References
- [Miro Board – Initial Architecture Diagram](https://miro.com/app/board/uXjVN4iTFac=/?share_link_id=983680778424)  
- Internal Design Meeting Notes (10/31)
