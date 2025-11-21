# Shared Components

Reusable UI components used across multiple pages.

## When to Use

Component used by **2+ pages** → put it here.
Component only used by one feature → keep it in `pages/yourFeature/`.

## Components

### `profileDropdown.js`

User profile avatar with dropdown menu. Used in dashboard, class features, and profile pages.

**Functions:**
- `initProfileDropdown()` - Initialize component, fetch user data from API
- `createUserDropdown(userType)` - Create dropdown menu ("student" or "professor")
- `updateProfileFromAPI()` - Fetch user name from `/v1/api/auth/session`
- `setupDropdownBehavior()` - Set up click toggle and outside-click close

**Usage:**
```javascript
import { initProfileDropdown, createUserDropdown } from "../../components/profileDropdown.js";

createUserDropdown("student");
await initProfileDropdown();
```

**HTML Required:**
```html
<section class="user-profile-dropdown">
  <article class="user-profile" id="user-profile-trigger">
    <figure class="user-avatar">...</figure>
    <span class="user-name">Loading...</span>
  </article>
  <menu class="dropdown-menu" id="user-dropdown"></menu>
</section>
```
