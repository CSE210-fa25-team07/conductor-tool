# Frontend Utilities

Shared utility modules used across all features.

## Files

### `templateLoader.js`
Loads and caches HTML templates for any feature (directory, attendance, standup).
- `loadTemplate(feature, templateName)` - Fetches `/html/{feature}/{templateName}.html`
- Extracts content from `<template>` tags and caches results

### `componentLoader.js`
Dynamically renders reusable UI components.
- `renderComponent(componentName, data)` - Renders a single component with data
- `renderComponents(componentName, dataArray)` - Renders multiple instances of a component

### `userContext.js`
Manages user session data and course context.
- `loadUserContext()` - Loads user, courses, and enrollment data
- `getActiveCourse()`, `isProfessorOrTA()` - Access user context and roles
