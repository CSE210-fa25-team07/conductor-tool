# **Conductor App Design Document \- Infinite Loopers**

Team Members: Rhea Senthil Kumar, Wayne Wang, Emma Zhang, Gaurav Joshi, Win Htet Aung, Yuri Bukhradze, Braxton Conley, Jialuo Hu, Ethan Huang, Luting Lei, Sree Teja Nadella, Cole Carter, Will Luo

### **Project Background:**

This project aims to build an integrated workflow application that streamlines how instructors, teaching assistants, and students coordinate within a larger (500+) software engineering class environment. The system consolidates key classroom operations across the following features: (1) user authentication and role management, (2) class directory organization, (3) attendance tracking, and (4) daily work journal/standup reporting. By unifying these tools, the platform aims to reduce administrative overhead and improve transparency and accountability across instructional teams.

The core problem we are addressing is the fragmentation of class management tools. Previously, instructors may have relied on multiple disconnected systems (emails, spreadsheets, messaging apps, ad-hoc trackers), making it difficult to maintain accurate records, monitor engagement, and ensure consistent communication. This created inefficiencies, manual work, and opportunities for errors, especially in a software engineering class which relies heavily on team-based version controlled projects to build applications. As enrollment and team-taught courses become larger and more common, the need for a centralized, reliable operational hub has become urgent.

Our goal is to provide a streamlined system that enables secure onboarding of users, clear definition of roles, easy navigation of class directories, accurate attendance logging, and structured daily reporting. Success looks like instructors saving time on logistics, TAs having better visibility into student progress and engagement, and students benefiting from clearer expectations and communication channels. Over time, this foundational infrastructure sets the stage for adding more advanced features such as grading workflows, deliverable tracking, analytics dashboards, and integration with external tools.

Primary users include instructors, course administrators, TAs, and students, with stakeholders spanning academic program leads and operational staff who depend on consistent and accurate records. By consolidating and formalizing these processes into a robust platform, we aim to establish a scalable, maintainable system that supports both current needs and future expansion.

### **Stakeholders**:

The Conductor tool is an application that will interact with potentially thousands of people over the next couple years of varying roles in an academic institution within Software Engineering courses. Such that these stakeholders will have varying responsibilities, interactions, and requirements for this project.

- Professors - Responsible for overseeing and orchestrating the entire course and projects. Needs a hub where to manage large courses, create teams, monitor students, and reduce the overhead of applying a large project to a course of many students.
- Teaching Assistants - Need a dashboard to do things like attendance, progress, blockers, and team health. This will allow efficient processes and help to students that need it.
- Students - Need low friction and quick access to fill out attendance, standup forms, team dashboards, and access to help.
- University Offices - IT offices need to validate authentication, privacy, security, and regulatory compliance.
- Future Teams - Need good documentation to fix, update, or maintain application, aided by low dependency architecture.

### **In Scope**:

- User Management & Authentication: Google sign-in, role-based access (Professor, TA, Tutor, Team Leader, Student), course enrollment via verification codes, profile editing, admin user management and request approval.
- Class Directory: Five views (Dashboard, People, Group, Team Profile, My Profile), searchable roster, role-based profile visibility, team and course link editing, global navigation with course selector.
- Attendance System:  Meeting creation and management, manual and QR code check-in, attendance analytics at class/team/individual levels, calendar views, participant management.
- Work Journal/ Standup Tool: Daily standup submissions, GitHub integration for auto-populating activity, email notifications to TAs, standup history viewing, TA dashboard with participation metrics and sentiment tracking.
- Course & Team Management: Course creation, team configuration
- Performance Monitoring: Built-in metrics dashboard tracking API performance, response times, status codes, and top endpoints with real-time visualization.


### **Out of Scope**:

The project aims to keep an achievable scope within the given time in order to prevent feature creep and deliver our version of the conductor app. With this in mind, we will not be implementing these features, and they are deemed out of scope:

