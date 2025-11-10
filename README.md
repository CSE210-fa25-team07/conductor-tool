# Conductor

**Conductor** is a tool designed to streamline the management of large-scale software engineering courses.  
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
3. Generate documentation locally
   ```bash
   npm run docs
   ```
   You can also check our [GitHub Pages](https://cse210-fa25-team07.github.io/conductor-tool/) for documentation from `main`.

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
> [!NOTE] Disclaimer
> In order to use authentication (Log in with Google), you must have the `.env` file.
> The `.env` file contains the necessary secrets and information that our web app uses for the Google Auth API.
> Please ask the authentication team for more info.

1. Run the web server
    ```bash
    node server.js
    ```
2. On your browser, go to `localhost:8081`
   