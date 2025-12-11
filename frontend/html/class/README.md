# Class Features Shell

This folder contains the **main shell page** for all in-class features.

## Architecture

`index.html` is the **ONLY** full HTML page - it provides:
- Top navigation bar with course information (lines 20-45)
- Primary feature tabs: [Directory] [Attendance] [Standup] (lines 47-59)
- Left sidebar `#sidebar` for secondary navigation (dynamically populated)
- Main content area `#content-area` where feature templates are loaded

## Important: Template Loading Flow

1. User navigates to `/html/class/index.html?feature=directory&view=dashboard`
2. `/js/pages/class/main.js` orchestrates feature/view switching
3. Template partials from `/html/directory/*.html` are loaded into `#content-area`
4. These partials are `<template>` tags only - **NOT standalone pages**
5. Opening `/html/directory/dashboard.html` directly shows ONLY the card (no nav/shell)

## Entry Point

Always access via: `/html/class/index.html?feature={feature}&view={view}`
Never load feature templates directly - they require the shell.