- Group formation tool
- Docs manager
- User story maker
- Done Checklist Tool
- Retrospective runner
- Lab management system queue
- FAQ system
- Reporting engine. 

These features we deemed not to be essential to our version of the conductor app that we would be able to confidently accomplish within the 6 weeks that we had to work together. Any of these features or further improvements are deliberately deferred to later releases of this project.

### **User Stories**:

Professors:

1. As a professor I want to keep track of and monitor all members of the course so I can provide a positive learning experience and appropriate interaction.  
2. As a professor I want an organized and streamlined way to form student teams fairly so that more class time can be dedicated to learning.  
3. As a professor I want to rely on outside surfaces in a safe and future-proof way so that the app is sustainable even as external tools change or go down.   
4. As a professor I want a simple, well-documented, and low dependency app so future staff and students can continue to work on and improve it.
5. As a professor, I want an easy way for me to post notes and information for the students.


TAs: 
1. What I’m looking for is simply a quick way to capture and recall meeting notes or key points later. As long as it lets me jot things down easily and find them when needed, it works. What benefits does having a AI note taker give me in this apart from the traditional way to take notes?  
2. Probably, i am not sure but maybe a way to keep track of each student’s individual participation, something that helps me assess each member’s involvement beyond just the group’s overall progress. For example it could be \- attendance, engagement in meetings, task ownership or any incidents (missed deadlines, conflicts, exceptional contributions). You can think of such metrics and let me know.  
3. The grading itself can stay manual, but the rubric should be clear and structured enough to guide consistency for example, predefined criteria, score ranges, and example descriptions for each level. Maybe, the thought that comes to the top of mind is that probably automation can help calculate totals or visualize grades but the actual judgment should remain with me.
4. As a TA, I want a simple way to review blockers submitted in the daily standups so I can understand which teams are struggling and prepare better for meetings.
5. As a TA, I want a clean dashboard that brings everything together—attendance, standups, notes, participation—so I don’t have to jump across different tools to understand what’s happening with a team.

Tutors:
1. As a tutor, I want to search the existing FAQ by keywords so that I can point students to existing resources efficiently.  
2. As a tutor, I want to attach screenshots, code examples, or videos to FAQ entries so that explanations are clearer for visual learners.  
3. As a tutor, I want to have a help queue system to see and manage the list of students waiting for assistance.  
4. As a tutor, I want to require students to check the FAQ page before they can join the help queue.  
5. As a tutor, I want to have a staff feedback system to send observations and feedback about labs to the main teaching staff.  
6. As a tutor, I want visibility into team standups so I can understand the context behind a student’s blocker rather than starting from zero each time.
   

Questions: 

1. For the queue system, do we need to provide a platform for TA and students to talk? Or just providing a zoom link to students is enough? And do we need to provide a chat-based platform for students who prefer texting?

   

   **Prof’s reply:** Regarding the help queue, your system should not build its own chat or video platform. Instead, it must be flexible and "pluggable." It should act as a coordination tool where TAs and students can simply share how they will communicate, for example, by providing a Zoom link, a Slack username, or an in-person table number.

   

2. What format should the feedback tool take (e.g., a form, a text box) and should tutors be able to tag a specific lab with their comments?

   

   **Prof’s reply:** For the feedback tool, you can proceed with building a form that allows tutors to submit comments and "tag" them to specific labs or assignments.	

3. Is the FAQ system a pre-written FAQ or an online Q\&A platform. If it is a pre-written FAQ, does the tutor need to always update it?

   

   **Prof’s reply:** the FAQ system needs to be flexible to support different professors. Your tool should be built to handle both a static, read-only FAQ (where only staff can add entries) and a dynamic, forum-style Q\&A (where students can post questions and vote on answers). The professor for the course should be able to choose which mode they want to use.

Team Leaders:

1. As a team leader I want an interface where I can efficiently run the team, coordinate the project, and perform my role as a team leader.  
   1. Questions: What features would enable efficient project management/project planning?  
   2. Feature ideas: See point 4  
