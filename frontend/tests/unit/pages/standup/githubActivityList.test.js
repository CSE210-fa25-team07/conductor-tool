import { describe, it, expect, beforeEach } from "vitest";
import { JSDOM } from "jsdom";

// Setup DOM environment before importing the module
const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>");
global.document = dom.window.document;

// Now import the module
const {
  ACTIVITY_ICONS,
  ACTIVITY_TYPES,
  transformActivityData,
  renderActivityItem,
  renderActivityList,
  getSelectedItemsText,
  toggleAllItems,
  renderStoredActivityItem,
  renderStoredActivities,
  generateStoredActivitiesHtml
} = await import("../../../../js/pages/standup/githubActivityList.js");

describe("githubActivityList", () => {
  describe("ACTIVITY_ICONS", () => {
    it("should export commit icon", () => {
      expect(ACTIVITY_ICONS.commit).toBe("●");
    });

    it("should export pr icon", () => {
      expect(ACTIVITY_ICONS.pr).toBe("⑃");
    });

    it("should export review icon", () => {
      expect(ACTIVITY_ICONS.review).toBe("✓");
    });

    it("should export issue icon", () => {
      expect(ACTIVITY_ICONS.issue).toBe("◉");
    });
  });

  describe("ACTIVITY_TYPES", () => {
    it("should have commit type config", () => {
      expect(ACTIVITY_TYPES.commit).toEqual({
        icon: "●",
        iconClass: "activity-icon-commit"
      });
    });

    it("should have pr type config", () => {
      expect(ACTIVITY_TYPES.pr).toEqual({
        icon: "⑃",
        iconClass: "activity-icon-pr"
      });
    });

    it("should have review type config", () => {
      expect(ACTIVITY_TYPES.review).toEqual({
        icon: "✓",
        iconClass: "activity-icon-review"
      });
    });

    it("should have issue type config", () => {
      expect(ACTIVITY_TYPES.issue).toEqual({
        icon: "◉",
        iconClass: "activity-icon-issue"
      });
    });
  });

  describe("transformActivityData", () => {
    it("should transform commits into activity items", () => {
      const activity = {
        commits: [
          { repo: "org/my-repo", message: "Fix bug", url: "https://github.com/commit/1" }
        ]
      };
      const items = transformActivityData(activity);
      expect(items).toHaveLength(1);
      expect(items[0]).toMatchObject({
        type: "commit",
        id: "commit-0",
        icon: "●",
        iconClass: "activity-icon-commit",
        label: "[my-repo] Fix bug",
        url: "https://github.com/commit/1",
        text: "- [my-repo] Fix bug"
      });
    });

    it("should transform pull requests into activity items", () => {
      const activity = {
        pullRequests: [
          { repo: "org/repo", number: 42, title: "Add feature", action: "opened", url: "https://github.com/pr/42" }
        ]
      };
      const items = transformActivityData(activity);
      expect(items).toHaveLength(1);
      expect(items[0]).toMatchObject({
        type: "pr",
        label: "[repo] PR #42: Add feature (Opened)"
      });
    });

    it("should transform reviews into activity items", () => {
      const activity = {
        reviews: [
          { repo: "org/repo", prNumber: 10, state: "approved", url: "https://github.com/review/1" }
        ]
      };
      const items = transformActivityData(activity);
      expect(items).toHaveLength(1);
      expect(items[0]).toMatchObject({
        type: "review",
        label: "[repo] Reviewed PR #10 (Approved)"
      });
    });

    it("should transform issues into activity items", () => {
      const activity = {
        issues: [
          { repo: "org/repo", number: 5, title: "Bug report", action: "opened", url: "https://github.com/issue/5" }
        ]
      };
      const items = transformActivityData(activity);
      expect(items).toHaveLength(1);
      expect(items[0]).toMatchObject({
        type: "issue",
        label: "[repo] Issue #5: Bug report (Opened)"
      });
    });

    it("should handle empty activity object", () => {
      const items = transformActivityData({});
      expect(items).toHaveLength(0);
    });

    it("should combine all activity types", () => {
      const activity = {
        commits: [{ repo: "org/a", message: "msg", url: "url" }],
        pullRequests: [{ repo: "org/b", number: 1, title: "t", action: "opened", url: "url" }],
        reviews: [{ repo: "org/c", prNumber: 2, state: "approved", url: "url" }],
        issues: [{ repo: "org/d", number: 3, title: "i", action: "closed", url: "url" }]
      };
      const items = transformActivityData(activity);
      expect(items).toHaveLength(4);
      expect(items.map(i => i.type)).toEqual(["commit", "pr", "review", "issue"]);
    });
  });

  describe("renderStoredActivityItem", () => {
    it("should create activity item element", () => {
      const activity = { type: "commit", label: "Test commit", url: "https://github.com/test" };
      const element = renderStoredActivityItem(activity);

      expect(element.tagName).toBe("DIV");
      expect(element.className).toContain("history-activity-item");
      expect(element.className).toContain("activity-icon-commit");
    });

    it("should include activity icon", () => {
      const activity = { type: "commit", label: "Test commit", url: "https://github.com/test" };
      const element = renderStoredActivityItem(activity);

      const icon = element.querySelector(".activity-icon");
      expect(icon).not.toBeNull();
      expect(icon.textContent).toBe("●");
    });

    it("should include activity link", () => {
      const activity = { type: "pr", label: "PR #42", url: "https://github.com/pr/42" };
      const element = renderStoredActivityItem(activity);

      const link = element.querySelector(".activity-label");
      expect(link).not.toBeNull();
      expect(link.getAttribute("href")).toBe("https://github.com/pr/42");
      expect(link.getAttribute("target")).toBe("_blank");
      expect(link.textContent).toContain("PR #42");
    });

    it("should default to commit type if type is missing", () => {
      const activity = { label: "Unknown", url: "https://github.com/test" };
      const element = renderStoredActivityItem(activity);

      expect(element.className).toContain("activity-icon-commit");
      const icon = element.querySelector(".activity-icon");
      expect(icon.textContent).toBe("●");
    });

    it("should use correct icon for each activity type", () => {
      const types = [
        { type: "commit", expectedIcon: "●" },
        { type: "pr", expectedIcon: "⑃" },
        { type: "review", expectedIcon: "✓" },
        { type: "issue", expectedIcon: "◉" }
      ];

      types.forEach(({ type, expectedIcon }) => {
        const activity = { type, label: "Test", url: "https://github.com/test" };
        const element = renderStoredActivityItem(activity);
        const icon = element.querySelector(".activity-icon");
        expect(icon.textContent).toBe(expectedIcon);
      });
    });
  });

  describe("renderStoredActivities", () => {
    let container;

    beforeEach(() => {
      container = document.createElement("div");
    });

    it("should render activities into container", () => {
      const activities = [
        { type: "commit", label: "Commit 1", url: "https://github.com/1" },
        { type: "pr", label: "PR 2", url: "https://github.com/2" }
      ];
      renderStoredActivities(activities, container);

      const items = container.querySelectorAll(".history-activity-item");
      expect(items.length).toBe(2);
    });

    it("should clear container before rendering", () => {
      container.innerHTML = "<p>Old content</p>";
      const activities = [
        { type: "commit", label: "New", url: "https://github.com/1" }
      ];
      renderStoredActivities(activities, container);

      expect(container.querySelector("p")).toBeNull();
      expect(container.querySelectorAll(".history-activity-item").length).toBe(1);
    });

    it("should handle empty activities array", () => {
      container.innerHTML = "<p>Old content</p>";
      renderStoredActivities([], container);

      expect(container.innerHTML).toBe("");
    });

    it("should handle null activities", () => {
      container.innerHTML = "<p>Old content</p>";
      renderStoredActivities(null, container);

      expect(container.innerHTML).toBe("");
    });

    it("should handle undefined activities", () => {
      container.innerHTML = "<p>Old content</p>";
      renderStoredActivities(undefined, container);

      expect(container.innerHTML).toBe("");
    });

    it("should handle non-array activities", () => {
      container.innerHTML = "<p>Old content</p>";
      renderStoredActivities("not an array", container);

      expect(container.innerHTML).toBe("");
    });
  });

  describe("generateStoredActivitiesHtml", () => {
    it("should generate HTML string for activities", () => {
      const activities = [
        { type: "commit", label: "Test commit", url: "https://github.com/test" }
      ];
      const html = generateStoredActivitiesHtml(activities);

      expect(html).toContain("history-activity-item");
      expect(html).toContain("activity-icon-commit");
      expect(html).toContain("●");
      expect(html).toContain("https://github.com/test");
      expect(html).toContain("Test commit");
    });

    it("should generate HTML for multiple activities", () => {
      const activities = [
        { type: "commit", label: "Commit", url: "https://github.com/1" },
        { type: "pr", label: "PR", url: "https://github.com/2" },
        { type: "review", label: "Review", url: "https://github.com/3" }
      ];
      const html = generateStoredActivitiesHtml(activities);

      expect(html).toContain("activity-icon-commit");
      expect(html).toContain("activity-icon-pr");
      expect(html).toContain("activity-icon-review");
    });

    it("should return empty string for empty array", () => {
      const html = generateStoredActivitiesHtml([]);
      expect(html).toBe("");
    });

    it("should return empty string for null", () => {
      const html = generateStoredActivitiesHtml(null);
      expect(html).toBe("");
    });

    it("should return empty string for undefined", () => {
      const html = generateStoredActivitiesHtml(undefined);
      expect(html).toBe("");
    });

    it("should return empty string for non-array", () => {
      const html = generateStoredActivitiesHtml("not an array");
      expect(html).toBe("");
    });

    it("should escape HTML in label", () => {
      const activities = [
        { type: "commit", label: "<script>alert('xss')</script>", url: "https://github.com/test" }
      ];
      const html = generateStoredActivitiesHtml(activities);

      expect(html).not.toContain("<script>");
      expect(html).toContain("&lt;script&gt;");
    });

    it("should escape HTML in URL", () => {
      const activities = [
        { type: "commit", label: "Test", url: "javascript:alert('xss')" }
      ];
      const html = generateStoredActivitiesHtml(activities);

      // URL should be escaped but still present
      expect(html).toContain("javascript:");
    });

    it("should default to commit type for missing type", () => {
      const activities = [
        { label: "No type", url: "https://github.com/test" }
      ];
      const html = generateStoredActivitiesHtml(activities);

      expect(html).toContain("activity-icon-commit");
      expect(html).toContain("●");
    });
  });

  describe("renderActivityItem", () => {
    it("should create label element with checkbox", () => {
      const item = {
        type: "commit",
        id: "commit-0",
        icon: "●",
        iconClass: "activity-icon-commit",
        label: "Test commit",
        url: "https://github.com/test",
        text: "- [repo] Test commit"
      };
      const element = renderActivityItem(item);

      expect(element.tagName).toBe("LABEL");
      expect(element.className).toContain("github-activity-item");

      const checkbox = element.querySelector("input[type=\"checkbox\"]");
      expect(checkbox).not.toBeNull();
      expect(checkbox.checked).toBe(true);
      expect(checkbox.dataset.text).toBe("- [repo] Test commit");
    });
  });

  describe("renderActivityList", () => {
    let container;

    beforeEach(() => {
      container = document.createElement("div");
    });

    it("should render items into container", () => {
      const items = [
        { type: "commit", id: "1", icon: "●", iconClass: "c", label: "A", url: "u", text: "t" },
        { type: "pr", id: "2", icon: "⑃", iconClass: "p", label: "B", url: "u", text: "t" }
      ];
      renderActivityList(items, container);

      expect(container.querySelectorAll(".github-activity-item").length).toBe(2);
    });

    it("should show empty message when no items", () => {
      renderActivityList([], container);

      expect(container.querySelector(".github-activity-empty")).not.toBeNull();
      expect(container.textContent).toContain("No GitHub activity");
    });
  });

  describe("getSelectedItemsText", () => {
    let container;

    beforeEach(() => {
      container = document.createElement("div");
      container.innerHTML = `
        <label><input type="checkbox" class="activity-checkbox" checked data-text="Item 1"></label>
        <label><input type="checkbox" class="activity-checkbox" data-text="Item 2"></label>
        <label><input type="checkbox" class="activity-checkbox" checked data-text="Item 3"></label>
      `;
    });

    it("should return text of checked items only", () => {
      const selected = getSelectedItemsText(container);
      expect(selected).toEqual(["Item 1", "Item 3"]);
    });

    it("should return empty array if no items checked", () => {
      container.querySelectorAll(".activity-checkbox").forEach(cb => cb.checked = false);
      const selected = getSelectedItemsText(container);
      expect(selected).toEqual([]);
    });
  });

  describe("toggleAllItems", () => {
    let container;

    beforeEach(() => {
      container = document.createElement("div");
      container.innerHTML = `
        <label><input type="checkbox" class="activity-checkbox" checked></label>
        <label><input type="checkbox" class="activity-checkbox"></label>
        <label><input type="checkbox" class="activity-checkbox" checked></label>
      `;
    });

    it("should check all items when passed true", () => {
      toggleAllItems(container, true);

      const checkboxes = container.querySelectorAll(".activity-checkbox");
      checkboxes.forEach(cb => expect(cb.checked).toBe(true));
    });

    it("should uncheck all items when passed false", () => {
      toggleAllItems(container, false);

      const checkboxes = container.querySelectorAll(".activity-checkbox");
      checkboxes.forEach(cb => expect(cb.checked).toBe(false));
    });
  });
});
