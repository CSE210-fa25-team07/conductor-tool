# Class Features Controller

This folder contains the **orchestration logic** for the class features shell.

## Architecture

`main.js` manages the entire in-class experience:

1. **Feature Switching** - Handles [Directory] [Attendance] [Standup] tab clicks
2. **Sidebar Population** - Dynamically updates left sidebar based on active feature
3. **Template Loading** - Loads `<template>` partials from `/html/{feature}/{view}.html`
4. **Content Injection** - Injects loaded templates into `#content-area` on the shell page

## Template Loading Flow

```javascript
switchFeature("directory")
  → updateSidebar("directory") // Shows: Dashboard, People, Group, My
  → loadContent("directory", "dashboard")
    → import("../directory/main.js").render(container, "dashboard")
      → loadTemplate("directory", "dashboard") // Fetches /html/directory/dashboard.html
        → Injects <template> content into #content-area
```

## Feature Configuration

FEATURES object maps each feature to its available views. Feature modules must export `render(container, view)`.
