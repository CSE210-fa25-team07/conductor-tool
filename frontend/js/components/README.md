# Components

Reusable UI components used across multiple pages.

## When to Use

Component used by **2+ teams** → put it here.
Component only your team uses → keep it in `pages/yourFeature/`.

## Pattern

Export functions that return HTML strings or DOM elements.

```javascript
export function createCard(data) {
  return `<div class="card">${data.title}</div>`;
}
```
