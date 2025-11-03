## **1\. Feature Consolidation & Analysis**

### **1.1 Consolidated Features from User Stories**

Through analysis of the provided user stories, I identified 13 core features with significant overlap reduction:

**MVP Features (Priority Order):**

1. **User Management & Authentication**  
2. **Class Directory**  
3. **Attendance System**  
4. **Work Journal / Stand-up Tool**  
5. **Team Formation Tool**  
6. **Evaluation Journal**  
7. **Help Queue System**  
8. **FAQ System**

**Post-MVP Features:**

9. **Student Contribution Portfolio**  
10. **Anonymous Feedback System**  
11. **Staff Feedback Tool**  
12. **Team Leader Dashboard**  
13. **Participation Tracking System**

---

### **1.2 Feature Details**

#### **Feature 1: User Management & Authentication**

**Purpose:** Secure, role-based access control with FERPA compliance

**User Stories Addressed:**

* Professor needs to track all course members  
* System administrator needs FERPA compliance  
* System administrator needs security event logging  
* System needs to encrypt sensitive data at rest

**Key Requirements:**

* Five role levels: Professor, Teaching Assistant, Tutor, Team Leader, Student  
* Configurable role permissions (not hard-coded)  
* Google OAuth authentication only  
* Security logging for login/logout, private data access, failed login attempts  
* Provisioning code or verification phase for student sign-up  
* Encryption at rest for sensitive database fields

---

#### **Feature 2: Class Directory**

**Purpose:** Central roster and profile management for all course participants

**User Stories Addressed:**

* Professor wants to keep track of all course members  
* Team leader wants to know who is on their team  
* TA wants a list of all groups and members

**Key Requirements:**

* Searchable, filterable roster view  
* Rich user profiles including: name, pronunciation guide, pronouns, photo/avatar, contact information (class chat, social media, phone), availability (general and specific times)  
* Group organization with: team name, logo, mantra/mission, communication links (Slack/Mattermost, GitHub repo), member list with role indicators  
* Multiple view modes: by role (professors, TAs, students), by team, by individual  
* Mobile-responsive design

---

#### **Feature 3: Attendance System**

**Purpose:** Fast, mobile-optimized attendance tracking for lectures and meetings

**User Stories Addressed:**

* TA/Professor need quick attendance entry (\<1 minute)  
* Team leader needs to enter team member attendance  
* System needs mobile-friendly interface

**Key Requirements:**

* Mobile-first design with photo-based roster  
* Quick tap interface (present/absent toggle)  
* Support for lecture and team meeting contexts  
* Real-time submission with offline capability  
* Dashboard views showing: team-based attendance percentages, class-level overview, time-series visualization, automated alerts for concerning attendance patterns  
* Historical data access for evaluation purposes

---

#### **Feature 4: Work Journal / Stand-up Tool**

**Purpose:** Daily logging of work, sentiment, and communication needs

**User Stories Addressed:**

* Student wants their work to be fully captured  
* Team leader wants to see which students are participative  
* Team leader needs to know about team member progress  
* Non-vocal student wants alternative participation methods

**Key Requirements:**

* Lightweight, frequent-use form with fields for: work accomplished, upcoming work, blockers/concerns, sentiment ratings (self, team, course)  
* Private reach-out mechanism to team leader, TA, or professor  
* Multiple entry methods: web form, potential future integration with chat bots or email  
* Viewable by team leaders and teaching staff  
* Aggregation into contribution portfolio  
* Sentiment tracking over time for early intervention

---

#### **Feature 5: Team Formation Tool**

**Purpose:** Automated, fair team creation to replace manual Google Forms workflow

**User Stories Addressed:**

* Professor wants an organized way to form teams fairly  
* Professor wants to dedicate more class time to learning (not admin tasks)

**Key Requirements:**

* Roster upload or enrollment system sync  
* Student profile/preference collection (optional)  
* Configurable team formation algorithm with parameters for: team size, skill distribution, availability matching, diversity considerations  
* Manual override capability for professor adjustments  
* Team assignment to TAs  
* Automated notification to students and staff upon team publication  
* Integration with Class Directory for immediate visibility