2. As a team leader I want a focus view for me to holistically track project progress as well as a team tool to track individual member progress.  
   1. Questions: What is a “team tool”? What features should be on that, as well as the focus view?  
   2. Feature ideas:  
3. As a team leader I want to know who is on my team as well as details about them  
   1. Feature ideas: Group page can contain links to student user profiles  
4. As a team leader I want to coordinate team member schedules so that the team can meet easily and split up work equitably.  
   1. Feature ideas: google calendar, when2meet link, assigned work to members  
   2. Project tracker: timeline tool, Member availability, project feature “amount of work” estimation  
5. As a team leader, I need to enter attendance information about team members to aid in understanding participation and fair workload distribution.  
   1. Feature ideas: attendance tracker for meetings, standup log  
6. As a team leader I need to be able to enter private notes about team members so that I can lead them better and inform the teaching staff about positive and negative aspects early and often for equitable workloads and fair evaluation.  
   1. Feature ideas: link to google doc, private notes, email  
7. As a team leader I want to be able to see which students are more participative so that I can delegate work better and lead the team for a better project outcome.  
   1. Feature ideas: use participation tracker from point 5, add sentiment/effort scorecards  
8. As a team leader I want to let the TAs and/or professor know about challenging situations early and often so that I can de-escalate or solve them for a better project outcome.  
   1. Feature ideas: see point 6, email or notes feature  

All Students:

1. Anonymous Feedback Channel  
   1. As a student I want to provide anonymous feedback to teaching staff so that I can voice concerns without fear of negative consequences.  
   2. Feature Ideas:  
* Anonymous feedback form to TAs/professor  
* Optional identity reveal  
* Feedback acknowledgment system  
* Track response status

2. Voice Amplification for Quiet Students

   1. As a non-vocal student I want alternative ways to participate and contribute so that my engagement is recognized even if I don't speak up often in meetings

   2. Feature Ideas:

* Written question submission during class  
* Async discussion boards  
* React/vote on others' comments  
* "Raise hand" queue system  
* Contribution types beyond speaking (documentation, research, etc.)  
3.  Contribution Portfolio  
   1. As a student I want a comprehensive view of all my contributions so that my full effort is visible and fairly evaluated.  
   2. Feature Ideas:  
* Aggregated contribution dashboard  
* GitHub activity (commits, PRs, reviews, issues)  
* Meeting attendance history  
* Work journal entries  
* Document contributions  
* Communication participation  
* Peer collaboration evidence


Misc: 

1. As a system administrator I need to ensure the system complies with FERPA so that we protect student educational records legally.  
2. As a system administrator I need to log security events so that I can detect and investigate issues. (For now, detecting failed login attempts)  
3. As a system I need to encrypt sensitive data at rest so that data is protected if the database is compromised.  
4. As a student with disabilities I need the system to work with assistive technologies so that I can fully participate in the course. (Accessibility features)  
5. As an ESL student I need the site to work when translated so that I can translate it to my preferred language.  
6. As a mobile user I need the site to perform/display well on my mobile device so that I can use it efficiently anywhere.  
7. As a system I need to support the concurrent load so that performance is acceptable during peak usage. (500-1000 users per session)  
8. As a system I need to handle large historical data so that the system works for multiple quarters/years. (10,000+ students)

### **Glossary**:

**ADR (Architectural Decision Record)**
A short document capturing an important technical decision, why it was made, and alternatives considered. Used to maintain architectural consistency over time.

**API Layer**
The HTTP-facing surface of the backend responsible for parsing requests, invoking services, and returning structured JSON responses.

**Authorization Middleware**
Server-side logic that checks whether a user has the permissions required to access a route (e.g., professor-only actions, team-leader-only updates).

**Course Enrollment Verification Code**
A system-generated code used to join a course during account setup. Ensures that only authorized individuals enroll.

