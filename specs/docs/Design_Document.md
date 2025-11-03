# **Conductor App Design Document \- Infinite Loopers**

Team Members: Rhea Senthil Kumar, Wayne Wang, Emma Zhang, Gaurav Joshi, Win Htet Aung, Yuri Bukhradze, Braxton Conley, Jialuo Hu, Ethan Huang, Luting Lei, Sree Teja Nadella, Cole Carter

### **Project Background:** 

### **Stakeholders**: 

* 

### **In Scope**: 

* 

### **Out of Scope**: 

### **User Stories**:

Professors:

1. As a professor I want to keep track of and monitor all members of the course so I can provide a positive learning experience and appropriate interaction.  
2. As a professor I want an organized and streamlined way to form student teams fairly so that more class time can be dedicated to learning.  
3. As a professor I want to rely on outside surfaces in a safe and future-proof way so that the app is sustainable even as external tools change or go down.   
4. As a professor I want a simple, well-documented, and low dependency app so future staff and students can continue to work on and improve it.

TAs: 

1. What I’m looking for is simply a quick way to capture and recall meeting notes or key points later. As long as it lets me jot things down easily and find them when needed, it works. What benefits does having a AI note taker give me in this apart from the traditional way to take notes?  
2. Probably, i am not sure but maybe a way to keep track of each student’s individual participation, something that helps me assess each member’s involvement beyond just the group’s overall progress. For example it could be \- attendance, engagement in meetings, task ownership or any incidents (missed deadlines, conflicts, exceptional contributions). You can think of such metrics and let me know.  
3. The grading itself can stay manual, but the rubric should be clear and structured enough to guide consistency for example, predefined criteria, score ranges, and example descriptions for each level. Maybe, the thought that comes to the top of mind is that probably automation can help calculate totals or visualize grades but the actual judgment should remain with me.

Tutors:

1. As a tutor, I want to search the existing FAQ by keywords so that I can point students to existing resources efficiently.  
2. As a tutor, I want to attach screenshots, code examples, or videos to FAQ entries so that explanations are clearer for visual learners.  
3. As a tutor, I want to have a help queue system to see and manage the list of students waiting for assistance.  
4. As a tutor, I want to require students to check the FAQ page before they can join the help queue.  
5. As a tutor, I want to have a staff feedback system to send observations and feedback about labs to the main teaching staff.  
   

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
9. 

All Students:

1. Anonymous Feedback Channel  
   1. As a student I want to provide anonymous feedback to teaching staff so that I can voice concerns without fear of negative consequences.  
   2. Feature Ideas:  
* Anonymous feedback form to TAs/professor  
* Optional identity reveal  
* Feedback acknowledgment system  
* Track response status

2. ### Voice Amplification for Quiet Students

   1. ### As a non-vocal student I want alternative ways to participate and contribute so that my engagement is recognized even if I don't speak up often in meetings

   2. ### Feature Ideas:

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

### **Functional Requirements**:

* 

### **System Requirements**:

* 

### **High-Level Sequence Diagram**:

### **Implementation Components**:

### **Testing Plan**:

### **Development Plan**:

* 

**Open Issues**:

### **Open Items**:

### **Lessons Learned:**

* 