---

#### **Feature 6: Evaluation Journal**

**Purpose:** Private observation notes for fair, evidence-based evaluation

**User Stories Addressed:**

* Team leader needs to enter private notes about team members  
* TA/Professor need to write notes about groups and individuals  
* Team leader wants to let TAs/professor know about challenges early

**Key Requirements:**

* Private note-taking interface for professors, TAs, and team leaders  
* Tagged observations with: timestamp, location (lab, office hours, lecture, meeting), subject (individual or group), sentiment score, detailed notes  
* Configurable visibility controls: can be shared between staff roles, optional sharing with team leaders  
* Searchable and filterable by student, team, date range  
* Audit trail of who viewed observations  
* Aggregation for final evaluation and grading  
* Support for early intervention flagging

---

#### **Feature 7: Help Queue System**

**Purpose:** Coordination tool for student help requests with pluggable communication

**User Stories Addressed:**

* Tutor wants a help queue to manage students waiting for assistance  
* Tutor wants to require FAQ check before joining queue  
* Professor wants pluggable, not built-in, communication tools

**Key Requirements:**

* Student request form with: topic/category selection, brief problem description, communication preference field (Zoom link, Slack username, in-person location)  
* Mandatory FAQ gate before queue entry  
* Real-time queue display for tutors/TAs showing: student name, wait time, topic, problem summary, preferred communication method  
* Queue management actions: claim ticket, mark in-progress, mark resolved, escalate to TA/professor  
* Status notifications to students (position in queue, claimed by staff, ready to connect)  
* Historical analytics: average wait time, common topics, resolution rates  
* Integration with FAQ system to add common issues as articles

**Critical Design Decision:** The system does NOT build its own chat or video platform. It acts purely as a coordination tool where staff and students share how they will communicate (Zoom link, Slack handle, table number, etc.).

---

#### **Feature 8: FAQ System (Dual Mode)**

**Purpose:** Flexible knowledge base that adapts to different teaching styles

**User Stories Addressed:**

* Tutor wants to search FAQ by keywords to point students to resources  
* Tutor wants to attach rich media (screenshots, code, videos) to entries  
* Professor needs flexibility to choose static or dynamic Q\&A mode

**Key Requirements:**

* **Mode 1 \- Static FAQ (Staff-Curated):** Staff-only content creation, organized by categories, rich media support (images, video embeds, code blocks), keyword search, usage analytics  
* **Mode 2 \- Dynamic Q\&A Forum:** Student question posting, multiple answers per question, voting/upvoting system, "helpful answer" marking by staff, sorting options (recent, popular, unanswered)  
* Shared features across both modes: powerful search with keyword highlighting, tagging system, integration with help queue (search before joining), mobile-responsive layout  
* Professor-configurable mode selection per course  
* Optional student contribution in static mode (submit suggestions for review)

---

#### **Feature 9: Student Contribution Portfolio (Post-MVP)**

**Purpose:** Aggregated view of all student work for fair evaluation

**User Stories Addressed:**

* Student wants a comprehensive view of all contributions  
* Student wants their full effort to be visible and fairly evaluated

**Key Requirements:**

* Automated aggregation from multiple sources: GitHub activity (commits, PRs, reviews, issues), meeting attendance history, work journal entries, document contributions, communication participation metrics  
* Visual dashboard with contribution timeline  
* Exportable reports for student and teaching staff  
* Comparison views (individual vs. team average)  
* Evidence collection for evaluation discussions

---

#### **Feature 10: Anonymous Feedback System (Post-MVP)**

**Purpose:** Safe channel for students to voice concerns

**User Stories Addressed:**

* Student wants to provide anonymous feedback without fear of consequences

**Key Requirements:**

* Anonymous submission form accessible to all students  
* Optional identity reveal mechanism  
* Feedback routing to appropriate staff (TA, professor)  
* Acknowledgment system (staff can respond to feedback anonymously)  
* Status tracking (submitted, acknowledged, addressed)  
* Analytics on feedback themes