**DTO (Data Transfer Object)**
A structured format used to return data to the frontend while hiding internal database details.

**End-to-End (E2E) Flow**
A complete real-user sequence such as login → navigate → perform action → confirm result. Used for manual validation of actual system behavior.

**Mock Data**
Placeholder data used during early development before connecting actual backend or databases. Useful for UI demos and early prototyping.

**OAuth**
External authentication mechanism (e.g., Google) used to verify user identity without storing passwords.

**Session Management**
Mechanism that stores and validates user login state across pages using server-side sessions.

**Standup**
A daily structured report containing: completed work, GitHub activity, planned work, blockers, and reflection. Stored and analyzed in the system.

### **Functional Requirements**:

- Ability to authorize users and give permissions based on roles (e.g. course staff, team leaders, ordinary students).
- Ability to enroll in multiple courses and manage permission for each user for each course independently.
- Ability to create meetings, invite participants, and record attendance.
- Ability to view students’ attendance and meeting participation, as well as schedule of meetings and course items.
- Ability to view student directories by course staff to verify enrollment and students’ status.
- Ability to submit stand ups via dedicated Standup Tool, where team members can communicate with the team.
- Ability to view users’ profiles.
- Difference of views and accessible features based on user permissions and roles.

### **System Requirements**:
1. Platform & Runtime:
   - Node.js
   - npm
   - PostgreSQL (Docker Containerized)
2. Performance: 
   - Server on port 8081
   - Database on port 5433
   - Database connection via Prisma ORM
   - Express session management
   - Database health check
   - RAIL Performance Monitoring
3. Security:
   - OAuth integration for authentication
   - Role-based access control (Admin vs. User)
   - Secrets in .env
   - SendGrid API integration for email service
4. Code Quality:
   - ESLint enforcement to standardize the coding style
   - JSDoc for all functions and classes
   - 3-layer architecture (Routes -> Services -> Repositories)
   - Vitest framework for testing
5. Compatibility:
   - Modern browsers to support HTML5, CSS3, and ES6+ Javascript
   - VanillaJS frontend (no frameworks)
   - RESTful JSON APIs
6. Operational:
   - Docker Compose orchestration for database
   - CI/CD pipeline with automated linting, testing, and documentation via Github actions
   - Version control using Git
7. External Dependencies:
   - OAuth providers
   - SendGrid email service

### **High-Level Sequence Diagram**:

<img width="1053" height="486" alt="Screenshot 2025-12-10 at 8 17 32 PM" src="https://github.com/user-attachments/assets/1224ef16-b067-46d6-91dd-1fc95738f17d" />

<img width="1053" height="486" alt="Screenshot 2025-12-10 at 8 18 26 PM" src="https://github.com/user-attachments/assets/24410eae-bdcf-493c-93a8-f030a15fe588" />

<img width="1053" height="486" alt="Screenshot 2025-12-10 at 8 19 07 PM" src="https://github.com/user-attachments/assets/e0c2eec2-8a96-47b0-bc55-bc5eb30cfea4" />

### **Implementation Components**:

<img width="534" height="497" alt="Screenshot 2025-12-10 at 8 20 17 PM" src="https://github.com/user-attachments/assets/9c42191b-76aa-49dc-90a6-169bf7f61997" />

1. User Management & Authentication

<img width="631" height="360" alt="Screenshot 2025-12-10 at 8 20 51 PM" src="https://github.com/user-attachments/assets/4ea46833-974f-4ff6-8ff9-c5a95a4df0a5" />

<img width="631" height="227" alt="Screenshot 2025-12-10 at 8 21 34 PM" src="https://github.com/user-attachments/assets/ed43e523-e19b-480d-af2d-d78a004b5beb" />

Authorization Middleware

<img width="636" height="142" alt="Screenshot 2025-12-10 at 8 21 56 PM" src="https://github.com/user-attachments/assets/0657bcdc-cd44-4b9e-af48-6f5801b9065b" />


