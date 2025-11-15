# Sprint 2 Review
**Meeting Date:** November 14, 2025
**Attendance:** Yuri, Rhea, Braxton, Cole, Ethan, Jialuo, Win, Sree, Wayne, Gaurav, Emma, Will

---

## Agenda

- Sprint Review
- Good Git Practices
- Feature Team Updates (Which issues were completed this week?)
- Action Items (Goals to complete for upcoming sprint)

---

## Team Updates

### **Login / Auth Team**

**Completed This Sprint:**
- OAuth login and authentication implementation
- JSON-based auth (no database dependency yet - logic is transferable)
- OAuth backend integration

**Key Learnings:**
- Successfully implemented OAuth flow
- Backend authentication logic is ready for database integration

**Action Items for Next Sprint:**
- Create assigned database schemas
- Backend/database integration
- Admin user functionality: adding and viewing users
- Dashboard improvements after authentication

---

### **Class Directory Team**

**Completed This Sprint:**
- Frontend database queries/schema planning
- Initial directory structure implementation

**Key Challenges:**
- Managing complexity of directory features
- Maintaining cohesiveness with main branch

**Action Items for Next Sprint:**
- Create assigned database schemas
- Database data integration
- Connect live backend to frontend
- Complete directory functionality

---

### **Attendance Team**

**Completed This Sprint:**
- Figma planning (proved very useful)
- Frontend implementation with mock data for demo
- Split team responsibilities for different sections of attendance

**Key Learnings:**
- Figma planning upfront was valuable for alignment
- Team splitting strategy worked well for parallel development

**Action Items for Next Sprint:**
- Create assigned database schemas
- Database for meeting and attendance data
- Student and instructor implementation
- Backend integration with frontend

---

### **Standup Team**

**Completed This Sprint:**
- HTML demo completed early
- Standup pages fully implemented
- Team dashboard, individual history, and TA dashboard views

**Key Learnings:**
- Early HTML demo was useful for stakeholder presentation
- Process was smooth overall
- Standalone feature made implementation easier

**Action Items for Next Sprint:**
- Create assigned database schemas
- Wire existing frontend to new backend
- GitHub connection for GitHub Projects integration
- Email bot for important updates

---

## Git Best Practices Discussion

**Led by:** Ethan

**Key Topics Covered:**
- Git workflow improvements
- Ethan's workflow documentation
- PR best practices:
  - Fill out PR templates completely
  - Use keywords to automatically close issues (e.g., "Closes #123")
- Documentation standards for PRs and commits

---

## Sprint-Wide Action Items

### **All Feature Teams**
| Task | Details | Priority |
|------|---------|----------|
| Create assigned database schemas | Each team must define and document their database schema | High |
| Backend integration | Connect frontend mock data to real backend/database | High |

### **Team Communication**
| Task | Owner | Details |
|------|-------|---------|
| Implement mid-sprint feature team check-ins | Sprint leads | Regular check-ins to monitor progress |
| Communicate directly with feature teams | All members | Encourage direct communication rather than only through leads |

### **Resource Experts Identified**
- **Frontend Gurus:** Wayne, Gaurav
- **Backend Gurus:** Sree, Braxton
- **Database Gurus:** Yuri, Will

*Team members should reach out to these experts for guidance in their respective areas.*

---

## Sprint 3 Planning

### **Common Goals Across All Teams**
1. **Database Schema Creation** - All teams must finalize and implement their schemas
2. **Backend Integration** - Transition from mock data to live backend
3. **Database Integration** - Connect all features to the database
4. **Testing** - Ensure features work end-to-end

### **Team-Specific Goals**

**Login/Auth Team:**
- Admin user management
- Dashboard post-authentication improvements
- Role-based access control

**Class Directory Team:**
- Live backend connection
- Complete database integration
- User and team roster functionality

**Attendance Team:**
- Student and instructor views
- Meeting and attendance data persistence
- QR code integration

**Standup Team:**
- GitHub Projects integration
- Email notification bot
- Backend data persistence

---

## References