---

#### **Feature 11: Staff Feedback Tool (Post-MVP)**

**Purpose:** Tutor observations about lab effectiveness

**User Stories Addressed:**

* Tutor wants to send observations and feedback about labs to teaching staff

**Key Requirements:**

* Form-based feedback submission  
* Tagging to specific labs or assignments  
* Viewable by TAs and professors  
* Aggregation for curriculum improvement  
* Historical tracking across quarters

---

#### **Feature 12: Team Leader Dashboard (Post-MVP)**

**Purpose:** Centralized project management view for team leaders

**User Stories Addressed:**

* Team leader wants an interface to efficiently run the team  
* Team leader wants a focus view to track project progress  
* Team leader wants to coordinate schedules and delegate work

**Key Requirements:**

* Holistic team overview showing: member roster with recent activity, attendance patterns, work journal summaries, sentiment trends, upcoming meetings/deadlines  
* Project progress tracking: timeline visualization, task assignment, workload distribution  
* Schedule coordination tools: availability overlap display, meeting scheduler integration, work allocation helper  
* Quick access to evaluation note entry  
* Alert mechanism for concerns  
* Integration with team communication tools

---

#### **Feature 13: Participation Tracking System (Post-MVP)**

**Purpose:** Capture in-class engagement with alternative contribution methods

**User Stories Addressed:**

* Non-vocal student wants alternative ways to participate  
* Team leader wants to see which students are more participative  
* Professor wants to track participation for evaluation

**Key Requirements:**

* In-class question submission (written, async)  
* "Raise hand" digital queue  
* Reaction/voting system for comments  
* Discussion board for async participation  
* Contribution type logging (speaking, documentation, research, facilitation)  
* Analytics dashboard for participation patterns  
* Recognition of diverse contribution types beyond speaking

---

## **2\. User Flows**

### **Flow A: Student Gets Help via Help Queue**

**Actors:** Student, Tutor/TA

**Steps:**

