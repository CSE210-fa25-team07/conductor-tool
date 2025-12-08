/**
 * @module tests/utils/componentLoader
 */
import { describe, it, expect } from "vitest";
import { JSDOM } from "jsdom";

// Setup DOM environment before importing the module
const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>");
global.document = dom.window.document;

// Now import the module
const { fillTemplate } = await import("../../../js/utils/componentLoader.js");

describe("componentLoader", () => {
  describe("fillTemplate", () => {
    describe("variable substitution", () => {
      it("should replace {{key}} with escaped value", () => {
        const template = "<p>Hello {{name}}</p>";
        const data = { name: "World" };
        const result = fillTemplate(template, data);
        expect(result).toBe("<p>Hello World</p>");
      });

      it("should escape HTML in double braces", () => {
        const template = "<p>{{content}}</p>";
        const data = { content: "<script>alert('xss')</script>" };
        const result = fillTemplate(template, data);
        expect(result).toBe("<p>&lt;script&gt;alert('xss')&lt;/script&gt;</p>");
      });

      it("should return empty string for undefined values", () => {
        const template = "<p>{{missing}}</p>";
        const data = {};
        const result = fillTemplate(template, data);
        expect(result).toBe("<p></p>");
      });

      it("should return empty string for null values", () => {
        const template = "<p>{{nullValue}}</p>";
        const data = { nullValue: null };
        const result = fillTemplate(template, data);
        expect(result).toBe("<p></p>");
      });
    });

    describe("raw HTML substitution (triple braces)", () => {
      it("should replace {{{key}}} with raw unescaped value", () => {
        const template = "<div>{{{html}}}</div>";
        const data = { html: "<strong>Bold</strong>" };
        const result = fillTemplate(template, data);
        expect(result).toBe("<div><strong>Bold</strong></div>");
      });

      it("should allow HTML tags in triple braces", () => {
        const template = "{{{content}}}";
        const data = { content: "<a href=\"link\">Click me</a>" };
        const result = fillTemplate(template, data);
        expect(result).toBe("<a href=\"link\">Click me</a>");
      });

      it("should return empty string for undefined values in triple braces", () => {
        const template = "<div>{{{missing}}}</div>";
        const data = {};
        const result = fillTemplate(template, data);
        expect(result).toBe("<div></div>");
      });

      it("should return empty string for null values in triple braces", () => {
        const template = "<div>{{{nullValue}}}</div>";
        const data = { nullValue: null };
        const result = fillTemplate(template, data);
        expect(result).toBe("<div></div>");
      });

      it("should handle complex HTML in triple braces", () => {
        const template = "<div class=\"activities\">{{{activitiesHtml}}}</div>";
        const data = {
          activitiesHtml: `
            <div class="activity-item">
              <span class="icon">●</span>
              <a href="https://github.com/test">Commit message</a>
            </div>
          `
        };
        const result = fillTemplate(template, data);
        expect(result).toContain("<div class=\"activity-item\">");
        expect(result).toContain("<span class=\"icon\">●</span>");
        expect(result).toContain("<a href=\"https://github.com/test\">");
      });
    });

    describe("conditional sections", () => {
      it("should render content when condition is truthy", () => {
        const template = "{{#show}}Visible{{/show}}";
        const data = { show: true };
        const result = fillTemplate(template, data);
        expect(result).toBe("Visible");
      });

      it("should hide content when condition is falsy", () => {
        const template = "{{#show}}Hidden{{/show}}";
        const data = { show: false };
        const result = fillTemplate(template, data);
        expect(result).toBe("");
      });

      it("should hide content when condition is empty string", () => {
        const template = "{{#value}}Has value{{/value}}";
        const data = { value: "" };
        const result = fillTemplate(template, data);
        expect(result).toBe("");
      });

      it("should process variables inside conditional sections", () => {
        const template = "{{#hasName}}Hello {{name}}{{/hasName}}";
        const data = { hasName: true, name: "World" };
        const result = fillTemplate(template, data);
        expect(result).toBe("Hello World");
      });
    });

    describe("inverted sections", () => {
      it("should render content when condition is falsy", () => {
        const template = "{{^show}}Visible{{/show}}";
        const data = { show: false };
        const result = fillTemplate(template, data);
        expect(result).toBe("Visible");
      });

      it("should hide content when condition is truthy", () => {
        const template = "{{^show}}Hidden{{/show}}";
        const data = { show: true };
        const result = fillTemplate(template, data);
        expect(result).toBe("");
      });

      it("should render content when value is missing", () => {
        const template = "{{^missing}}Default{{/missing}}";
        const data = {};
        const result = fillTemplate(template, data);
        expect(result).toBe("Default");
      });
    });

    describe("mixed usage", () => {
      it("should handle both double and triple braces in same template", () => {
        const template = "<p>{{title}}</p><div>{{{html}}}</div>";
        const data = {
          title: "My <Title>",
          html: "<strong>Bold content</strong>"
        };
        const result = fillTemplate(template, data);
        expect(result).toBe("<p>My &lt;Title&gt;</p><div><strong>Bold content</strong></div>");
      });

      it("should handle conditionals with triple braces", () => {
        const template = "{{#hasHtml}}{{{html}}}{{/hasHtml}}{{^hasHtml}}No content{{/hasHtml}}";
        const data = { hasHtml: true, html: "<em>Emphasis</em>" };
        const result = fillTemplate(template, data);
        expect(result).toBe("<em>Emphasis</em>");
      });

      it("should handle conditionals with triple braces when condition is false", () => {
        const template = "{{#hasHtml}}{{{html}}}{{/hasHtml}}{{^hasHtml}}No content{{/hasHtml}}";
        const data = { hasHtml: false, html: "<em>Emphasis</em>" };
        const result = fillTemplate(template, data);
        expect(result).toBe("No content");
      });
    });
  });
});