- [Conductor Tool Repository](https://github.com/CSE210-fa25-team07/conductor-tool)
- [Sprint 2 Retrospective](./111425-retrospective.md)


## Design Meeting Tab Notes

### Database Design

#### Class Term - ASSIGNED: user management & auth
- Term_uuid (PK)
- year
- season
- start_date: timestamp
- end_date: timestamp
- is_active: boolean

#### Users - ASSIGNED: user management & auth
- user_uuid (PK)
- email
- first_name
- last_name
- Photo_url
  - TODO: storage
- pronouns
- Bio: string
- phone_number
- github_username
- last_login: timestamp

#### Staff_profiles - ASSIGNED: user management & auth
- user_uuid (PK, FK)
  - From users table
- office_location
- research_interests
- Personal_website
- Is_prof
- is_system_admin

#### Courses - ASSIGNED: user management & auth, class directory
- course_uuid (PK)
- course_code
- course_name
- term_uuid (FK)
- description
- syllabus_url
- canvas_url
- lecture_uuid (FK)

#### Course_enrollment - ASSIGNED: user management & auth, class directory
- User_uuid (PK, FK)
- Course_uuid (PK, FK)
- enrollment_status
- enrolled_at
- Dropped_at
- Role_uuid (PK, FK)

#### Role - ASSIGNED: user management & auth
- Role_uuid (PK)
- role

#### Meeting - ASSIGNED: attendance
- meeting_uuid (PK)
- creator_uuid (FK)
- course_uuid (FK)
- meeting_type (int)
- meeting_date
- meeting_start_time
- meeting_end_time
- Location [string]
- Meeting_description
- Is_recurring [boolean]
- parent_meeting_uuid
- Day
- meeting_type

#### Participants - ASSIGNED: attendance
- Meeting_uuid (FK)
- Participant_uuid (FK) (together with meeting_uuid constitutes PK)
- Present [boolean]
- Attendance_time [datetime] (can be null)

#### Meeting_codes - ASSIGNED: attendance
- code_uuid
- Meeting_code [varchar]
- Meeting_uuid (FK)
- Qr_code_link [url]
- valid_start_datetime
- valid_end_datetime [timestamp]

#### Teams - ASSIGNED: class directory
- team_uuid (PK)
- course_uuid (FK)
- team_name
- team_page_url
- Repo_url
- team_ta_uuid (FK)

#### Team_members - ASSIGNED: class directory
- Team_uuid (FK)
- User_uuid (FK)
- Joined_at
- Left_at

#### Standups - ASSIGNED: Standup
- Standup_uuid (PK)
- user_uuid (FK)
- Team_uuid (FK)
- Course_uuid (FK)
- Date_submitted
- What_done
- what_next
- Blockers
- Reflection
- Sentiment_score
- Visibility
- Created_at
- Updated_at

#### Standup_comments - ASSIGNED: Standup
- Comment_uuid (PK)
- Standup_uuid (FK)
- Commenter_uuid (FK)
- Comment_text
- Created_at
- Updated_at

#### Standup_notifications - ASSIGNED: Standup
- Notif_uuid (PK)
- Sender_uuid (FK)
- Receiver_uuid (FK)
- Standup_uuid (FK)
- Message
- Status
- Created_at

#### Sentiment_logs - ASSIGNED: Standup
- Log_uuid (PK)
- Standup_uuid
- Sentiment_score
- Detected_keywords [json]
- Created_at

#### Verification_code - ASSIGNED: user management & auth
- Course_uuid (PK, FK)
- Role_uuid (PK, FK)
- Veri_code
- Is_active

#### Request_form - ASSIGNED: user management & auth
- Form_uuid (PK)
- First_name
- Last_name
- Email
- Institution
- verification_code

---

### Unknowns
- Storage of qr codes / user profile photo
- Participants, course_enrollment, user profile page should be per course?

### Additional Notes
- Put meeting on student dashboard to offer faster class attendance
- Dashboard with attendance analytics
  - Students shows for their course
  - professor/TAs show class attendance

---

### Action Items
- Tables assigned to feature subteams above, due on 11/15/2025
- Braxton to send out how-to Lucid Chart end of 11/14/2025
- Yuri, Will to make database and join tables, end of 11/16/2025
- Collaborate with dependent teams on schema
- Find migration tool

### Git Workflow Reminders
- Save your changes locally, pull into, push to your branch, then PR to merge back into main

### Sprint Planning Notes
- Mid Sprint meeting - check in with feature teams
- Subteam meetings throughout the sprint