1. Student encounters a problem and navigates to Help Queue  
2. System prompts student to search FAQ first (required gate)  
3. Student searches FAQ with keywords  
4. If FAQ doesn't resolve issue, student clicks "Still Need Help"  
5. Student fills out help request form:  
   * Selects topic/category from dropdown  
   * Writes brief description of problem  
   * Specifies communication preference (Zoom link they'll provide, Slack username, or in-person table number)  
6. Student submits request and joins queue  
7. System displays real-time queue position to student  
8. Tutor/TA views queue, sees student request with all details  
9. Tutor/TA claims ticket and provides communication method based on student's preference  
10. Student receives notification with connection method  
11. Student and tutor connect via the provided method (outside the system)  
12. Tutor marks ticket as resolved after helping student  
13. System prompts tutor: "Was this a common issue? Add to FAQ?"  
14. Optional: Tutor adds entry to FAQ for future students

**Key Points:**

* FAQ search is mandatory before queue entry  
* Communication happens outside the system via pluggable methods  
* System only coordinates the connection, not the actual help session

---

### **Flow B: Team Leader Tracks and Manages Team**

**Actors:** Team Leader, Team Members, TA/Professor

**Steps:**

1. Team leader logs in and sees team leader dashboard  
2. Dashboard displays team health overview:  
   * Attendance percentages for each member  
   * Work journal completion rates  
   * Recent sentiment indicators  
3. Team leader clicks on a team member's profile  
4. System displays detailed member view:  
   * Full attendance history  
   * All work journal entries  
   * Contribution portfolio summary  
   * Any existing evaluation notes (if team leader has access)  
5. Team leader reviews member's recent journals and notices concerning sentiment or missing entries  
6. Team leader adds private evaluation note about observation  
7. Team leader marks note as visible to TA/Professor for early intervention  
8. System sends notification to assigned TA about the concern  
9. TA reviews the flag and evaluation notes  
10. TA reaches out to student for check-in  
11. Team leader monitors situation through continued journal reviews and attendance tracking

**Key Points:**

* Proactive monitoring through aggregated data  
* Early intervention through evaluation notes  
* Communication escalation to teaching staff  
* Evidence-based leadership decisions

---

### **Flow C: Professor Forms Teams at Course Start**

**Actors:** Professor, Students, TAs

**Steps:**

1. Professor logs in at beginning of quarter  
2. Professor navigates to Team Formation Tool  
3. Professor uploads course roster from CSV or syncs from enrollment system  
4. System imports student data and creates profiles  
5. Professor optionally distributes student preference survey (skills, availability, interests)  
6. Students complete preference survey if provided  
7. Professor configures team formation parameters:  
   * Team size (e.g., 5-6 members)  
   * Number of teams  
   * Skill distribution preferences  
   * Availability overlap requirements  
   * Any manual constraints (e.g., keep certain students together/apart)  
8. Professor runs team formation algorithm  
9. System generates proposed teams and displays preview  
10. Professor reviews teams and manually adjusts if needed:  
* Drag-and-drop students between teams  
* Designate team leaders  
* Assign TAs to teams  
11. Professor approves final team composition  
12. System publishes teams to Class Directory  
13. System sends notifications to all students with their team assignment  
14. System sends notifications to TAs with their assigned teams  
15. Teams become visible in Class Directory with full member details

**Key Points:**

* Automated but not fully autonomous (professor maintains control)  
* Replaces tedious manual Google Forms workflow  
* Immediate integration with Class Directory  
* Clear TA assignment for oversight

---

### **Flow D: TA Takes Lecture Attendance (Mobile)**

**Actors:** TA, Students

**Steps:**

1. TA arrives at lecture with mobile device  
2. TA opens Conductor app on phone  
3. TA navigates to Attendance section  
4. System detects current day/time and suggests "Lecture 8 \- Oct 28, 2pm"  
5. TA confirms or selects different lecture session  
6. System displays photo roster of all students  
7. System defaults all students to "Present" status  
8. TA quickly taps photos of absent students to mark them absent  
9. TA reviews count: "Present: 57/60"  
10. TA submits attendance (total time: \<1 minute)  
11. System records attendance and updates student records  
12. System updates team attendance dashboards in real-time  
13. If student has concerning attendance pattern (e.g., 3+ absences), system flags for TA review  
14. Attendance data becomes available in team leader and professor dashboards  
15. Attendance contributes to overall student contribution portfolio

**Key Points:**

* Mobile-optimized for speed (\<1 minute goal)  
* Photo-based interface for quick identification  
* Default present reduces taps needed  
* Real-time updates across all views  
* Automated alerts for intervention

---

### **Flow E: Student Completes Daily Work Journal**

**Actors:** Student, Team Leader, TA

**Steps:**

1. Student receives reminder notification (optional: daily at set time)  
2. Student navigates to Work Journal section  
3. System displays simple form with three main sections:  
   * What did you accomplish today?  
   * What are you working on next?  
   * Any blockers or concerns?  
4. Student writes brief entries in each section  
5. System prompts sentiment check with emoji scale:  
   * How are you feeling about yourself? (student selects emoji)  
   * How are you feeling about your team? (student selects emoji)  
   * How are you feeling about the course? (student selects emoji)  
6. System displays optional private note field: "Need to reach out to your team leader, TA, or professor?"  
7. Student optionally writes private concern  
8. Student submits journal entry  
9. System saves entry and marks completion for the day  
10. If private note was included, system notifies appropriate recipient  
11. Team leader views team dashboard and sees:  
    * All team members' journal completion status  
    * Recent entries (without private notes)  
    * Sentiment trends  
12. Team leader notices one member has consistently negative sentiment  
13. Team leader adds evaluation note about observation and plans check-in  
14. Journal entries contribute to student's contribution portfolio

**Key Points:**

* Lightweight, frequent-use design encourages daily completion  
* Sentiment tracking provides early warning signals  
* Private communication channel for concerns  
* Visible to team leaders for coordination  
* Aggregates into evaluation data