2. Class Directory

<img width="659" height="367" alt="Screenshot 2025-12-10 at 8 22 28 PM" src="https://github.com/user-attachments/assets/c0d59e30-5234-4c65-8bd4-c4d25f72dc6b" />

<img width="639" height="229" alt="Screenshot 2025-12-10 at 8 23 00 PM" src="https://github.com/user-attachments/assets/5c90d4c9-4290-4311-b6a3-60989fdb3725" />

Authorization Rules

<img width="641" height="196" alt="Screenshot 2025-12-10 at 8 23 18 PM" src="https://github.com/user-attachments/assets/f22c45f9-2126-4de2-b5ef-16e8a293929a" />

3. Attendance

<img width="633" height="349" alt="Screenshot 2025-12-10 at 8 23 53 PM" src="https://github.com/user-attachments/assets/14d5498f-ab39-4df7-9c5c-f1ba282966c9" />

<img width="640" height="202" alt="Screenshot 2025-12-10 at 8 24 15 PM" src="https://github.com/user-attachments/assets/0d4c773b-063a-4fab-8d32-74cb9ebae93f" />

Meeting Types

<img width="640" height="144" alt="Screenshot 2025-12-10 at 8 24 31 PM" src="https://github.com/user-attachments/assets/f0a04c03-db56-4197-b0d7-cff9e2be7adf" />

Analytics Endpoints

<img width="653" height="105" alt="Screenshot 2025-12-10 at 8 24 49 PM" src="https://github.com/user-attachments/assets/6ea469cd-29de-4098-9c52-34bc9cb2e7a8" />

4. Work Journal / Stand-Up Tool

<img width="672" height="367" alt="Screenshot 2025-12-10 at 8 31 35 PM" src="https://github.com/user-attachments/assets/0fed112c-2239-4648-a3aa-5c4a68062a9e" />

<img width="654" height="294" alt="Screenshot 2025-12-10 at 8 31 57 PM" src="https://github.com/user-attachments/assets/24cd1cee-7f9a-42b7-be25-d9c6bc7de372" />

Dashboard Data

<img width="651" height="104" alt="Screenshot 2025-12-10 at 8 32 20 PM" src="https://github.com/user-attachments/assets/fe9b2d62-ffdd-4862-aec0-2ad15e9d1287" />

Standup Fields

<img width="658" height="237" alt="Screenshot 2025-12-10 at 8 32 45 PM" src="https://github.com/user-attachments/assets/65039550-2570-4570-bd8b-623522ee5517" />

### **Testing Plan**:
The testing strategy for this project focuses on validating correctness across all major layers of the application: data access, business logic, and API integration. Automated testing is implemented using Vitest, and manual processes are used for end-to-end validation of user workflows.

Unit Tests
Unit tests verify the correctness of small, isolated units of logic. We use Vitest for all unit-level testing.
- Repository Tests
   - Validate database operations such as CRUD functions, query logic, and transaction behavior.
   - Ensure that repository functions interact with the database layer as expected (using test DB/mocks).
- Service Tests
   - Test business logic independently from the API layer.
   - Ensure proper data flow between the repository layer and API layer.
   - Verify input validation, error handling, and branching logic.
- Integration Tests
   - Exercise API endpoints through the actual routing, middleware, and service layers.
   - Validate that full request → processing → response flows behave correctly.
   - Confirm API responses, status codes, side effects, and error cases.
   - Use Supertest to set up HTTP requests

Manual End-to-End (E2E) Testing
Although not automated at this stage, we perform manual end-to-end testing to verify end-user workflows and ensure that the entire system behaves correctly in real-world scenarios.
Typical manual E2E tests include:
- Full user flows (e.g., authentication, form submission, content creation).
- Cross-page navigation.
- Validation of UI behavior and error states.
- Checking interactions between frontend and backend in a production-like environment.
If we had more time, automated E2E testing (e.g., with Playwright or Cypress) may be introduced.

