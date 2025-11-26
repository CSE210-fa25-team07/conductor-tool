# Shared Components

Reusable UI components used across multiple pages.

## When to Use

Component used by **2+ pages** → put it here.
Component only used by one feature → keep it in `pages/yourFeature/`.

## Components

### `navigation.js` - Global Navigation Bar

Top navigation bar with logo, navigation links, and user profile dropdown. This component automatically injects the navigation bar and profile dropdown into any page.

**Functions:**
- `initGlobalNavigation(activePage)` - Initialize and inject navigation bar into page

**Usage:**
```javascript
import { initGlobalNavigation } from "../../components/navigation.js";

document.addEventListener("DOMContentLoaded", async () => {
  await initGlobalNavigation("dashboard"); // Pass the current page ("dashboard" or "calendar" for styling purposes)
  // Your page-specific code here...
});
```

**Requirements for Pages:**

1. **Import the module** in your page's JavaScript file
2. **Call `initGlobalNavigation()`** with the current page name (e.g., "dashboard", "calendar")
3. **NO HTML required** - the navigation component injects itself at the top of the body
4. **CSS Required** - Include navigation.css in your page's HTML head:


**What it does:**
- Injects navigation bar HTML at the top of `document.body`
- Sets the active page link based on the `activePage` parameter
- Automatically initializes the profile dropdown
- Fetches and displays user data (name, avatar, dropdown menu)