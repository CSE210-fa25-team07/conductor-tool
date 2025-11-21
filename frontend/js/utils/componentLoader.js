/**
 * @fileoverview Component Loader
 * Loads and renders HTML templates with Mustache-like syntax
 */

const templateCache = new Map();

/**
 * Get courseId from current URL path
 * URL pattern: /courses/:courseId/feature
 * @returns {string|null} courseId or null if not in course context
 */
function getCourseIdFromUrl() {
  const match = window.location.pathname.match(/^\/courses\/([^/]+)/);
  return match ? match[1] : null;
}

/**
 * Build the component path from the component name
 * @param {string} componentName - Component name with feature prefix (e.g., "standup/card")
 * @returns {string} Full path to the component
 */
function buildComponentPath(componentName) {
  if (!componentName.includes("/")) {
    throw new Error(`Component name must include feature prefix (e.g., "standup/card"), got: "${componentName}"`);
  }
  const [feature, ...rest] = componentName.split("/");
  const name = rest.join("/");
  const courseId = getCourseIdFromUrl();
  // Build path: /courses/:courseId/feature/pages/components/name
  if (courseId) {
    return `/courses/${courseId}/${feature}/pages/components/${name}`;
  }
  return `/${feature}/pages/components/${name}`;
}

/**
 * Load a component template
 * @param {string} componentName - Name of the component with feature prefix (e.g., "standup/card")
 * @returns {Promise<string>} The template HTML
 */
export async function loadTemplate(componentName) {
  // Check cache first
  if (templateCache.has(componentName)) {
    return templateCache.get(componentName);
  }

  const componentPath = buildComponentPath(componentName);

  try {
    const response = await fetch(componentPath);
    if (!response.ok) {
      throw new Error(`Failed to load template: ${componentName}`);
    }

    const html = await response.text();

    // Parse the template element
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const template = doc.querySelector("template");

    if (!template) {
      throw new Error(`No <template> found in ${componentName}.html`);
    }

    const templateHTML = template.innerHTML;
    templateCache.set(componentName, templateHTML);
    return templateHTML;

  } catch (error) {
    throw error;
  }
}

/**
 * Render a component with data
 * @param {string} componentName - Name of the component
 * @param {Object} data - Data to populate the template
 * @returns {Promise<string>} Rendered HTML
 */
export async function renderComponent(componentName, data) {
  const template = await loadTemplate(componentName);
  return fillTemplate(template, data);
}

/**
 * Fill a template with data (Mustache-like syntax)
 * @param {string} template - Template HTML string
 * @param {Object} data - Data object
 * @returns {string} Filled HTML
 */
function fillTemplate(template, data) {
  let result = template;

  // Process conditional sections {{#key}}...{{/key}}
  result = result.replace(/\{\{#(\w+)\}\}([\s\S]*?)\{\{\/\1\}\}/g, (match, key, content) => {
    const value = data[key];
    if (value && value !== false && value !== 0 && value !== "") {
      return fillTemplate(content, data);
    }
    return "";
  });

  // Process inverted sections {{^key}}...{{/key}}
  result = result.replace(/\{\{\^(\w+)\}\}([\s\S]*?)\{\{\/\1\}\}/g, (match, key, content) => {
    const value = data[key];
    if (!value || value === false || value === 0 || value === "") {
      return fillTemplate(content, data);
    }
    return "";
  });

  // Process variables {{key}}
  result = result.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    const value = data[key];
    if (value === undefined || value === null) {
      return "";
    }
    // Escape HTML by default
    return escapeHtml(String(value));
  });

  return result;
}

/**
 * Escape HTML to prevent XSS
 * @param {string} text - Text to escape
 * @returns {string} Escaped HTML
 */
function escapeHtml(text) {
  if (!text) return "";
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Render multiple components
 * @param {string} componentName - Name of the component
 * @param {Array<Object>} dataArray - Array of data objects
 * @returns {Promise<string>} All rendered HTML joined
 */
export async function renderComponents(componentName, dataArray) {
  const template = await loadTemplate(componentName);
  return dataArray
    .map(data => fillTemplate(template, data))
    .join("\n");
}

/**
 * Clear the template cache
 */
export function clearTemplateCache() {
  templateCache.clear();
}

/**
 * Helper to create a DOM element from HTML string
 * @param {string} html - HTML string
 * @returns {Element} DOM element
 */
export function createElementFromHTML(html) {
  const template = document.createElement("template");
  template.innerHTML = html.trim();
  return template.content.firstChild;
}

/**
 * Helper to create multiple DOM elements from HTML string
 * @param {string} html - HTML string
 * @returns {NodeList} DOM nodes
 */
export function createElementsFromHTML(html) {
  const template = document.createElement("template");
  template.innerHTML = html.trim();
  return template.content.childNodes;
}
