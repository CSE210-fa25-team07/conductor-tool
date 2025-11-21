/**
 * @fileoverview Page Loader
 * Loads and renders page HTML templates
 */

const PAGE_BASE_PATH = "/html/standup";
const pageCache = new Map();

/**
 * Load a page template
 * @param {string} pageName - Name of the page file (without .html)
 * @returns {Promise<string>} The template HTML
 */
export async function loadPageTemplate(pageName) {
  // Check cache first
  if (pageCache.has(pageName)) {
    return pageCache.get(pageName);
  }

  try {
    const response = await fetch(`${PAGE_BASE_PATH}/${pageName}.html`);
    if (!response.ok) {
      throw new Error(`Failed to load page template: ${pageName}`);
    }

    const html = await response.text();

    // Parse the template element
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const template = doc.querySelector("template");

    if (!template) {
      throw new Error(`No <template> found in ${pageName}.html`);
    }

    const templateHTML = template.innerHTML;
    pageCache.set(pageName, templateHTML);
    return templateHTML;

  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(`Error loading page template ${pageName}:`, error);
    throw error;
  }
}

/**
 * Clear the page cache
 */
export function clearPageCache() {
  pageCache.clear();
}
