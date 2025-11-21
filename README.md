# Conductor

**Conductor** is a web platform designed to streamline the management of large-scale software engineering courses (500+ students).
It provides utilities and insights that help teaching staff and students focus on the more meaningful aspects of software engineering, while automating repetitive or administrative tasks.

## Overview

The goal of **Conductor** is to:
- Automate time-consuming tasks involved in course management.
- Provide a consistent structure for collecting and evaluating observations.
- Support fair and transparent assessment for both individual students and project groups.
- Offer insights that help improve teaching efficiency and student learning outcomes.

## Getting Started

### Installing Node.js and npm

Conductor requires **Node.js** and **npm** (Node Package Manager).
If you don’t already have them installed:

1. Visit the [Node.js download page](https://nodejs.org/).
2. Download and install the **LTS** version for your operating system.
3. Verify installation by running the following commands in your terminal:
   - `node -v` — prints your Node.js version  
   - `npm -v` — prints your npm version  
  
### Setting Up the Project

1. Clone the repository
   ```bash
   git clone git@github.com:CSE210-fa25-team07/conductor-tool.git
   ```
2. Install dependencies
   ```bash
   npm install
   ```
3. Generate JS documentation locally
   ```bash
   npm run docs
   ```
   You can also check our [GitHub Pages](https://cse210-fa25-team07.github.io/conductor-tool/) for JS documentation from `main`.

## Contributing

- Use JSDoc for all functions, classes, and modules  
- Follow the modular structure of the project for all new components
- Run `npm run lint` periodically to ensure your code meets standards

*Example Template for documenting your code*
```
/**
* @module {moduleName} - Define in only one file
*/

/**
 * [Short description of the function]
 *
 * @param {TYPE} param1 - [Description of parameter]
 * @param {TYPE} param2 - [Description of parameter]
 * @returns {TYPE} [Description of return value]
 * @memberof module:{moduleName} - Only for other files
 *
 * @example
 * // Example usage
 * const result = functionName(arg1, arg2);
 */
function functionName(param1, param2) {
  // function body
}
``` 

## Running the Web App (Local)
> [!NOTE]
> In order to use authentication (Log in with Google), you must have the `.env` file.
> The `.env` file contains the necessary secrets and information that our web app uses for the Google Auth API.
> Please ask the authentication team for more info.


### 1. Setup Environment Variables

Copy the content from `.env.example` and append it to your `.env` file (or create `.env` if it doesn't exist)

### 2. Start the Database

Start the PostgreSQL container:

```bash
npm run db:start
```

This will:
- Create PostgreSQL 16 instance on port 5433
- Run all migration scripts in `database/migrations/`
- Initialize the `conductor_tool` database with tables and default roles
- Persist data in a Docker volume

### 3. Generate Prisma Client

Generate the Prisma Client from the schema:

```bash
npm run db:generate
```

This creates type-safe database access functions based on your schema.

### 4. (Optional) Open Prisma Studio

Explore your database with a visual interface:

```bash
npm run db:studio
```

Opens a browser-based GUI at http://localhost:5555 to view and edit data.

### 5. Run the web server
```bash
node backend/src/server.js
```
On your browser, go to `localhost:8081`

### Quick Start/Stop Scripts

For convenience, you can use the helper scripts:

```bash
# Start all services (database + backend)
./start.sh

# Stop all services
./stop.sh
```

These scripts handle port checking, service startup/shutdown, and display colorful logs.
   
## Structure

```
conductor-tool/
├── frontend/              # VanillaJS
│   └── css/components/    # Shared CSS components (global, navigation)
├── backend/               # Node.js + Express (Port 8081)
├── database/              # PostgreSQL migrations
├── specs/                 # Docs, ADRs
├── start.sh               # Start all services
└── stop.sh                # Stop all services
```

## Team Ownership

| Team | Feature | Frontend Folder | Backend Files |
|------|---------|----------------|---------------|
| **Auth** | Login, roles | `pages/auth/` | `auth*` files |
| **Directory** | Roster, profiles | `pages/directory/` | `directory*`, `team*` |
| **Attendance** | Meetings, check-in | `pages/attendance/` | `attendance*` |
| **Standup** | Daily standups | `pages/standup/` | `standup*` |

## Docs

- **[STRUCTURE_SUMMARY.md](https://github.com/CSE210-fa25-team07/conductor-tool/blob/main/STRUCTURE_SUMMARY.md)** - Quick overview
- **[codebase_structure.md](https://github.com/CSE210-fa25-team07/conductor-tool/blob/main/specs/code_guides/codebase_structure.md)** - Patterns & examples
- **[subteam_expectations.md](https://github.com/CSE210-fa25-team07/conductor-tool/blob/main/specs/code_guides/subteam_expectations.md)** - Team dependencies
- **Folder READMEs** - Check any folder for guidance

## Rules

1. **3-layer pattern:** Route → Service → Repository
2. **File naming:** Match your feature (`standupRoutes.js`, `standupService.js`)
3. **Don't mix layers:** Business logic goes in services, SQL goes in repositories
4. **Check folder READMEs** when unsure where code goes

## Tech Stack

- Frontend: HTML/CSS/VanillaJS
- Backend: Node.js + Express
- Database: PostgreSQL
- Auth: Auth.js + Google OAuth
