# CI/CD Pipeline Overview

## 1. Introduction

Our CI/CD pipeline is designed to maintain high code quality, ensure proper documentation, and enforce safe collaboration through code reviews. It currently automates code linting, documentation generation, and requires approval before merging pull requests.

Future enhancements include automated unit and end-to-end testing to increase confidence in code correctness and user workflows.


## 2. Pipeline Rundown

The pipeline currently includes the following stages:

| Stage | Tool | Description | Status |
|-------|------|-------------|:--------:|
| **Linting** | ESLint | Checks JavaScript/TypeScript code for syntax errors, unused imports, and style violations. Part of status checks. | ✅ |
| **Documentation** | JSDoc | Generates developer-friendly API documentation from annotated code. The documentation is automatically deployed to GitHub Pages via a GitHub Actions workflow when changes are pushed to `main`. | ✅ |
| **PR Review** | GitHub Pull Request Checks | Requires code review approval and status checks passing before merging into main branch. | ✅ |

## 3. Functional Stages
### Linting and Code Quality — ESLint

We use [ESLint](https://eslint.org/) to enforce a consistent JavaScript style and prevent common programming mistakes.

#### Why ESLint
- Detects bugs and code smells early in development
- Encourages a uniform code style across contributors
- Enforces rules such as:
  - No duplicate or unused imports
  - Consistent indentation and spacing
  - CamelCase naming
  - No accidental `console.log` in production

#### How It’s Configured
- The ESLint flat configuration (`eslint.config.js`) defines base rules and ignores `node_modules` and build outputs.
- Runs automatically in CI to ensure commits follow style guidelines.
- Developers can run `npm run lint` locally before committing changes.

### Documentation — JSDoc

We use [JSDoc](https://jsdoc.app/) to automatically generate HTML documentation from inline comments in our JavaScript code.

#### Why JSDoc
- Provides a clear, centralized reference for functions, classes, and modules  
- Encourages consistent documentation across all components  
- Helps new contributors understand the API quickly  
- Supports examples, types, and modular organization for complex projects  

#### How It’s Configured
- Configuration is defined in `jsdocs.json`
- Generates HTML documentation automatically via `npm run docs`  
- Deployed to [GitHub Pages](https://cse210-fa25-team07.github.io/conductor-tool/) using GitHub Actions, so the latest docs are always available online
- Supports modular design using `@module` and `@memberof` tags to group functions and classes logically 

### PR Review

Branch protection rules are enabled on the main branch to enforce:
- Required PR reviews before merging
- Passing CI checks (e.g., linting)

### Why PR Review
- Prevents direct pushes to main
- Guarantees all code is peer-reviewed and passes automated checks
- Maintains repository integrity

## 3. Planned / In-Progress Enhancements

We are actively planning the following improvements:

- **Unit Testing (Vitest)**: Automated tests for individual modules and components to detect regressions.  
- **End-to-End Testing (Puppeteer)**: Automated browser-based tests to validate full application workflows.  

These enhancements will integrate into the existing pipeline to provide faster feedback and stronger assurance of code correctness.

---

## 4. Pipeline Diagram

![CI/CD Pipeline](cicd.png)

**Diagram Description:**  
- The pipeline starts with code commits or pull requests.  
- Current functional stages include linting, JSDoc generation and deployment, and PR review.  
- Planned stages such as unit testing, end-to-end testing, and deployment are marked for future integration.  
- Arrows indicate the flow of operations from code submission to merge.