### **Development Plan**:
The project follows an incremental, feature-driven development workflow. Each feature is developed end-to-end across backend and frontend, and immediately validated through unit and integration tests before merging into the shared development branch. The development can be divided into following phases.

Planning & Requirements Consolidation
- Collect requirements from all stakeholder groups (professors, TAs, tutors, team leaders, students).
- Convert requirements into user stories that clearly describe what each role needs.
- Define what is in scope vs. out of scope for this quarter.

System Architecture & Environment Setup
- Establish backend architecture using a modular layering pattern (Api → services → repositories → database).
- Set up Prisma schema, migrations, and Dev/Prod DB environments.
- Configure Docker Compose for consistent local execution.
- Create common frontend utilities (template loader, user context, API helpers).

Iterative Feature Development (Implementation + Unit Testing Together)
Each feature is implemented end-to-end:
- Implement database operations.
- Implement business logic, input validation, error handling.
- Add API routes 
- Build UI components and pages.
- Connect APIs through fetch calls.

Continuous Integration & Code Review
- All work happens on feature branches.
- PRs must include:
   - updated tests
   - screenshots (if frontend)
   - migration files (if schema changed)
- PR reviews ensure consistent architecture and minimize merge conflicts.


### **Lessons Learned:**
Throughout the development of the Conductor App, the Infinite Loopers team encountered several process and technical challenges that shaped our workflow. Below are the key takeaways derived from our sprint retrospectives and final delivery.

Team Structure: Vertical Slicing vs. Horizontal Layering
- The Experience: Initially, we considered separating into Frontend and Backend teams. However, we shifted to "Feature Teams" (Vertical Slicing), where sub-teams owned specific domains (e.g., Auth, Attendance) end-to-end.
- The Lesson: This structure significantly improved individual ownership and allowed teams to move fast without blocking each other. However, it created "silos," leading to inconsistent coding styles and confusion regarding how features would eventually interact.
- Future Improvement: While feature teams are effective, we learned that a "core architecture" team or distinct "integration milestones" are necessary early on to enforce shared standards (styles, API response formats) before features drift too far apart.

The Cost of Deferred Integration ("Git Merge Hell")
- The Experience: As noted in our Sprint 2 and Sprint 5 retrospectives, delaying the integration of independent features led to significant friction. We faced "Git merge hell" and complex conflicts when combining the Class Directory, Attendance, and Auth systems late in the process.
- The Lesson: Integration is not a phase to be left for the end; it must be continuous. Mock data served us well for demos, but delaying the connection to the live database and shared components obscured architectural incompatibilities until they became critical blockers.

Documentation as a Development Dependency
- The Experience: A recurring theme in our "Sad" retrospective columns was the lack of up-to-date documentation. We found that when ADRs (Architectural Decision Records) and API specs were not updated in real-time, cross-team communication broke down, and onboarding new members or debugging other teams' code became difficult.
- The Lesson: Documentation cannot be an afterthought or a "chore" to be done before submission. It must be treated as part of the "Definition of Done" for every Pull Request to ensure maintainability.

Stakeholder Feedback Loops
- The Experience: Our Sprint 1 and 2 demos were crucial. The professor’s feedback regarding the "pluggable" nature of the help queue and the flexibility of the FAQ system saved us from over-engineering features that weren't required (e.g., building a custom chat platform).
- The Lesson: Early prototyping and exposing "rough" work to stakeholders is more valuable than perfecting a feature based on assumptions. It allowed us to pivot our scope (as seen in the FAQ and Help Queue requirements) before sinking time into code.

Technical Standardization
- The Experience: We struggled with styling alignment and inconsistent folder structures across different feature directories.
- The Lesson: A shared design system (or strict UI component library) and a rigid folder structure skeleton should be established in Sprint 0. Relying on ad-hoc styling by separate teams leads to a disjointed user experience that is difficult to unify later
