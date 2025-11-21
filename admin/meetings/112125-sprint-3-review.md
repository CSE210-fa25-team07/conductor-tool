# Sprint 3 Review
**Meeting Date:** 11/21/2025
**Attendance:** Wayne, Rhea, Braxton, Jialuo, Ethan, Luting, Gaurav, Sree, Yuri, Emma, Cole, Will

## Sprint Review Agenda
- Sprint3 overview and action items review
- Review progress made on repo structure + current state
- Feature team updates (Be specific! Which issues were completed this week?)
- Code monitoring planning (ownership assignment, technology, and metrics)
- Action Items (goals to complete for upcoming sprint)



## Review Notes

Upcoming deadlines/reminders:
Reading assignment #7 due Tuesday 5 PM, see doc for assigned chapter: https://docs.google.com/document/d/1WTpqbhdD-OKu71aTTiy66EO5-dhBglvKu4Rgv3ipVzA/edit?usp=drive_link 

AI policy: “As per the course guidelines, **you are allowed to use AI tools, but only in specific ways.** Please take a moment to review the screenshot below (also available on **Canvas --> CSE 210 -> Syllabus**).
- You may use AI to get suggestions, clarify concepts or understand best practices while writing code. What you should not do is rely on Cursor, ChatGPT, or any other tool to generate actual implementation for your final project. If something looks completely AI-generated, it puts the instructional team in a very difficult position and it may prompt some additional review from our side, which none of us want to get into.”

Reminders on git workflow:
- Features should be pushed to dev branch
- Follow linter + other CI checks
- Try to get someone who isn’t on your feature subteam to review your code

**General project progress:**
- Overview of where we are currently
- Asked Tanmay for code freeze deadline, original launch date was Dec. 5th
- Concerns? Questions?

**Repository review:**
Doc from 11/20 meeting: https://docs.google.com/document/d/1xQL0i-rLO_Y_lkDBaRVNfdOcK452hzMRM98COLAAj_8/edit?usp=sharing


## Team updates

- Database created

### Login/Auth Team
- Set up the database
- Integrated authentication and login with the database

### Class Directory Team
- Set up ER diagram and sql schema for team related tables
- Review new frontend and start working on backend

### Attendance Team
- Set up database schema
- Reviewed repository structure, starting work on frontend and backend, paused while repo was under work

### Standup Team:
- Basic end-to-end pipeline implemented as an example
- In progress: update database schema

## New Feature - Code monitoring:
- Asked Tanmay for MVP
- Monitoring lives on the dashboard?
- Failure/success rate of API
- Latency
- Error count/logs
- Technology: standalone front end server 
- Assigned: feature teams write monitoring for their own API

## Action Items:
Receive Tanmay’s clarification on code monitoring expectations

### Login/Auth Team
- Get user dashboard to load correct courses for user
- Verification code that adds user to database correctly
### Class Directory Team
- Integrate backend + frontend + database
- Styling using global CSS
### Attendance Team
- Integrate backend + frontend + database for calendar and meeting view as well as analytics
- Styling using global CSS
### Standup Team:
- Visual effects in frontend
- Github integration
- Email bot that connects user to their email

## Contacts for Technical Help:
- Frontend gurus: Wayne, Gaurav
- Backend gurus: Sree, Braxton
- Database gurus: Yuri, Will

## Misc. Notes
Not able to hold mid-sprint checkins this week due to codebase being restructured.